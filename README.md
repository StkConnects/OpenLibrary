# OpenLibrary

**Open-source program library.**

OpenLibrary is a collection of open-source projects, tools, and reusable implementations. Each project is organized independently so it can be developed, tested, documented, and extended without confusion.

## Projects

### OpenRemote

A remote-control interface and firmware project, beginning with a hovercraft controller.

- Browser-based controller preview
- WebSocket simulation without physical hardware
- ESP32-based controller interface
- Hovercraft profile, with room for future vehicle and device profiles

See [OpenRemote](projects/OpenRemote/README.md).

## Repository structure

- `docs/` — shared development documentation
- `projects/` — individual projects
- `projects/OpenRemote/preview/` — browser preview and simulator
- `projects/OpenRemote/profiles/Hovercraft/firmware/` — ESP32 hovercraft firmware

## Development principles

- Keep projects organized and independently understandable.
- Preserve working implementations when restructuring.
- Document setup, configuration, and hardware requirements.
- Clearly distinguish simulation from physical hardware operation.
- Keep project-specific dependencies and instructions with the relevant project.

## Status

OpenRemote is the first project being organized within OpenLibrary. Repository structure and documentation are being prepared before additional profiles and tools are developed.

## License

A repository-wide open-source license has not yet been selected. Until one is added, do not assume that the code is automatically available for unrestricted reuse.
