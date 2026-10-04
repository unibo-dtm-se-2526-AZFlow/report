---
title: Design
has_children: true
nav_order: 4
---

# Design

The requirements describe a workflow that is simple from the user point of view, but the internal model has to separate information that belongs to existing hospital systems from the operational state managed by AZFlow. The design therefore started from two main problems: representing a patient who can have multiple services during the same day, and keeping the application independent from the concrete systems used to obtain appointments, store operational data and present the workflow to different clients.

The resulting design separates the core workflow from its external interfaces. The application coordinates check-in, queues, calls and state changes through domain concepts and application services, while adapters connect this logic to HTTP and WebSocket clients, the appointment source and persistent storage. This separation also makes it possible to replace the mock integrations used by the project without moving those details into the domain model.

Because these decisions involve different views of the same system, the Design chapter is divided into the following sections:

- **Architecture** describes the architectural style, the main components and their responsibilities.
- **Domain Model** explains the concepts introduced to represent the daily patient flow and their relationships.
- **Interaction and Behaviour** describes communication between components and the evolution of the operational state.
- **Infrastructure** describes how the server, database, external source and browser clients are distributed and connected.
- **Data and Persistence** explains which information is stored and how current state and transition history are represented.

The sections are separated for readability, but they describe a single design: domain concepts are coordinated by the application layer, persisted through ports and adapters and exposed to the different clients through the application API.
