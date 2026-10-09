---
title: Interaction and Behaviour
parent: Design
nav_order: 3
---

# Interaction and Behaviour

AZFlow uses HTTP for commands and queries and WebSockets for live display updates. Application services coordinate both without depending on their concrete transport implementation.

| Interaction | Initiator | Communication | Main effect |
| --- | --- | --- | --- |
| Patient check-in | Totem | HTTP request/response | Creates or reuses daily operational state. |
| Queue view | Operator UI | HTTP request/response | Reads and orders visible ServiceAccesses. |
| Patient call | Operator UI | HTTP + WebSocket event | Moves an access to `CALLED` and updates displays. |
| State management | Operator UI | HTTP + optional WebSocket event | Suspends, restores, admits, cancels or recalls. |
| Display snapshot | Public display | HTTP request/response | Rebuilds visible state from persistence. |
| Live display update | AZFlow | WebSocket push | Propagates display-relevant changes. |

## Check-in interaction

A Totem sends a patient identifier and optionally its Totem id. `CheckInService` validates the request, queries the configured `AppointmentSource` objects for the operational day and keeps only appointments mapped to an active local Queue.

The repository imports or reuses those appointments, creates or reuses the `DailyPresence` and adds missing `ServiceAccess` records. Repeating check-in is therefore idempotent for the same appointments. The response contains the public call code.

![Patient check-in sequence]({{ site.baseurl }}/pictures/check-in-sequence.svg)

*Figure - Main interactions of the patient check-in use case.*

<a href="https://www.plantuml.com/plantuml/uml/XLFBRXin3BphAuYSKhH6xZa4CTf3S-gszjrW96vCH2i94jU9_xxKFcAlOo2dbSJXQ3YQVIo2MVhEcpqxWZP6UOxlfhnoI9YnWx975zyul42Blf0nmk896XIc863tP5zN78n1Ap7FvqQRXIqdLCms2dMBavlVssq3w-Rf1h3KxxBwiv8-XGtb0riQCDDwYLkd53b8fnTkOfzdwB2yolYFKYoiEey3icwDcKTPFOnAuHvIfbAFr98Wt39bCvOKeseLqVpPR4_3rpCjJIArF5Hs76vF33z0AiMEtJSp0xMdQj260tfsA3IPTGOOnr58oy7jsfXt3eyBNjqhvGXRBMJGkr0Ew05FJXLZV8m9CdawL7CMDO3FsjICw0y4wnSA3k4EzAbPztzxwaax1jZouav9DJDNwUeSe56ncUh0PuzebDzSCUUYunUoFpR34-axNxbz0O3laFfdpnOiUWysEfeSu2x5BEI-Tk12m0HOMqkbN8Z-ICX7v4hlPKp8US8k9KtvKiYSnnf3LQL-btryEuC-wetrZ_qF" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/check-in-sequence.puml)

## Queue reading and patient calling

`QueueViewService` loads Queue configuration and eligible accesses, then applies the configured ordering policy. Calling uses the same rules. For `call next`, `CallingService` selects the current head and asks the repository to perform a conditional `WAITING` to `CALLED` transition. If another request has already changed it, the service reloads the candidates and tries again.

A specific visible access can also be called directly. The selected Room is stored with the successful transition; only then is a `CallEvent` published through `CallEventPublisher`, currently implemented by `WebSocketCallHub`.

![Patient calling sequence]({{ site.baseurl }}/pictures/calling-sequence.svg)

*Figure - Synchronous patient calling followed by asynchronous display notification.*

<a href="https://www.plantuml.com/plantuml/uml/VPJDRjim3CVlUWgYfnPhNs27eK5Rh06ABKk3zLWm4jC8LIHDejFcxKT9jXSZmGmabiKVANxyxTlCcBZRERMrXc0J0g_3fyhlraTCk8EyHHC-h7-33RfCIh5bHx10jkGPD3fNZEWD69kZmmDqqI0BYPf3Wf-H4if2IJossaOKjul7rMe1iyNy0Z2N-zHwrw8-KzfRJPNfrrFkLqST_RRqiIGqb2hObgVnbXH3jfB8eSTYc48lj7uE-fsuq8_Tkc9odrABRksiXljMQwxGyA3KK2pSV2jLmTVQ8F3qoPT_IhBNa4BONQbY5AQlgkTUJxa14BOL9gWBQA2MNjkkvS-MZcVL8pUJo8tyCkpCjAQSZxqcPyGWBeboS7k2fUIWwjuqPCaDh57AXH2XysmTw201sGQF3ZYXp_K1SYVdaSaAv3ezYTFXjPH-YJMjLlOrr1vSLHzq329I9h1P5bRQ-JARh-O_lbTpkSvaU3TxUdgudzPSUH8Hbrnrbr8Ly1Rz6_qlb0z7zOpWkS4aggCvQks_i6S6CwOmvSaRLNx7Sn4PYaCisijRA09zs8khAlkZUPWQRZQacGpiWY-2pmqJRX2gmAFQXzTrF6sKRdjhSkUuoLKCexwROEMCDZUHLzNAhIHUFYP_0G00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/calling-sequence.puml)

## Service-access behaviour

A new `ServiceAccess` starts in `WAITING`. It can be called or suspended; suspension can be restored to `WAITING`; a called access can be admitted or returned to waiting; an admitted access can be recalled to `CALLED`.

![ServiceAccess state diagram]({{ site.baseurl }}/pictures/service-access-state.svg)

*Figure - State transitions supported by the current ServiceAccess lifecycle.*

<a href="https://www.plantuml.com/plantuml/uml/NP7TIiD048NlzodcMgWFu8Kqc2A56eH4l10lbjb9CtH_mkn4wTkxYLfDxvRpdJdpizkiLdGAtWpi22YCUWP76OL7vHHDFd4ShTW0UR0kVN8yGczz9cEKrHEq91-CL25Ipk2v9poZB_ZjvXqsctjuhVRTldc4Eq0Xg-JChpBJX-fmsDKpjDwlIFlIFk-QUe5voYD5P_wqTR9GrYHqnLVPK1AGUqRp8r_DPYEI_vxYdw6gd_PTjuHO5rZDHLWr45eAJKnA87mS559_AJO0JG8b2HnjwP72wAaS0ihnYvzpCN1KIMx2ed847GXm4g6ea7qvxwqfwyCSRxRbDN_O5m00" target="_blank" rel="noopener noreferrer">Edit on PlantUML</a> · [source]({{ site.baseurl }}/pictures/plantuml/service-access-state.puml)

The domain validates transitions, while persistence applies them conditionally and atomically. A transition succeeds only if the stored state still matches the expected source state. Admission and recall reuse the Room stored at call time.

## Display interaction

Displays first obtain a snapshot from the display read model and then subscribe to their configured WebSocket. They can therefore reconnect and rebuild state without relying on events that may have been missed while offline.

`WebSocketCallHub` resolves the monitors affected by a Room and pushes call or state updates. Waiting-room scope comes from the location hierarchy; Room monitors are tied to their configured Room. Messages contain public operational information, not the patient identifier.

## Interaction boundaries

HTTP endpoints handle transport and error translation. Application services coordinate the use cases, while persistence, appointment retrieval and event publication are accessed through ports. This keeps the workflow testable independently from its adapters.
