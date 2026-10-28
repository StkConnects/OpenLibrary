const DEVICE_URL = "ws://192.168.4.1:81/";

let socket = null;

function connectDevice(onStatus, onMessage) {
    if (socket && socket.readyState <= WebSocket.OPEN) return;

    onStatus("Connecting");

    socket = new WebSocket(DEVICE_URL);

    socket.onopen = () => onStatus("Connected (Simulator)");
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
