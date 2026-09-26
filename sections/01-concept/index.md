---
title: Concept
has_children: false
nav_order: 2
---

# Concept

## Product overview

AZFlow is a healthcare queue-management system. Its purpose is to coordinate the operational flow between a patient's arrival and access to a healthcare service.

AZFlow is not intended to replace hospital appointment systems or to maintain a new patient registry. Appointment and patient-related information can come from external systems, which remain the source of truth for that information. AZFlow uses this information to create and manage its own operational state: daily presence, service accesses, queue visibility, calls and admission.

The project is implemented as a web service with external browser-based clients. The same application exposes the operations required by kiosks, operator workstations and public displays.

## Operational concept

A patient starts the workflow by identifying at a kiosk. AZFlow queries the configured appointment sources and imports the relevant appointments for the operational day. It then creates or reuses a DailyPresence and creates the required ServiceAccess records.

The patient receives a public call code, such as AAA001. This code is used during the operational workflow instead of displaying the patient's identity.

A ServiceAccess represents access to one healthcare service. It can be visible through one or more Queues according to its Agenda. A queue does not own or duplicate service accesses: it provides an operational view over eligible accesses and orders them according to its policy. The implemented policies support ordering by arrival or by appointment time.

An operator works from a room and selects a queue. The operator can inspect the operational list, call the next eligible access or a specific one, suspend and restore accesses, confirm admission, cancel a call and recall a previously admitted patient.

When a patient is called, the information is made available to the appropriate public displays. A waiting-room display can show recent calls and their destination rooms, while a room display shows the current call for that room. Public displays use the public call code and never expose the patient identifier.

## Actors and interaction

The current system has the following main actors:

- **Patient** — interacts with AZFlow through a kiosk during check-in and later follows the public call information shown on displays.
- **Operator** — uses a workstation to select queues and rooms and to manage the operational lifecycle of service accesses.
- **Kiosk client** — provides the patient-facing check-in interface and communicates with the AZFlow HTTP API.
- **Waiting-room display** — presents recent calls relevant to its configured location without exposing patient identity.
- **Room display** — presents the current call associated with a specific room.
- **External appointment source** — provides appointment information through an AZFlow application boundary.

Administrative configuration, supervision functions and integration with real hospital information systems are outside the implemented project scope. The delivered system uses predefined configuration and a mock appointment source to exercise the complete operational workflow.

## Main use cases

The main supported use cases are:

1. **Patient check-in** — identify a patient, retrieve relevant appointments, create or reuse the daily operational presence and service accesses, and return a public call code.
2. **View queue** — show the service accesses visible through a selected queue, ordered according to its policy.
3. **Call patient** — call the next eligible service access or a specific service access to a room.
4. **Manage service access state** — suspend, restore, cancel a call, confirm admission or recall a patient according to the allowed state transitions.
5. **Display calls** — publish call information to waiting-room and room displays while preserving patient privacy.

## Usage context

AZFlow is designed for a healthcare facility where patients, operators and displays interact with the same operational process from different physical locations.

Patient interaction is occasional and short: the patient uses a kiosk when arriving for scheduled services and then reads the public displays. Operator interaction is continuous during service activity because the operator repeatedly views and changes the state of the operational queue. Displays remain active and receive updates as calls and state transitions occur.

The current demonstrator represents these devices with independent browser clients. This keeps the clients separate from the AZFlow application while exercising the same public interfaces that dedicated devices could use.

## Data and privacy

AZFlow stores the information required to connect external appointments with its operational workflow. Relevant concepts include appointments, agendas, daily presences, service accesses, queues, rooms, location topology and the history of operational state transitions.

AZFlow does not maintain an independent persistent patient master. The patient identifier presented at check-in is used to retrieve appointments and to recognize the patient's daily operational presence.

Patient identity is not used as the public queue identifier. A DailyPresence receives a public call code that is reused by its service accesses during the operational day. Public displays expose this code and operational information such as the destination room, but not the patient identifier.

## Project scope

The project focuses on the Patient and Operator workflow and on the public displays required to demonstrate it end to end. Configuration data is predefined and external healthcare systems are represented through mock adapters.

The architecture keeps these external boundaries explicit so that real connectors, administration and supervision capabilities can be introduced in future developments without making them necessary for the current project.
