---
title: Release
has_children: false
nav_order: 7
---

# Release

AZFlow is released as one Python package containing the application and database migrations. Poetry builds a wheel (`.whl`) and source distribution (`.tar.gz`). Tests, demo clients, seed data, Docker Compose files and development scripts remain in the GitHub source repository and are not included in the package.

The distributions are published to **TestPyPI** and attached to the corresponding **GitHub Release**. TestPyPI is appropriate for the academic demonstrator, while GitHub Releases keep artefacts, tag, source history and release notes together.

## Release process

Release creation is automated by GitHub Actions and `semantic-release`:

1. completed work is merged into `development`;
2. releasable changes are merged into `master`;
3. CI runs static, compatibility and PostgreSQL integration checks;
4. `semantic-release` analyses commits since the previous tag;
5. if required, Poetry updates the version and builds/publishes the package;
6. the workflow creates the Git tag and GitHub Release and updates `CHANGELOG.md` and `pyproject.toml`.

Branches other than `master`/`main` run semantic-release in dry-run mode. Real publication uses the repository `PYPI_TOKEN`; GitHub Actions provides `GITHUB_TOKEN` for release metadata. The workflow selects TestPyPI through `RELEASE_TEST_PYPI=true`.

The release command is:

```bash
npm install
npx semantic-release
```

which, on a real release, invokes the equivalent Poetry version/build/publish operations. No release branch is used. Tags use `v<major>.<minor>.<patch>`. The **v3.0.x release series** introduces explicit appointment-source configuration through the breaking change `feat(config)!`, replacing the automatic mock setup of v2.0.1. Each release receives its own exact version tag.

## License

AZFlow uses the **Apache License 2.0**, inherited from the course template and deliberately retained. It is permissive, allows modification and redistribution, and includes an explicit patent grant. Source and package use the same license.

## Versioning

AZFlow follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`). Version selection is derived from Conventional-Commit-style messages:

| Commit category | Release effect |
| --- | --- |
| type/scope ending in `!` | **MAJOR** |
| `feat`, `chore(api-deps)` | **MINOR** |
| `fix`, `docs`, `perf`, `revert`, `chore(core-deps)` | **PATCH** |
| `test`, `ci`, `build`, `style`, `refactor`, general `chore` | no release alone |

The `!` marker takes precedence. The `totem_reference` to `totem_id` API change, for example, produced **v2.0.0**.

There is one versioned product, so wheel, source distribution, Git tag, GitHub Release, TestPyPI package and changelog are aligned by the same semantic-release run. If no commit since the previous tag requires a release, nothing is published.
