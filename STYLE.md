# Style

## TypeScript

Prefer TypeScript for service code.

Use ESM modules.

Keep module boundaries boring and explicit. Export named functions, types, and constants unless a framework requires a default export.

Prefer `type` for object shapes and unions. Use `interface` only when declaration merging or class implementation is useful.

Keep runtime validation close to external boundaries, such as HTTP requests, queue events, environment variables, and LLM/tool outputs.

Prefer structured results over thrown errors for expected business outcomes. Throw for programmer errors, invalid invariants, and infrastructure failures that should be retried or surfaced.

Use async functions for I/O boundaries and orchestration code. Keep pure evaluation logic synchronous unless it genuinely needs I/O.

Avoid barrel files until a folder has enough stable exports to justify one.

Keep file and folder names lowercase with hyphens where needed.
