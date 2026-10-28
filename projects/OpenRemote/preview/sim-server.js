const { WebSocketServer, WebSocket } = require("ws");

const PORT = 8765;
const server = new WebSocketServer({
    port: PORT,
    host: "127.0.0.1",
    path: "/ws"
});

const safeState = () => ({
    thrust: 0,
    lift: 0,
    steering: 0,
    stop: true
});

let state = safeState();
let lastControlAt = Date.now();
const CONTROL_TIMEOUT_MS = 60000;

setInterval(() => {
    if (
        !state.stop &&
        Date.now() - lastControlAt > CONTROL_TIMEOUT_MS
    ) {
        state = safeState();
        console.log("[TIMEOUT] No control updates; outputs reset to zero.");
    }
}, 250);

server.on("listening", () => {
    console.log(`OpenRemote simulator listening on ws://127.0.0.1:${PORT}/ws`);
    console.log("Simulation only — no physical hardware is connected.\n");
});

server.on("connection", (socket) => {
    console.log("[CONNECTED] Controller connected.");

    socket.send(JSON.stringify({
        type: "status",
        device: "OpenRemote Simulator",
        connected: true,
        simulated: true,
        state
    }));

    socket.on("message", (raw) => {
        let message;

        try {
            message = JSON.parse(raw.toString());
        } catch {
            socket.send(JSON.stringify({
                type: "error",
                message: "Invalid JSON"
            }));
            return;
        }

        if (message.type === "stop") {
            state = safeState();
            console.log("[STOP] Emergency stop received.");
        } else if (message.type === "control") {
            const { thrust, lift, steering } = message;

            const valid =
                Number.isFinite(thrust) &&
                thrust >= 0 && thrust <= 100 &&
                Number.isFinite(lift) &&
                lift >= 0 && lift <= 100 &&
                Number.isFinite(steering) &&
                steering >= -45 && steering <= 45;

            if (!valid) {
                socket.send(JSON.stringify({
                    type: "error",
                    message: "Control values out of range"
                }));
                return;
            }

            state = {
                thrust,
                lift,
                steering,
                stop: false
            };
            lastControlAt = Date.now();

            console.log(
                `[CONTROL] Thrust: ${thrust}% | ` +
                `Lift: ${lift}% | Steering: ${steering}°`
            );
        } else {
            socket.send(JSON.stringify({
                type: "error",
                message: "Unknown message type"
            }));
            return;
        }

        socket.send(JSON.stringify({
            type: "ack",
            simulated: true,
            state
        }));
    });

    socket.on("close", () => {
        state = safeState();
        console.log("[DISCONNECTED] Simulated outputs reset to safe state.");
    });
});

server.on("error", (error) => {
    console.error("Simulator error:", error.message);
    process.exitCode = 1;
});
