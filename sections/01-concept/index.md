---
title: Concept
has_children: false
nav_order: 2
---

# Concept

## Product idea

AZFlow is a web-based queue management application for a healthcare environment, where the patient flow must be managed from the moment a patient arrives in the facility until the required services are completed. The application exposes web services used by multiple browser clients, each representing a different point of interaction with the workflow. The idea starts from a real problem: having an appointment does not describe what is actually happening inside the facility, because the patient can arrive earlier or later, can have more than one service during the same day and can move between different waiting areas and rooms.

Hospital information systems normally already manage patients and appointments, so AZFlow is not intended to replace them, but to manage the operational part of the visit. When the patient arrives, the system needs to know which services are expected, which of them are ready to enter a queue and, later, where the patient must be called. At the same time operators need a simple way to manage this flow and public displays must give useful information without showing the patient identity.

This also means that the Patient alone is not enough to represent what is happening. A patient arrives once during the day but can have multiple services, and each of them can progress independently. This problem influenced the model used by AZFlow, where the daily presence of the patient is separated from the individual service accesses and these accesses can then be managed through different operational queues.

The complete idea is larger than the project presented here, therefore a vertical slice was selected that could represent the main workflow without implementing a complete hospital system. The implemented flow starts with patient identification and check-in, continues with queue management and patient calling and ends with admission to a room, while also including the information presented on public displays.

## Usage context

The main users are Patients and Operators, but they interact with the system in very different ways. A Patient normally interacts directly only when arriving at the facility, using a kiosk to identify and check in, while during the rest of the visit the interaction is indirect through waiting-room and room displays. An Operator instead uses the system continuously during the working activity, from a workstation associated with the room where the service is provided.

The system also communicates with an external appointment source, because appointment and patient information are considered to belong to existing hospital systems. In the project this integration is represented by a mock source, while the kiosk, operator station and displays are implemented as independent browser clients, which makes it possible to reproduce the interaction of different physical devices without requiring dedicated hardware for the demonstrator.

A public call code is used during the visit instead of the patient identity on public displays. The system stores the operational information needed to manage the visit, including imported appointments, the presence of the patient, the individual service accesses, queues, rooms and the history of their state changes. These data are persisted by AZFlow in its application database, while the patient master data remain under the responsibility of the external hospital systems, so AZFlow does not try to maintain another patient master database.

## Project scope

The objective of the project is not to reproduce every function that a production queue management system could require, but to implement a small end-to-end workflow where the most relevant modelling and architectural problems can be addressed. Configuration of the facility is therefore predefined, real hospital integrations are replaced by adapters or mock implementations and administration, supervision and device management are outside the current scope.

These limitations are intentional, because they keep the project focused on the operational flow while leaving space for a possible evolution toward a larger system, where real integrations, configuration tools and stronger operational constraints could be introduced without changing the basic idea demonstrated by the current slice.
