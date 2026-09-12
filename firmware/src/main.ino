#include <Arduino.h>
#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <HX711.h>
#include <Adafruit_VL53L0X.h>
#include <ESP32Servo.h>
#include <FirebaseClient.h>
#include <ArduinoJson.h>
#include "config.h"

DefaultNetwork network;
UserAuth user_auth(FIREBASE_API_KEY, DEVICE_EMAIL, DEVICE_PASSWORD);
FirebaseApp app;

WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client, getNetwork(network));
Firestore::Documents Docs;

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
HardwareSerial FingerSerial(2);
Adafruit_Fingerprint finger(&FingerSerial);
Adafruit_VL53L0X tof = Adafruit_VL53L0X();

HX711 dispenseScale;
HX711 riceScale, wheatScale, dalScale, sugarScale;
Servo riceGate, wheatGate, dalGate, sugarGate;

enum State { IDLE, AUTHENTICATED, WAITING_FOR_BIN, DISPENSING, COMPLETE, FAULT };
State state = IDLE;

String beneficiaryId = "";
String beneficiaryName = "";
String activeCommodity = "";
float targetKg = 0;
float targetG = 0;
float currentG = 0;
unsigned long stateStarted = 0;
unsigned long lastTelemetry = 0;
unsigned long lastWeightRead = 0;
unsigned long lastCommandPoll = 0;
String lastCommandId = "";

void authHandler() {
  unsigned long start=millis();
  while(app.isInitialized() && !app.ready() && millis()-start<120000UL) {
    app.loop();
    delay(10);
  }
}

void setGate(const String& commodity, bool open) {
  int angle = open ? GATE_OPEN_DEG : GATE_CLOSED_DEG;
  if(commodity=="rice") riceGate.write(angle);
  if(commodity=="wheat") wheatGate.write(angle);
  if(commodity=="dal") dalGate.write(angle);
  if(commodity=="sugar") sugarGate.write(angle);
}

float clamp100(float x) { return x<0 ? 0 : x>100 ? 100 : x; }

float stockPercent(float grams,float emptyG,float fullG) {
  if(fullG<=emptyG) return 0;
  return clamp100((grams-emptyG)*100.0f/(fullG-emptyG));
}

float readStock(HX711 &scale,float factor) {
  if(!scale.is_ready()) return NAN;
  scale.set_scale(factor);
  return scale.get_units(3);
}

float readDispenseWeight() {
  if(!dispenseScale.is_ready()) return currentG;
  dispenseScale.set_scale(DISPENSE_SCALE_FACTOR);
  float g=dispenseScale.get_units(3);
  if(!isfinite(g) || g<0) return currentG;
  return g;
}

bool containerPresent() {
  VL53L0X_RangingMeasurementData_t m;
  tof.rangingTest(&m,false);
  if(m.RangeStatus==4) return false;
  return m.RangeMilliMeter > 20 && m.RangeMilliMeter < 350;
}

void writeMachine() {
  Document<Values::Value> doc("online", Values::BooleanValue(WiFi.status()==WL_CONNECTED));
  doc.add("wifiRssi",Values::IntegerValue(WiFi.RSSI()));
  doc.add("machineAvailable",Values::BooleanValue(state==IDLE || state==COMPLETE));
  doc.add("binPresent",Values::BooleanValue(containerPresent()));
  doc.add("dispensing",Values::BooleanValue(state==DISPENSING));
  doc.add("activeCommodity",Values::StringValue(activeCommodity));
  doc.add("currentWeightG",Values::DoubleValue(currentG));
  doc.add("targetWeightG",Values::DoubleValue(targetG));
  doc.add("gateOpen",Values::BooleanValue(state==DISPENSING));
  doc.add("emergencyStop",Values::BooleanValue(false));
  String path=String("machines/")+MACHINE_ID;
  Docs.patch(aClient,Firestore::Parent(FIREBASE_PROJECT_ID),path,
    PatchDocumentOptions(DocumentMask("online,wifiRssi,machineAvailable,binPresent,dispensing,activeCommodity,currentWeightG,targetWeightG,gateOpen,emergencyStop")),
    doc);
}

