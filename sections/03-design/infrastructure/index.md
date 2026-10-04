---
title: Infrastructure
parent: Design
nav_order: 4
---

# Infrastructure

The current project is a deployable vertical slice rather than the definition of a production hospital topology. Its infrastructure is therefore deliberately small: one AZFlow application process, one PostgreSQL database and browser-based clients. The appointment integration is represented by an in-memory mock adapter, while the interface used by the application is designed so that a real external source can replace it.

The runtime elements of the demonstrator are intentionally limited:

| Component | Current placement | Role | Required by AZFlow |
| --- | --- | --- | --- |
| AZFlow server | Host Python process in the development launcher; also buildable as a Docker image | Runs FastAPI, application services, domain code and adapters | Yes |
| PostgreSQL 16 | Docker Compose container | Stores configuration, operational state and transition history | Yes |
| `demo-web` | Nginx container in the `dev` profile | Serves browser demonstrators and proxies API/WebSocket traffic | Development/demo only |
| Adminer | Docker Compose container in the `dev` profile | Provides a database inspection interface | Development only |
| Browser clients | Web browser | Operator, Totem, Waiting Room and Room interfaces | Client side |
| `MockAppointmentSource` | Inside the AZFlow process | Simulates the external scheduling integration | Current slice only |


## Runtime components

The AZFlow server runs the FastAPI application and exposes both REST and WebSocket endpoints. The same process contains the application services, domain code and infrastructure adapters; the architectural separation described in the previous sections is a separation of responsibilities and dependencies, not a set of distributed microservices.

PostgreSQL runs as a separate service and stores the operational and configuration data. AZFlow opens a database connection for each HTTP request that requires persistence. WebSocket-related read operations use short-lived connections created by the display read-model factory, so blocking PostgreSQL work is not executed directly on the asynchronous event loop.

The Operator UI, Totem, Waiting Room Display and Room Display are browser clients. In the demonstrator they are static development clients served through an Nginx container, but they communicate with AZFlow only through the exposed HTTP and WebSocket interfaces and are not part of the server process.

## Container topology

Docker Compose is used to reproduce the development and demonstration environment. The default application topology contains the `azflow` and `postgres` services. PostgreSQL is addressed inside the Compose network by the service name `postgres`, so no additional service-discovery mechanism is necessary for the current deployment.

The development profile adds `demo-web`, which serves the browser demonstrators through Nginx, and Adminer for database inspection. These components support development and demonstration and are not required by the AZFlow application architecture. The PostgreSQL data directory is backed by a named Docker volume so that data can survive container recreation.

The `poe dev` launcher starts PostgreSQL, Adminer and the Nginx demo gateway through Docker Compose, then runs AZFlow locally with Uvicorn. The resulting development topology is shown below.

![AZFlow development deployment]({{ site.baseurl }}/pictures/infrastructure-deployment.svg)

*Figure — Deployment of the local development and demonstration environment.*

<a href="https://www.plantuml.com/plantuml/uml/VLDBRnCn4BxxLunoWaCUF5NbW1eAfKX0GpS82Qs4dDtPZHNlZ6KxJGFgVsUythJfXTkCv_jcldduF4Jjuwwpoc8J8J9uqsuYrCPZ5GsJ2bj3JdlTGTZeclU6McYq3NWIiOOm7Xm2-xZXau3JrLQtMCI3HKWPDRKMbOecoiFYrwNbFTHuYvPTXnH1Kor-nnIYrwc-UCxo8GML8guHHkyzxmFw4UW0wsmVGnzEKcqun1wJ3FYh02hk75EAZNBfadxSceezmHGkTOYBvUUIvcUpsQmdwZ-DW9uIltArNJZ7XcAgKl3ELrZICqFWF5SOmlEUsmbE2RMHCIHXugA7YvGeO8-eijqh0yZwK-lZFQvB-jOQkWFHqcCfUIUuHTt9o7qlzcm68WOzQPjLvrYFhdNKQor5HaiPGkkn-Fu5NhmLtflNhru-vRcC23rHZi8qkfA6NPkIb3HqSCjsr-K6iYdmUtMlrB0968_VPRamXwlLQgcoavxpF8Tt6VbFN1SfQomfxMXIzoKcHrNz8axfkJ7XJmTpgeQKANpKB_77PajQNXUhJpSVYzzNOaZHvVNDIXrJ_OSdlSXj893iR_uud0TqekO9236D21fZ1V2WQ3W1ueYmvXYv0sxouyNE-tHDmQOAJFOmKOjqF_Mk_tJIgdOo1AWqoRTnLWlCn8b2-HufeJeNA_tQVm00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/infrastructure-deployment.puml)

## Naming and service discovery

The current topology does not require a dedicated discovery service. Inside Docker Compose, containers use Compose service names, for example `postgres` and `adminer`. The Nginx demo gateway reaches the locally running AZFlow process through `host.docker.internal:8000`, while AZFlow obtains the PostgreSQL host and port from environment variables. When the application image is run inside the Compose topology, the PostgreSQL hostname is configured as `postgres`.

This is deliberately simple naming rather than dynamic service discovery: the project has one application instance and one database instance, so introducing a registry or load-balancing layer would not solve a requirement of the current slice.

## External boundaries

The browser clients reach the AZFlow API over HTTP and maintain WebSocket connections for live display updates. PostgreSQL is reached through its database connection, while appointment retrieval is hidden behind the `AppointmentSource` application port. In the current slice this port is wired to `MockAppointmentSource`; a production integration would provide another adapter for the hospital scheduling system without changing the check-in service.

The composition module performs this wiring when the FastAPI application is created. It connects application services to PostgreSQL repositories and read models and creates one shared `WebSocketCallHub` for live display communication. This explicit composition keeps runtime dependencies visible and also allows tests to replace them with test implementations.

## Deployment scope

No load balancer, replicated application node, distributed cache or message broker is required for the project slice, and the report does not assume them. Those choices would depend on the availability, scale and network requirements of a real hospital deployment. The current design instead defines stable application boundaries that could be deployed differently later without moving those infrastructure concerns into the domain model.
