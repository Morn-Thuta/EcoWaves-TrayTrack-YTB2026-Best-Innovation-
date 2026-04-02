#include "buffer.h"
#include "config.h"
#include <SPIFFS.h>
#include <ArduinoJson.h>

// RAM circular buffer
static BufferEntry ramBuffer[RAM_BUFFER_SIZE];
static int bufferHead = 0;
static int bufferTail = 0;
static int bufferSize = 0;

// SPIFFS overflow
static const char* SPIFFS_BUFFER_PATH = "/offline_buffer.jsonl";
static bool spiffsOverflowActive = false;

void initBuffer() {
  bufferHead = 0;
  bufferTail = 0;
  bufferSize = 0;
  spiffsOverflowActive = false;
}

void bufferPush(float weightGrams, int readingsCount, unsigned long timestamp) {
  // If RAM buffer is getting full, overflow to SPIFFS
  if (bufferSize >= SPIFFS_OVERFLOW_THRESHOLD) {
    // Write to SPIFFS
    File file = SPIFFS.open(SPIFFS_BUFFER_PATH, "a");
    if (file) {
      JsonDocument doc;
      doc["w"] = weightGrams;
      doc["c"] = readingsCount;
      doc["t"] = timestamp;
      serializeJson(doc, file);
      file.println(); // JSONL format (one JSON per line)
      file.close();
      spiffsOverflowActive = true;
      Serial.println("Buffered to SPIFFS");
      return;
    }
  }

  // Push to RAM circular buffer
  ramBuffer[bufferHead].weightGrams = weightGrams;
  ramBuffer[bufferHead].readingsCount = readingsCount;
  ramBuffer[bufferHead].timestamp = timestamp;

  bufferHead = (bufferHead + 1) % RAM_BUFFER_SIZE;

  if (bufferSize < RAM_BUFFER_SIZE) {
    bufferSize++;
  } else {
    // Overwrite oldest entry
    bufferTail = (bufferTail + 1) % RAM_BUFFER_SIZE;
  }
}

bool bufferPop(BufferEntry* entry) {
  // First drain SPIFFS buffer (oldest data)
  if (spiffsOverflowActive && SPIFFS.exists(SPIFFS_BUFFER_PATH)) {
    flushSPIFFSBuffer();
  }

  if (bufferSize == 0) return false;

  entry->weightGrams = ramBuffer[bufferTail].weightGrams;
  entry->readingsCount = ramBuffer[bufferTail].readingsCount;
  entry->timestamp = ramBuffer[bufferTail].timestamp;

  bufferTail = (bufferTail + 1) % RAM_BUFFER_SIZE;
  bufferSize--;
  return true;
}

int bufferCount() {
  return bufferSize;
}

bool isBufferEmpty() {
  return bufferSize == 0 && !spiffsOverflowActive;
}

void flushSPIFFSBuffer() {
  if (!SPIFFS.exists(SPIFFS_BUFFER_PATH)) {
    spiffsOverflowActive = false;
    return;
  }

  File file = SPIFFS.open(SPIFFS_BUFFER_PATH, "r");
  if (!file) return;

  // Read each line and push to RAM buffer for upload
  while (file.available()) {
    String line = file.readStringUntil('\n');
    if (line.length() == 0) continue;

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, line);
    if (error) continue;

    // Push back into RAM buffer for network.cpp to upload
    BufferEntry entry;
    entry.weightGrams = doc["w"].as<float>();
    entry.readingsCount = doc["c"].as<int>();
    entry.timestamp = doc["t"].as<unsigned long>();

    ramBuffer[bufferHead] = entry;
    bufferHead = (bufferHead + 1) % RAM_BUFFER_SIZE;
    if (bufferSize < RAM_BUFFER_SIZE) {
      bufferSize++;
    }
  }

  file.close();
  SPIFFS.remove(SPIFFS_BUFFER_PATH); // Clear after reading
  spiffsOverflowActive = false;
  Serial.println("SPIFFS buffer loaded into RAM");
}
