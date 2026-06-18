# Agents

Denki AI is an internal auditing service, backed by AI tooling.

The primary function is ingestion of documents "evidence" and criteria
"conditions" which are used to identify and signal discrepancies.

There exist at present two services:

- `/evaluator`: first point of contact for evaluation of evidence against
  conditions.
- `/ingestor`: dedicated service for performing optical character recognition
  (OCR) of evidence images.

There are several further services in development not currently available here.

## Structure

The codebase is organized as a monorepo of microservices, which live in
`/services`.

There may eventually be a `/tools` folder for scripts not designed for
deployment, but rather anything that might be used in development.

There is also a `/database` folder which at present holds Supabase
configuration and migrations, but may be expanded to add support for other
DBMSs in the future.

Some folders you may see repeatedly include:

- `setup`: contains dependency and install/build contract files when tooling
  supports non-root manifests, such as `package.json`, `package-lock.json`,
  `pyproject.toml`, `requirements.txt`, and equivalent language package
  manifests.
- `configuration`: contains development and tool configuration, such as
  formatter preferences, `.env.example`, `tsconfig.json`, linter config, and
  the like. Things useful during development but not intended as source, test
  fixtures, or runtime resources.
- `resources`: contains assets used at runtime (when in source), or during test
  (when in a test subfolder). Things loaded actively in-code to assist with
  primary function.
- `source`: source code-
- `test/unit` and `test/integration`: unit and integration tests. Each service
  should expose matching taskfile entrypoints where the split is useful.

In addition to these folders, at the root of a service you might expect to see:

- `Dockerfile`: Docker configuration
- `.dockerignore`: Docker build context exclusions
- `.gitignore`: local Git exclusions
- package manifests: dependency setup files when required by local tooling
- `Taskfile.yaml`: service-specific tasks

### 12FA

The codebase adheres strictly to 12FA principles. For clarity, that is a
philosophy which aspires to:

- The use of declarative formats for setup automation, minimizing time and cost
  for new developers
- Clean contracts with the underlying OS, aiming for maximum portability
  between execution environments
- Suitability for deployment on serverless platforms
- Minimization of divergence between development and production, in the hopes
  of enabling continuous deployment
- Targeting scalability without significant changes to tooling, architecture,
  or development practice

## Usage

The primary contact surface for developers is implemented using `go-task`

The root `Taskfile.yaml` is merely a wrapper; services own their particular
tasks. Root task options are intentionally small:

| Task    | Purpose                                      |
| ------- | -------------------------------------------- |
| `run`   | Runs the local container stack.              |
| `lint`  | Runs lint checks across services.            |
| `test`  | Runs test suites across services.            |
| `clean` | Removes root-managed generated artifacts.    |

For more granular commands, navigate to the relevant service and run its
taskfile directly.

If a service's taskfile grows unwieldy, it may be divided into smaller files
living under `{service_root}/configuration/task`.

At minimum, a service's taskfile will contain:

| Task               | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `setup`            | Prepares service dependencies and generated state; internal to dependent tasks.  |
| `build`            | Creates and tags the service Docker image; internal to container run tasks.      |
| `debug`            | Runs the service process directly on the host.                                   |
| `run`              | Builds and runs the service container locally.                                   |
| `docs`             | Runs the service and opens API documentation where available.                    |
| `invoke`           | Runs a service command entrypoint with forwarded arguments where available.      |
| `lint`             | Runs service lint and static checks.                                             |
| `format`           | Formats service-owned files.                                                     |
| `test`             | Runs the service test suite.                                                     |
| `test:unit`        | Runs unit tests where the split is useful.                                       |
| `test:integration` | Runs integration tests where the split is useful.                                |
| `deploy`           | Pushes the service container to the relevant cloud provider. _(future)_          |
| `clean`            | Removes generated local artifacts.                                               |

The root taskfile is intended to be as minimal as possible. Its `test` task is
the single entrypoint for running all service tests.

### Environment

Environment shared between services is defined in the root Taskfile. This
includes `ENVIRONMENT`, service ports, and other values common to local
development and testing.

Service-specific taskfiles may define additional env. required only by that
service, such as API keys, tool cache paths, or adapter settings.

Env. wires through taskfiles and is injected into debug processes or Docker
commands at runtime.

In deployment, it's injected via secrets, and `ENVIRONMENT=production` is
expected.

Any service-specific env. requirements are defined in
`{service}/configuration/.env.example`. The actual `.env` file should never be
staged or committed **under any circumstances**.
