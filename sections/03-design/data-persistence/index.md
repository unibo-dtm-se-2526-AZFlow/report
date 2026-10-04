---
title: Data and Persistence
parent: Design
nav_order: 5
---

# Data and Persistence

AZFlow uses PostgreSQL as the persistent store for both configuration and operational state. A relational model was selected because the workflow contains explicit relationships and consistency constraints between appointments, daily presences, service accesses, queues and locations, and because state changes such as patient calling have to be performed atomically.

The application layer does not execute SQL directly. It defines repository and read-model ports for the operations required by each use case, and PostgreSQL adapters implement those ports. This keeps persistence decisions outside the domain objects while still allowing queries to be designed for the needs of a specific workflow or display.

## Scheduling and operational data

External scheduling data is stored separately from AZFlow operational data. `external_source` and `external_agenda` identify the origin and mapping of imported appointments, while `appointment` stores the scheduling information required by the current workflow. When an external appointment reference is available, a uniqueness constraint prevents the same source appointment from being imported more than once.

`daily_presence` represents one checked-in patient identifier on one operational day. Its uniqueness constraint prevents multiple daily presences for the same identifier and day, while `service_access` represents each service managed during that presence. A separate uniqueness constraint prevents the same appointment from creating duplicate accesses for one presence.

The current state of a service access is stored directly on `service_access`, because queue and operator operations need to determine its state efficiently. The call-time `room_id` is also stored there so later admission or recall can reuse the Room selected when the call was made.

## Current state and transition history

AZFlow keeps both the current state and an append-only transition history. `service_access.state` answers the common question of where an access is now, while `service_access_transition` records successful changes with their previous state, resulting state and timestamp. Call transitions can also record the Queue through which the call was made.

Keeping these two representations avoids reconstructing the current state from the complete event history for every operational query, while preserving the sequence required by display behaviour and future audit-oriented use cases. For example, waiting-room views can identify the latest call of each access and order recent calls using transition timestamps.

State-changing repositories use conditional SQL updates. Calling succeeds only when the persisted access is still in an allowed source state, and state-management operations follow the same approach. The state update and its transition record are performed together, so concurrent requests cannot both treat the same previous state as a successful transition.

## Queue and configuration data

Queues and agendas have a many-to-many relationship represented by `queue_agenda`. The Queue stores its status, ordering policy and `TicketMaster`, while the Agenda remains the local identity of a service. `ticket_sequence` keeps the daily counter used to generate public call codes, separated from the `TicketMaster` configuration itself.

Physical configuration is represented through a recursive `location_node` hierarchy. Rooms and Totems belong to location nodes, Room monitors are associated with Rooms, and waiting-room monitors can cover one or more nodes through `waiting_room_monitor_scope`. This structure avoids fixing the topology to a predefined number of levels and lets display queries determine whether a Room belongs to the scope of a waiting-room monitor.

## Read models

Not every read operation reconstructs complete domain objects. Queue views, operator discovery and public displays need data shaped for a particular consumer, so dedicated read-model ports query PostgreSQL directly and return only the required information. This is especially important for displays, where patient-identifying data must not be exposed simply because it exists in the same database.

The display read model combines current state, transition history, Room configuration and monitor scope to produce the public snapshot. Queue-related readers combine Queue configuration with service accesses and appointment times so the application can apply the configured ordering policy. These query-oriented adapters coexist with repositories used for state changes because the two responsibilities have different data-access needs.

## Schema evolution

The database schema is versioned with Alembic migrations rather than being recreated from application models at startup. This makes structural changes explicit and repeatable and allows the deployed database to be upgraded together with a new application version. Development commands run the migrations before the application starts, while the application itself does not silently create or modify its schema.

This persistence design keeps relational integrity and concurrency handling close to the database while leaving use-case decisions in the application layer and domain rules in the domain model.
