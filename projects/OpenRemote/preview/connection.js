const SIMULATOR_URL = "ws://127.0.0.1:8765/ws";
const ESP32_URL = "ws://192.168.4.1:81/";

const params = new URLSearchParams(window.location.search);
const DEVICE_URL = params.get("device") === "esp32"
    ? ESP32_URL
    : SIMULATOR_URL;

const CONNECTION_LABEL = DEVICE_URL === ESP32_URL
    ? "Connected (ESP32)"
    : "Connected (Simulator)";

let socket = null;

function connectDevice(onStatus, onMessage) {
    if (socket && socket.readyState <= WebSocket.OPEN) return;

    onStatus("Connecting");

    socket = new WebSocket(DEVICE_URL);

    socket.onopen = () => onStatus(CONNECTION_LABEL);
    socket.onmessage = event => {
        try {
            onMessage(JSON.parse(event.data));
        } catch {
            onStatus("Invalid device response");
        }
    };
    socket.onerror = () => onStatus("Connection error");
    socket.onclose = () => onStatus("Disconnected");
}

function sendDeviceCommand(command) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(command));
    return true;
}

function disconnectDevice() {
    if (socket) socket.close();
    socket = null;
}
