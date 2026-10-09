---
title: Infrastructure
parent: Design
nav_order: 4
---

# Infrastructure

The implemented slice runs one AZFlow application process against PostgreSQL. Browser clients and the optional in-memory `DemoAppointmentSource` complete the demonstrator; the required runtime remains independent of the demo services.

| Component | Current placement | Role | Required by AZFlow |
| --- | --- | --- | --- |
| AZFlow server | Host Python process (`poe dev`) or Compose `azflow` service | Runs FastAPI, application services, domain code and adapters. | Yes |
| PostgreSQL 16 | Compose container in the demo; external DB for the package | Stores configuration and operational data. | Yes |
| `demo-web` | Nginx container in the `dev` profile | Serves demo clients and proxies HTTP/WebSocket traffic. | Demo only |
| Adminer | Compose container in the `dev` profile | Database inspection. | Development only |
| Browser clients | Web browser | Operator, Totem, Waiting Room and Room interfaces. | Client-side |
| `DemoAppointmentSource` | AZFlow process | Provides synthetic appointments when selected. | Optional |

## Runtime and container topology

AZFlow exposes REST and WebSocket endpoints from one FastAPI/Uvicorn process, with PostgreSQL running separately. For local development, `poe dev` starts PostgreSQL, Adminer and Nginx through Docker Compose, then runs AZFlow on the host. Compose also defines an `azflow` container for image-based execution. PostgreSQL data is stored in the named `pgdata` volume so it survives container recreation.

![AZFlow infrastructure]({{ site.baseurl }}/pictures/infrastructure.svg)

*Figure - Infrastructure topology of the local development and demonstration environment.*

<a href="https://www.plantuml.com/plantuml/uml/VPJVRzCm4CVV_LUS-W3RGzO1Oa9zc5RIebPqRKSg9l53a-TSKok97TdkjiBsltEEtP42uis--zpNNzyvkR2E6xUjAsPBgHfkU0rsmtDzBrK1QrvPx6GQBafUOEPs5O91uRWggYuWTDreXSe5X7HVTx9AvsYnWJTlEq73LTa6Jnbpqb7LyCk7Ijz30bErDjmwinLkQv2nbv0a2QIpwNY-oloQHKFGIoj9fzeU_6G0NnSD6kwqWLGhgoly3jo2Q94RdjTIUIZTe2WJgU2ZrBQqNQRq4S-Cf6qglZj8vY76dlQ6HkFFuzbYUKckOBB8LgqpVrVeZV0E9jgwdg_Vq8ByaIvTg_PPBKhq9gbf5bj6X7Lx3O0WCY-aUe2ZmRlJuvPHVj_93_sDICSJUuQ7M4lbtF5RJgAz9Jae36PNCtXrrd9DY5W2dxopvm6IR1X3gasmnd-iQK-CL0xDcWj_TDDesjP-udfh14PHusvikp-K766j_ohvfewcAhcabDa5ypNrvNTxqyLyFavNqyKyp9p2STgGd4DipcIrMi8BkCRRp3VL7RFkk26X1ws8Rbi70_0uwmxxlqIS-3yPwCDrbdbJmSadl4D3lLuQ_R0ZHt4uBDJi5K8l3oKYOMInSHw9Knr0Foxx_fHbjIKEXaPifCFmOKIrM7hGVjzAEAbmxKuUpmyof3LwxpyGHIgIlfDdcUXn_pJ80JqOjlVpPvfTeChz3-GN" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/infrastructure.puml)

Compose services resolve PostgreSQL by the name `postgres`. The demo Nginx gateway reaches the host AZFlow process at `host.docker.internal:8000`; the database address is configured through environment variables. This single-instance topology needs no discovery service.

## Database connections

HTTP requests requiring persistence receive their own PostgreSQL connection. WebSocket-related reads use short-lived connections outside the asynchronous event loop to avoid blocking it.
