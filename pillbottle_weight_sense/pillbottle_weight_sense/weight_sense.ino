#include <ArduinoJson.h>
#include <HX711.h>
#include "HX711.h"
#include <EEPROM.h>
#include <SoftwareSerial.h>



// HX711.DOUT	- pin #A0
// HX711.PD_SCK	- pin #A1
SoftwareSerial BT(10, 11);

StaticJsonBuffer<500> jsonBuffer;
JsonObject& root = jsonBuffer.createObject();

// creates a "virtual" serial port/UART
// connect BT module TX to D10
// connect BT module RX to D11

//#define BT Serial
float bottle_w= 16.17;
float bottle_wo_cap=11;
HX711 scale(A0, A1);		// parameter "gain" is ommited; the default value 128 is used by the library
float prev=0.000f;
int addr=27;
float new1=0.000f;
float avg_w=0.000f;
int count=0;
float offset=90.562;
float unit_w =2.67;//0.92
int taken=0;
float init_count=0; 
String str;
void setup() {
 
  
  BT.begin(9600);
  //BT.println("Health First");
  //BT.print("Before setting up the scale:");
  //BT.print("read: \t\t");
  scale.read();			// print a raw reading from the ADC
  //BT.print("read average: \t\t");
  scale.read_average(20);  	// print the average of 20 readings from the AD
  //BT.print("get value: \t\t");
  scale.get_value(5);		// print the average of 5 readings from the ADC minus the tare weight (not set yet)
  //BT.print("get units: \t\t");
  scale.get_units(5);	// print the average of 5 readings from the ADC minus tare weight (not set) divided 
						// by the SCALE parameter (not set yet)    
  scale.set_scale(-2099.58f);                      // this value is obtained by calibrating the scale with known weights; see the README for details
  //scale.tare();				        // reset the scale to 0
  //BT.println(scale.get_units(10));

  prev= EEPROM.read(addr);
  //BT.print("Prev:\t");
  //BT.println(prev);
  //BT.println("Readings:");
  avg_w=scale.get_units(10)-offset;
  init_count=((avg_w-bottle_wo_cap)/unit_w);
  //BT.print(init_count);
}

void loop() 
{  
  avg_w=scale.get_units(10)-offset;
  //root["weight"]=avg_w; 
  //root["pilltaken"]=(avg_w);
  //BT.print("avg_w =");
  //BT.println(avg_w);
  
  //float p_weight = avg_w;
  prev= EEPROM.read(addr);
 // BT.println(prev);
 // BT.print("avg-prev=");
  //BT.println(avg_w-prev);
 

  if ((avg_w-prev)>unit_w && (avg_w-prev)>0)
    {
      
     //BT.println("pill removed");
     root["pillName"] = "Cozaar";
     //BT.println(avg_w-prev);
     
     
     //BT.print("pillName=Cozaar");
     //BT.print(",pillTaken=");
     //BT.print(taken);
     
   
     count=((avg_w-bottle_wo_cap)/unit_w);
     taken= init_count-count; 
     root["pillTaken"]=taken;
     root["pillRemaining"]=(count);
     str="";
     root.printTo(str);
     str=str+"#";
     //BT.print(",pillRemaining=");
     //BT.print(count);
     //BT.println("#");
     //root.printTo(BT);  
     BT.println(str);
     
     
   }
      
   if(avg_w!=prev)
  {
  EEPROM.update(addr,avg_w);
  }

   //root.printTo(BT);
  //BT.println();
  
  scale.power_down();			        // put the ADC in sleep mode
  delay(1000);
  scale.power_up();
}

