
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <cstring>
#include "web_files.h"

// ---------- Wi-Fi ----------
const char* AP_SSID = "OpenRemote";
const char* AP_PASSWORD = "openremote123";

// ---------- Proposed signal pins ----------
// Confirm these against your actual ESP32 board before wiring.
constexpr int LIFT_ESC_PIN = 18;
constexpr int THRUST_ESC_PIN = 19;
constexpr int STEERING_SERVO_PIN = 21;

// ---------- PWM settings ----------
constexpr int ESC_MIN_US = 1000;
constexpr int ESC_MAX_US = 2000;
constexpr int SERVO_CENTER_DEG = 90;
constexpr int SERVO_MIN_DEG = 45;
constexpr int SERVO_MAX_DEG = 135;

constexpr unsigned long CONTROL_TIMEOUT_MS = 1500;

WebServer httpServer(80);
WebSocketsServer webSocket(81);

Servo liftESC;
Servo thrustESC;
Servo steeringServo;

struct ControlState {
    int thrust = 0;
    int lift = 0;
    int steering = 0;
    bool stopped = true;
};

ControlState controls;
unsigned long lastControlAt = 0;

// ---------- Hardware output helpers ----------

int percentToEscPulse(int percent) {
    percent = constrain(percent, 0, 100);
    return map(percent, 0, 100, ESC_MIN_US, ESC_MAX_US);
}

void applyOutputs() {
    // A stopped controller always commands minimum throttle.
    int liftPulse = controls.stopped
        ? ESC_MIN_US
        : percentToEscPulse(controls.lift);

    int thrustPulse = controls.stopped
        ? ESC_MIN_US
        : percentToEscPulse(controls.thrust);

    int steeringAngle = controls.stopped
        ? SERVO_CENTER_DEG
        : constrain(
            SERVO_CENTER_DEG + controls.steering,
            SERVO_MIN_DEG,
            SERVO_MAX_DEG
        );

    liftESC.writeMicroseconds(liftPulse);
    thrustESC.writeMicroseconds(thrustPulse);
    steeringServo.write(steeringAngle);
}

void stopControls() {
    controls.thrust = 0;
    controls.lift = 0;
    controls.steering = 0;
    controls.stopped = true;

    applyOutputs();
}

// ---------- Website serving ----------

void servePage(const uint8_t* content, const char* type) {
    httpServer.send_P(
        200,
        type,
        reinterpret_cast<PGM_P>(content)
    );
}

// ---------- WebSocket status ----------

void sendState(uint8_t client) {
    JsonDocument doc;

    doc["type"] = "status";
    doc["device"] = "OpenRemote ESP32";
    doc["connected"] = true;
    doc["simulated"] = false;

    doc["state"]["thrust"] = controls.thrust;
    doc["state"]["lift"] = controls.lift;
    doc["state"]["steering"] = controls.steering;
    doc["state"]["stop"] = controls.stopped;

    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(client, output);
}

void sendError(uint8_t client, const char* message) {
    JsonDocument doc;
    doc["type"] = "error";
    doc["message"] = message;

    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(client, output);
}

// ---------- WebSocket command handling ----------

void onWebSocketEvent(
    uint8_t client,
    WStype_t type,
    uint8_t* payload,
    size_t length
) {
    if (type == WStype_CONNECTED) {
        Serial.printf("Controller connected: client %u\n", client);
        sendState(client);
        return;
    }

    if (type == WStype_DISCONNECTED) {
        stopControls();
        Serial.println("Client disconnected: outputs stopped.");
        return;
    }

    if (type != WStype_TEXT) return;

    JsonDocument doc;
    DeserializationError error =
        deserializeJson(doc, payload, length);

    if (error) {
        sendError(client, "Invalid JSON");
        return;
    }

    const char* messageType = doc["type"] | "";

    if (strcmp(messageType, "stop") == 0) {
        stopControls();
        Serial.println("STOP: minimum throttle commanded.");

    } else if (strcmp(messageType, "control") == 0) {
        int thrust = doc["thrust"] | -1;
        int lift = doc["lift"] | -1;
        int steering = doc["steering"] | -999;

        if (thrust < 0 || thrust > 100 ||
            lift < 0 || lift > 100 ||
            steering < -45 || steering > 45) {
            sendError(client, "Control values out of range");
            return;
        }

        controls.thrust = thrust;
        controls.lift = lift;
        controls.steering = steering;
        controls.stopped = false;
        lastControlAt = millis();

        applyOutputs();

        Serial.printf(
            "Control: thrust=%d%% lift=%d%% steering=%d deg\n",
            controls.thrust,
            controls.lift,
            controls.steering
        );

    } else {
        sendError(client, "Unknown message type");
        return;
    }

    JsonDocument response;
    response["type"] = "ack";
    response["simulated"] = false;
    response["state"]["thrust"] = controls.thrust;
    response["state"]["lift"] = controls.lift;
    response["state"]["steering"] = controls.steering;
    response["state"]["stop"] = controls.stopped;

    String output;
    serializeJson(response, output);
    webSocket.sendTXT(client, output);
}

// ---------- Setup ----------

void setup() {
    Serial.begin(115200);

    // Attach outputs and command minimum throttle immediately.
    liftESC.setPeriodHertz(50);
    thrustESC.setPeriodHertz(50);
    steeringServo.setPeriodHertz(50);

    liftESC.attach(LIFT_ESC_PIN, ESC_MIN_US, ESC_MAX_US);
    thrustESC.attach(THRUST_ESC_PIN, ESC_MIN_US, ESC_MAX_US);
    steeringServo.attach(STEERING_SERVO_PIN, 500, 2500);

    stopControls();

    // Give ESCs time to initialize while commanding minimum throttle.
    delay(3000);

    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);

    Serial.println();
    Serial.println("OpenRemote ESP32 starting");
    Serial.print("Wi-Fi network: ");
    Serial.println(AP_SSID);
    Serial.print("ESP32 address: ");
    Serial.println(WiFi.softAPIP());

    httpServer.on("/", HTTP_GET, []() {
        servePage(index_html, "text/html");
    });

    httpServer.on("/index.html", HTTP_GET, []() {
        servePage(index_html, "text/html");
    });

    httpServer.on("/style.css", HTTP_GET, []() {
        servePage(style_css, "text/css");
    });

    httpServer.on("/app.js", HTTP_GET, []() {
        servePage(app_js, "application/javascript");
    });

    httpServer.on("/connection.js", HTTP_GET, []() {
        servePage(connection_js, "application/javascript");
    });

    httpServer.onNotFound([]() {
        httpServer.send(404, "text/plain", "Not found");
    });

    httpServer.begin();

    webSocket.begin();
    webSocket.onEvent(onWebSocketEvent);

    Serial.println("HTTP server ready on port 80");
    Serial.println("WebSocket server ready on port 81");
}

// ---------- Main loop ----------

void loop() {
    httpServer.handleClient();
    webSocket.loop();

    if (!controls.stopped &&
        millis() - lastControlAt > CONTROL_TIMEOUT_MS) {
        stopControls();
        Serial.println("Failsafe timeout: outputs stopped.");
    }
}

