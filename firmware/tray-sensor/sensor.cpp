#include "sensor.h"
#include "config.h"
#include <SPIFFS.h>
#include <ArduinoJson.h>

static HX711 scale;
static float calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
static long zeroOffset = 0;

void initHX711() {
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  if (loadCalibrationFromSPIFFS()) {
    Serial.println("Loaded calibration from SPIFFS");
    scale.set_scale(calibrationFactor);
    scale.set_offset(zeroOffset);
  } else {
    Serial.println("Using default calibration");
    scale.set_scale(calibrationFactor);
    scale.tare(20); // Average 20 readings for tare
  }
}

float readWeight() {
  if (!scale.is_ready()) {
    return -1.0; // Invalid reading
  }

  float weight = scale.get_units(1); // Single reading in grams

  // Reject obviously invalid readings
  if (weight < WEIGHT_MIN_GRAMS || weight > WEIGHT_MAX_GRAMS) {
    return -1.0;
  }

  return weight;
}

float getAveragedWeight(int samples) {
  if (samples < 3) samples = 3;

  float readings[samples];
  int validCount = 0;

  for (int i = 0; i < samples; i++) {
    float w = readWeight();
    if (w >= 0) {
      readings[validCount++] = w;
    }
  }

  if (validCount < 2) return -1.0;

  // Sort to discard min and max (outlier removal)
  for (int i = 0; i < validCount - 1; i++) {
    for (int j = i + 1; j < validCount; j++) {
      if (readings[i] > readings[j]) {
        float temp = readings[i];
        readings[i] = readings[j];
        readings[j] = temp;
      }
    }
  }

  // Average excluding min and max
  float sum = 0;
  int count = 0;
  for (int i = 1; i < validCount - 1; i++) {
    sum += readings[i];
    count++;
  }

  if (count == 0) return readings[0]; // Fallback if only 2 valid readings
  return sum / count;
}

void runCalibration() {
  Serial.println("=== CALIBRATION MODE ===");
  Serial.println("Step 1: Place EMPTY tray on load cells");
  Serial.println("Press any key when ready...");

  while (!Serial.available()) {
    delay(100);
  }
  Serial.read(); // Clear buffer

  Serial.println("Taring... (measuring empty tray)");
  scale.set_scale(1); // Raw mode
  scale.tare(20);     // Average 20 readings as zero offset
  zeroOffset = scale.get_offset();
  Serial.print("Zero offset: ");
  Serial.println(zeroOffset);

  Serial.println("\nStep 2: Place a KNOWN weight on the tray");
  Serial.println("Enter the weight in grams:");

  while (!Serial.available()) {
    delay(100);
  }

  float knownWeight = Serial.parseFloat();
  Serial.print("Known weight: ");
  Serial.print(knownWeight);
  Serial.println("g");

  Serial.println("Measuring...");
  long rawValue = scale.read_average(20);
  long rawDelta = rawValue - zeroOffset;

  calibrationFactor = (float)rawDelta / knownWeight;
  scale.set_scale(calibrationFactor);
  scale.set_offset(zeroOffset);

  Serial.print("Calibration factor: ");
  Serial.println(calibrationFactor);

  // Verify
  Serial.println("\nVerification - current reading:");
  float verified = scale.get_units(10);
  Serial.print(verified);
  Serial.println("g");

  // Save to SPIFFS
  saveCalibrationToSPIFFS(calibrationFactor, zeroOffset);
  Serial.println("Calibration saved to SPIFFS");
  Serial.println("=== CALIBRATION COMPLETE ===");
}

bool loadCalibrationFromSPIFFS() {
  if (!SPIFFS.exists("/calibration.json")) {
    return false;
  }

  File file = SPIFFS.open("/calibration.json", "r");
  if (!file) return false;

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();

  if (error) return false;

  calibrationFactor = doc["factor"].as<float>();
  zeroOffset = doc["offset"].as<long>();
  return true;
}

void saveCalibrationToSPIFFS(float factor, long offset) {
  JsonDocument doc;
  doc["factor"] = factor;
  doc["offset"] = offset;

  File file = SPIFFS.open("/calibration.json", "w");
  if (file) {
    serializeJson(doc, file);
    file.close();
  }
}
