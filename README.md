# README #

Continuous monitoring of health vitals and other medical signals in order to detect and predict health anomalies is of paramount importance for certain health conditions. 

### Set Up ###

1. Smart Pill Bottle - weight sensor
2. Motion Sensor
3. ECG Sensor
4. Mobile Gateway
5. Signal Processing 
   Script filters raw ECG signal, extracts egg features from signal. These features are passed as input to trained ANN model to get prediction.
   # 


5. MQTT
   # mosquitto -c /etc/mosquitto/mosquitto.conf


6. Kafka
   # ~/kafka/bin/kafka-server-start.sh ~/kafka/config/server.properties


7. MQTT-Kafka Bridge
   To transfer MQTT data to Kafka cluster
   # python mqtt-kafka-bridge.py


8. Logstash
   # nano logstash.conf
     input { stdin { }
           }
     output {
            elasticsearch { hosts => ["localhost:9200"] } stdout { }
           }
    # ~/logstash/logstash-2.2.2/bin/logstash -f agent log stash.conf

9. ElasticSearch
   # ~/elasticsearch/elasticsearch-2.2.1/bin/elasticsearch


10. Apache Spark
    We have used Multilayer perceptron classifier which is based on the feedforward artificial neural network. Trained a model with egg dataset
    # sbt package 
    # ./bin/spark-submit --class ClassName --master local[2] /path/to/application.jar


11. Script to read motion sensor real-time values and convert activity, light intensity into understandable format
    # python sensortag.py

12. Web Server
    - To start nodejs server 
      # node server.js


    - Connection to ElasticSearch and MongoDB
    # elastic_client = new elasticsearch.Client({
            # host: '<host>:<ip>',
            # log: 'trace'
    # });
    # db = mongoose.connect('mongodb://<mlab-user>:<mlab-password>@ds053216.mlab.com:53211/<collection>');


    - AgendaJS to start cron jobs for reminders and alerts
    # agenda.define(<job-name>, function(job, done) {
                # done();
      });
    # agenda.every(<time>, <job-name>);


    - SocketIO to pass real-time values from MQTT to UI
    # var io = require('socket.io').listen(app.listen(5000));
    # io.sockets.emit(<topic-name>, <message>)


    - Nodemailer to send notifications on email
    # var transporter = nodemailer.createTransport('smtps://<username>%40gmail.com:<password>@smtp.gmail.com');


    - Twilio to send text notifications
    # var twilio_client = twilio('<accountId>', '<authenticationKey>');


13. Web UI
    - To start in development environment
    #  gulp develop

    - To start in production
      gulp build
      gulp production