#ifndef CONFIG_H
#define CONFIG_H

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Supabase configuration
#define SUPABASE_URL "https://your-project.supabase.co"
#define SUPABASE_ANON_KEY "your-anon-key-here"
#define SENSOR_ID "your-sensor-uuid-here"

// HX711 pin definitions
#define HX711_DT_PIN 16
#define HX711_SCK_PIN 4

// Calibration (determined during physical calibration)
#define DEFAULT_CALIBRATION_FACTOR -7050.0

// Timing intervals (milliseconds)
#define READ_INTERVAL_MS 1000      // Local read every 1 second
#define UPLOAD_INTERVAL_MS 7000    // Upload averaged reading every 7 seconds
#define DEBOUNCE_MS 3000           // Ignore weight spikes shorter than 3 seconds

// Buffer sizes
#define RAM_BUFFER_SIZE 150        // Circular buffer capacity in RAM
#define SPIFFS_OVERFLOW_THRESHOLD 120  // Start SPIFFS overflow at 80% RAM capacity

// Weight validation bounds (grams)
#define WEIGHT_MIN_GRAMS -100.0
#define WEIGHT_MAX_GRAMS 60000.0

// WiFi reconnection
#define WIFI_RECONNECT_INITIAL_MS 2000
#define WIFI_RECONNECT_MAX_MS 32000

// Calibration button
#define CALIBRATION_BUTTON_PIN 0   // GPIO 0 (BOOT button on most ESP32 boards)
#define CALIBRATION_HOLD_MS 5000   // Hold 5 seconds to enter calibration mode

#endif
