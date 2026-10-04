---
title: Domain Model
parent: Design
nav_order: 2
---

# Domain Model

The main modelling problem in AZFlow is that an appointment is not the same thing as the operational journey of a patient inside the hospital. An appointment comes from an external scheduling system and describes that a service is planned at a certain time, while AZFlow has to represent what happens after the patient arrives: check-in, waiting, calling, suspension and admission. Keeping these two aspects separated avoids adding queue-management state to information owned by another system.

The domain model therefore introduces an operational layer around the external appointment data. The central concepts are `DailyPresence` and `ServiceAccess`, together with `Agenda` and `Queue` for the organization of services.

## Patient identification and daily presence

AZFlow does not introduce a persistent `Patient` entity. For the current slice the patient is represented by a `PatientIdentifier`, a value object containing an identifier type and value. This is enough to find appointments during check-in without duplicating a patient registry that belongs to other hospital systems.

When check-in succeeds, AZFlow creates or reuses one `DailyPresence` for that identifier and operational day. A daily presence represents the patient's operational journey for that day, not the physical presence of the person in a specific room or location. It stores the check-in time and one public call code, which can be shown on public displays without exposing the patient identifier. The same daily presence can be related to multiple services, which is necessary because a patient may have more than one appointment during the same day.

## Appointment and service access

`Appointment` represents scheduling information obtained from an external source. It contains the scheduled time, the patient identifier and the external agenda information, but it deliberately has no AZFlow operational state.

For every service that has to be managed by AZFlow, the operational counterpart is a `ServiceAccess`. A service access belongs to one `DailyPresence` and one local `Agenda`, and it may refer to the appointment from which it was created. This separation means that two appointments of the same patient can become two independent service accesses while sharing the same daily presence and public call code.

A `ServiceAccess` also owns its current operational state. It starts as `WAITING` and the domain object defines the valid transitions used by the application: it can be called, suspended and restored, a called access can be admitted or returned to waiting by cancelling the call, and an admitted access can be recalled. Invalid transitions are rejected by domain errors instead of being silently accepted.

## Agendas and queues

An `Agenda` represents a service known locally by AZFlow. The external scheduling system is kept separate through `ExternalAgenda`, which associates a local agenda with an `ExternalSource` and its external reference. In this way the local name and configuration can evolve without changing the information owned by the source system.

A `Queue` is an operational grouping of one or more agendas. An agenda can participate in queue configuration without becoming the queue itself, because the same scheduled service and the rule used to order patients are different concepts. The ordering policy therefore belongs to the queue. The current model supports `BY_APPOINTMENT`, where eligible accesses are ordered using their scheduled time, and `BY_ARRIVAL`, where the patient's check-in time determines the order.

This distinction is important because it allows the same domain model to represent different organizational choices without modifying appointment data. Queue configuration decides how accesses are presented and selected, while the agenda keeps the identity of the service.

## Public call identity

The public call code belongs to `DailyPresence` rather than to a single `ServiceAccess`. It is generated using a `TicketMaster`, which defines the prefix while persistence manages the daily sequence. As a consequence, a patient with multiple services during the same day keeps one public identity through the complete journey instead of receiving a different public code for every service.

This also separates the identifier used internally for check-in from the information displayed in public areas. Displays work with the public call code and operational information and do not need the patient identifier.

## Location and display configuration

Rooms, totems, monitors and the location hierarchy are configuration concepts used by the operational workflow, but they are intentionally not embedded in the core `ServiceAccess` domain object. A call resolves a configured Room and its identifier is persisted with the operational access, while application ports expose the location and monitor information required by operators and displays.

This keeps the central service lifecycle independent from the physical topology. The current persistence model can represent a recursive `LocationNode` hierarchy, attach Rooms and Totems to it and define the scope of waiting-room monitors without making those infrastructure and display concerns part of the basic service-access state model.

## Model boundaries

The resulting model separates three kinds of information that would otherwise be easy to mix: external scheduling information in `Appointment` and `ExternalAgenda`, AZFlow operational state in `DailyPresence` and `ServiceAccess`, and organizational configuration in `Agenda`, `Queue`, `TicketMaster` and the location-related structures. Application services coordinate these concepts, while repositories and read models are responsible for their persistent representation and for queries that combine them.

This separation is also the boundary used for future integrations: replacing the current appointment source does not require changing the operational lifecycle, and changes to the physical location or display configuration do not change the meaning of an appointment or a service access.
