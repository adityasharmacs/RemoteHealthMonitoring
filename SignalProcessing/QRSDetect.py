import heartbeat as hb #Assuming we named the file 'heartbeat.py
import paho.mqtt.client as mqtt
import threading
import json
import time

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


class MQTTThread(threading.Thread):
    def __init__(self, host, port):
        super(MQTTThread, self).__init__()
        self.host = host
        self.port = port
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.sc = SparkContext()
        self.sqlContext = SQLContext(self.sc)
        self.savedmodel = MultilayerPerceptronClassificationModel.load("/home/ubuntu/trained-model")

    # The callback for when the client receives a CONNACK response from the server.
    def on_connect(self, client, userdata, flags, rc):
        print("Connected with result code "+str(rc))
        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        print self.topic
        client.subscribe(self.topic)


    def subscribe_topic(self, topic):
        self.topic = topic
        self.client.subscribe(self.topic)


    # The callback for when a PUBLISH message is received from the server.
    def on_message(self, client, userdata, msg):
        json_message = json.loads(msg.payload)
        # print str(json_message)
        try:
            processsignal = hb.ProcessSignalThread(json_message, 0.75, 250.0, 15.0, 5, self.sqlContext, self.savedmodel)
            processsignal.run()
        except:
            print("Unexpected error:", sys.exc_info()[0])
            raise

    def publish_message(self, topic, msg):
        self.client.publish(topic, msg)

    def run(self):
        print "Connecting to mqtt"
        self.client.connect(self.host, self.port, 60)
        self.client.loop_start()


mqtt_thread = MQTTThread("54.244.148.72", 1883)
mqtt_thread.subscribe_topic("ecg-raw-readings")
mqtt_thread.run()


while True:
    print "";
    time.sleep(10)
