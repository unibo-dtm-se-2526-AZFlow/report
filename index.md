---
title: Home
layout: home
has_children: false
nav_order: 1
---

# AZFlow

### Authors

- [Andrea Zaccheroni](mailto:andrea.zaccheroni@studio.unibo.it)

## Abstract

AZFlow is a healthcare queue-management system designed to support the operational path of a patient from check-in to access to a healthcare service.

The system integrates appointment information coming from external sources with the local operational workflow. A patient identifies at a kiosk and receives a public call code. AZFlow creates the required operational accesses and makes them available through one or more queues. Operators can view and process these accesses according to the policy of the selected queue, call patients to a room, suspend or restore an access, confirm admission, cancel a call, or recall a patient when required.

Public waiting-room and room displays receive call information without exposing patient identity. AZFlow separates external scheduling data from the operational state it owns and keeps the core application independent from specific external systems and infrastructure technologies.

The project is implemented as a single deployable application with a versioned HTTP API, WebSocket-based display updates and PostgreSQL persistence. The delivered project also includes lightweight browser clients used to demonstrate the main patient, operator and display workflows.

## Disclaimer

During the preparation of this work, the author used ChatGPT (OpenAI) to support requirements and design refinement, software development, testing, documentation and review.

The outputs produced with these tools were critically reviewed, verified and adapted as needed. The author takes full responsibility for the content of the final report and software artefact.
