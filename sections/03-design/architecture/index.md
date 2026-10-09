---
title: Architecture
parent: Design
nav_order: 1
---

# Architecture

AZFlow follows an object-oriented design with a layered organization based on the principles of **hexagonal architecture**. This choice was made because the main workflow should not depend directly on FastAPI, PostgreSQL or on the system that provides appointments. These technologies are necessary to run the current application, but they are not part of the queue-management problem itself.

A traditional layered architecture could also separate presentation, business logic and persistence, but for AZFlow an explicit separation through ports is useful because some boundaries are expected to change. The current demonstrator uses `DemoAppointmentSource` to simulate appointment retrieval, while a real deployment would connect to an existing hospital system. In the same way, application services use persistence and event-publishing interfaces without knowing the concrete PostgreSQL or WebSocket implementations. An event-based architecture was not selected as the main architectural style because the central workflow requires synchronous commands and immediate state transitions; events are used only where they are useful for propagating call and state changes to displays.

## Architectural components

The application is organized around four main areas.

**Domain** contains the concepts and rules that describe the operational flow, such as appointments, daily presences, service accesses, agendas and queues. It does not depend on the API or infrastructure code.

**Application** coordinates the use cases. Services implement operations such as check-in, queue reading, patient calling and state management. When they need information or an external operation, they depend on ports rather than concrete infrastructure implementations.

**API** is the inbound adapter of the current application. FastAPI endpoints translate HTTP or WebSocket interactions into calls to application services and translate the results back to the clients. The composition module is also responsible for connecting the required implementations when the application starts.

**Infrastructure** contains outbound adapters. PostgreSQL repositories and read models implement persistence ports, the appointment-source adapter provides external scheduling information and the WebSocket call hub publishes changes to connected displays.

This dependency direction keeps the application and domain logic independent from the concrete delivery and persistence mechanisms. It is particularly useful in the current vertical slice because the demonstrator can enable `DemoAppointmentSource` while preserving the same application behaviour expected from a future real integration.

## Composition

The separation between components does not mean that they are independent processes. In the current implementation they are assembled inside the same AZFlow server. The composition layer creates application services with the required adapters, opening PostgreSQL connections when needed and sharing the WebSocket hub used for live display updates. This keeps dependency construction explicit instead of hiding it inside domain or application objects.

The architectural view is intentionally independent from the detailed deployment. The physical processes and network connections used by the demonstrator are described separately in the Infrastructure section.
