---
title: Interaction and Behaviour
parent: Design
nav_order: 3
---

# Interaction and Behaviour

AZFlow is mainly driven by synchronous user operations, but displays also need asynchronous updates when a call or a display-relevant state change occurs. For this reason the application combines request/response interactions through HTTP with event publication through WebSockets. The application services coordinate both mechanisms without depending on their concrete implementation.

## Check-in interaction

Check-in starts when a Totem sends a patient identifier, and optionally its configured Totem id, to the HTTP API. `CheckInService` first validates the identifier and the Totem and then queries the configured `AppointmentSource` ports for appointments on the operational day. Only appointments whose external agenda is mapped to a local Agenda with an active Queue are considered.

The relevant appointments are imported or reused through the check-in repository. AZFlow then creates or reuses the patient's `DailyPresence` and creates the missing `ServiceAccess` records. Repeating the operation therefore does not create another daily presence or duplicate the same appointment access. The response contains the public call code generated for the daily presence and no patient identifier has to be exposed in the following public workflow.

## Queue reading and patient calling

The operator reads a Queue through `QueueViewService`. The service loads its configuration and candidates, filters the accesses that can participate in the selected Queue and orders them according to the Queue policy. `BY_APPOINTMENT` and `BY_ARRIVAL` therefore affect the view and the selection of the next patient without changing the stored appointment.

Calling uses the same eligibility and ordering rules. For `call next`, `CallingService` reads the current candidates, selects the first one and asks the repository to perform a conditional `WAITING` to `CALLED` transition. If another request has already changed that access, the service reads the candidates again and tries the new head instead of keeping an application-level lock. A specific visible access can also be called directly, including a suspended access through the explicit call-specific operation.

The selected Room is resolved before the state change and is persisted with the call. Only after a successful transition does the service publish a `CallEvent`. The application depends on the `CallEventPublisher` port, while the current adapter is the shared `WebSocketCallHub`.

## Service-access behaviour

The operational lifecycle is centred on the state of `ServiceAccess`. A new access starts in `WAITING`. From this state it can be called (`CALLED`) or suspended (`SUSPENDED`); a suspended access can be restored to `WAITING`, while a called access can be admitted (`ADMITTED`) or returned to `WAITING` by cancelling the call. An admitted access can be recalled and becomes `CALLED` again.

The domain object defines these valid transitions, while persistence performs the operational changes conditionally and atomically. This is important because API requests may arrive concurrently. A transition succeeds only if the persisted state still matches the expected source state, and a failed conditional update is classified as either a missing access or an invalid current state.

Admission and recall reuse the Room stored at call time rather than asking the client to provide it again. This keeps the location of the call consistent through the following state changes. Suspend and restore do not require a Queue or Room context because they act directly on the service access.

## Display interaction

Room and waiting-room displays use two complementary interactions. When a display connects, it can obtain the current snapshot through the display read model. It then subscribes to a WebSocket identified by its configured monitor. This avoids using the event stream as the only source of truth: a display can reconnect and rebuild its state even if it was offline when an earlier event occurred.

After a successful call, `WebSocketCallHub` resolves which configured monitors are affected by the Room and pushes the updated call information to their connected clients. Admission, call cancellation and recall also publish display-state changes when they affect a persisted Room. Waiting-room scopes are resolved from the location hierarchy, while a Room monitor is associated with its configured Room.

The messages exposed to displays contain operational and public information such as the call code, state and Room information, but not the patient identifier. This follows the same separation introduced in the domain model between internal check-in identity and public calling identity.

## Interaction boundaries

HTTP endpoints are responsible for transport concerns and for translating application errors into API responses, while application services implement the use-case coordination. Database operations, appointment retrieval and event publication are accessed through ports. As a result, the same use cases can be tested without starting FastAPI, PostgreSQL or WebSocket clients, and the concrete adapters can be replaced without changing the workflow itself.
