---
title: Data and Persistence
parent: Design
nav_order: 5
---

# Data and Persistence

AZFlow uses PostgreSQL as the persistent store for both configuration and operational state. A relational model was selected because the workflow contains explicit relationships and consistency constraints between appointments, daily presences, service accesses, queues and locations, and because state changes such as patient calling have to be performed atomically.

The application layer does not execute SQL directly. It defines repository and read-model ports for the operations required by each use case, and PostgreSQL adapters implement those ports. This keeps persistence decisions outside the domain objects while still allowing queries to be designed for the needs of a specific workflow or display.

The persisted information can be grouped by responsibility:

| Data group | Main tables | Purpose |
| --- | --- | --- |
| External scheduling | `external_source`, `external_agenda`, `appointment` | Keeps imported scheduling information and its source references separated from AZFlow operational state. |
| Operational flow | `daily_presence`, `service_access`, `service_access_transition` | Stores check-in context, current service state and successful state-change history. |
| Queue configuration | `agenda`, `queue`, `queue_policy`, `queue_agenda` | Defines locally known services, Queue membership and ordering policy. |
| Public call codes | `ticket_master`, `ticket_sequence` | Configures call-code namespaces and allocates their daily sequence. |
| Physical/display configuration | `location_node`, `room`, `totem`, monitor tables | Describes where interactions happen and which displays are affected by a Room call. |

## Relational model

The following diagram shows the main persistent relationships involved in scheduling, check-in, Queue management and state transitions. It intentionally omits most non-key attributes and the detailed monitor topology so that the operational relationships remain readable.

![AZFlow persistent data model]({{ site.baseurl }}/pictures/persistence-model.svg)

*Figure — Main relationships in the AZFlow PostgreSQL model.*

<a href="https://www.plantuml.com/plantuml/uml/bLPDJzmm4BtxLrXxQb4NqMk541oAL74eLM-zM5vdiclXZzGV2zkA_zvnaWKxcsJJ4u9vcNdpvisOMn-u2r4hifCLK0rXPolV_U83EB3Xq80d_acQXZkkgT_noZvBiwKrLnwoY9864ffQXrcoW53S-xiGdDp40D-4DJ_b7w1NH44TQB3KoUqkq4ew445QGqYGGG6z-tMlx3Djm7c9P0n2UE1KsmeK_Q2vDDI1ukaJlvED_qX8myKJtm9TVNr1zeOhwiKEgeZSjYlwbr2AQMGuKEZZpDle1BGXIY-ehEWNAas0BJXwVVtuS7FJHjRhzeV0sWW8-3d-_af64c9vK_6b2Jiq6w3kZwW1pVCu1pLEpOW9bhnfB7wkavWB6VO2GiLuI4cb1ZIDRigwP_feS4fO4-E9I2t1iTOgRoH78NkkOj78QpRXx-YBTlOuv1fzKeotub8TMEF0jreiRDM-fsGLFo0M3GSTkxXHKZ31bMAb2IXA8fuWCCtJnanAW38Yh6BIZ0aPR00zyMq-G0zkBz48N0ZmVcbZfHoJ5CyCCJFF9CPPgoU3s6wOC6RP5mkE6o_JA1RRj4mmQKG7UscZPmCko1nyL07ln6d82X6T6z-0tn4YJ0ukD-oFXCGBOcgvZPtF2i_-t-4mN4z8sJ9QB1ls6dsnXnQDVkZ_aaktnEOdF5YVxaWdsvqHDeflyBHFTpKyhgFYFpvyUkDyCU7fTqnUe-XmgOBeg5g-Z9Fk4tf0elaTcfMov3z-aqQryu6Pg3UOv2tTqOGzdxITBOcfhjfSxGwVF2Gfo-3HN7rUuHTqTNLvUR4QlWMadzKyQFXibkZiuX0okEabibn_ahzp2J63nVwwTiO93nAt2fxFcDw9TJeKhPXa49-ha9q-qctocMhvhUmAeoNj7Wn7bGWfjh0it8QEHKuZitCi4ENUZ1MPGvHpdOKEzedSOldqp-i_" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/persistence-model.puml)

## Scheduling and operational data

External scheduling data is stored separately from AZFlow operational data. `external_source` and `external_agenda` identify the origin and mapping of imported appointments, while `appointment` stores the scheduling information required by the current workflow. When an external appointment reference is available, a uniqueness constraint prevents the same source appointment from being imported more than once.

`daily_presence` represents one checked-in patient identifier on one operational day. Its uniqueness constraint prevents multiple daily presences for the same identifier and day, while `service_access` represents each service managed during that presence. A separate uniqueness constraint prevents the same appointment from creating duplicate accesses for one presence.

