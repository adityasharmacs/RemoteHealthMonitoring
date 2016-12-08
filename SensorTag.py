import paho.mqtt.client as mqtt
import json
import time

tosigned = lambda n: float(n-0x10000) if n>0x7fff else float(n)
tosignedbyte = lambda n: float(n-0x100) if n>0x7f else float(n)

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected to mqtt with code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("body-temp-readings")

def on_message(client, userdata, msg):
    #print(msg.topic+" "+str(msg.payload))
    resp_dict = json.loads(msg.payload)
    
    ambient_temp = resp_dict["d"]["ambient_temp"]
    object_temp = resp_dict["d"]["object_temp"]
    light = resp_dict["d"]["light"]
    humidity = resp_dict["d"]["humidity"]

    x_val = resp_dict["d"]["acc_x"]
    y_val = resp_dict["d"]["acc_y"]
    z_val = resp_dict["d"]["acc_z"]

    xyz = [float(x_val)/(64), float(y_val)/(64), float(z_val)/(64)]

    mag = (xyz[0]**2 + xyz[1]**2 + xyz[2]**2)**0.5

    activity = "Stationary"

    if mag>0.015:
	activity = "Motion"
    else:
        activity = "Stationary"

    light_value = "Low"

    if float(light)<=25:
        light_value = "Low"
    elif float(light)>25 and float(light)<=1000:
	light_value = "Moderate"
    elif float(light)>1000:
	light_value = "High"

    epoch_time = int(time.time()*1000)   	

    print(json.dumps({"AmbientTemperature":ambient_temp,"BodyTemperature":object_temp,"Light":light,"Humidity":humidity,"Activity":activity,"Timestamp":epoch_time}))
    print(light)
    print(light_value)
    #producer = KafkaProducer(bootstrap_servers=['localhost:9092'])
    #future = producer.send('CMPE296AIoT', msg.payload)

    
    motion = json.dumps({"AmbientTemperature":ambient_temp,"BodyTemperature":object_temp,"Light":light_value,"Humidity":humidity,"Activity":activity,"Timestamp":epoch_time})    
    client.publish("motion-sensor-readings", motion)
	
    
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("54.244.148.72", 1883, 60)

# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()