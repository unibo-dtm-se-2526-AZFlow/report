---
title: Development
has_children: false
nav_order: 5
---

# Development

AZFlow was implemented in vertical increments following the boundaries established in Design. This section describes the development workflow and representative coding decisions; setup commands, test results and release procedures are documented in their respective chapters.

## DVCS and incremental development

Git and GitHub manage the source history. `development` integrates completed changes, while `master` is the releasable branch. Topic branches isolate each increment:

| Branch pattern | Purpose | Example |
| --- | --- | --- |
| `feature/<name>` | New functionality | `feature/operator-workflow` |
| `fix/<name>` | Behaviour correction | `fix/waiting-room-appointment-time` |
| `hotfix/<name>` | Urgent integration or release correction | `hotfix/testpypi-publishing` |
| `refactor/<name>` | Structural change | `refactor/totem-id-check-in` |

Work advanced from check-in and Queue reading to calling, state management, displays, operator functions, demo clients and database/package lifecycle. Requirements and design were refined alongside implementation and verification. Commit messages follow a Conventional-Commits-like format, for example `fix(display): respect queue policy for appointment time`; `!` identifies a breaking change.

As a single-developer project, work was tracked through specifications, task lists and topic branches rather than mandatory pull requests or GitHub Issues. Automated checks were run before integration into `development` and promotion to `master`.

## Technologies and implementation choices

| Concern | Implementation | Motivation |
| --- | --- | --- |
| Application code | Python, FastAPI, Uvicorn | Typed domain code and HTTP/WebSocket endpoints |
| API contracts and settings | Pydantic, pydantic-settings, JSON | Validation and a common client/server representation |
| Requests and live updates | HTTP commands/queries, WebSocket events | Immediate workflow results and push notifications |
| Persistence | PostgreSQL 16, Psycopg 3, explicit SQL | Transactional state changes and controlled queries |
| Schema evolution | Alembic | Explicit, versioned database migrations |
| Development tooling | Poetry, Poe, Docker Compose | Reproducible tasks and local services |
| Demo interfaces | HTML, CSS, JavaScript modules, Nginx | Lightweight browser clients without a frontend framework |

The API is versioned under `/api/v1`. WebSocket messages complement persisted state rather than replacing it: display clients first receive the current snapshot and then subsequent events. Authentication and authorization were outside the current slice; their implications are discussed in Future Work.

## Object-oriented implementation

Domain concepts use Python dataclasses and enums. In particular, `ServiceAccess` is a frozen dataclass: its state transitions enforce domain rules and return a new value instead of mutating the current instance. For example:

```python
def called(self) -> "ServiceAccess":
    if self.state is not ServiceAccessState.WAITING:
        raise ServiceAccessNotWaitingError(self.id)
    return replace(self, state=ServiceAccessState.CALLED)
```

`Enum` defines the allowed operational states, while type hints describe method contracts for static checking. The returned instance expresses the valid transition; writing the new state to PostgreSQL remains the repository's responsibility.

## Ports and adapters implementation

Application services depend on typed ports rather than FastAPI or Psycopg. `AppointmentSource` is defined through structural typing with `Protocol`:

```python
class AppointmentSource(Protocol):
    def find_for_day(
        self,
        patient_identifier: PatientIdentifier,
        operational_day: date,
    ) -> List[ExternalAppointmentData]:
        ...
```

`CheckInService` accepts a `Sequence[AppointmentSource]` and queries the supplied sources in order. Each external appointment is mapped to a local Agenda, and only those linked to an active Queue are considered. The composition root reads numbered `AZFLOW_APPOINTMENT_SOURCE_<n>` settings in numeric order, including sparse indices. Only `demo` is currently implemented; additional adapters can be registered without changing the service. With no source selected, check-in returns HTTP 503. Other ports similarly isolate persistence and event delivery.

## Queue processing and consistency

The application-level ordering functions select `ServiceAccess` candidates belonging to the Agendas served by a Queue, remove duplicate access identifiers and apply its policy. `BY_APPOINTMENT` sorts by scheduled time, while `BY_ARRIVAL` uses check-in time; identifiers provide deterministic tie-breaking. Operator lists additionally distinguish active calls, queued/suspended accesses and admitted entries.

Queue membership never duplicates the underlying access or its state. During `call_next`, the service reads and orders candidates, then asks the repository to perform a conditional transition:

```sql
UPDATE service_access
SET state = 'CALLED', room_id = %s
WHERE id = %s AND state = %s
RETURNING id, daily_presence_id, agenda_id, appointment_id
```

The repository records the corresponding transition in the same transaction. If another operator has already changed the selected access, the update returns no row and `call_next` reloads the candidates. An event is published only after a successful call, avoiding duplicate notifications for failed attempts.

## Demo clients and package separation

The repository provides four static browser clients: Totem, Operator, Waiting Room display and Room display. They use native JavaScript modules, with `dev/demo_clients/shared/azflow-api.js` centralizing HTTP requests, WebSocket creation and common utilities. URL parameters identify the simulated device or select the operator's initial Room and Queue.

The display clients handle snapshots, live events and reconnection so opening or refreshing a page reconstructs the current state. Nginx serves the clients and proxies requests in the development environment; `dev/seed_data.sql` supplies repeatable synthetic scenarios.

The distributable Python package contains the `AZFlow/` application, migrations and optional demo adapter, but not `dev/`, `tests/` or local launch scripts. The demo adapter includes synthetic appointments; selecting it does not load the SQL demo seed or create the database schema. Packaging and publication are covered in Release, environment setup in Developer Guide and client operation in User Guide.
