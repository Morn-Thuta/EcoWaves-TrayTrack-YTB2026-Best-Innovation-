#include "network.h"
#include "buffer.h"
#include "config.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

static unsigned long reconnectDelay = WIFI_RECONNECT_INITIAL_MS;
static unsigned long lastReconnectAttempt = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastReconnectAttempt < reconnectDelay) return;

  lastReconnectAttempt = now;
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Non-blocking: check on next loop iteration
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    reconnectDelay = WIFI_RECONNECT_INITIAL_MS; // Reset backoff
  } else {
    Serial.println(" Not yet connected");
    // Exponential backoff
    reconnectDelay = min(reconnectDelay * 2, (unsigned long)WIFI_RECONNECT_MAX_MS);
  }
}

bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

int uploadReading(float weightGrams, int readingsCount, unsigned long timestamp) {
  if (!isWiFiConnected()) return -1;

  HTTPClient http;

  // POST to Supabase Edge Function
  String url = String(SUPABASE_URL) + "/functions/v1/ingest-reading";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

  JsonDocument doc;
  doc["sensor_id"] = SENSOR_ID;
  doc["weight_grams"] = weightGrams;
  doc["readings_count"] = readingsCount;
  doc["recorded_at"] = timestamp; // Epoch milliseconds

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("Upload: %d - %.1fg\n", httpCode, weightGrams);
  } else {
    Serial.printf("Upload failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  return httpCode;
}

void flushBuffer() {
  if (!isWiFiConnected()) return;

  BufferEntry entry;
  int flushed = 0;

  while (bufferPop(&entry)) {
    int status = uploadReading(entry.weightGrams, entry.readingsCount, entry.timestamp);
    if (status < 200 || status >= 300) {
      // Re-buffer on failure and stop flushing
      bufferPush(entry.weightGrams, entry.readingsCount, entry.timestamp);
      break;
    }
    flushed++;
    delay(100); // Throttle to avoid flooding
  }

  if (flushed > 0) {
    Serial.printf("Flushed %d buffered readings\n", flushed);
  }
}
