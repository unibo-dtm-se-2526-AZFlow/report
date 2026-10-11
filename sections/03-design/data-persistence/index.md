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
| External scheduling | `external_source`{: style="background-color: #EAF3FE; color: #283443;" }, `external_agenda`{: style="background-color: #EAF3FE; color: #283443;" }, `appointment`{: style="background-color: #EAF3FE; color: #283443;" } | Imported scheduling data and source references. |
| Operational flow | `daily_presence`{: style="background-color: #FFF3D9; color: #283443;" }, `service_access`{: style="background-color: #FFE5B5; color: #283443;" }, `service_access_transition`{: style="background-color: #FFF3D9; color: #283443;" } | Check-in state, current service state and transition history. |
| Queue configuration | `agenda`{: style="background-color: #F0EDFB; color: #283443;" }, `queue`{: style="background-color: #F0EDFB; color: #283443;" }, `queue_policy`{: style="background-color: #F0EDFB; color: #283443;" }, `queue_agenda`{: style="background-color: #F0EDFB; color: #283443;" } | Services, Queue membership and ordering policy. |
| Public call codes | `ticket_master`{: style="background-color: #F0EDFB; color: #283443;" }, `ticket_sequence`{: style="background-color: #F0EDFB; color: #283443;" } | Call-code configuration and daily sequence. |
| Physical configuration | `location_node`{: style="background-color: #EAF7EF; color: #283443;" }, `room`{: style="background-color: #EAF7EF; color: #283443;" }, `totem`{: style="background-color: #EAF7EF; color: #283443;" } | Location hierarchy, Rooms and check-in points. |
| Display monitors | `room_monitor`{: style="background-color: #EAF7EF; color: #283443;" }, `waiting_room_monitor`{: style="background-color: #EAF7EF; color: #283443;" }, `waiting_room_monitor_scope` | Room displays and waiting-room scope. The scope association table is not drawn as a separate entity. |

## Relational model

The diagram shows the main persistent relationships, including the recursive location hierarchy and display monitors. Most non-key attributes are omitted for readability. The many-to-many scope relationship between waiting-room monitors and location nodes is stored in the `waiting_room_monitor_scope` association table, represented by a direct relationship in the diagram.

![AZFlow main persistent data relationships]({{ site.baseurl }}/pictures/persistence-model.svg)

*Figure - Main persistent data relationships in PostgreSQL.*

<a href="https://www.plantuml.com/plantuml/uml/hLTBRzGm4BxxLrXmG4AiHDa21I745ZOIGY0Uui8byZhJhbN73hR3KYZ_dR4JkhRZb4NYKcrcnjzyCvw7-y8wPbpVIh8L3T0Mt5OtTlYm3WneTzc19VP2g8uPrbAxPOtU2NLEpvYq46caKE2jgJQ84YcuPDQkd3DYqpjupRNw97u0lP-RL5gve3bwC7jwRtCKsQoCqRkNMcf3RpzQFbwUFCe1JhLfm8mc9qTFZbR79VUZmOEJvV7nCZBOC7vnRdIlci5YjnKkZbtf1YnqT1axDanTUE7n2P5mvgZJr8ZphQEDCC2Tq8eG9vm4klfIIRsZ2_gM2KKxC5PWzXLQCiUe0ScyjTsApXA2Sk4kwItuZXUacAojxWs7MvHPcidexVMgMbPh-fDGUfUAXZwb0c6VFNl_vlbpb2qM-8SZULGuF4n-JU7PEQY6fV23x33uZ5CTcLM3sO1MK5mVDN26nQXuWIVhEes7MlmE7AFlV-GtIyFoBJIzXAPcpXCGBM3Vj5tCOf-aFxcfxgzVLQSt-rQiBOJqjOSUuhp7WWnuK2Nmz-Z8-suXizVgpDtUps7CEoq5lnovxrFb1By0LxVCJuzIAXrplPqBUG2DGXwzf8oYUir8IRO1EGLFI0NqH79Wm5Y3uliik0LahCOsp6IPWzaS9LUdSGo4jiVAR9ZFD0u3c0HiNQtwTeDH19I8MCE4lAoHjhtcbOgGLbKjNpsvEUuoZmEksca7RK7UzHkyr9epAUjuzE0WsW92DhLGyurcmNmJE4KOvs1jY2eL-QZM3qyVtXnLcedIJDgFaN-PM4RhKio-x0kDdZAl7MuCAtok2t55siCkBZi-9JKP7QDSSzuRCvrseGU-2TtREea7emRRIuUFWdecKAbvgA7QByeGN289W_hnklfB1p9JlesvjlS5EFIZ_tMOauJNnDSUt5zqmFO__WVqM3k5JPVuh5kjXDFcslSVmM4SflLvZtv-z_h3vtKItOw9S9qJZoN5WT6dbqJkq8_nkmPFqFL7V4Yv82FvI-RgQh7GF_DbJSQTEAFDtokZMTJRXCJlXIiTz6ddP3uoPJPIoqQXHihW99jUHO2ezycmeujWiHb95kY86cGaNNw9QWIFHEL49weoO9gOiass9mb9fy8OP2fyEiw1t7P0z9akQy8C8CCa684pYiCjUUkhfBD8iUX_bSbPZWkJlC34-F-gVWC0" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/persistence-model.puml)

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
