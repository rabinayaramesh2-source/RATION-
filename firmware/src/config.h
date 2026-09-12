#pragma once

// ===== NETWORK / FIREBASE =====
#define WIFI_SSID "YOUR_WIFI"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define FIREBASE_API_KEY "YOUR_WEB_API_KEY"
#define FIREBASE_PROJECT_ID "YOUR_PROJECT_ID"
#define DEVICE_EMAIL "esp32-device@YOUR_DOMAIN"
#define DEVICE_PASSWORD "YOUR_DEVICE_PASSWORD"
#define MACHINE_ID "SRD-001"

// ===== RFID MFRC522 =====
// ESP32 VSPI example; change if your wiring differs.
#define RFID_SS_PIN 5
#define RFID_RST_PIN 27
#define RFID_SCK_PIN 18
#define RFID_MISO_PIN 19
#define RFID_MOSI_PIN 23

// ===== R307 fingerprint =====
#define FP_RX_PIN 16
#define FP_TX_PIN 17

// ===== HX711 dispensing scale =====
#define DISPENSE_HX_DOUT 32
#define DISPENSE_HX_SCK 33

// ===== Optional stock level scales =====
// One HX711 per hopper is recommended for independent real-time stock.
#define RICE_HX_DOUT 4
#define RICE_HX_SCK  0
#define WHEAT_HX_DOUT 34
#define WHEAT_HX_SCK  35
#define DAL_HX_DOUT 25
#define DAL_HX_SCK  26
#define SUGAR_HX_DOUT 14
#define SUGAR_HX_SCK  13

// ===== ToF =====
#define TOF_XSHUT_PIN 2

// ===== Servo gates =====
#define SERVO_RICE_PIN 12
#define SERVO_WHEAT_PIN 15
#define SERVO_DAL_PIN 21
#define SERVO_SUGAR_PIN 22

#define GATE_CLOSED_DEG 10
#define GATE_OPEN_DEG 85

// ===== Calibration =====
// Replace these after calibrating each load cell.
#define DISPENSE_SCALE_FACTOR 420.0f
#define STOCK_SCALE_RICE 420.0f
#define STOCK_SCALE_WHEAT 420.0f
#define STOCK_SCALE_DAL 420.0f
#define STOCK_SCALE_SUGAR 420.0f

// Empty/full stock tare values in grams for each hopper.
#define RICE_EMPTY_G 0.0f
#define RICE_FULL_G 20000.0f
#define WHEAT_EMPTY_G 0.0f
#define WHEAT_FULL_G 20000.0f
#define DAL_EMPTY_G 0.0f
#define DAL_FULL_G 10000.0f
#define SUGAR_EMPTY_G 0.0f
#define SUGAR_FULL_G 10000.0f

#define DISPENSE_TIMEOUT_MS 90000UL
#define BIN_WAIT_TIMEOUT_MS 120000UL
#define TELEMETRY_INTERVAL_MS 3000UL
#define WEIGHT_SAMPLE_MS 120UL
