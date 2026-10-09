---
title: Developer guide
has_children: false
nav_order: 11
---

# Developer Guide

The public repository is `https://github.com/unibo-dtm-se-2526-AZFlow/artifact`; project contact is `andrea.zaccheroni@studio.unibo.it`. Problems can be reported through the repository. AZFlow was developed as a single-contributor university project, so collaboration rules are intentionally lightweight; a future team can extend the current topic-branch workflow with Issues and pull-request review.

## Repository and conventions

| Path | Purpose |
| --- | --- |
| `AZFlow/domain/` | Domain entities, value objects and rules |
| `AZFlow/application/` | Use cases and ports |
| `AZFlow/api/` | FastAPI adapters and composition |
| `AZFlow/infrastructure/` | PostgreSQL, event and external-source adapters |
| `AZFlow/migrations/` | Alembic migrations |
| `tests/` | Automated tests |
| `dev/` | Seed data and demo clients |
| `scripts/` | Development/test launchers |
| `.github/workflows/` | CI/CD |

Python uses normal naming conventions (`snake_case`, `PascalCase`, uppercase constants). Ruff handles linting/formatting and mypy checks static types:

```bash
poetry run poe static-checks
poetry run poe format-check
```

Commit messages follow the same Conventional-Commit-style convention described in Development.

## Development environment

Requirements are Python `>=3.10,<4.0`, Git, Docker and Docker Compose V2.

```bash
git clone https://github.com/unibo-dtm-se-2526-AZFlow/artifact.git
cd artifact
python3.12 -m pip install -r requirements.txt
poetry install
cp .env.example .env
```

Create a fresh deterministic database with:

```bash
poetry run poe dev-reset
```

This is destructive: it recreates the development volume, applies migrations and loads `dev/seed_data.sql`. The supplied `.env.example` enables `AZFLOW_APPOINTMENT_SOURCE_1=demo`; existing `.env` files may add it at any positive index (for example `_1000`) without filling preceding indices. Selecting `demo` alone never loads the SQL seed.

Normal development startup preserves data:

```bash
poetry run poe dev
```

It starts PostgreSQL 16, Adminer, the Nginx demo gateway and AZFlow/Uvicorn. The API is available at `http://localhost:8000`; Swagger and Adminer are also exposed at `http://localhost/docs` and `http://localhost/adminer/`. The four browser clients and their configuration URLs are documented in the [User Guide]({{ site.baseurl }}/sections/09-userguide/).

Stop services while preserving data with `poetry run poe dev-stop`.

## Tests and quality checks

Portable tests:

```bash
poetry run poe test
```

Complete PostgreSQL suite:

```bash
poetry run poe test-integration
```

The integration launcher recreates a dedicated `azflow_test` database, applies migrations, sets `AZFLOW_TEST_DATABASE_URL` and runs pytest.

Coverage and static checks are available through:

```bash
poetry run poe coverage
poetry run poe coverage-report
poetry run poe coverage-html
poetry run poe compile
poetry run poe static-checks
poetry run poe format-check
```

These tasks are also used by CI.

## Git workflow

`master` is releasable and `development` is the integration branch. Normal work starts from `development`:

```bash
git switch development
git pull
git switch -c feature/<short-name>
```

Use `feature/`, `fix/`, `refactor/` or `hotfix/` according to the change. After local verification, merge the topic branch into `development`; merge `development` into `master` when the collected changes are releasable. In a multi-contributor continuation, pull requests toward `development` should be used for review.

## Database schema changes

Alembic is the only supported schema-evolution mechanism. Because application persistence uses explicit SQL rather than ORM metadata, revisions are written manually:

```bash
poetry run alembic revision -m "describe the schema change"
```

Implement `upgrade()` and, where reasonable, `downgrade()`, then inspect/apply the chain with:

```bash
poetry run poe db-upgrade
poetry run poe db-current
poetry run poe db-history
```

Update `dev/seed_data.sql` when required and finish with `poetry run poe test-integration` to verify the migration chain from an empty database.

## IDE support

VS Code configuration is provided but optional. `.vscode/settings.json` selects the project virtual environment and pytest; `.vscode/launch.json` provides **AZFlow - Debug**, which starts `scripts/debug.py` through `debugpy`. Poetry/Poe commands remain the authoritative development interface.
