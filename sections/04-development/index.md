---
title: Development
has_children: false
nav_order: 5
---

# Development

The implementation follows the boundaries introduced in the Design chapter, but this section focuses on the concrete development choices: how the Git repository was organized, how components communicate at runtime and which technologies were selected to implement the current vertical slice.

## DVCS

Git is used as the distributed version control system and GitHub hosts the public project repository. Development follows an integration-branch workflow where `master` represents the releasable line and `development` collects completed work before it is promoted to `master`.

Short-lived branches isolate changes with a name that also explains their purpose:

| Branch pattern | Purpose | Example |
| --- | --- | --- |
| `feature/<name>` | Introduce a new capability or a coherent extension. | `feature/operator-workflow` |
| `fix/<name>` | Correct behaviour already present in development. | `fix/waiting-room-appointment-time` |
| `hotfix/<name>` | Correct an urgent integration, deployment or release problem. | `hotfix/testpypi-publishing` |
| `refactor/<name>` | Change implementation structure without introducing a new user feature. | `refactor/totem-id-check-in` |

A topic branch is normally merged into `development` when its work is complete. `development` is then merged into `master` when the collected changes form a releasable version. The release automation and version tags are described separately in the Release and CI/CD chapters.

Commit messages follow a Conventional-Commits-like structure, using a type and usually a scope, for example `fix(display): respect queue policy for appointment time` or `docs(readme): expand development and demo setup`. The main types used by the project are `feat`, `fix`, `refactor`, `test`, `docs` and `chore`; a `!` marks a breaking change when needed. Merge commits use a short `merge:` description so that the history keeps the integration points visible.

The project was developed by one developer, so a mandatory pull-request and approval workflow was not introduced. GitHub Issues were not used either: work was tracked through incremental specifications, task lists and topic branches. Topic branches and automated checks provide isolation and verification, while merges are performed only after the related change has been reviewed locally. This avoids adding review ceremony without an independent reviewer in the context of the project.

## Incremental development

Development proceeded through small vertical increments rather than implementing the complete system in a single pass. Each increment refined a limited part of the workflow, updated its requirements and design where needed, and was then implemented and verified on a dedicated topic branch before integration into `development`.

The main increments followed the evolution of the demonstrator: project foundation, patient check-in, queue reading, patient calling, suspend/restore/admission, live call notifications and displays, operator workflow, demo clients, and finally database lifecycle and packaging improvements. This kept each change reviewable and made architectural decisions evolve together with the implemented behaviour instead of being fixed completely upfront.

## Implementation details

The main implementation choices are summarized below.

| Concern | Choice | Reason |
| --- | --- | --- |
| Client commands and queries | HTTP | Fits short request/response operations such as check-in, queue views and state changes. |
| Live display updates | WebSocket | Keeps a connection open and lets AZFlow push new calls and state changes without continuous polling. |
| In-transit representation | JSON | Native fit for the browser clients and FastAPI/Pydantic models, and readable during development. |
| Persistent data access | SQL through Psycopg | Gives explicit control over joins, conditional updates, transactions and PostgreSQL behaviour. |
| Authentication | Not implemented in the current slice | Identity and login management are outside the implemented workflow. |
| Authorization | Not implemented in the current slice | The demonstrator assumes trusted clients and does not enforce roles at API level. |

### Communication protocols and data representation

The HTTP API is versioned under `/api/v1`. FastAPI endpoints receive and return JSON structures described by Pydantic models, which also validate basic request constraints before the application service is called. HTTP is used for operations where the caller expects an immediate result, including check-in, Queue views, patient calling and state-management commands.

WebSockets are used only for the live display channel. Room and waiting-room displays first rebuild their visible state from persisted data and then keep a WebSocket connection for subsequent updates. Messages are also JSON and contain the public operational information required by the display, while timestamps are serialized in ISO 8601 form. This keeps the real-time channel simple and consistent with the HTTP representation.

The project does not introduce a message broker or another asynchronous protocol because the current deployment contains a single AZFlow process and live events only need to reach connected display clients. A broker could become useful with multiple application instances, but it is not required by the current slice.

### Database access

Persistence adapters query PostgreSQL using Psycopg and explicit SQL rather than an ORM. For the current slice this was also more immediate to implement than introducing and configuring an ORM, while still giving explicit control where database semantics are important, especially conditional state transitions, `ON CONFLICT` operations, recursive topology queries and transactional creation of public call codes. An ORM remains a possible future evolution if the persistence layer grows in size and complexity.

SQL remains inside the infrastructure adapters. Domain objects and application services do not know table names or Psycopg APIs; they depend on repositories and read-model ports. This keeps database-specific code localized while allowing the implementation to use PostgreSQL features directly where they simplify consistency and concurrency handling.

### Authentication and authorization

The current vertical slice has no authentication mechanism and does not implement RBAC or another authorization model. `Patient`, `Operator`, Totem and display roles describe use cases, but they are not authenticated identities in the implemented API. The demonstration environment therefore assumes that its clients are already inside a trusted context.

This is a deliberate scope boundary rather than a production security model. A real hospital deployment would need to identify operator and device clients and restrict operations according to their role. A planned evolution is to integrate Keycloak for user and role management and to connect authentication with the identity systems already available in the target organization; this integration is intentionally outside the current implementation.

## Technological details

The project started from the Python course template, so Python and its packaging workflow were retained while the application technologies were selected around the requirements of the vertical slice.

| Technology | Role in AZFlow |
| --- | --- |
| Python | Main implementation language for domain, application, API and infrastructure code. |
| FastAPI | HTTP and WebSocket API framework; it provides request validation and OpenAPI documentation with little additional infrastructure. |
| Uvicorn | ASGI server used to run the FastAPI application. |
| Pydantic / pydantic-settings | API models, validation and environment-based configuration. |
| PostgreSQL 16 | Relational persistent store, well suited to transactional operational data, constraints and structured queries. |
| Psycopg 3 | PostgreSQL driver used by repository and read-model adapters; it keeps SQL explicit and avoids the initial complexity of an ORM. |
| Alembic | Versioned database-schema migrations, allowing schema changes to evolve safely with application releases. |
| Poetry | Dependency management, packaging and build configuration inherited from the course template and retained for a reproducible workflow. |
| Poe the Poet | Named commands that make tests, checks, migrations and local startup repeatable without remembering long command sequences. |
| Docker / Docker Compose | Reproducible PostgreSQL and development/demo services. |
| HTML, CSS and JavaScript | Lightweight browser demonstrators for Operator, Totem and displays. |
| Nginx | Serves the static demo clients and proxies their development API/WebSocket traffic. |

The Python package is organized according to the architectural boundaries rather than by framework feature:

| Package | Responsibility |
| --- | --- |
| `AZFlow/domain` | Domain concepts and local business rules. |
| `AZFlow/application` | Use-case services and application ports. |
| `AZFlow/api` | FastAPI endpoints, transport schemas and dependency composition. |
| `AZFlow/infrastructure` | PostgreSQL, appointment-source and WebSocket adapters. |
| `AZFlow/migrations` | Alembic migration history for the PostgreSQL schema. |

The main runtime dependencies are intentionally limited to FastAPI, Uvicorn, Psycopg, Pydantic Settings and Alembic. Development dependencies add Pytest, Coverage, Ruff, Mypy and HTTPX for verification and tooling. PostgreSQL is the only external runtime service required by the current implementation; the hospital appointment system is represented by `MockAppointmentSource`, while GitHub Actions and TestPyPI belong to the delivery process described later in the report.
