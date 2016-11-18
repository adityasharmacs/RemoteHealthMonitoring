import paho.mqtt.client as mqtt
from kafka import KafkaProducer
producer = KafkaProducer(bootstrap_servers=['localhost:9092'])
class Queue:
    def __init__(self):
        self.items = []

    def isEmpty(self):
        return self.items == []

    def enqueue(self, item):
        self.items.insert(0,item)

    def dequeue(self):
        return self.items.pop()

    def size(self):
        return len(self.items)

    def peek(self):
        return self.items[len(self.items)-1]
q1= Queue()
q2 = Queue()
# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    #q = Queue()
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("ecg-readings")
    client.subscribe("body-temp-readings")
    client.subscribe("pill-bottle-readings")
# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    if(msg.topic == "ecg-readings"):
        q1.enqueue(str(msg.payload))
        #producer = KafkaProducer(bootstrap_servers=['localhost:9092'])
        while not (q1.isEmpty()):
                message = q1.peek()
                future = producer.send('ecg-readings', message)
                #producer.send('cmpe296a',"hello from bridge")
                try:
                        record_metadata = future.get(timeout=10)
                        print("Message dequeued from the queue")
                        print (q1.dequeue())
                #except KafkaError:
                except Exception:
                        print ("Trying to connect to Kafka....")
                        # Decide what to do if produce request failed...
    if(msg.topic == "body-temp-readings"):
        q2.enqueue(str(msg.payload))
        #producer = KafkaProducer(bootstrap_servers=['localhost:9092'])
        while not (q2.isEmpty()):
                message = q2.peek()
                future = producer.send('body-temp-readings', message)
                #producer.send('cmpe296a',"hello from bridge")
                try:
                        record_metadata = future.get(timeout=10)
                        print("Message dequeued from the queue")
                        print (q2.dequeue())
                #except KafkaError:
                except Exception:
                        print ("Trying to connect to Kafka....")
                        # Decide what to do if produce request failed...
    if(msg.topic == "pill-bottle-readings"):
        q1.enqueue(str(msg.payload))
        #producer = KafkaProducer(bootstrap_servers=['localhost:9092'])
        while not (q1.isEmpty()):
                message = q1.peek()
                future = producer.send('pill-bottle-readings', message)
                #producer.send('cmpe296a',"hello from bridge")
                try:
                        record_metadata = future.get(timeout=10)
                        print("Message dequeued from the queue")
                        print (q1.dequeue())
                #except KafkaError:
                except Exception:
                        print ("Trying to connect to Kafka....")
                        # Decide what to do if produce request failed...


client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("54.244.148.72", 1883, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
