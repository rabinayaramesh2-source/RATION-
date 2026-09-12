# Smart Ration Dispenser — Full Web + Firebase + ESP32

This version is the hardware-connected architecture, not only a UI demo.

## Hardware → cloud → 3D dashboard

ESP32 reads:
- MFRC522 RFID
- R307 fingerprint
- HX711 load cell
- VL53L0X ToF container-presence sensor
- four stock-level load cells (recommended: one HX711 channel/module per hopper)
- four servo slide gates

ESP32 writes live machine/stock state to Firebase Firestore.
The web dashboard uses Firestore `onSnapshot()` listeners, so the four 3D hopper models update whenever the hardware publishes a new level.

### Firestore paths

`machines/{machineId}`
- online
- wifiRssi
- batteryPercent
- solarCharging
- machineAvailable
- binPresent
- dispensing
- activeCommodity
- currentWeightG
- targetWeightG
- updatedAt

`hoppers/{commodity}`
- name
- stockKg
- capacityKg
- fillPercent
- state (`normal`, `low`, `refill`, `full`)
- updatedAt

`beneficiaries/{beneficiaryId}`
- name
- cardId
- members
- entitlementKg
- remainingKg

`transactions/{transactionId}`
- beneficiaryId
- commodity
- requestedKg
- actualKg
- status
- machineId
- createdAt

`alerts/{alertId}` and `errors/{errorId}` store faults and alerts.

## Important hardware note

The exact GPIOs, load-cell calibration factors, servo mechanics and R307 fingerprint enrollment IDs depend on your physical build. They are deliberately isolated in `firmware/src/config.h` so you can change them without touching the state machine.

The firmware keeps the ESP32 as the final safety authority. A browser command cannot bypass:
1. container-presence interlock,
2. target-weight check,
3. motor timeout,
4. authentication,
5. emergency stop.

## Setup

### 1. Web
```bash
cd web
npm install
copy .env.example .env
npm run dev
```

Deploy:
```bash
npm run build
```

### 2. Firebase
Enable:
- Authentication → Email/Password
- Firestore
- Cloud Functions

Deploy:
```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,functions
```

Create one Firebase email/password account for the ESP32 device and put it in `firmware/src/config.h`.

### 3. ESP32 Arduino libraries

Install:
- FirebaseClient
- MFRC522
- Adafruit Fingerprint Sensor Library
- HX711
- Adafruit VL53L0X
- ESP32Servo

FirebaseClient currently supports ESP32 and Cloud Firestore. See:
https://github.com/mobizt/FirebaseClient

### 4. ESP32
Open `firmware/src/config.h`, fill Wi-Fi/Firebase credentials and calibration values, then upload `firmware/src/main.ino`.

## 3D stock behaviour

The web app does NOT fake a fixed level. Each hopper receives `fillPercent` from Firestore. The liquid/grain fill mesh is clipped/scaled vertically from 0–100%.

For example:
- hardware publishes `fillPercent: 80` → Rice 3D hopper visibly fills to ~80%
- hardware publishes `fillPercent: 35` → Wheat 3D hopper falls to ~35%
- hardware publishes `fillPercent: 8` → low-stock state and red/orange warning
- simulator writes the same Firestore field, so simulator and real hardware use exactly the same dashboard path.

## Production security

The included rules are intentionally structured around roles, but you must create the appropriate custom claims/role documents before production. Never expose a Firebase Admin SDK service-account key in the browser or ESP32.

The web UI's customer login is a demo-friendly Card ID flow. For a production public portal, use a stronger second factor/PIN or OTP because a card ID by itself is an identifier rather than a secret.


## Actual web → ESP32 command path
The Machine page writes `machines/{machineId}/commands/current`. The ESP32 polls that document, validates the commodity/target, enforces the container interlock and weight timeout, opens the appropriate servo gate, and publishes live weight/stock state back to Firestore. The dashboard's 3D models then update from those Firestore values.
