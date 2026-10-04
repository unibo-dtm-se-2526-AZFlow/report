---
title: Validation
has_children: false
nav_order: 6
---

# Validation

Validation was performed at several levels so that domain rules could be checked quickly in isolation while persistence, HTTP adapters and WebSocket behaviour were also exercised against the real implementation. The final automated suite contains 418 tests. A separate deterministic browser demo documents useful demonstration scenarios, but it is not counted as validation evidence because the complete scenario set has not yet been re-verified after the latest changes.

## Testing approach

The project did not follow strict Test-Driven Development as a project-wide rule. Development was incremental and specification-driven: tests were added together with each functional increment, while dedicated regression tests were introduced when behaviour needed to be corrected or protected from later changes.

`pytest` is the main testing framework. Its fixtures and parametrization keep domain and application tests compact, while the same framework can also drive FastAPI through `TestClient` and run persistence tests against PostgreSQL. `coverage.py` measures line coverage; Ruff and mypy complement behavioural tests with linting, formatting and static type checks.

The automated suite is divided into four groups. The groups are disjoint and together account for all 418 collected tests:

| Test group | Main purpose | Cases | Final result |
| --- | --- | ---: | ---: |
| Unit/component | Domain rules, application services, configuration and infrastructure components tested without PostgreSQL | 209 | 209/209 passed |
| API component | FastAPI HTTP/WebSocket adapters tested through `TestClient`, normally with service dependencies replaced by doubles | 111 | 111/111 passed |
| Persistence integration | Psycopg repositories and read models exercised against real PostgreSQL | 85 | 85/85 passed |
| System/end-to-end | Complete HTTP/WebSocket workflows through the wired application and real PostgreSQL adapters | 13 | 13/13 passed |

The normal `poe test` command can run without a database: PostgreSQL tests are skipped unless `AZFLOW_TEST_DATABASE_URL` explicitly identifies a dedicated test database. `poe test-integration` creates a fresh `azflow_test` database, applies all Alembic migrations and then runs the complete suite. This separation keeps fast tests easy to execute while preventing destructive test cleanup from ever targeting the normal development database.

### Coverage

The final complete run reaches **94% line coverage** on the runtime `AZFlow` production modules. Alembic migration scripts are not included in that percentage: they are validated operationally by creating a fresh database and applying the full migration chain before the PostgreSQL integration suite.

Coverage is more informative when split by architectural area:

| Production area | Final line coverage |
| --- | ---: |
| Domain | **97.4%** |
| Application | **99.1%** |
| API / FastAPI adapters | **87.6%** |
| Infrastructure | **94.1%** |
| Runtime production code overall | **94%** |

The individual test groups were also measured in isolation. These percentages are not additive: they show how strongly each group exercises the layer it primarily targets. Unit/component tests alone cover **97.4% of Domain** and **95.4% of Application**; API component tests cover **80.4% of the API/FastAPI layer**; persistence integration tests cover **89.4% of the PostgreSQL persistence adapters**. The end-to-end tests deliberately cross all layers, so their usefulness is reported through the workflows they exercise and their 13/13 success rate rather than by assigning them a single layer-specific coverage percentage.

### Requirement traceability

The table below summarizes the main validation evidence for the requirements defined earlier in the report. Individual files contain several test cases and parametrized variants.

| Requirement | Main automated evidence | Related demo scenarios* |
| --- | --- | --- |
| FR1–FR3 Check-in, DailyPresence and ServiceAccess creation | `test_check_in.py`, `test_check_in_api.py`, `test_postgres_check_in_repository.py` | S04, S07, E01–E04 |
| FR4 Queue view and ordering | `test_queue_view.py`, `test_ordering.py`, `test_postgres_queue_view_reader.py`, `test_queue_view_api.py` | S05, S06, S18, E05 |
| FR5 Patient calling | `test_calling.py`, `test_calling_api.py`, `test_postgres_call_repository.py`, `test_calling_end_to_end.py` | S09, S10, E06–E08, E10 |
| FR6–FR7 State management and transition history | `test_state_management.py`, `test_suspend_restore_admission_regression.py`, `test_postgres_state_transition_repository.py`, `test_state_management_end_to_end.py` | S11–S17, E09 |
| FR8–FR9 Display scope and public call displays | `test_postgres_display_scope.py`, `test_postgres_display_read_model.py`, `test_websocket_call_hub.py`, `test_websocket_display_end_to_end.py` | S19–S25, E11 |
| FR10 Operator operational view | `test_operator_queue_list.py`, `test_operator_queue_list_api.py`, `test_operator_discovery_api.py` | S02, S09–S18 |
| FR11 External appointment-source boundary | `test_appointment_source.py`, `test_mock_appointment_source.py`, check-in service tests | S04, S07 |
| NFR1 Privacy | `test_display_privacy.py`, `test_websocket_privacy_and_independence.py`, end-to-end response assertions | S26 |
| NFR2 Consistency under concurrency | concurrency cases in PostgreSQL check-in, calling and state-transition repository tests | — |
| NFR3 Recoverable display state | display read-model tests and `test_websocket_display_end_to_end.py` | S01, S25 |
| NFR4 Verifiability | complete pytest suite, Ruff, mypy and CI checks | — |

