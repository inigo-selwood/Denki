# Source Structure

## `main.ts`

Runtime entrypoint; loads configuration, creates runtime dependencies, builds
the HTTP application, starts the server.

## `configuration/`

Environment and runtime configuration parsing. Can read `process.env` -- Other
folders should receive parsed configuration instead of reading environment
directly.

## `domain/`

Owns schemas, inferred types, result builders, and deterministic rollups.
Shouldn't touch Hono, Inngest, Supabase, Mastra, or other infrastructure
libraries.

## `application/`

Coordinates domain types and abstract dependencies. Defines ports such as
repositories and queues, but remains infrastructure agnostic.

## `inbound/`

Translates external requests and events into application calls. `inbound/http`
owns Hono routes and OpenAPI documentation. `inbound/inngest` owns Inngest
served routes and function definitions.

## `infrastructure/`

Talks to external systems and temporary technical implementations.
`infrastructure/database` owns database schema and database client wiring.
`infrastructure/inngest` sends evaluation events to Inngest.
`infrastructure/memory` provides local storage while the persistence contract
is still evolving. `infrastructure/reducto` adapts Reducto document parsing
into the service's normalized evidence ingestion shape.

## `runtime/`

Wires application use cases to concrete infrastructure adapters. Starts
process-level services such as the HTTP server.
