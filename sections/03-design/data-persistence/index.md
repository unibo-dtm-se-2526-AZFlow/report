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

The diagram shows the main persistent relationships, including the recursive location hierarchy. Most non-key attributes and detailed monitor topology are omitted for readability.

![AZFlow main persistent data relationships]({{ site.baseurl }}/pictures/persistence-model.svg)

*Figure - Main persistent data relationships in PostgreSQL.*

<a href="https://www.plantuml.com/plantuml/uml/hLVTJzim47_tNs71moIqIfGMA0WXocYaQPeqiRUzH6voj5OTExCTIWVxttVv6BLTXnLfBrLoT_xTxyxtaTuOoxIj2a6MF0TQW5sgtBGlne86PJSb669MN9PCiuAQ9SlLcii5VM32WACHN49jJPL654UH2MRCr5hDvvM5pvcIt_aleCUXIQAaRJJ3azxJMvkXOpFLMgq_AQ4qFJmRdOycPo70hT8vwCvaChmOJiSnzvt1oMGq7eySWpdBLWkjAfct5kibjsxiKkLWeAGZrx5cSbKBnnCYuC5IgwZcYwMbETUGMQua8PPR0NJw8n5gJGVqA-EIbg0Dn-nBj6IMKGs2rTPcoKj32CgvtT03UC8BaaoaHbKwWmFA30raz70sJKR9Z3uJIeyep-abvGXxTVNjo_KroWO3_CcGF2ei7YQ_T-7P0cJEVFXMjXzym2brp9BMh4MBA5wFQdZ0OfHPX2ShIuM72dnlE3hlx-JNIyDaIyWh0NdAR4s05u1zKvGkYssI_kOcEPxT9RTl-vQiY8Jqiu8AtBoxWW2uLNdm7sd7-oYIsLTru6xhPp_cfH8ystJSjwcoF5k1JGjMJuzOAYspbUaBkGLrGkwy-8oSUWr82JO7iGlkaMhGFScU0MCDygTUS0F8M7Pj6CW21xqvygvEuHXesXuhCsTrfd4Om4x0ngQoAkOOHOFY4CiP5viKQPjNNhu8QIN9wExYxRZZFFQuQgii515vMStnKjEC2P6wemS7qH8GCa-vx6yq0_gHunHXMGR6D57veZggsUdjwTjH-Pc8pQJj67dFnD9AnMAkopxIw3xprEB6CBpETIGkHxlVnGN7TqdjZ8vEhhAiqdftsZKzyCXLPL8l7emQJ2KiVXIaFO4AbJKrbDQBiWdEapI3-doM_AC3cOxVHb_RrmNOzcFzj9yJZzUEhoruVT4DTltmFw2xsebiElA1thkV07YApkxncyCsCX8k_PUNmK0zXtkDTEkZHnkkzixCQGD2tDNweXgzNsI1Zq0PJ9-uKPFEE3W96ZqAuBG9QTTP5Cmr8zwkwL0R6V7tXAVgm1rHFD6UAWxe9oPk4wmKGlm6weBqXPTTouIsBMATwRYcQHVIDaq7752ymMZgVmr_0000" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/persistence-model.puml)

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