void writeHopper(const char* id,const char* name,float stock,float capacity) {
  if(!isfinite(stock)) return;
  float percent=clamp100(stock*100.0f/capacity);
  const char* s = percent<=10 ? "low" : percent>=99 ? "full" : "normal";
  Document<Values::Value> doc("name",Values::StringValue(name));
  doc.add("stockKg",Values::DoubleValue(stock/1000.0f));
  doc.add("capacityKg",Values::DoubleValue(capacity/1000.0f));
  doc.add("fillPercent",Values::DoubleValue(percent));
  doc.add("state",Values::StringValue(s));
  String path=String("hoppers/")+id;
  Docs.patch(aClient,Firestore::Parent(FIREBASE_PROJECT_ID),path,
    PatchDocumentOptions(DocumentMask("name,stockKg,capacityKg,fillPercent,state")),doc);
}

void publishTelemetry() {
  if(!app.ready()) return;
  writeMachine();
  writeHopper("rice","Rice",readStock(riceScale,STOCK_SCALE_RICE),RICE_FULL_G);
  writeHopper("wheat","Wheat",readStock(wheatScale,STOCK_SCALE_WHEAT),WHEAT_FULL_G);
  writeHopper("dal","Dal",readStock(dalScale,STOCK_SCALE_DAL),DAL_FULL_G);
  writeHopper("sugar","Sugar",readStock(sugarScale,STOCK_SCALE_SUGAR),SUGAR_FULL_G);
}

