---
title: Future work
has_children: false
nav_order: 13
---

# Known issues and future work

After the final validation cycle I am not aware of a reproducible defect that prevents the demonstrated workflow from working as intended. The main limitations are features and production concerns intentionally left outside the slice.

## Current limitations

External appointment sources are only partially modular. `AppointmentSource` is already an application port and `CheckInService` accepts multiple sources selected through numbered configuration entries. Currently, only `DemoAppointmentSource` is implemented; real integrations still require adapter implementations and registration in the composition root.

Authentication and authorization are absent. The API assumes trusted Operator, Totem and display clients and does not enforce roles. Configuration also has no administration UI: Agendas, Queues, Rooms, Totems, monitors, topology and source mappings are prepared through database data rather than managed by non-technical users.

The browser clients are demonstrators rather than finished clinical applications. A production version would require stronger usability/accessibility, device management and handling of exceptional conditions.

Finally, live events use an in-memory WebSocket hub and therefore assume one AZFlow process. Multiple instances would require a shared event mechanism and load balancing.

## Future developments

The first step would be modular appointment-source adapters. A registry, factory or plugin mechanism could load one or more `AppointmentSource` implementations from configuration without changing domain/application code. The built-in mock could remain a development adapter while real HIS/RIS connectors live in separate modules or packages. YAML is one possible configuration format, but the concrete mechanism is not yet fixed.

Identity and access control are another priority. Operators should authenticate through the organization identity system, while Totems and displays should be recognized as managed devices. Keycloak is one possible integration direction.

A larger product would also need administration and supervision: configuration UI, health checks, structured logs, metrics, alerts and audit-oriented views. The functional scope could then expand to richer patient journeys, additional Queue-eligibility rules and further hospital events beyond appointment data.

Persistence could also evolve. Introducing an ORM may reduce direct coupling to PostgreSQL and simplify some adapters, although database independence would still require isolating PostgreSQL-specific behaviour rather than relying on the ORM alone.

On deployment, the existing `Dockerfile` could be used to publish a versioned container image together with the Python package. If AZFlow later ran on multiple application servers, the in-memory WebSocket mechanism would need a shared publish/subscribe layer so events reach clients connected to any instance.

## Possible target architecture

The following diagram illustrates a possible production-oriented evolution, with redundant application nodes, shared event delivery and adapters for hospital services. These components are design options, not part of the implemented slice.

![AZFlow possible target architecture]({{ site.baseurl }}/pictures/target-architecture.svg)

*Figure - Possible target component architecture for a future AZFlow deployment.*

<a href="https://www.plantuml.com/plantuml/uml/ZLRRRjiu47tNLmpoi8qVx1IBNInG145LMOc5jMN1KXjidI2W9TecB95QaafgTFllEwHaNPmKw8DZUUOSpeLpHlceD96wAd977HWlYIG5g3t9n0lZEzYIND6UfoJfWUneh8yv1KbJJVWkxmDIKPI2Kwvh29xxUy_BHKOLBU7FzpsZ9FnWZ7-yTnpDDBBShxUvU84n94Jkg0RlT2YuCjqpZN4hIHtd7Op7O_3cWHycCLowypaaosXah4wJALnuEKEcke3l3a1hdGbLCarocBiX3200QpSh68ShY3NPRX_uFTrW2bo9d3u2KP1Q-1Cng9hWxMbw62FdRoRKGVLH1sEfKLEcofmSrGE_l2TCOtzNGXJm6qo5aAC-AQkHIFk1dtxU_ZTD9SUyptEEY3O6M8WDCoqio_w1XRNQytwS-ePTdY_l8VudJlm5k54q3zpGyuVTQwu2ZyiPuIc5ovcBiIk5QOmkJ0JIkhux681nz6n9QdgS956CRRoFumSUy9saIbbASFiKX7ShFuw7X5Dn3pmMbKnf9AIsX18VdZ2GG721zGnfRgNtPr2qc6JMSq4o-4Hoav_4JaTIV3i-yEjhh68CNuBeviQsATyOT5Ei9oG5d-yOfotKJJLxfbVrLqDA4MTe_hDfV5HjSgRsLBQS5SLxF3MhuPJLHbKss9HeiY6g2n59LX1vlCAfuzdcs12oZTE__oYlCA_kscT136v6IenWuQH-VjepLGDMFm784w1LWcdZcr3RpS7ep9Pn52Jk788myLSXFiJ-walW-V5mUjgp0zwCRKpbCqkfWaiKtgWkmnPn1Txd2E8ZzggmqTLHDLNO6guWShtu751NqTKmPMOf2NaqwesNgBJvr8tC3tSn7xMqfgAE5ozCX0LXETmHJL_8iSMgGdM5BzpGlVEdk7EMdwS_ATeEGjgKJ7LTOvgBAZC-jSU9m6TCxTPRO50t2bMj98jvAX7I1VIMOUXxIR0CwoXexcqiq08QOJdzhGIJoKrFPV01QYtQfZlzpVHBo6OTmVLaCiIYiYqIHvtauuGLT6GoR6-xMnihKPc5v_JeOrZdcqV7_C7IRc1jzFI8fw8tgStNs85rBPd7EfpZD33Bw5pKQ50Dd9brP2YpGKwrWi0iZ0wFhpi-VhrctdBRrRBkwUmH9bKv-U_c3NfFRB-0CaUVmMomT_1QH-PX9t7dutkfkQnXJjUs1us8J2DcyxzmscvdmUeihmufQ-Gqy9PcCf5ndbo7hNz_W4PVos3g3RhVICT0uaLY8FPQsvkWPcEY64AXsPQbjXAmwtShPFCMSzeBDaTsycYdr9wmelzML6cdvpT3FNZp8UDrjCjJ9ZYq7odFp3z1_mC0" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/target-architecture.puml)

The current release remains a tested demonstrator of the core workflow, not a complete clinical queue-management product.
