---
title: Developer guide
has_children: false
nav_order: 11
---

# Developer Guide

This section is intended to let a new contributor reproduce the development environment and start making changes without first learning the complete project history. AZFlow is maintained in the public repository `https://github.com/unibo-dtm-se-2526-AZFlow/artifact`. The project was developed by Andrea Zaccheroni as a single-contributor university project, so some collaboration practices are intentionally lightweight. For project contact, the repository metadata lists `andrea.zaccheroni@studio.unibo.it`.

Problems or proposed changes can be reported through the GitHub repository. During the course project, GitHub Issues and mandatory pull-request reviews were not part of the regular workflow because there was only one developer; work was instead tracked through incremental specifications, topic branches and commits. In a multi-contributor continuation, opening an Issue for reproducible defects and a pull request toward `development` would be the natural extension of the existing workflow.

## Repository and conventions

The most relevant top-level directories are:

| Path | Purpose |
| --- | --- |
| `AZFlow/domain/` | domain entities, value objects and business rules |
| `AZFlow/application/` | use cases and application ports |
| `AZFlow/api/` | FastAPI HTTP/WebSocket adapters and application composition |
| `AZFlow/infrastructure/` | PostgreSQL, event and external-source adapters |
| `AZFlow/migrations/` | Alembic migration environment and revisions |
| `tests/` | unit, component, persistence and end-to-end tests |
| `dev/` | deterministic seed data and static demo clients |
| `scripts/` | development, debug, test and stop launchers |
| `.github/workflows/` | CI/CD workflows |

Python names follow normal Python conventions: modules, functions and variables use `snake_case`; classes and domain types use `PascalCase`; constants use uppercase names. API routes are versioned below `/api/v1`.

Ruff is used both for linting and formatting, while mypy checks static types. Contributors should not manually introduce a different formatting style. Before integrating a change, run:

```bash
poetry run poe static-checks
poetry run poe format-check
```

Commit messages follow a Conventional-Commit-style convention. Common types in the repository are `feat`, `fix`, `refactor`, `test`, `docs`, `style` and `chore`; `!` marks an incompatible change. Integration commits use the `merge:` prefix. Examples are `feat(db): add queue policy catalog` and `fix(display): prioritize active waiting-room calls`.

## Development environment

The local environment requires:

- Python `>=3.10` and `<4.0`;
- Git;
- Docker with Docker Compose V2.

Clone the repository and restore the Python environment:

```bash
git clone https://github.com/unibo-dtm-se-2526-AZFlow/artifact.git
cd artifact
python3.12 -m pip install -r requirements.txt
poetry install
cp .env.example .env
```

`python3.12` can be replaced with another supported Python version. The supplied `.env.example` contains development defaults; `.env` is ignored by Git and can therefore contain local port or database changes.

To create a fresh deterministic development database:

```bash
poetry run poe dev-reset
```

This command is destructive: after confirmation it removes the existing development Docker volume, recreates PostgreSQL, applies all Alembic migrations and loads `dev/seed_data.sql`.

Start the normal development environment with:

```bash
poetry run poe dev
```

This starts PostgreSQL 16, Adminer and the Nginx demo gateway through Docker Compose, applies pending migrations and then starts AZFlow with Uvicorn. Unlike `dev-reset`, a normal start preserves database data.

Useful local endpoints are:

| Service | URL |
| --- | --- |
| Swagger UI through gateway | `http://localhost/docs` |
| Adminer | `http://localhost/adminer/` |
| Totem | `http://localhost/demo/totem/?id=1` |
| Operator | `http://localhost/demo/operator/?room=1&queue=1` |
| Waiting Room display | `http://localhost/demo/waiting_room/?id=1` |
| Room display | `http://localhost/demo/room_display/?id=1` |
| Direct AZFlow API | `http://localhost:8000` |

Stop the application and development services while preserving database data with:

```bash
poetry run poe dev-stop
```

## Tests and quality checks

The portable pytest suite does not require a PostgreSQL instance:

```bash
poetry run poe test
```

Persistence tests are skipped unless an explicit test database URL is available. To run the complete suite against a disposable PostgreSQL database, use:

```bash
poetry run poe test-integration
```

The integration launcher starts PostgreSQL if necessary, recreates an `azflow_test` database, applies the migration chain, sets `AZFLOW_TEST_DATABASE_URL` and then executes pytest. It deliberately uses a dedicated test database so destructive fixture cleanup cannot target the normal development database.

Coverage can be inspected with:

```bash
poetry run poe coverage
poetry run poe coverage-report
poetry run poe coverage-html
```

The HTML report is written to `htmlcov/`. Syntax, lint, typing and formatting checks are available through:

```bash
poetry run poe compile
poetry run poe static-checks
poetry run poe format-check
```

These are the same core tasks used by GitHub Actions, so passing them locally reduces differences between the contributor workstation and CI.

## Git development workflow

`master` is the releasable line and `development` is the integration branch. Normal work starts from an up-to-date `development` branch:

```bash
git switch development
git pull
git switch -c feature/<short-name>
```

Use a branch prefix that reflects the type of change:

| Prefix | Use |
| --- | --- |
| `feature/` | new capability or coherent extension |
| `fix/` | correction of existing behaviour |
| `refactor/` | structural change without a new feature |
| `hotfix/` | urgent release/deployment/integration correction |

A topic branch is tested and then integrated into `development`. When the collected changes are ready for a release, `development` is merged into `master`; CI then performs the release checks and semantic-release decides whether a new version is required.

Because the current project had one developer, merges were performed directly and no pull-request approval rule was enforced. A future team should preserve the same branch direction but use a pull request from the topic branch to `development` for discussion and review rather than treating PR use as an already existing project rule.

## Database schema changes

Alembic is the only supported schema-evolution mechanism. The application must not create or patch database tables at startup.

AZFlow deliberately uses explicit SQL/Psycopg persistence rather than an ORM, and Alembic's `target_metadata` is therefore `None`. Schema revisions are not autogenerated from Python models. Create a revision with:

```bash
poetry run alembic revision -m "describe the schema change"
```

Then implement both `upgrade()` and, where reasonably possible, `downgrade()` in the generated file under `AZFlow/migrations/versions/`. Apply and inspect the chain with:

```bash
poetry run poe db-upgrade
poetry run poe db-current
poetry run poe db-history
```

If the schema change affects deterministic development data, update `dev/seed_data.sql` as part of the same change. Finally run `poetry run poe test-integration`; this recreates a fresh PostgreSQL test database and is the important check that the complete migration chain still works from an empty database.

## IDE support

No IDE is required, but the repository contains VS Code configuration used during development. `.vscode/settings.json` selects `.venv/bin/python`, enables pytest discovery and disables `unittest`. `.vscode/launch.json` provides **AZFlow - Debug**, which runs `scripts/debug.py` under `debugpy`.

The debug launcher starts PostgreSQL, applies pending migrations and runs Uvicorn without auto-reload so breakpoints behave predictably. Command-line development remains fully supported, and the Poetry/Poe commands above are the authoritative project interface rather than IDE-specific tasks.
