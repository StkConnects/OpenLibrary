# OpenRemote

OpenRemote is an open-source remote-control interface and firmware project. Its first profile targets a hovercraft, with an ESP32 planned for physical control.

The browser controller can also run with a local WebSocket simulator, so development does not require physical hardware.

## Components

- **Browser preview:** controller interface served locally.
- **WebSocket simulator:** simulates a device connection for software development.
- **Hovercraft firmware:** ESP32 firmware, for use when compatible hardware is available.

## Requirements

- Node.js and npm
- Python 3, for serving the browser interface

Physical ESP32 hardware is not required for simulator mode.

## Run the browser preview

Open two terminals.

### Terminal 1 — start the simulator

```bash
cd ~/Projects/OpenLibrary/projects/OpenRemote/preview
npm install
npm start
```

The simulator listens on `ws://127.0.0.1:8765/ws`.

Keep this terminal running.

### Terminal 2 — serve the browser interface

```bash
cd ~/Projects/OpenLibrary/projects/OpenRemote/preview
python -m http.server 8000 --bind 127.0.0.1
```

Keep this terminal running too.

Open the following address in your browser:

http://127.0.0.1:8000

The preview uses the simulator by default. This setup runs locally and does not connect to a physical vehicle.

## Physical hardware

The Hovercraft profile contains the ESP32 firmware and embedded browser assets:

`profiles/Hovercraft/firmware/OpenRemoteESP32/`

Physical operation requires compatible hardware, firmware, and a suitable connection. It has not been verified as part of the simulator setup.

## Project structure

```text
OpenRemote/
├── preview/
└── profiles/
    └── Hovercraft/
        └── firmware/
            └── OpenRemoteESP32/
```

## Development notes

- Keep simulator behavior distinct from physical hardware behavior.
- Keep the browser assets and embedded firmware assets consistent.
- Test changes in simulator mode before attempting hardware operation.
