---
title: Release
has_children: false
nav_order: 7
---

# Release

AZFlow produces one logical software artefact: the installable Python package containing the application and its database migrations. Each release is built by Poetry in the two standard Python distribution formats: a wheel (`.whl`) and a source distribution (`.tar.gz`). The browser demo clients, development seed data, Docker Compose environment, automated test suite, development scripts and supporting documentation are intentionally excluded from the published Python package. The complete development and demonstration environment remains available in the GitHub source repository at `https://github.com/unibo-dtm-se-2526-AZFlow/artifact`.

The two distribution files are published to **TestPyPI** and are also attached to the corresponding **GitHub Release**. TestPyPI was retained from the course release infrastructure because the project is an academic demonstrator rather than a production package intended for the public Python Package Index. GitHub Releases provide a second release surface closely connected to the source history, tag, changelog and release notes.

Release creation is automated through GitHub Actions and `semantic-release`. The normal workflow is:

1. completed work is integrated into `development`;
2. when the collected changes are considered releasable, `development` is merged into `master`;
3. the CI workflow runs the static checks, automated tests and PostgreSQL integration tests;
4. after those checks succeed, the reusable deploy workflow runs `semantic-release`;
5. `semantic-release` analyses commits since the previous tag, determines whether a new version is required and, if so, computes the version number;
6. Poetry updates the package version and builds the wheel and source distribution;
7. the distributions are uploaded to TestPyPI, a Git tag and GitHub Release are created, the distribution files are attached to the GitHub Release, and `CHANGELOG.md` and `pyproject.toml` are committed with the release version.

Pushes from branches other than `master`/`main` execute the release workflow in dry-run mode. Therefore development work can exercise the release configuration without publishing a package. A real publication requires the repository `PYPI_TOKEN` secret for TestPyPI; GitHub Actions supplies the repository `GITHUB_TOKEN` used for tags, release metadata and the release commit. The project-level `poetry.toml` defines the `testpypi` repository URL, while the workflow sets `RELEASE_TEST_PYPI=true`; the release configuration then installs the token under `pypi-token.testpypi` and publishes to that repository rather than production PyPI.

The release operation itself is intentionally small because the version is not entered manually. The deploy job installs the project and Node release tooling and then executes:

```bash
npm install
npx semantic-release
```

During an actual release, the configured semantic-release exec plugin effectively performs the equivalent of:

```bash
poetry version <computed-version>
poetry publish --build --repository testpypi
```

No dedicated release branch is used. `master` is the releasable line, while `development` is the integration branch. Tags use the form `v<major>.<minor>.<patch>`, for example `v2.0.0`, and the GitHub Release is generated automatically from the same semantic-release execution. At the time this section was written, the latest completed project release was **v2.0.0**.

## Choice of the license

AZFlow uses the **Apache License 2.0** for both the source code and the distributed Python package. The license was already part of the course project template and was deliberately retained rather than replaced.

Apache 2.0 is suitable for the project because it is a permissive open-source license: it allows the software to be used, modified and redistributed, including in other systems, while requiring preservation of the relevant license and notices. Its explicit patent grant also provides clearer terms for reuse than a minimal permissive license. Using the same license for source and packaged artefacts avoids introducing different legal conditions for two forms of the same software.

## Choice of the versioning schema

AZFlow uses **Semantic Versioning (SemVer)** in the form `MAJOR.MINOR.PATCH`. This fits a reusable API/package better than date-based versioning because the version communicates the expected compatibility impact of a change.

Version selection is automated from Conventional-Commit-style messages by the semantic-release preset used by the course infrastructure. In the current configuration:

| Commit category | Release effect | Example meaning |
| --- | --- | --- |
| a commit type/scope ending in `!` | **MAJOR** | incompatible or breaking change |
| `feat` | **MINOR** | new backward-compatible capability |
| `chore(api-deps)` | **MINOR** | API dependency update according to the course preset |
| `fix`, `docs`, `perf`, `revert` | **PATCH** | correction, documentation, performance or revert release |
| `chore(core-deps)` | **PATCH** | core dependency update according to the course preset |
| `test`, `ci`, `build`, `style`, `refactor`, general `chore` | no release by themselves | internal change without a published version increment |

The `!` marker takes precedence when a commit introduces a breaking change. For example, the change from `totem_reference` to `totem_id` was released as **v2.0.0** because the public check-in contract changed incompatibly.

There is only one versioned product, so the wheel and source distribution always share the same version. The Git tag, GitHub Release, TestPyPI package, `pyproject.toml` version and generated changelog entry are therefore aligned by the same semantic-release run.

A new release is not created by manually editing the version or creating a tag. Instead, releasable changes are merged to `master`; after CI succeeds, semantic-release analyses all commits since the previous release. If none of them require a release, nothing is published. Otherwise it calculates the highest required SemVer increment, generates the release notes and changelog, builds and publishes the package, creates the `vX.Y.Z` tag and GitHub Release, and commits the generated version/changelog update back to the repository.