String readCardUID() {
  if(!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return "";
  String uid="";
  for(byte i=0;i<rfid.uid.size;i++){ if(i) uid+="-"; if(rfid.uid.uidByte[i]<16) uid+="0"; uid+=String(rfid.uid.uidByte[i],HEX); }
  uid.toUpperCase();
  rfid.PICC_HaltA();
  return uid;
}

int readFingerprint() {
  if(finger.getImage()!=FINGERPRINT_OK) return -1;
  if(finger.image2Tz()!=FINGERPRINT_OK) return -1;
  if(finger.fingerSearch()!=FINGERPRINT_OK) return -1;
  return finger.fingerID;
}

void startDispensing(const String& commodity,float kg) {
  activeCommodity=commodity;
  targetKg=kg;
  targetG=kg*1000.0f;
  currentG=0;
  state=WAITING_FOR_BIN;
  stateStarted=millis();
  setGate(activeCommodity,false);
  writeMachine();
}


void pollCommand() {
  if(!app.ready() || millis()-lastCommandPoll<1200UL) return;
  lastCommandPoll=millis();

  String path=String("machines/")+MACHINE_ID+"/commands/current";
  String payload=Docs.get(aClient,Firestore::Parent(FIREBASE_PROJECT_ID),path,GetDocumentOptions());
  if(aClient.lastError().code()!=0 || payload.length()==0) return;

  DynamicJsonDocument root(8192);
  if(deserializeJson(root,payload)) return;

  JsonObject fields=root["fields"];
  const char* type=fields["type"]["stringValue"] | "";
  const char* cmdId=fields["commandId"]["stringValue"] | "";
  bool handled=fields["handled"]["booleanValue"] | false;

  if(handled || !cmdId[0] || String(cmdId)==lastCommandId) return;
  if(String(type)=="DISPENSE" && state==IDLE) {
    const char* commodity=fields["commodity"]["stringValue"] | "";
    float grams=fields["targetWeightG"]["integerValue"] | 0.0f;
    if(grams<=0) grams=fields["targetWeightG"]["doubleValue"] | 0.0f;
    if(String(commodity)=="rice" || String(commodity)=="wheat" ||
       String(commodity)=="dal" || String(commodity)=="sugar") {
      startDispensing(String(commodity),grams/1000.0f);
      lastCommandId=String(cmdId);

      Document<Values::Value> ack("handled",Values::BooleanValue(true));
      ack.add("handledBy",Values::StringValue(MACHINE_ID));
      Docs.patch(aClient,Firestore::Parent(FIREBASE_PROJECT_ID),path,
        PatchDocumentOptions(DocumentMask("handled,handledBy")),ack);
    }
  }
}

void loopStateMachine() {
  if(state==WAITING_FOR_BIN) {
    if(containerPresent()) {
      state=DISPENSING;
      stateStarted=millis();
      setGate(activeCommodity,true);
    } else if(millis()-stateStarted>BIN_WAIT_TIMEOUT_MS) {
      state=FAULT;
      setGate(activeCommodity,false);
    }
  } else if(state==DISPENSING) {
    if(millis()-lastWeightRead>WEIGHT_SAMPLE_MS) {
      lastWeightRead=millis();
      currentG=readDispenseWeight();
      if(currentG>=targetG) {
        setGate(activeCommodity,false);
        state=COMPLETE;
        stateStarted=millis();
      } else if(millis()-stateStarted>DISPENSE_TIMEOUT_MS) {
        setGate(activeCommodity,false);
        state=FAULT;
      }
    }
  } else if(state==COMPLETE) {
    if(millis()-stateStarted>2500) {
      state=IDLE;
      activeCommodity="";
      targetG=0;
      currentG=0;
    }
  } else if(state==FAULT) {
    setGate(activeCommodity,false);
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin(RFID_SCK_PIN,RFID_MISO_PIN,RFID_MOSI_PIN,RFID_SS_PIN);
  rfid.PCD_Init();

  FingerSerial.begin(57600,SERIAL_8N1,FP_RX_PIN,FP_TX_PIN);
  finger.begin(57600);

  dispenseScale.begin(DISPENSE_HX_DOUT,DISPENSE_HX_SCK);
  riceScale.begin(RICE_HX_DOUT,RICE_HX_SCK);
  wheatScale.begin(WHEAT_HX_DOUT,WHEAT_HX_SCK);
  dalScale.begin(DAL_HX_DOUT,DAL_HX_SCK);
  sugarScale.begin(SUGAR_HX_DOUT,SUGAR_HX_SCK);

  riceGate.attach(SERVO_RICE_PIN);
  wheatGate.attach(SERVO_WHEAT_PIN);
  dalGate.attach(SERVO_DAL_PIN);
  sugarGate.attach(SERVO_SUGAR_PIN);
  setGate("rice",false); setGate("wheat",false); setGate("dal",false); setGate("sugar",false);

  Wire.begin();
  tof.begin();

  WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
  Serial.print("WiFi");
  while(WiFi.status()!=WL_CONNECTED){delay(300);Serial.print(".");}
  Serial.println();

  ssl_client.setInsecure();
  ssl_client.setTimeout(5000);
  ssl_client.setHandshakeTimeout(5);
  ssl_client.setConnectionTimeout(5);

  initializeApp(aClient,app,getAuth(user_auth));
  authHandler();
  app.getApp<Firestore::Documents>(Docs);
}

void loop() {
  authHandler();
  Docs.loop();

  // Web machine UI writes a command here. The ESP32 validates and executes it.
  pollCommand();
  loopStateMachine();

  if(millis()-lastTelemetry>TELEMETRY_INTERVAL_MS) {
    lastTelemetry=millis();
    if(app.ready()) publishTelemetry();
  }

  // RFID/fingerprint hooks are intentionally non-blocking.
  // Customer authentication and the requested quantity should be supplied
  // by the machine UI/command queue after server-side entitlement validation.
  String uid=readCardUID();
  if(uid.length() && state==IDLE) {
    beneficiaryId=uid;
    beneficiaryName="RFID beneficiary";
    Serial.println("RFID: "+uid);
    state=AUTHENTICATED;
  }

  if(state==AUTHENTICATED) {
    // Demo default: replace this with the command queue from Firestore.
    // Keeping it here makes the hardware authentication path explicit.
    delay(20);
  }

  delay(5);
}
