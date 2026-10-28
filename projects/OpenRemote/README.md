# OpenRemote

OpenRemote is a remote-control interface and firmware project. Its first profile targets a hovercraft using an ESP32, with a browser controller and a simulator for development without physical hardware.

## Components

### Browser preview

Location: `preview/`

The preview contains the browser interface, connection logic, and WebSocket simulator.

To start the simulator:

```bash
cd projects/OpenRemote/preview
npm install
npm start
