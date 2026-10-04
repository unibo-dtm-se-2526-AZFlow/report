---
title: Infrastructure
parent: Design
nav_order: 4
---

# Infrastructure

The current project is a deployable vertical slice rather than the definition of a production hospital topology. Its infrastructure is therefore deliberately small: one AZFlow application process, one PostgreSQL database and browser-based clients. The appointment integration is represented by an in-memory mock adapter, while the interface used by the application is designed so that a real external source can replace it.

## Runtime components

The AZFlow server runs the FastAPI application and exposes both REST and WebSocket endpoints. The same process contains the application services, domain code and infrastructure adapters; the architectural separation described in the previous sections is a separation of responsibilities and dependencies, not a set of distributed microservices.

PostgreSQL runs as a separate service and stores the operational and configuration data. AZFlow opens a database connection for each HTTP request that requires persistence. WebSocket-related read operations use short-lived connections created by the display read-model factory, so blocking PostgreSQL work is not executed directly on the asynchronous event loop.

The Operator UI, Totem, Waiting Room Display and Room Display are browser clients. In the demonstrator they are static development clients served through an Nginx container, but they communicate with AZFlow only through the exposed HTTP and WebSocket interfaces and are not part of the server process.

## Container topology

Docker Compose is used to reproduce the development and demonstration environment. The default application topology contains the `azflow` and `postgres` services. PostgreSQL is addressed inside the Compose network by the service name `postgres`, so no additional service-discovery mechanism is necessary for the current deployment.

The development profile adds `demo-web`, which serves the browser demonstrators through Nginx, and Adminer for database inspection. These components support development and demonstration and are not required by the AZFlow application architecture. The PostgreSQL data directory is backed by a named Docker volume so that data can survive container recreation.

## External boundaries

The browser clients reach the AZFlow API over HTTP and maintain WebSocket connections for live display updates. PostgreSQL is reached through its database connection, while appointment retrieval is hidden behind the `AppointmentSource` application port. In the current slice this port is wired to `MockAppointmentSource`; a production integration would provide another adapter for the hospital scheduling system without changing the check-in service.

The composition module performs this wiring when the FastAPI application is created. It connects application services to PostgreSQL repositories and read models and creates one shared `WebSocketCallHub` for live display communication. This explicit composition keeps runtime dependencies visible and also allows tests to replace them with test implementations.

## Deployment scope

No load balancer, replicated application node, distributed cache or message broker is required for the project slice, and the report does not assume them. Those choices would depend on the availability, scale and network requirements of a real hospital deployment. The current design instead defines stable application boundaries that could be deployed differently later without moving those infrastructure concerns into the domain model.
