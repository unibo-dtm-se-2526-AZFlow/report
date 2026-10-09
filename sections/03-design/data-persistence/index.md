---
title: Data and Persistence
parent: Design
nav_order: 5
---

# Data and Persistence

AZFlow uses PostgreSQL for configuration and operational state. A relational model fits the explicit relationships between appointments, daily presences, service accesses, queues and locations, while state changes can be handled atomically.

Application services do not execute SQL directly. They depend on repository and read-model ports implemented by PostgreSQL adapters.

| Data group | Main tables | Purpose |
| --- | --- | --- |
| External scheduling | `external_source`, `external_agenda`, `appointment` | Imported scheduling data and source references. |
| Operational flow | `daily_presence`, `service_access`, `service_access_transition` | Check-in state, current service state and transition history. |
| Queue configuration | `agenda`, `queue`, `queue_policy`, `queue_agenda` | Services, Queue membership and ordering policy. |
| Public call codes | `ticket_master`, `ticket_sequence` | Call-code configuration and daily sequence. |
| Physical/display configuration | `location_node`, `room`, `totem`, monitor tables | Locations and display scope. |

## Relational model

The diagram shows the main persistent relationships. Most non-key attributes and detailed monitor topology are omitted for readability.

![AZFlow persistent data model]({{ site.baseurl }}/pictures/persistence-model.svg)

*Figure - Main relationships in the AZFlow PostgreSQL model.*

<a href="https://www.plantuml.com/plantuml/uml/bLPDRzim3BthLn0vRSLITDUXADh32WmzhCDkkmYAJ2T2PSdJHzfiw7yVPJkjvTYETmeIFP6FZuzKRdqGBiHAivqg42eCErluzeiFwD26GusU-ITbQk541Nud2lkip1PAeJtsJhGocD1W7KNf7KWjlByBmQbD3FXDMlDJ_K6uOXhB0C62KzjTW48vb45PmrXGGIFS_RhNzXbgT5uH6KCG4GHKja0D7ogX33ZK8btnErNxZupLGZw9BSBgwmknDqA3bpii8d7Rhk0l0w0mAXm0ktFkRNGIcoE02r05V05b0cxHmVNruyFDJNEoNZSVad8J8D1r-lxAHW9IUbE8fG5RD1-Wxe-e0StpE8SbTSt82PQYhYrThvAO2nbs0cB1HKX1LOLacghEyvwfewOkKKuwJqHAXOutLdaZEGhP2nspGbvx7VvElcXwJqqkoITPUmkXz87N3dsZnS9IxNj8NeW3OSbmsBAB6wqabq9hdfi0I1BvX85N8atCf0Ga8y4AhioOaC46h2RkzXleqUqL6K58YTulBIoNOvBYcIRsp3E9STPEbK5M2YJdk37pkdXmmdYLMh7Ofdc0IICwt2iRFHzm8UReemwq9qwFh9JHkV49-1qnJYcQ6_P7Gj86CQNQnjPdcMV_Rt4OKKr8sJ1QB1lL6dqsXvQCVkX-wKktnEOdF7WNxaYdDpiZRBJOq6gVhcguN4V5VtpuzCRvOiBJxvX-Zgp2fGgIeqhrCaww2-YHYFRtqAoKEV_ndJIgdG_Sn6f3GTx27KtOyKdJsP2Oggg9rSpmoKEIeWmUpTNd5Ts0rTNbvSLg-1QmhbVpeE6pcQDx6uUnmKxFaVdui_uxbn0pMAglBMUSy21me-3vYEcTMAT5qOZ91kTp6NghZxMJV2PRVrUsYScITez6a4gCPLEO9swEZabEJsRxc27okHbBCeV8-peB7SmJkwNqwS_hFm00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/persistence-model.puml)

## Scheduling and operational data

`external_source` and `external_agenda` identify the source and mapping of imported appointments. When an external appointment reference is available, a uniqueness constraint prevents duplicate imports.

`daily_presence` is unique for a patient identifier and operational day. `service_access` represents each managed service, with a further constraint preventing the same appointment from creating duplicate accesses for one presence. The current state and call-time `room_id` are stored directly on `service_access` for efficient operational use.

## Current state and transition history

AZFlow stores both current state and append-only transition history. `service_access.state` supports fast operational decisions, while `service_access_transition` records successful changes, timestamps and, where relevant, the Queue used for a call.

| Aspect | Current state | Transition history |
| --- | --- | --- |
| Stored in | `service_access.state` | `service_access_transition` |
| Purpose | Current operational decisions | Ordering and historical reconstruction |
| Update model | Replaced on transition | Append-only |
| Concurrency role | Conditional update checks expected state | Inserted after a successful update |

State-changing repositories use conditional SQL updates and record the transition in the same operation. Concurrent requests therefore cannot both succeed from the same previous state.

## Queue and configuration data

`queue_agenda` represents the many-to-many relationship between Queues and Agendas. A Queue references its ordering policy and `TicketMaster`, while `ticket_sequence` stores the daily call-code counter.

Physical topology uses a recursive `location_node` hierarchy. Rooms and Totems belong to nodes; Room monitors reference Rooms, while waiting-room monitors cover one or more nodes.

## Read models

Queue views, operator discovery and displays use dedicated read-model ports instead of reconstructing complete domain objects. This allows each query to return only what its consumer needs and prevents public display queries from exposing patient-identifying data.

| Adapter | Main role |
| --- | --- |
| `PostgresCheckInRepository` | Resolves configuration and creates/reuses appointments, DailyPresence and ServiceAccesses. |
| `PostgresQueueViewReader` | Loads Queue configuration and candidate accesses. |
| `PostgresCallRepository` | Performs the conditional transition to `CALLED` and records history. |
| `PostgresStateTransitionRepository` | Applies the other state transitions and records history. |
| `PostgresDisplayReadModel` | Builds non-identifying Room and waiting-room snapshots. |
| `PostgresOperatorDiscoveryReadModel` | Supplies configured Rooms and Queues. |

## SQL strategy and schema evolution

PostgreSQL adapters use `psycopg` with explicit SQL. This keeps important behaviour visible, including conditional updates, `RETURNING`, sequence upserts and recursive location queries. SQL remains confined to infrastructure adapters.

Alembic versions the schema through explicit migrations. The application does not create or alter the database schema automatically at startup.
