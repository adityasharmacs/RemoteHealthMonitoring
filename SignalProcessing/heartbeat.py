import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import math
import threading
import json
from datetime import datetime
from scipy.interpolate import interp1d
from scipy.signal import butter, lfilter, detrend #Import the extra module required

from pyspark.sql.types import *
from pyspark.sql import Row
from pyspark import SparkContext
from pyspark.sql import SQLContext
from pyspark.ml.classification import MultilayerPerceptronClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.ml.classification import MultilayerPerceptronClassificationModel
import sys
import csv
from collections import defaultdict
from pyspark.sql import DataFrame as pyspark_df
import paho.mqtt.client as mqtt

def on_connect(client, userdata, rc):
    print("Connected with result code "+str(rc))

client = mqtt.Client()
client.on_connect = on_connect
client.connect("54.244.148.72", 1883)


class ProcessSignalThread(threading.Thread):
    def __init__(self, dataset, hrw, fs, cutoff, order, sqlContext, savedModel):
        super(ProcessSignalThread, self).__init__()
        self.dataset = dataset
        self.hrw = hrw
        self.fs = fs
        self.cutoff = cutoff
        self.order = order
        self.measures = {}
        self.sqlContext = sqlContext
        self.savedmodel = savedModel
        self.dataset_json = ""

    def run(self):
        self.process(self.dataset, self.hrw, self.fs, self.cutoff, self.order)

    #Preprocessing
    def get_data(self, filename):
        dataset = pd.read_csv(filename)
        return dataset

    def get_samplerate(self, dataset):
        sampletimer = [x for x in dataset['datetime']]
        self.measures['fs'] = ((len(sampletimer) / sampletimer[-1])*1000)

    def rolmean(self, dataset, hrw, fs):
        # mov_avg = pd.rolling_mean(dataset.hart, window=int(hrw*fs), center=False)
        mov_avg = pd.Series.rolling(dataset.hart, window=187,center=False).mean()
        avg_hr = (np.mean(dataset.hart))
        mov_avg = [avg_hr if math.isnan(x) else x for x in mov_avg]
        self.dataset['hart_rollingmean'] = mov_avg

    def butter_lowpass(self, cutoff, fs, order=5):
        nyq = 0.5 * fs
        normal_cutoff = cutoff / nyq
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        return b, a

    def butter_lowpass_filter(self, data, cutoff, fs, order):
        b, a = self.butter_lowpass(cutoff, fs, order=order)
        y = lfilter(b, a, data)
        return y

    def filtersignal(self, dataset, cutoff, fs, order):
        hart = [math.pow(x, 3) for x in dataset['hart']]
        # hart = dataset['hart']
        hartfiltered = self.butter_lowpass_filter(hart, cutoff, fs, order)

        filtered_list = hartfiltered.tolist()
        ecg_heart = []
        ecg_time = []
        for index in range(len(filtered_list)):
            ecg_heart.append(round(filtered_list[index], 2))
            ecg_time.append(str(dataset['timer'][index])[:-1])
        self.dataset_json = json.dumps({"heart": ecg_heart, "timestamp": ecg_time})

        # # Plot it
        # plt.subplot(211)
        # plt.plot(dataset.hart, color='Blue', alpha=0.5, label='Original Signal')
        # plt.legend(loc=4)
        # plt.subplot(212)
        # plt.plot(hartfiltered, color='Red', label='Filtered Signal')
        # # plt.ylim(-6000, 4000)  # limit filtered signal to have same y-axis as original (filter response starts at 0 so otherwise the plot will be scaled)
        # plt.legend(loc=4)
        # plt.show()

        # dataset['hart'] = hartfiltered

        return hartfiltered

    #Peak detection
    def detect_peaks(self, dataset, ma_perc, fs):
        rolmean = [(x+((x/100)*ma_perc)) for x in dataset.hart_rollingmean]
        window = []
        peaklist = []
        listpos = 0
        for datapoint in dataset.hart:
            rollingmean = rolmean[listpos]
            if (datapoint <= rollingmean) and (len(window) <= 1): #Here is the update in (datapoint <= rollingmean)
                listpos += 1
            elif (datapoint > rollingmean):
                window.append(datapoint)
                listpos += 1
            else:
                maximum = max(window)
                beatposition = listpos - len(window) + (window.index(max(window)))
                peaklist.append(beatposition)
                window = []
                listpos += 1
        self.measures['peaklist'] = peaklist
        self.measures['ybeat'] = [dataset.hart[x] for x in peaklist]
        self.measures['rolmean'] = rolmean
        self.calc_RR(dataset, fs)
        self.measures['rrsd'] = np.std(self.measures['RR_list'])
        # plt.title("Incremental detect Peaks")
        # plt.plot(dataset.hart, color='blue', label="Orignal Signal")
        # plt.scatter(self.measures['peaklist'], self.measures['ybeat'], color='green', label="Detected Peaks %.2f ma_perc, number of peaks detected %.2f"%(ma_perc,(len(self.measures['ybeat'])/10)))
        # plt.xlim(0, 2000)
        # plt.legend(loc=4, framealpha=0.6)
        # plt.show()


    def fit_peaks(self, dataset, fs):
        ma_perc_list = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 150, 200, 300] #List with moving average raise percentages, make as detailed as you like but keep an eye on speed
        rrsd = []
        valid_ma = []
        for x in ma_perc_list:
            self.detect_peaks(dataset, x, fs)
            bpm = ((len(self.measures['peaklist'])/(len(dataset.hart)/fs))*60)
            rrsd.append([self.measures['rrsd'], bpm, x])
        for x,y,z in rrsd:
            # print x, y, z
            if ((x > 1) and ((y > 30) and (y < 130))):
                valid_ma.append([x, z])
        self.measures['best'] = min(valid_ma, key = lambda t: t[0])[1]
        self.detect_peaks(dataset, min(valid_ma, key = lambda t: t[0])[1], fs)

    def check_peaks(self, dataset):
        RR_list = self.measures['RR_list']
        # RR_list = detrend(RR_list, type='linear')
        peaklist = self.measures['peaklist']
        ybeat = self.measures['ybeat']

        upper_threshold = np.mean(RR_list) + 300
        lower_threshold = np.mean(RR_list) - 300

        removed_beats = []
        removed_beats_y = []

        RR_list_cor = []
        RR_list_removed = []

        peaklist_cor = [peaklist[0]]
        ybeat_cor = [ybeat[0]]

        cnt = 0
        while cnt < len(RR_list):
            if (RR_list[cnt] < upper_threshold) and (RR_list[cnt] > lower_threshold):
                RR_list_cor.append(RR_list[cnt])
                peaklist_cor.append(peaklist[cnt+1])
                ybeat_cor.append(ybeat[cnt+1])
                cnt += 1
            else:
                RR_list_removed.append(RR_list[cnt])
                removed_beats.append(peaklist[cnt+1])
                removed_beats_y.append(ybeat[cnt+1])
                cnt += 1

        self.measures['RR_list_removed'] = RR_list_removed
        self.measures['peaklist_removed'] = removed_beats
        self.measures['ybeat_removed'] = removed_beats_y

        self.measures['RR_list_cor'] = RR_list_cor
        self.measures['peaklist_cor'] = peaklist_cor
        self.measures['ybeat_cor'] = ybeat_cor

        # plt.subplot(211)
        # plt.title('Marked Uncertain Peaks')
        # plt.plot(dataset.hart, color='blue', alpha=0.6, label='heart rate signal')
        # plt.plot(self.measures['rolmean'], color='green')
        # plt.scatter(self.measures['peaklist_cor'], self.measures['ybeat_cor'], color='green')
        # plt.scatter(removed_beats, removed_beats_y, color='red', label='Detection uncertain')
        # plt.legend(framealpha=0.6, loc=4)
        #
        # plt.subplot(212)
        # plt.title("RR-intervals with thresholds")
        # plt.plot(RR_list, color='blue', label='Orignal RR List')
        # plt.plot(RR_list_cor, color='green', label='Corrected RR List')
        # plt.plot(RR_list_removed, color='red', label='Removed RR List')
        # plt.axhline(y=upper_threshold, color='red')
        # plt.axhline(y=lower_threshold, color='red')
        # plt.show()



    #Calculating all measures
    def calc_RR(self, dataset, fs):
        peaklist = self.measures['peaklist']
        RR_list = []
        cnt = 0
        while (cnt < (len(peaklist)-1)):
            RR_interval = (peaklist[cnt+1] - peaklist[cnt])
            ms_dist = ((RR_interval / fs) * 1000.0)
            RR_list.append(ms_dist)
            cnt += 1
        RR_diff = []
        RR_sqdiff = []
        cnt = 0
        while (cnt < (len(RR_list)-1)):
            RR_diff.append(abs(RR_list[cnt] - RR_list[cnt+1]))
            RR_sqdiff.append(math.pow(RR_list[cnt] - RR_list[cnt+1], 2))
            cnt += 1
        self.measures['RR_list'] = RR_list
        self.measures['RR_diff'] = RR_diff
        self.measures['RR_sqdiff'] = RR_sqdiff


    def calc_ts_measures(self, dataset):
        RR_list = self.measures['RR_list_cor']
        RR_diff = self.measures['RR_diff']
        RR_sqdiff = self.measures['RR_sqdiff']
        self.measures['bpm'] = 60000 / np.mean(RR_list)
        self.measures['ibi'] = np.mean(RR_list)
        self.measures['sdnn'] = np.std(RR_list)
        self.measures['sdsd'] = np.std(RR_diff)
        self.measures['rmssd'] = np.sqrt(np.mean(RR_sqdiff))
        NN20 = [x for x in RR_diff if (x>20)]
        NN50 = [x for x in RR_diff if (x>50)]
        self.measures['nn20'] = NN20
        self.measures['nn50'] = NN50
        self.measures['pnn20'] = float(len(NN20)) / float(len(RR_diff))
        self.measures['pnn50'] = float(len(NN50)) / float(len(RR_diff))


    def calc_fd_measures(self, dataset, fs):
        peaklist = self.measures['peaklist_cor']
        RR_list = self.measures['RR_list_cor']
        RR_x = peaklist[1:]
        RR_y = RR_list
        RR_x_new = np.linspace(RR_x[0],RR_x[-1],RR_x[-1])
        f = interp1d(RR_x, RR_y, kind='cubic')

        # plt.title("Original and Interpolated Signal")
        # plt.plot(RR_x, RR_y, label="Original", color='blue')
        # plt.plot(RR_x_new, f(RR_x_new), label="Interpolated", color='red')
        # plt.legend()
        # plt.show()

        n = len(dataset.hart)
        frq = np.fft.fftfreq(len(dataset.hart), d=((1/fs)))
        frq = frq[range(n/2)]
        Y = np.fft.fft(f(RR_x_new))/n
        Y = Y[range(n/2)]

        # # Plot
        # plt.title("Frequency Spectrum of Heart Rate Variability")
        # plt.xlim(0, 0.6)  # Limit X axis to frequencies of interest (0-0.6Hz for visibility, we are interested in 0.04-0.5)
        # plt.ylim(0, 50)  # Limit Y axis for visibility
        # plt.plot(frq, abs(Y))  # Plot it
        # plt.xlabel("Frequencies in Hz")
        # plt.show()

        self.measures['lf'] = np.trapz(abs(Y[(frq>=0.04) & (frq<=0.15)]))
        self.measures['hf'] = np.trapz(abs(Y[(frq>=0.16) & (frq<=0.5)]))


    def detect_other_waves(self, dataset, fs):
        # print "Q Wave S detection"
        qbeat = []
        qwavelist = []
        sbeat = []
        swavelist = []
        pbeat = []
        pwavelist = []
        tbeat = []
        twavelist = []
        qrs_amplitde = []
        qrs_duration = []
        pr_interval = []
        qt_interval = []
        t_interval = []
        p_interval = []

        self.measures['peaklist_cor'] = self.measures['peaklist_cor'][1:-1]
        self.measures['ybeat_cor'] = self.measures['ybeat_cor'][1:-1]

        for index in range(len(self.measures['peaklist_cor'])):
            index_search_back = self.measures['peaklist_cor'][index]
            index_search_forward = self.measures['peaklist_cor'][index]

            if index_search_back > 0:
                while ((dataset.hart[index_search_back] - dataset.hart[index_search_back-1]) > 0.05 and index_search_back > 0 and index_search_back < len(dataset.hart)):
                    index_search_back -= 1
                qbeat.append(dataset.hart[index_search_back])
                qwavelist.append(index_search_back)

                while ((dataset.hart[index_search_back-1] - dataset.hart[index_search_back]) > 0.05 and index_search_back > 0 and index_search_back < len(dataset.hart)):
                    index_search_back -= 1
                pbeat.append(dataset.hart[index_search_back])
                pwavelist.append(index_search_back)

            if index_search_forward > 0:
                while ((dataset.hart[index_search_forward] - dataset.hart[index_search_forward + 1]) > 0.05 and index_search_forward < len(dataset.hart)):
                    index_search_forward += 1
                sbeat.append(dataset.hart[index_search_forward])
                swavelist.append(index_search_forward)

                while ((dataset.hart[index_search_forward + 1] - dataset.hart[index_search_forward]) > 0.05 and index_search_forward < len(dataset.hart)):
                    index_search_forward += 1
                tbeat.append(dataset.hart[index_search_forward])
                twavelist.append(index_search_forward)

        self.measures['qwavelist'] = qwavelist
        self.measures['qbeat'] = qbeat
        self.measures['swavelist'] = swavelist
        self.measures['sbeat'] = sbeat
        self.measures['pwavelist'] = pwavelist
        self.measures['pbeat'] = pbeat
        self.measures['twavelist'] = twavelist
        self.measures['tbeat'] = tbeat

        for index in range(len(self.measures['peaklist_cor'])):
            qrs_amplitde.append(self.measures['ybeat_cor'][index] - self.measures['sbeat'][index])
            qrs_duration.append(self.measures['swavelist'][index] - self.measures['qwavelist'][index])
            pr_interval.append(self.measures['peaklist_cor'][index] - self.measures['pwavelist'][index])
            qt_interval.append(self.measures['twavelist'][index] - self.measures['qwavelist'][index])
            t_interval.append(self.measures['twavelist'][index] - self.measures['swavelist'][index])
            p_interval.append(self.measures['qwavelist'][index] - self.measures['pwavelist'][index])

        self.measures['qrs_amplitde'] = (np.mean(qrs_amplitde)/100000000)
        self.measures['qrs_duration'] = (np.mean(qrs_duration)/fs)
        self.measures['pr_interval'] = (np.mean(pr_interval)/fs)
        self.measures['qt_interval'] = (np.mean(qt_interval)/fs)
        self.measures['t_interval'] = (np.mean(t_interval)/fs)
        self.measures['p_interval'] = (np.mean(p_interval)/fs)
        self.measures['t_amplitude'] = (np.mean(self.measures['tbeat'])/100000000)
        self.measures['p_amplitude'] = (np.mean(self.measures['pbeat'])/100000000)


    #Plotting it
    def plotter(self, dataset):
        peaklist = self.measures['peaklist']
        ybeat = self.measures['ybeat']
        plt.title("Best fit: mov_avg %s percent raised" %self.measures['best'])
        plt.plot(dataset.hart, alpha=0.5, color='blue', label="heart rate signal")
        plt.plot(self.measures['rolmean'], color ='green', label="moving average")
        plt.scatter(self.measures['peaklist_removed'], self.measures['ybeat_removed'], color='red', label="Incorrect Detected Peaks")
        plt.scatter(self.measures['qwavelist'], self.measures['qbeat'], color='yellow', label="Q Wave Points")
        plt.scatter(self.measures['swavelist'], self.measures['sbeat'], color='black', label="S Wave Points")
        plt.scatter(self.measures['pwavelist'], self.measures['pbeat'], color='magenta', label="P Wave Points")
        plt.scatter(self.measures['twavelist'], self.measures['tbeat'], color='cyan', label="T Wave Points")
        plt.scatter(self.measures['peaklist_cor'], self.measures['ybeat_cor'], color='green', label="RRSD:%.2f\nBPM:%.2f" %(np.std(self.measures['RR_list_cor']), self.measures['bpm']))#, label="average: %.1f BPM" %measures['bpm'])
        plt.legend(loc=4, framealpha=0.6)
        # plt.xlim(0, 2000)
        plt.show()


    #Wrapper function
    def process(self, dataset, hrw, fs, cutoff, order):
        d = {'hart': self.filtersignal(dataset, cutoff, fs, order), 'timestamp': dataset['timer']}
        self.dataset = pd.DataFrame(data=d)
        self.rolmean(self.dataset, hrw, fs)
        self.fit_peaks(self.dataset, fs)
        self.check_peaks(self.dataset)
        self.calc_ts_measures(self.dataset)
        self.calc_fd_measures(self.dataset, fs)
        self.detect_other_waves(self.dataset, fs)
        print self.measures['bpm']

        new_item = "%f %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s %s:%s" % (0.0, 1 ,44 ,3 ,169 ,4 ,80 ,5 ,109 ,6 ,128 ,7 ,382 ,8 ,195 ,9 ,60 ,10 ,-34 ,11 ,112 ,12 ,154 ,13 ,7 ,14 ,63)
        data_file_name = '/home/ubuntu/processing-ann/data-%s.txt' % datetime.now().strftime('%Y-%m-%d')
        data_file = open(data_file_name, 'wb')
        data_file.write(new_item)
        data_file.close()

        self.data = self.sqlContext.read.format("libsvm").load(data_file_name)
        self.predictions = self.savedmodel.transform(self.data)
        self.predictionAndLabels = self.predictions.select("prediction")
        self.result = json.loads(self.predictions.toJSON().first())
        print(str(self.result['prediction']))

        # dataset_json = json.dumps({"heart" : self.dataset.hart, "timestamp" : str(dataset['timer'])})
        client.publish("ecg-filtered-readings", str(self.dataset_json))
        client.publish("heartrate-readings", str(self.measures['bpm']))
        client.publish("ecg-prediction", str(self.result['prediction']))


        # self.plotter(self.dataset)