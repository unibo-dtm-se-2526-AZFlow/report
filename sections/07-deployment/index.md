---
title: Deployment
has_children: false
nav_order: 8
---

# Deployment

AZFlow is distributed as a server-side Python package. The current release is a demonstrator rather than a complete clinical production deployment because only the synthetic `DemoAppointmentSource` is implemented and production identity/authorization integration is absent.

## User installation

No local installation is required on user devices: clients access AZFlow through a browser. The source repository provides four demonstration interfaces, but they are not included in the published Python package. Client configuration and usage are described in the [User Guide]({{ site.baseurl }}/sections/09-userguide/).

## Server-side installation

The released package requires Python `>=3.10,<4.0` and a reachable PostgreSQL database. PostgreSQL 16 is used in development and CI.

```bash
pip install \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  AZFlow
```

Main environment settings are:

| Variable | Purpose | Default |
| --- | --- | --- |
| `AZFLOW_API_HOST` | Uvicorn bind address | `0.0.0.0` |
| `AZFLOW_API_PORT` | HTTP/WebSocket port | `8000` |
| `AZFLOW_APPOINTMENT_SOURCE_<n>` | Numbered appointment-source entries; sparse indices allowed (`demo` currently supported) | none |
| `AZFLOW_DISPLAY_RECENT_CALLS_MAX` | Recent calls returned to displays | `10` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_USER` | Database user | required |
| `POSTGRES_PASSWORD` | Database password | required |
| `POSTGRES_DB` | Database name | required |

Database creation and credentials remain infrastructure responsibilities. When no appointment source is selected, check-in returns HTTP 503; with an unavailable PostgreSQL server, database-backed requests return HTTP 503. The health endpoint only reports API process availability. The demo adapter is included in the package but does not automatically seed PostgreSQL. Apply packaged migrations explicitly before first start and after schema-changing upgrades:

```bash
python -m AZFlow.migrations upgrade
python -m AZFlow
```

Migrations are not run automatically at startup, avoiding concurrent schema changes when several application processes exist.

TLS termination, reverse proxying, supervision, high availability and replacement of the mock source depend on the target environment. A `Dockerfile` can build AZFlow from source, but no container image is currently published; the documented release path is the Python package.

## Packaged runtime topology

The released AZFlow package runs on a Python application host and connects to an independently managed PostgreSQL database. Schema migrations are invoked explicitly; clients communicate over HTTP/WebSocket.

![AZFlow package deployment]({{ site.baseurl }}/pictures/deployment.svg)

<a href="https://www.plantuml.com/plantuml/uml/NLB1IYGn4BtdAuevxHx61Lb1F2pEEeWBU-XrN0JnKgPhkaEdav3KpDY8_subSRJnLgdtNjLxrNsP62FlHgiiRHdOGpHTpz2QI9gDToeDnWMCE4BgiVK7uphOeaqqGwnnn5CWy95xFmEq7uDtv7Z3aoMGFQSprFcM4WNuUJvhHdH3RfwTASM6HRLwkBR-04jeK0_O4QmfM3-DCbQfF0CMgn2iqPWDmurFl01CW27qKiEB0gYqPX9x3cvtZir8XHHhNKW0SWkpHSqoiIuDTMMXXg4hf8zGiBZ6nAlc3_o0_tkZVNIFxbsOAEufllimNtLhP7p2H32QBXRRgL0_dw9uLQzAjKVcef4iNQJDlx-FxXizCqM7raumeXE7xVVgiPBIyJ1NrkI5Qn9xDKLRof9tPkXtz0Un39LVYBgKsOC4XvEJNpa8N428Vc_amtsqFqtFqIg7vVAekxcxQ-HGz_IqyNeWLhcTuQDduKWuDHkNfy_Gf7iQ4NP122qfTKckpR_k6m00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/deployment.puml)

## Development demonstrator

The source repository also provides a local environment with browser clients, Nginx, Adminer and synthetic data. These are development/demo assets, not dependencies of the released Python package. The [Developer Guide]({{ site.baseurl }}/sections/10-devguide/) documents setup, database reset and startup; the infrastructure topology is described in Design - Infrastructure.
