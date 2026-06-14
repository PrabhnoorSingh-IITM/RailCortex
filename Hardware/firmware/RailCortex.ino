#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ---------------------------------------------------------
// Configuration
// ---------------------------------------------------------
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Target FastAPI WebSocket Endpoint
const char* ws_host = "192.168.1.100"; 
const uint16_t ws_port = 8000;
const char* ws_path = "/api/ws/telemetry";

const float G_FORCE_THRESHOLD = 8.0; // Trigger threshold in Gs

// ---------------------------------------------------------
// Global Objects
// ---------------------------------------------------------
WebSocketsClient webSocket;
Adafruit_MPU6050 mpu;

// ---------------------------------------------------------
// WebSocket Event Handler
// ---------------------------------------------------------
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("[WS] Disconnected!");
            break;
        case WStype_CONNECTED:
            Serial.printf("[WS] Connected to url: %s\n", payload);
            break;
        case WStype_TEXT:
            Serial.printf("[WS] Received text: %s\n", payload);
            break;
    }
}

// ---------------------------------------------------------
// Setup
// ---------------------------------------------------------
void setup() {
    Serial.begin(115200);
    while (!Serial) delay(10); 

    Serial.println("\n[INIT] RailCortex Edge Node Starting...");

    // 1. Initialize MPU6050
    if (!mpu.begin()) {
        Serial.println("[ERROR] Failed to find MPU6050 chip");
        while (1) delay(10);
    }
    mpu.setAccelerometerRange(MPU6050_RANGE_16_G);
    mpu.setGyroRange(MPU6050_RANGE_250_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("[INIT] MPU6050 Initialized.");

    // 2. Connect to Wi-Fi
    Serial.print("[INIT] Connecting to Wi-Fi");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n[INIT] Wi-Fi Connected!");
    Serial.print("[INIT] IP Address: ");
    Serial.println(WiFi.localIP());

    // 3. Initialize WebSocket Client
    webSocket.begin(ws_host, ws_port, ws_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    Serial.println("[INIT] WebSocket Client Started.");
}

// ---------------------------------------------------------
// Main Loop
// ---------------------------------------------------------
void loop() {
    // Keep WebSocket connection alive
    webSocket.loop();

    // Read MPU6050 Data
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Calculate Resultant G-Force Vector
    // Gravity is ~9.81 m/s^2. We convert absolute acceleration to Gs.
    float x = a.acceleration.x / 9.81;
    float y = a.acceleration.y / 9.81;
    float z = a.acceleration.z / 9.81;

    float resultant_g = sqrt((x * x) + (y * y) + (z * z));

    // Check for Physical Impact Anomaly
    if (resultant_g > G_FORCE_THRESHOLD) {
        Serial.println("\n=========================================");
        Serial.printf("[ALERT] KINETIC ANOMALY DETECTED: %.2f Gs\n", resultant_g);
        Serial.println("=========================================\n");

        // Construct JSON Payload
        String payload = "{";
        payload += "\"type\":\"EMERGENCY_TRIGGER\",";
        payload += "\"source\":\"ESP32_EDGE_NODE_01\",";
        payload += "\"g_force\":" + String(resultant_g) + ",";
        payload += "\"lat\":37.7749,"; // Hardcoded for demo, normally from NEO-6M GPS
        payload += "\"lng\":-122.4194"; // Hardcoded for demo, normally from NEO-6M GPS
        payload += "}";

        // Send to FastAPI Backend
        webSocket.sendTXT(payload);

        // Delay to prevent flood of emergency packets during a single crash event
        delay(5000); 
    }

    // Small delay for loop stability
    delay(50);
}
