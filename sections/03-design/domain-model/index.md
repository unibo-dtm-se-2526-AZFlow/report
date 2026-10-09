---
title: Domain Model
parent: Design
nav_order: 2
---

# Domain Model

An external appointment describes a planned service; AZFlow must instead represent what happens after patient arrival. The model therefore keeps scheduling information separate from the operational journey managed by the queue system.

| Concept | Role in AZFlow |
| --- | --- |
| `PatientIdentifier` | Identifies the patient where required without introducing a local Patient registry. |
| `Appointment` | Scheduling information received from an external source. |
| `DailyPresence` | One patient's operational journey during an operational day. |
| `ServiceAccess` | One service managed during a DailyPresence and owner of its operational state. |
| `Agenda` | Local identity of a healthcare service. |
| `ExternalAgenda` | Mapping between a local Agenda and an external scheduling source. |
| `Queue` | Group of Agendas with an ordering policy. |
| `TicketMaster` | Namespace and prefix used to allocate public call codes. |
| `ExternalSource` | Configuration of an external scheduling source. |

## Patient identification and daily presence

AZFlow does not maintain a persistent `Patient` entity. The current slice uses `PatientIdentifier`, containing an identifier type and value, to retrieve appointments without duplicating a registry owned by another system.

A successful check-in creates or reuses one `DailyPresence` for that identifier and operational day. It stores the check-in time and one public call code. The same presence may contain several services, so a patient with multiple appointments keeps one public identity for the whole day.

## Appointment and service access

`Appointment` contains scheduling data and deliberately has no AZFlow queue state. Its operational counterpart is `ServiceAccess`, which belongs to a `DailyPresence` and a local `Agenda` and may reference the source appointment.

`ServiceAccess` owns its lifecycle. It starts in `WAITING`; valid transitions allow calling, suspension/restoration, admission, call cancellation and recall. Invalid transitions raise domain errors. As a frozen dataclass, each valid transition returns a new instance rather than mutating the existing one.

## Agendas and queues

`Agenda` identifies a service locally, while `ExternalAgenda` connects it to an `ExternalSource`. This mapping separates external scheduling identifiers from the internal organization of services.

A `Queue` is a configurable operational view over one or more Agendas. The relationship is many-to-many: a Queue can combine services from different Agendas, and the same Agenda can be included in multiple Queues. For example, a shared arrival-order Queue may combine Agendas A and B, while a separate appointment-order Queue handles Agenda A alone. The current policies are `BY_APPOINTMENT`, ordered by scheduled time, and `BY_ARRIVAL`, ordered by check-in time.

Each `ServiceAccess` belongs to a single Agenda and retains one operational state even when that Agenda appears in multiple Queues. Queues therefore select and order accesses without owning or duplicating them. Although an Agenda normally needs to be assigned to a Queue to be operationally visible, the current domain relationship does not require every Agenda to belong to at least one Queue.

The following example illustrates this configuration: Agenda A is included in both queues, while Agenda B is included only in Queue 2.

![Example queue configuration]({{ site.baseurl }}/pictures/queue-configuration.svg)

<a href="https://www.plantuml.com/plantuml/uml/TP5BJyCm48Jl_XMhtYEH28wWEYY7Ib3w4g8dv2RRnDIn8tiZMX3_7JUcbNcTl9hrDpEMnuw4fRvLJE6MW0nOMJS4bRHOaZIQkPtKdR2Y1TU8ohnANSDMA8VHHacDTEWGZAN6H0kpUV4sdCZAJKyuAOrUoZU4Y-YEDXKwxE3oAXAjqBilaIGfX68lsiwV2Snxx15kZTxAkhTYACb248oAFQ7LGW6lKLS2-0Y4WuB3EmDmfhSbmZKi3uwmXIVsyI-O1p3_4rn7uBSW_bCEDlbP3kNJGPsdWtbdb2mFtZnVF_FPx64oNTqNqrKK4Q0iGDblQB6OFF8x3p3_q2IvyJLyyUEGio3CqzEGiVmqZ7t3uyz_0W00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/queue-configuration.puml)

## Public call identity

