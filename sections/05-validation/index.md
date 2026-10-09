---
title: Validation
has_children: false
nav_order: 6
---

# Validation

Validation covers domain rules, application services, API adapters, PostgreSQL persistence and end-to-end HTTP/WebSocket workflows. The final automated suite contains **439 tests**. The demo walkthrough is useful for demonstrations but is not claimed as formal acceptance-test evidence.

## Testing approach

The project did not follow strict TDD. Tests were developed with each increment and regression tests were added when behaviour needed protection. `pytest` is the main framework; `coverage.py`, Ruff and mypy provide coverage, linting, formatting and static type checks.

| Test group | Main purpose | Cases | Result |
| --- | --- | ---: | ---: |
| Unit/component | Domain, application, configuration and isolated infrastructure | 216 | 216/216 |
| API component | FastAPI adapters and production composition wiring | 125 | 125/125 |
| Persistence integration | Real Psycopg adapters against PostgreSQL | 85 | 85/85 |
| System/end-to-end | Wired HTTP/WebSocket workflows with PostgreSQL | 13 | 13/13 |

`poe test` runs without a database and skips PostgreSQL tests unless `AZFLOW_TEST_DATABASE_URL` points to a dedicated test database. `poe test-integration` recreates `azflow_test`, applies all Alembic migrations and runs the complete suite.

### Coverage

The complete run reaches **96.8% runtime line coverage**, rounded to **97%**. Migration scripts are excluded from line coverage but are validated by applying the full migration chain before integration tests.

| Production area | Final line coverage |
| --- | ---: |
| Domain | **97.4%** |
| Application | **99.1%** |
| API / FastAPI adapters | **96.8%** |
| Infrastructure | **94.1%** |
| Overall runtime code | **96.8%** |

The coverage figures reflect the complete suite and are not additive.

### Requirement traceability

| Requirement | Main automated evidence | Related demo aliases* |
| --- | --- | --- |
| FR1–FR3 Check-in, DailyPresence and ServiceAccess creation | `test_check_in.py`, `test_check_in_api.py`, `test_postgres_check_in_repository.py` | S04, S07, E01–E04 |
| FR4 Queue view and ordering | `test_queue_view.py`, `test_ordering.py`, `test_postgres_queue_view_reader.py`, `test_queue_view_api.py` | S05, S06, S18, E05 |
| FR5 Patient calling | `test_calling.py`, `test_calling_api.py`, `test_postgres_call_repository.py`, `test_calling_end_to_end.py` | S09, S10, E06–E08, E10 |
| FR6–FR7 State management and transition history | `test_state_management.py`, `test_suspend_restore_admission_regression.py`, `test_postgres_state_transition_repository.py`, `test_state_management_end_to_end.py` | S11–S17, E09 |
| FR8–FR9 Display scope and public call displays | `test_postgres_display_scope.py`, `test_postgres_display_read_model.py`, `test_websocket_call_hub.py`, `test_websocket_display_end_to_end.py` | S19–S25, E11 |
| FR10 Operator operational view | `test_operator_queue_list.py`, `test_operator_queue_list_api.py`, `test_operator_discovery_api.py` | S02, S09–S18 |
| FR11 External appointment-source boundary | `test_appointment_source.py`, `test_demo_appointment_source.py`, check-in service tests | S04, S07 |
| NFR1 Privacy | `test_display_privacy.py`, `test_websocket_privacy_and_independence.py`, end-to-end assertions | S26 |
| NFR2 Consistency under concurrency | PostgreSQL concurrency cases for check-in, calling and state transitions | - |
| NFR3 Recoverable display state | display read-model tests and `test_websocket_display_end_to_end.py` | S01, S25 |
| NFR4 Verifiability | complete pytest suite, Ruff, mypy and CI | - |

*These identifiers are traceability aliases retained in `docs/demo-scenarios.md`; they are not separate passed acceptance tests.

## Automated testing

### Unit and component tests

The **216** unit/component tests cover domain transitions, queue policies, check-in, calling, operator behaviour, configuration and error paths without PostgreSQL. Ports are replaced by small fakes and spies so failures remain independent from transport and persistence.

### Integration tests

The **125** API component tests exercise FastAPI through `TestClient`, including composition wiring. The **85** persistence tests run real Psycopg adapters against PostgreSQL and verify queries, transactions, constraints, topology traversal and conditional updates.

Integration fixtures use a dedicated database, truncate tables between cases and reset identities. Local and CI integration runs apply the complete Alembic chain before pytest.

### System tests

The **13** end-to-end tests wire FastAPI, application services and PostgreSQL adapters together. They cover check-in/calling, state changes, WebSocket snapshots and live updates, topology-based routing and public-data privacy. The complete run finishes with **439 passed, 0 failed**; Ruff and formatting checks pass, and mypy reports no issues.

## Manual acceptance

No formal manual acceptance campaign is claimed for the final version. `docs/demo-scenarios.md` now contains five main walkthrough blocks plus optional edge checks. Earlier fine-grained Sxx/Exx identifiers are retained only as traceability aliases.

The walkthrough covers check-in, Queue policies, state transitions, displays, topology, reconnect behaviour, privacy and invalid configurations. It provides a basis for future repeatable acceptance testing, but no manual pass rate is reported here.
