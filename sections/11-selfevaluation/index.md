---
title: Self-evaluation
has_children: false
nav_order: 12
---

# Self-evaluation

## Andrea Zaccheroni

### Role

AZFlow was an individual project, so I covered scope definition, domain modelling, architecture, implementation, persistence, demo clients, tests, CI/CD and documentation. Working alone kept decisions fast and consistent but removed independent code review; I tried to compensate with incremental development, topic branches and automated verification.

As disclosed in the introduction, I used ChatGPT as an AI-assisted development tool for requirements/design discussion, code drafting and review, test generation, edge-case analysis and documentation. It helped increase the amount of verification possible for one developer, including the final 428-test suite. I remained responsible for the decisions, review of suggestions, execution of the software and investigation of failures.

### Strengths

The initial idea changed during development but retained its main model: external appointments remain separate from AZFlow operational state, and the implementation covers a complete patient/operator/display flow. The current slice implements only part of the original vision, but it validates the core concept end to end.

The separation between application logic and technical adapters also worked well. It may be more structure than strictly necessary for a project of this size, but it kept FastAPI, PostgreSQL and WebSocket details out of the core workflow and supports the expected future integrations.

Automated verification is another strong point. Tests cover domain, application, API composition, PostgreSQL persistence and end-to-end behaviour, while CI adds formatting, static typing and compatibility checks.

### Weaknesses and lessons learned

The main limitation is that the slice is far from a production hospital product: authentication/authorization, real appointment integrations, administration and monitoring are absent.

Some design decisions also stabilised late. Room/device identification, database lifecycle and explicit migrations were refined after the first implementation phases. The final design improved, but addressing deployment and persistence strategy earlier would have reduced rework.

I also spent substantial time on tooling, demo infrastructure, packaging, release automation and documentation. These are useful software-engineering activities, but with a stricter schedule I would define them earlier and reserve more time for application functionality.

Finally, branches and CI cannot reproduce peer review or team coordination. In a future project I would keep the incremental approach but introduce independent review much earlier.

Overall, the most useful lesson was to keep the scope as a vertical slice and let the design evolve through tested increments rather than trying to define the complete system in advance.
