/*
 * Tray Weight Monitoring - ESP32 Firmware
 *
 * Hardware: 4x 50kg load cells + HX711 ADC + ESP32-WROOM-32U
 * Communication: HTTP POST to Supabase Edge Function
 */

#include <WiFi.h>
#include <SPIFFS.h>
#include "config.h"
#include "sensor.h"
#include "network.h"
#include "buffer.h"

// Running average state
static float weightSum = 0;
static int weightCount = 0;
static unsigned long lastReadTime = 0;
static unsigned long lastUploadTime = 0;

// Debounce state
static float lastStableWeight = 0;
static unsigned long spikeStartTime = 0;
static bool inSpike = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Tray Weight Monitor ===");

  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed!");
  }

  // Initialize buffer
  initBuffer();

  // Check for calibration mode (hold button on boot)
  pinMode(CALIBRATION_BUTTON_PIN, INPUT_PULLUP);
  delay(100);
  if (digitalRead(CALIBRATION_BUTTON_PIN) == LOW) {
    Serial.println("Calibration button held - entering calibration mode");
    initHX711();
    runCalibration();
    Serial.println("Restarting...");
    delay(1000);
    ESP.restart();
  }

  // Initialize sensor
  initHX711();

  // Connect to WiFi (blocking on first connect)
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 10000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" Will retry in background");
  }

  lastReadTime = millis();
  lastUploadTime = millis();
}

void loop() {
  unsigned long now = millis();

  // Read weight every READ_INTERVAL_MS
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    float weight = readWeight();
    if (weight >= 0) {
      // Debounce filter: detect sudden spikes (e.g., hand on tray)
      float delta = abs(weight - lastStableWeight);

      if (delta > 500 && !inSpike) { // Spike threshold: 500g sudden change
        inSpike = true;
        spikeStartTime = now;
      } else if (inSpike) {
        if (now - spikeStartTime > DEBOUNCE_MS) {
          // Spike lasted longer than debounce period - accept as real change
          inSpike = false;
          lastStableWeight = weight;
          weightSum += weight;
          weightCount++;
        }
        // Otherwise ignore (transient spike)
      } else {
        lastStableWeight = weight;
        weightSum += weight;
        weightCount++;
      }
    }
  }

  // Upload averaged reading every UPLOAD_INTERVAL_MS
  if (now - lastUploadTime >= UPLOAD_INTERVAL_MS) {
    lastUploadTime = now;

    if (weightCount > 0) {
      float avgWeight = weightSum / weightCount;

      if (isWiFiConnected()) {
        // Flush any buffered readings first
        flushBuffer();

        // Upload current reading
        int status = uploadReading(avgWeight, weightCount, now);
        if (status < 200 || status >= 300) {
          // Upload failed - buffer it
          bufferPush(avgWeight, weightCount, now);
        }
      } else {
        // WiFi disconnected - buffer the reading
        bufferPush(avgWeight, weightCount, now);
        connectWiFi(); // Non-blocking reconnection attempt
      }

      // Reset running average
      weightSum = 0;
      weightCount = 0;
    }
  }
}
