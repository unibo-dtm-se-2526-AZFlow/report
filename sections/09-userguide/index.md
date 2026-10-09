---
title: User guide
has_children: false
nav_order: 10
---

# User Guide

Users interact with AZFlow through clients rather than by running the Python package. The project provides four browser demonstrators using only synthetic data: Totem, Operator, Waiting Room display and Room display. This guide assumes the development environment is already running.

## Patient check-in at the Totem

Open a configured Totem, for example:

```text
http://localhost/demo/totem/?id=1
```

An unknown or missing `id` disables check-in.

![AZFlow Totem client]({{ site.baseurl }}/pictures/userguide-totem.png)

The patient enters the identifier and selects **Check in**. Demo identifiers `DEMO031`–`DEMO080` can be used. If appointments exist for the day, AZFlow creates or reuses the DailyPresence and required ServiceAccesses and returns one public call code. Repeating check-in does not create duplicates.

## Operator workstation

```text
http://localhost/demo/operator/?room=1&queue=1
```

The parameters provide the initial Room and Queue; both can then be changed from the UI. Login and persisted workstation configuration are not implemented.

![AZFlow Operator client]({{ site.baseurl }}/pictures/userguide-operator.png)

The Queue table shows public call code, Agenda, state and timing information. **Call next** follows the selected Queue policy (`BY_APPOINTMENT` or `BY_ARRIVAL`). Available actions are:

- **Call next** - call the next eligible WAITING access;
- **Call** - explicitly call a selected WAITING or SUSPENDED access;
- **Suspend / Restore** - temporarily remove and later restore an access;
- **Admit** - admit the currently called patient;
- **Cancel call** - return a CALLED access to WAITING;
- **Recall** - return an ADMITTED access to CALLED in its previous Room.

A Room can have only one active call. The **Current call** panel provides direct cancel/admit actions, and the Queue view refreshes automatically.

## Waiting Room display

```text
http://localhost/demo/waiting_room/?id=1
```

![AZFlow Waiting Room display]({{ site.baseurl }}/pictures/userguide-waiting-room.png)

The monitor receives calls for its configured topology scope. Entries use the public call code and never expose the patient identifier. Active calls are prioritised, followed by recent call history up to the configured limit.

If the WebSocket disconnects, the client reconnects automatically. AZFlow first rebuilds the snapshot from persistence and then resumes live updates.

## Room display

```text
http://localhost/demo/room_display/?id=1
```

![AZFlow Room display]({{ site.baseurl }}/pictures/userguide-room-display.png)

A Room monitor shows the public code currently called to its Room, with Room and Agenda information. Admission or cancellation clears the display; a new call or recall updates it through WebSocket. Reopening the page rebuilds the current state from AZFlow.

## Demo configuration

| Client | Parameter | Meaning |
| --- | --- | --- |
| Totem | `id` | Totem identifier |
| Operator | `room`, `queue` | Initial Room and Queue |
| Waiting Room | `id` | WaitingRoomMonitor identifier |
| Room display | `id` | RoomMonitor identifier |

Multiple tabs can represent different devices. The deterministic demo provides Totem `1`, Rooms `1`–`3`, RoomMonitor ids `1`–`3` and WaitingRoomMonitor ids `1`–`4`.

`docs/demo-scenarios.md` provides a short end-to-end walkthrough and optional edge checks. It is a demonstration guide, not formal validation evidence.
