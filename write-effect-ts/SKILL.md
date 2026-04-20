---
name: write-effect-ts
description: Write idiomatic Effect TypeScript using Effect.gen, Effect.fn, Schema, services, layers, Config, and @effect/vitest. Use when a repository uses `effect` or `@effect/*`, or when adding, refactoring, debugging, or reviewing Effect code around `ServiceMap.Service`, `Context.Tag`, `Effect.Service`, `Layer`, `Schema`, config, HTTP clients, CLI code, or Effect tests.
---

# Write Effect TS

Write Effect code that matches the repo's existing style, keeps requirements explicit, and verifies API details against current docs before committing to an implementation.

## Read Order

1. Read `references/patterns.md` before editing Effect code.
2. Read `references/doc-map.md` when you need topic-specific docs, upstream confirmation, or ready-made `ctx7` queries.

## Workflow

1. Inspect the repo first. Search for `ServiceMap.Service`, `Effect.Service`, `Context.Tag`, `Effect.fn`, `Effect.gen`, `Schema.TaggedError`, `Schema.TaggedErrorClass`, `Config.schema`, and `it.effect`.
2. Match the dominant local idiom. Do not mix service styles inside the same feature unless the repo already does.
3. If the repo has no strong local style, default to the `effect-solutions` house style summarized in `references/patterns.md`.
4. If `effect-solutions` is available, read the relevant topic before coding:

```bash
effect-solutions list
effect-solutions show basics services-and-layers data-modeling error-handling config testing
```

5. Verify API details with `ctx7` before relying on memory:

```bash
ctx7 library effect
ctx7 docs /effect-ts/effect "services layers schema tagged errors testing"
```

6. Implement the smallest complete change.
7. Validate with the repo's real feedback loop: typecheck, tests, and any Effect-specific checks.

## Default House Style

Unless the repo already established a different style:

- Use `Effect.gen` for inline sequential programs.
- Use `Effect.fn("Name")` for reusable effectful functions and service methods, including nullary methods.
- Model domain data with `Schema.Class`, `Schema.TaggedClass`, `Schema.Union`, and branded primitives.
- Model expected errors with `Schema.TaggedErrorClass`; use `Schema.Defect` when wrapping unknown external errors.
- Prefer `ServiceMap.Service` with static `layer` and `testLayer` exports for service-driven development.
- Keep service methods dependency-free (`R = never`); resolve dependencies in the layer.
- Provide layers once near the application boundary.
- Use `Config.schema` and `Config.redacted` instead of ad hoc parsing.
- Use `@effect/vitest` with `it.effect`, `TestClock`, and per-test layers.

## Style Selection Rules

- If the repo already uses `Context.Tag` or `Effect.Service`, stay consistent with it.
- If the repo already uses `Schema.TaggedError` instead of the class helpers, match that style.
- If the repo already wraps third-party clients with a `use` pattern or `Effect.tryPromise`, extend the existing boundary instead of inventing a new abstraction.
- If an `effect-solutions` example conflicts with current upstream docs, prefer repo consistency first, then confirm the API with `ctx7`, then implement the smallest safe adaptation.

## Non-Negotiable Rules

- Do not scatter `Effect.provide` through business logic; wire dependencies near the edge.
- Do not push service requirements into service method signatures when a layer can resolve them.
- Do not throw raw errors from Effect code when a typed error or defect boundary is appropriate.
- Do not parse untrusted input without `Schema` or `Config`.
- Do not default to `Promise` APIs if an Effect or `@effect/platform` API already exists in the repo.
- Do not share mutable test state across suites unless the test explicitly needs a shared layer.

## Trigger Examples

- `Add a new Effect service for this API client.`
- `Refactor this Promise code to Effect.`
- `Fix the layer wiring in this module.`
- `Write Effect tests for this service.`
- `Model these domain types and errors with Effect Schema.`
- `Set up config loading for this Effect app.`

## Resources

- `references/patterns.md` - effect-solutions-aligned patterns and anti-patterns
- `references/doc-map.md` - topic map, upstream caveats, and `ctx7` queries
