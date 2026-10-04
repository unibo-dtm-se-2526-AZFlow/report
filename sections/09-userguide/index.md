---
title: User guide
has_children: false
nav_order: 10
---

# User Guide

AZFlow is a server-side system, so normal users interact with it through clients rather than by running the Python application directly. The current project provides four lightweight browser clients for demonstration: a patient Totem, an Operator workstation, a Waiting Room display and a Room display. This guide assumes that AZFlow and the demo gateway have already been started as described in the Deployment chapter.

The browser clients are intentionally simple and represent the main user roles of the current vertical slice. They use only synthetic demo data; no real patient information is shown in the screenshots below.

## Patient check-in at the Totem

Open the Totem with a configured device id, for example:

```text
http://localhost/demo/totem/?id=1
```

The `id` parameter identifies the configured Totem. If it is missing or unknown, the client disables check-in instead of sending requests from an unconfigured device.

![AZFlow Totem client]({{ site.baseurl }}/pictures/userguide-totem.png)

The patient enters the fiscal-code identifier and selects **Check in**. In the deterministic demo, identifiers from `DEMO031` to `DEMO080` can be used. If appointments are found for the current day, AZFlow creates or reuses the patient's DailyPresence and the corresponding ServiceAccesses and returns a public call code.

The patient keeps this public code and waits for it to appear on a display. Repeating the same check-in does not create another daily presence or another call code. A patient with multiple appointments also keeps one public code while AZFlow creates the required ServiceAccesses for the different Agendas.

## Operator workstation

The Operator client can be opened with an initial Room and Queue selection:

```text
http://localhost/demo/operator/?room=1&queue=1
```

The URL parameters only provide the initial selection. The Operator can then change both values from the drop-down controls. The current demonstrator does not implement login or persist a workstation/user configuration.

![AZFlow Operator client]({{ site.baseurl }}/pictures/userguide-operator.png)

The Queue table shows the public call code, Agenda, operational state, check-in time and, where relevant, appointment and last-event information. Only active Queues are offered. The displayed Queue policy indicates how **Call next** chooses the next eligible ServiceAccess: for example, `BY_APPOINTMENT` follows appointment order while `BY_ARRIVAL` follows check-in order.

The main Operator actions are:

- **Call next**: calls the next eligible WAITING access according to the selected Queue policy;
- **Call**: explicitly calls a selected WAITING or SUSPENDED access, overriding NEXT ordering;
- **Suspend / Restore**: temporarily removes an access from normal calling and later returns it to WAITING;
- **Admit**: confirms access to the healthcare service after a patient has been called;
- **Cancel call**: returns a CALLED access to WAITING;
- **Recall**: calls an ADMITTED access again in its previously associated Room.

A Room can have only one active call. While the selected Room is occupied by a CALLED access, actions that would create another active call are disabled. The **Current call** panel allows the Operator to cancel or admit that call directly. The Queue view refreshes automatically and can also be refreshed manually.

## Waiting Room display

A Waiting Room display is associated with a configured monitor id:

```text
http://localhost/demo/waiting_room/?id=1
```

![AZFlow Waiting Room display]({{ site.baseurl }}/pictures/userguide-waiting-room.png)

The display connects to AZFlow through WebSocket and shows calls relevant to the monitor's configured topology scope. Each entry contains only the public call code, destination Room and call time; the Patient Identifier is never exposed on the public display. When appointment information is relevant to the configured Queue policy it can also be shown without exposing patient identity.

Active CALLED entries are prioritised, followed by the most recent call history, up to the configured display limit. A monitor placed higher in the topology can cover several Rooms: for example, the demo's BAR monitor covers the whole HOSPITAL, while floor-level waiting rooms see only calls inside their own subtree.

When the connection is interrupted, the client retries automatically. On reconnection AZFlow first sends a snapshot rebuilt from persisted state and then continues with live updates. The display therefore does not depend on having observed every previous WebSocket message.

## Room display

The Room display uses the same device-style configuration:

```text
http://localhost/demo/room_display/?id=1
```

![AZFlow Room display]({{ site.baseurl }}/pictures/userguide-room-display.png)

A Room monitor shows the public code currently called to its Room, together with the Room label and Agenda. It displays only a CALLED access. Admission, cancellation or another state change clears the call from the screen, while a new call or recall updates it immediately through WebSocket.

As with Waiting Room displays, reopening a Room display reconstructs its current state from AZFlow before live updates continue. An unknown monitor id is rejected instead of silently showing another Room's information.

## Demo client configuration

The current demo uses URL parameters rather than a configuration/login interface:

| Client | Parameter | Meaning |
| --- | --- | --- |
| Totem | `id` | Totem identifier |
| Operator | `room`, `queue` | Initial Room and Queue |
| Waiting Room | `id` | WaitingRoomMonitor identifier |
| Room display | `id` | RoomMonitor identifier |

Multiple browser tabs can be opened with different parameters to represent several devices at the same time. The deterministic demo provides Totem `1`, Rooms `1`–`3`, RoomMonitor ids `1`–`3` and WaitingRoomMonitor ids `1`–`4`.

For a short end-to-end demonstration of check-in, Queue policies, state transitions, display propagation and edge cases, the source repository also contains `docs/demo-scenarios.md`. That document is a demonstration walkthrough rather than part of the user interface or formal validation evidence.
