# Effect Doc Map

Use this file when you need to pick the right docs quickly.

## Decision Ladder

1. Inspect the current repo and match its existing Effect idioms.
2. If `effect-solutions` is available, read the closest topic first.
3. Use `ctx7` to confirm current upstream APIs.
4. Search local Effect source only when the docs still leave ambiguity.

## Topic Map

### Setup And Tooling

- `effect-solutions` topics: `quick-start`, `project-setup`, `tsconfig`
- Official docs: installation, devtools, running effects
- Good queries:

```bash
ctx7 docs /effect-ts/effect "installation Effect language service devtools tsconfig"
ctx7 docs /effect-ts/effect "running effects runtime runPromise runFork runSync"
```

### Sequential Effects And Function Shape

- `effect-solutions` topic: `basics`
- Official docs: using generators, creating effects, guidelines
- Good queries:

```bash
ctx7 docs /effect-ts/effect "Effect.gen generators yield Effect.fn"
```

### Services, Layers, And Requirements

- `effect-solutions` topic: `services-and-layers`
- Official docs: services, layers, layer memoization
- Upstream caveat: official docs often show `Context.Tag` and `Effect.Service`, while `effect-solutions` prefers `ServiceMap.Service`
- Good queries:

```bash
ctx7 docs /effect-ts/effect "services layers Context.Tag Effect.Service Layer memoization"
ctx7 docs /effect-ts/effect "requirements management provide Layer"
```

### Data Modeling

- `effect-solutions` topic: `data-modeling`
- Official docs: schema introduction, classes, branded types, transformations
- Good queries:

```bash
ctx7 docs /effect-ts/effect "Schema.Class branded types TaggedClass Union fromJsonString"
```

### Error Handling

- `effect-solutions` topic: `error-handling`
- Official docs: expected errors, unexpected errors, yieldable errors, matching
- Upstream caveat: official examples often use `Schema.TaggedError`; `effect-solutions` commonly uses `Schema.TaggedErrorClass`
- Good queries:

```bash
ctx7 docs /effect-ts/effect "yieldable errors Schema.TaggedError catchTag catchTags defects"
```

### Config

- `effect-solutions` topic: `config`
- Official docs: configuration, redacted, config providers
- Good queries:

```bash
ctx7 docs /effect-ts/effect "Config schema redacted ConfigProvider"
```

### Testing

- `effect-solutions` topic: `testing`
- Official docs: `@effect/vitest` README, `TestClock`
- Good queries:

```bash
ctx7 docs /effect-ts/effect "@effect/vitest it.effect it.live TestClock"
ctx7 docs /effect-ts/effect "TestClock testing fibers delays"
```

### CLI

- `effect-solutions` topic: `cli`
- Official docs: `@effect/cli` and platform runtime docs
- Good queries:

```bash
ctx7 docs /effect-ts/effect "effect cli Command Argument Flag runMain"
```

### HTTP Clients And Platform Code

- `effect-solutions` topic: `http-clients`
- Official docs: `@effect/platform` HTTP client docs
- Good queries:

```bash
ctx7 docs /effect-ts/effect "HttpClient HttpClientRequest HttpClientResponse schemaBodyJson"
ctx7 docs /effect-ts/effect "platform runtime FileSystem Path Terminal"
```

### Observability

- `effect-solutions` topic: `observability`
- Official docs: logging, tracing, metrics, supervisor
- Good queries:

```bash
ctx7 docs /effect-ts/effect "logging tracing metrics withSpan Effect.fn"
```

### Third-Party Client Wrappers

- `effect-solutions` topic: `use-pattern`
- Official docs: `Effect.tryPromise`, interruption, `AbortSignal`
- Good queries:

```bash
ctx7 docs /effect-ts/effect "tryPromise AbortSignal interruption"
```

## Helpful Local Sources

- If installed, run `effect-solutions show <topic>` for opinionated examples.
- If present, search `~/.local/share/effect-solutions/effect` for real Effect implementations and type definitions.
- Search the current repo before importing a new Effect package. Existing code usually tells you which abstraction family the maintainers prefer.
