# Style

This is a style convention guide for Denki's codebase.

## General

- Avoid use of helper functions wherever possible, unless it keeps things DRY.
  When in doubt, only use a helper if that same block of code is more than a
  half-dozen lines long and is used more than once. Prefer instead to use a
  comment line to aid scanning and break up the flow
- Keep module boundaries explicit and boring. Prefer code that is easy to scan
  over code that is clever
- Avoid barrel files until a folder has enough stable exports to justify one

## Python

- Unless indicated otherwise, follow idiomatic structure and naming conventions
- Variables and function signatures should use snake_case
- Constants should appear at the top of a file, and use SCREAMING_CASE
- Functions or variables not intended to be visible outside a given file should
  have an \_underscore_prefix
- Helper functions should appear at the top of a file
- Use numpydoc-style docstrings for all functions
- When an acronym appears inside a PascalCase name, preserve the acronym
  casing. For example, prefer `OCRBlock` to `OcrBlock`
- Use Black for formatting, with a 79-column line limit

## TypeScript

- Unless indicated otherwise, follow idiomatic TypeScript structure and naming
  conventions
- Use ESM modules
- Prefer `type` for object shapes and unions. Use `interface` only when
  declaration merging or class implementation is useful
- Variables and functions should use camelCase
- Types, classes, and schemas should use PascalCase
- Constants should appear at the top of a file, and use SCREAMING_CASE when
  they are true constants rather than local values
- Prefer named exports. Avoid default exports unless a framework requires them
- Keep runtime validation close to external boundaries, such as HTTP requests,
  queue events, environment variables, and model/tool outputs
- Prefer structured results over thrown errors for expected business outcomes.
  Throw for programmer errors, invalid invariants, and infrastructure failures
- Use async functions for I/O boundaries and orchestration code. Keep pure
  domain logic synchronous unless it genuinely needs I/O

## Markdown

- Prefer compact Markdown with clear sections and compact paragraphs
- Avoid filler introductions and prosaic summaries
- Use bullet-point lists only when a real list is required

## YAML

- Use folded scalars with `>-` when splitting commands
- Prefer explicit service-level task definitions over root-level duplication