The public call code belongs to `DailyPresence`, not to a single `ServiceAccess`. `TicketMaster` defines its prefix while persistence manages the daily sequence. Public displays can therefore use the call code without exposing the patient identifier.

## Core class relationships

The class diagram details the main domain objects, their attributes, public operations, enumerations and association multiplicities. Location and display configuration are omitted to keep the patient-service model readable.

![AZFlow core domain model]({{ site.baseurl }}/pictures/domain-model.svg)

<a href="https://www.plantuml.com/plantuml/uml/ZLRTRzCm47_FNs7jYGzr6X8FA48JOIqeqjOLMa0mJPQRt3Opnuxiow0W_dVEJjh6NHljfRhp_Uxx8ttdK5XiAfMWgHaQjZI8fcAbj52WD3fnzrBNmegAkJjHcbzItx8ReHpq98KIpcM8LYuRXBmmUYx_03lfGPJKWAiQcB5uPte2RKfmKBFNVRGL-ZuyladkP0aCgXfNh09IBLsIe4G5BFlnGPbVRCJEZ0KsDfMGcbsGEPKa8I8s4oX1OrxIZxoHODdRjmz2DHJ5yYVbTthA_YQClVI1fSoXzKm0hBdHo3znNXk7N6g9d3zxdhAfqP3yMxl9wjf8ZHLv8GVU5wxMfcMPCf9vqXLtK3OAIYumPQL0G5c1bzHjd5nk0aqVn-w1y1l1Qg6uk0LTYfHDkeSiy15aRTJ23LZG1ULqMVkM2dL5oLt7zhOf75RO93mMKgrcblf6gA6KdvoOgS6ArXSlnQejJx3GB9KiU26KuWNrTjCcbCKz8A-4Gszr4TYBm7anrPeUIkfPNErD3dEm3xA0h2Y0k84SIfyihxjiqpXv3rZtOjk3NZLxDUoDIIW-hHwIlIYGERPvjtFdiuRI3rm42igDgydT0Ib5XxGK-uM5eC2zuL3L0_e3haLPISHzmkr6X58CLLMBgklbHYcUvKVAZyliJ6DzHzQAyy17Spqq_AqwRoCvCEcnwQ64ek7SPXSaMjEnCPP7TmQqM5A9KpgvHcqzVcgW6NJanwPnQGkS1oOiYg4zMNNFiy0yOKtQef8r9HrUjQMztioVT5pGL-01VAlZCFk61Yy0TK3-tdGQT5FjcVYWzYtB5_dq8r5dsVdvP4p4_CjyDfcE0vsDB_B5WiX_hPLUea7z_NUUVVwSVytEEsOskyodYul9T16fj2KBAjdP8lyw8IAVTYI5sB_cez7fddlLHnoT71-_E0h0erT7k_TuPwGFWBkv7GPt5kFJkp--6EELHwErkNXXuoEut-DX394Ujgr6qWxl1hEcEaixqjPBD94xaGyWTy8wFZxTTqXRZrxONukTrsw7tb6C_e_GVm00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/domain-model.puml)

## Location and display configuration

Rooms, Totems, monitors and the `LocationNode` hierarchy support the workflow but are not embedded in `ServiceAccess`. A call stores the selected Room with the operational access, while dedicated application ports expose the topology needed by operators and displays.

## DDD interpretation

The model uses selected Domain-Driven Design concepts without implementing a complete DDD framework. AZFlow is treated as one queue-management bounded context; external scheduling stays outside and is translated at the `AppointmentSource` boundary.

| DDD concept | AZFlow interpretation |
| --- | --- |
| **Bounded context** | Queue management / patient flow; external scheduling remains outside. |
| **Value object** | `PatientIdentifier`. |
| **Entities** | `Appointment`, `DailyPresence`, `ServiceAccess`, `Agenda`, `ExternalAgenda`, `Queue`, `TicketMaster`, `ExternalSource`. |
| **Domain rules** | `ServiceAccess` validates state transitions. |
| **Application services** | Coordinate check-in, queue view, calling and state management. |
| **Repositories and ports** | Defined by the application layer and implemented by adapters. |
| **Factories** | No dedicated domain factories; creation is coordinated by services and repositories. |
| **Domain events** | No general domain-event model; call/display events are application notifications. |
