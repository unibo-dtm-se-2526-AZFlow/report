---
title: Deployment
has_children: false
nav_order: 8
---

# Deployment

AZFlow is a server-side application. End users do not install the Python package or PostgreSQL on their workstation: they interact with an AZFlow deployment through HTTP/WebSocket clients. The current repository also provides lightweight browser clients for demonstration purposes, but these clients are development assets and are not part of the released Python package.

The current slice is deployable as an application package, but it is not presented as a complete clinical production deployment. In particular, the application composition still uses `MockAppointmentSource`, while production identity, authorization and integration with real hospital systems are outside the implemented scope.

## User installation

No local installation is required for an end user of a deployed AZFlow service. A real integration can consume the versioned `/api/v1` HTTP API and the display WebSocket endpoints using its own clients.

For the project demonstration, four static browser clients are provided in the source repository: Totem, Operator, waiting-room display and Room display. They are served by the development Nginx gateway started by `poe dev`; therefore a web browser is the only client-side requirement.

The demo clients use URL parameters for device/workstation selection:

| Client | Example | Client-side configuration |
| --- | --- | --- |
| Totem | `/demo/totem/?id=1` | `id` selects the configured Totem |
| Operator | `/demo/operator/?room=1&queue=1` | `room` and `queue` preselect the working context |
| Waiting-room display | `/demo/waiting_room/?id=1` | `id` selects the WaitingRoomMonitor |
| Room display | `/demo/room_display/?id=1` | `id` selects the RoomMonitor |

These parameters configure the demonstrator only; authentication and persisted operator workstation configuration are not implemented in the current slice.

## Server-side installation

The released deployment path is the Python package published on TestPyPI. The server requires:

- Python `>=3.10` and `<4.0`;
- a reachable PostgreSQL database; PostgreSQL 16 is used by the development and CI environments;
- network access between AZFlow and PostgreSQL.

The package can be installed in an isolated Python environment with:

```bash
pip install \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  AZFlow
```

TestPyPI contains the AZFlow release, while the additional PyPI index is needed to resolve normal third-party dependencies.

AZFlow reads configuration from environment variables and optionally from a `.env` file in the current working directory. The main settings are:

| Variable | Purpose | Default |
| --- | --- | --- |
| `AZFLOW_API_HOST` | Address used by Uvicorn | `0.0.0.0` |
| `AZFLOW_API_PORT` | HTTP/WebSocket listening port | `8000` |
| `AZFLOW_DISPLAY_RECENT_CALLS_MAX` | Maximum recent calls returned to displays | `10` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_USER` | Database user | required |
| `POSTGRES_PASSWORD` | Database password | required |
| `POSTGRES_DB` | Database name | required |

For example:

```dotenv
AZFLOW_API_HOST=0.0.0.0
AZFLOW_API_PORT=8000
POSTGRES_HOST=db.example.internal
POSTGRES_PORT=5432
POSTGRES_USER=azflow
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=azflow
```

Database creation and credentials are an infrastructure responsibility; AZFlow manages its schema through Alembic migrations. Before the first application start, and before starting a newly installed version containing schema changes, the packaged migration chain must be applied explicitly:

```bash
python -m AZFlow.migrations upgrade
```

Migrations are deliberately not run automatically at application startup. This keeps schema changes an explicit deployment operation and avoids multiple application instances attempting the same migration concurrently.

Once the database is configured and migrated, AZFlow is started with:

```bash
python -m AZFlow
```

The process starts Uvicorn and exposes the FastAPI application on the configured host and port. A minimal production-oriented topology for the current slice is therefore:

```text
HTTP / WebSocket clients
          |
          v
+-------------------------+
| AZFlow                  |
| Uvicorn + FastAPI       |
| MockAppointmentSource   |
+------------+------------+
             |
             | PostgreSQL
             v
+-------------------------+
| PostgreSQL              |
+-------------------------+
```

TLS termination, reverse-proxy configuration, process supervision, high availability and the replacement of `MockAppointmentSource` with a real hospital adapter depend on the target environment and are not prescribed by the current project.

A `Dockerfile` is also present and can build the AZFlow application from source, but no Docker image is published as a release artefact. The package-based deployment above is therefore the documented release path rather than a dependency on a container registry.

## Development and demo deployment

The development environment is intentionally richer than the released package. Unlike the TestPyPI distribution, the GitHub repository contains the complete development and demonstration environment: automated tests, Docker Compose services, deterministic seed data, browser demo clients, development scripts and documentation. It requires Python, Git, Docker and Docker Compose V2. After cloning the repository:

```bash
python3.12 -m pip install -r requirements.txt
poetry install
cp .env.example .env
poetry run poe dev-reset
poetry run poe dev
```

`dev-reset` recreates the local database, applies migrations and loads deterministic demo data; it is destructive and is only a development/demo operation. A normal `poe dev` start preserves the existing database.

The development launcher runs AZFlow locally and starts PostgreSQL 16, Adminer and the Nginx demo gateway through Docker Compose. Nginx serves the browser clients and proxies their HTTP/WebSocket traffic to AZFlow; PostgreSQL data is kept in a Docker volume. The complete topology is shown in the Design chapter:

![AZFlow development deployment]({{ site.baseurl }}/pictures/infrastructure-deployment.svg)

This separation is deliberate: the demo gateway, Adminer, seeded hospital scenario and browser demonstrators make the project easy to inspect, but none of them are required by the released AZFlow Python package.