*The scenario references identify where the behaviour can be demonstrated; they are not currently claimed as passed manual acceptance tests.

## Testing (automated)

### Unit testing

Domain and application behaviour is tested without infrastructure wherever possible. These tests cover identifier handling, Queue ordering policies, ServiceAccess state transitions, check-in semantics, patient calling, operator-list behaviour and error conditions. Application ports are replaced by small fakes such as `ListAppointmentSource`, `FakeCheckInRepository` and `FakeQueueViewReader`; `CallEventPublisherSpy` records published events without requiring a WebSocket transport.

This layer is especially useful for business rules because failures remain independent from PostgreSQL, FastAPI and network behaviour. Parametrized tests are used for equivalent invalid states and input classes, while explicit regression tests protect suspend/restore/admission and ordering behaviour discovered during later increments.

All **209 unit/component tests pass**. Their isolated run covers **97.4% of the Domain layer** and **95.4% of the Application layer**; the higher final Application coverage shown above is reached when API, persistence and end-to-end tests exercise the remaining paths.

### Integration testing

Two integration-oriented groups exercise boundaries that unit tests replace with doubles. The **111 API component tests** combine FastAPI transport validation and application-service behaviour through `TestClient`, while the **85 persistence integration tests** execute the real Psycopg adapters against PostgreSQL and verify queries, transactions, constraints, topology traversal and conditional state transitions.

The persistence fixtures require a dedicated `AZFLOW_TEST_DATABASE_URL`. Tables are truncated before and after each test, with identity sequences reset, so each case starts from a controlled database state. The local integration command starts PostgreSQL through Docker Compose, recreates the dedicated `azflow_test` database and applies the current Alembic migration chain before pytest starts. CI uses an equivalent PostgreSQL 16 service container.

Test doubles remain useful at integration boundaries where the dependency is not the subject of the test. For example, the mock appointment source replaces an external hospital scheduling system, and event spies are used when a persistence/calling test does not need to exercise the WebSocket transport itself.

Both groups pass completely in the final run: **111/111 API component tests** and **85/85 persistence integration tests**. Run in isolation, they cover **80.4% of the API/FastAPI layer** and **89.4% of the PostgreSQL persistence adapters**, respectively.

### System testing

A smaller group of end-to-end tests wires the real FastAPI application, application services and PostgreSQL adapters together. These tests drive the public HTTP and WebSocket interfaces rather than calling service methods directly.

The main system paths verify:

- check-in followed by `call next` and call-specific operations through `/api/v1`;
- suspend, restore and admission with durable state changes in PostgreSQL;
- WebSocket monitor connection, persisted initial snapshots and live call delivery;
- topology-based display routing and isolation between scopes;
- display refresh after cancel, admission and recall;
- privacy of public and operational responses.

`test_websocket_display_end_to_end.py` is particularly important because it verifies both halves of the display design: persisted state is used to rebuild the initial snapshot, while later calls are delivered live through the in-process WebSocket hub. Therefore a lost WebSocket connection does not become a loss of operational state.

All **13 end-to-end tests pass**. Run by themselves, they exercise **81.3% of the runtime production package** (excluding migration scripts), which is expected to be lower than the combined-suite coverage because these tests intentionally concentrate on representative cross-layer workflows rather than every branch and error case. The complete automated run therefore finishes with **418 passed, 0 failed**. Ruff reported no linting issues, `ruff format --check` reported all 123 checked files formatted, and mypy reported **no issues in 119 source files**.

## Acceptance tests (manual)

No formal manual acceptance-test campaign is currently claimed for the final version. The deterministic dataset and `docs/demo-scenarios.md` were created to support demonstrations and exploratory walkthroughs of the implemented behaviour, but the complete scenario document still needs to be reviewed and re-executed after the latest changes before it can be used as acceptance-test evidence.

The current demo document contains 26 main scenarios and 11 edge scenarios covering check-in, Queue ordering, calling and state changes, topology-based display routing, WebSocket reconnect behaviour, privacy and invalid configurations. Because each scenario already describes an initial condition, an action and an expected outcome, it provides a useful basis for a future repeatable manual acceptance plan. Until that verification is performed, however, the scenarios are referenced in the traceability table only as demonstration coverage and no manual success rate is reported.
