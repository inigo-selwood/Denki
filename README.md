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

The codebase is a organized as a monorepo of microservices, which live in
`/services`.

There exists a folder `/tools` which holds scripts not designed for deployment,
but rather anything that might be used in development.

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
tasks.

If a service's taskfile grows unwieldy, it may be divided into smaller files
living under `{service_root}/configuration/task`

At minimum, a service's taskfile will contain:

- `debug`: a local run of the service with whatever debug tooling the
  language/environment permits. For TS this might be `npm run dev`, in python
  it could be `uvicorn source.main:app`, and so-on.
- `build`: services are all Dockerised; build will create and tag a latest
  revision of that service. _(future)_ a root `docker-compose.yaml` will be
  added for integration spin-up.
- `run`: running a service boots a new instance of its container; running a
  tool will execute that script.
- `deploy`: _(future)_ deploy will push a service's container to the relevant
  cloud provider.
- `setup`: prepares local dependencies and generated development state needed
  by other tasks.
- `lint` and `format`: each service must provide a point of contact for some
  form of linting/formatting - both for use during development and by GitHub
  workflow action while approving pull requests.
- `test`: runs that service's tests, including unit and integration tests where
  present.
- `clean`: cleans up ephemera.

The root taskfile is intended to be as minimal as possible. Its `test` task is
the single entrypoint for running all service tests.

### Environment

Global environment for development and testing is defined in the root Taskfile.

Env. wires through service-specific taskfiles and is injected into Dockerfiles
at runtime.

In deployment, it's injected via secrets, and `ENVIRONMENT=production` is
expected.

Any service-specific env. requirements are defined in
`{service}/configuration/.env.example`. The actual `.env` file should never be
staged or committed **under any circumstances**.
