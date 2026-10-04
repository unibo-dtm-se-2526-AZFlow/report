---
title: Future work
has_children: false
nav_order: 13
---

# Known issues and future work

The current AZFlow release implements the vertical slice described in this report and, after the final validation cycle, I am not aware of a reproducible functional defect that prevents the demonstrated workflow from working as intended. The main limitations are therefore not known bugs in the implemented use cases, but functionality and production concerns that were deliberately left outside the project scope.

## Current limitations

The most important limitation is currently how external appointment sources are composed. AZFlow already defines an `AppointmentSource` application port and the check-in service can work with a sequence of sources, so the core workflow is not tied to a specific hospital system. However, the current application composition directly instantiates the built-in `MockAppointmentSource`. This is appropriate for the demonstrator, but adding a real source today would still require changing the AZFlow composition code.

Authentication and authorization are also missing. Operator, Totem and display roles describe different use cases, but the API does not authenticate them and does not enforce permissions. The current demonstrator therefore assumes trusted clients. A real deployment would need authenticated users and devices, role-based authorization and integration with the identity infrastructure of the organization. Keycloak is one possible solution already considered during development, but no identity product is part of the current implementation.

Configuration is mainly loaded from the database and prepared through migrations and seed data. There is no administration interface for managing Agendas, Queues, Rooms, Totems, monitors, location topology or external-source mappings. In the same way, operator workstation and device configuration are not managed as a production lifecycle. These functions would be necessary before AZFlow could be operated by non-technical administrators.

The browser clients are demonstrators rather than finished clinical applications. They intentionally provide only the interaction needed to exercise the implemented workflow. A production version would require stronger usability and accessibility work, device-specific behaviour, better handling of exceptional conditions and a deployment model suitable for managed workstations, kiosks and public displays.

Finally, the current real-time implementation assumes a single AZFlow application process. WebSocket subscriptions are held in an in-memory hub, so this is appropriate for the current deployment but would not be sufficient if several application instances had to serve the same displays. High availability and horizontal scaling would require a shared event mechanism, for example a message broker or another distributed publish/subscribe solution, together with load balancing and production monitoring.

## Future developments

The first future step would therefore be to make appointment-source adapters genuinely modular. A registry, factory or plugin mechanism could select and configure one or more `AppointmentSource` implementations without changing the domain or application code, and ideally without modifying the AZFlow package itself. The built-in mock could remain the default development adapter, while real connectors could be provided as separate infrastructure modules or packages and enabled through configuration. This would make it possible to connect AZFlow to different sources of truth while keeping the same check-in workflow. Real adapters would then need to address protocol-specific mapping, authentication, temporary failures and availability constraints of each external system.

The second priority would be identity and access control. Operators should authenticate through the organization identity system, while Totems and displays should be recognized as managed devices. API permissions could then distinguish operational actions from read-only public information and provide an audit trail connected to the real actor performing each action.

A larger AZFlow product would also need an administration and supervision area. Configuration of services, Queues, topology and devices should no longer depend on seed data, and operational users should be able to understand the current status of the system. Health checks, structured logging, metrics, alerting and audit-oriented views would become increasingly important once the application is used outside a controlled demonstrator.

The functional scope could then expand toward the parts of the original idea that were not included in this project. Examples include richer management of the complete patient journey, more flexible rules for deciding when a ServiceAccess becomes eligible for a Queue, additional operator and supervisory workflows, and integration with other hospital events instead of relying only on the appointment information available at check-in.

On the deployment side, a useful next step would be to make better use of the existing `Dockerfile` and publish a versioned container image together with the Python package. This would make installation more predictable because the application and its dependencies would be packaged in the same way for every environment. If AZFlow later needed to run on more than one application server, the current in-memory WebSocket mechanism would also need to be reviewed so that live events could be shared correctly between instances.

These developments are intentionally separated from the functionality presented in this report. The current release should therefore be considered a tested demonstrator of the core workflow and architecture, not a complete clinical queue-management product.
