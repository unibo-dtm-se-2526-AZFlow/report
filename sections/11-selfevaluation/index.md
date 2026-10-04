---
title: Self-evaluation
has_children: false
nav_order: 12
---

# Self-evaluation

## Andrea Zaccheroni

### Role

AZFlow was developed as an individual project, so I covered the complete development cycle rather than a single technical role. I defined and refined the project scope, modelled the domain and use cases, designed the architecture, implemented the application and persistence layers, created the browser demonstrators, prepared the automated tests and CI/CD workflow, and wrote the project documentation.

Working alone made decisions fast and kept the implementation consistent, but it also meant that there was no independent developer performing code reviews or challenging design choices during development. I tried to compensate for this by working incrementally, keeping changes isolated in topic branches, adding automated verification and repeatedly reviewing earlier choices as new parts of the system were introduced.

As already disclosed in the report introduction, I used ChatGPT throughout the project as an AI-assisted development tool. It supported activities such as refining requirements and design alternatives, drafting and reviewing code, generating and extending test cases, checking edge cases, and improving documentation. This significantly increased the amount of verification that I could realistically perform as a single developer, including the final automated suite of 428 tests. I remained responsible for deciding what to implement, reviewing generated suggestions, executing the software and tests, investigating failures and accepting or rejecting the resulting changes.

### Strengths

One aspect I consider positive is that the initial idea survived the analysis and development phases without losing its main foundations. The implementation changed in several details, and some concepts were refined or removed, but the core problem I wanted to address remained the same. I interpret this as a sign that I had understood the problem reasonably well before starting the implementation. At the same time, the current project only covers part of the original idea: several functions I had imagined at the beginning are still missing and would require additional development.

I am also satisfied with the separation between application logic and technical details. The hexagonal structure helped me keep the domain and application code independent from FastAPI, PostgreSQL and WebSocket-specific code. For a project of this size this may be more structure than strictly necessary, but it made the main responsibilities easier to understand and change during development.

Another positive result is the level of automated verification. The project includes tests for domain behaviour, application services, API composition and PostgreSQL persistence, while the CI pipeline checks formatting, static typing and multiple Python versions and operating systems. This gave me confidence when refactoring parts of the application and reduced the risk of breaking behaviour that had already been implemented.

Finally, the project remained focused on a complete end-to-end path rather than only on isolated backend functions. The browser clients are deliberately simple, but they make it possible to demonstrate check-in, operator actions and public displays together in a way that is closer to the original use case.

### Weaknesses and lessons learned

The main weakness is that the implemented slice is still far from a deployable hospital product. Authentication and authorization are absent, the appointment source is mocked, configuration is mostly predefined, and administration and monitoring functions are outside the scope. These are acceptable project boundaries, but they are also important limitations of the current software.

Some design decisions also stabilised later than I would have preferred. During development I removed concepts that had become unnecessary, refined how Rooms and devices were identified, changed the database lifecycle and introduced explicit migrations only after the first implementation phases. These refactorings improved the final design, but they show that some infrastructure and deployment concerns should have been addressed earlier.

I also spent a significant amount of effort on development tooling, demo infrastructure, packaging, release automation and documentation. I consider this useful because these aspects are part of software engineering, but with a stricter time budget I would define the release and deployment strategy earlier and reserve more time for additional application functionality such as real identity management or external-system integration.

The individual nature of the project is another limitation of the experience itself. Git branches and CI reproduced part of a collaborative workflow, but they cannot replace discussion, pull-request review, task coordination and conflicting design opinions inside a real team. For a future project I would therefore keep the incremental technical approach used here while introducing peer review much earlier.

Overall, the project changed considerably from the first implementation to the final release, but the changes were mostly refinements rather than rewrites of the core idea. I consider this the most useful lesson from the work: defining a small vertical slice and allowing its design to evolve through tested increments produced a stronger result than trying to specify the complete system in advance.