The current state of a service access is stored directly on `service_access`, because queue and operator operations need to determine its state efficiently. The call-time `room_id` is also stored there so later admission or recall can reuse the Room selected when the call was made.

## Current state and transition history

AZFlow keeps both the current state and an append-only transition history. `service_access.state` answers the common question of where an access is now, while `service_access_transition` records successful changes with their previous state, resulting state and timestamp. Call transitions can also record the Queue through which the call was made.

Keeping these two representations avoids reconstructing the current state from the complete event history for every operational query, while preserving the sequence required by display behaviour and future audit-oriented use cases. For example, waiting-room views can identify the latest call of each access and order recent calls using transition timestamps.

| Aspect | Current state | Transition history |
| --- | --- | --- |
| Stored in | `service_access.state` | `service_access_transition` |
| Main purpose | Fast operational decisions and Queue views | Preserve successful changes and their ordering |
| Update model | Replaced on every successful transition | Append-only |
| Typical consumers | Calling, state management and operator views | Recent-call/display queries and historical reconstruction |
| Concurrency role | Conditional update checks the expected source state | Inserted only after the state update succeeds |

State-changing repositories use conditional SQL updates. Calling succeeds only when the persisted access is still in an allowed source state, and state-management operations follow the same approach. The state update and its transition record are performed together, so concurrent requests cannot both treat the same previous state as a successful transition.

## Queue and configuration data

Queues and agendas have a many-to-many relationship represented by `queue_agenda`. The Queue stores its status, a reference to the `queue_policy` catalog and its `TicketMaster`, while the Agenda remains the local identity of a service. `ticket_sequence` keeps the daily counter used to generate public call codes, separated from the `TicketMaster` configuration itself.

Physical configuration is represented through a recursive `location_node` hierarchy. Rooms and Totems belong to location nodes, Room monitors are associated with Rooms, and waiting-room monitors can cover one or more nodes through `waiting_room_monitor_scope`. This structure avoids fixing the topology to a predefined number of levels and lets display queries determine whether a Room belongs to the scope of a waiting-room monitor.

## Read models

Not every read operation reconstructs complete domain objects. Queue views, operator discovery and public displays need data shaped for a particular consumer, so dedicated read-model ports query PostgreSQL directly and return only the required information. This is especially important for displays, where patient-identifying data must not be exposed simply because it exists in the same database.

The display read model combines current state, transition history, Room configuration and monitor scope to produce the public snapshot. Queue-related readers combine Queue configuration with service accesses and appointment times so the application can apply the configured ordering policy. These query-oriented adapters coexist with repositories used for state changes because the two responsibilities have different data-access needs.

The main PostgreSQL adapters therefore have deliberately different responsibilities:

| Adapter | Main access pattern | Reason |
| --- | --- | --- |
| `PostgresCheckInRepository` | Read/write | Resolves Agenda configuration and creates or reuses appointments, DailyPresence and ServiceAccesses; sequence allocation and individual writes are transaction-protected. |
| `PostgresQueueViewReader` | Read | Loads Queue configuration and candidate ServiceAccesses for ordering by the application layer. |
| `PostgresCallRepository` | Conditional write | Resolves the Room and performs the atomic transition to `CALLED`, including transition history. |
| `PostgresStateTransitionRepository` | Conditional write | Applies suspend, restore, cancel, recall and admission transitions while recording history. |
| `PostgresDisplayReadModel` | Read | Builds non-identifying Room and waiting-room snapshots from operational state, transition history and monitor scope. |
| `PostgresOperatorDiscoveryReadModel` | Read | Supplies configured Rooms and Queues to the Operator client. |

## SQL strategy

The PostgreSQL adapters use `psycopg` and explicit SQL instead of an object-relational mapper. For this slice that keeps important database behaviour visible, including conditional `UPDATE ... WHERE state = ...` operations, `RETURNING` clauses, upserts used for daily ticket sequences and recursive queries used to resolve display scope. Domain and application code still remain independent from these statements because SQL is confined to infrastructure adapters.

Alembic is used separately for schema evolution. Its migration layer can use SQLAlchemy schema constructs, but this does not introduce an ORM into the application persistence path.

## Schema evolution

The database schema is versioned with Alembic migrations rather than being recreated from application models at startup. This makes structural changes explicit and repeatable and allows the deployed database to be upgraded together with a new application version. Development commands run the migrations before the application starts, while the application itself does not silently create or modify its schema.

This persistence design keeps relational integrity and concurrency handling close to the database while leaving use-case decisions in the application layer and domain rules in the domain model.
