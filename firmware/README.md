# ESP32 wiring / calibration

## Required sensors

1. MFRC522 RFID
2. R307 fingerprint sensor
3. HX711 + dispensing load cell
4. VL53L0X ToF
5. Four stock-level load cells + HX711 modules (recommended)
6. Servo/slide gates

## Why four stock sensors?

The 3D level shown on the dashboard must have a source. The cleanest implementation is a load cell under each commodity hopper. The firmware converts hopper mass into:

`fillPercent = (currentMass - emptyMass) / (fullMass - emptyMass) * 100`

and publishes that value to:

`hoppers/rice.fillPercent`
`hoppers/wheat.fillPercent`
`hoppers/dal.fillPercent`
`hoppers/sugar.fillPercent`

The web app listens to those documents and directly maps the percentage to the 3D fill height.

## Calibration

For each load cell:
1. Empty the hopper and record the zero.
2. Place a known mass.
3. Adjust the scale factor until the measured mass is correct.
4. Set the empty/full values in `config.h`.

Do not rely on the example calibration constants.

## Safety

The browser is never the final authority for a motor. The ESP32 checks:
- container present,
- target weight,
- timeout,
- gate state,
- emergency stop state.

For a real machine, add a physical emergency-stop input and independent motor power cutoff.
