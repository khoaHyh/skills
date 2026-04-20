# Effect Patterns

Use this file when writing or refactoring Effect code. It summarizes the `effect-solutions` house style and the places where upstream docs commonly differ.

## Start With Existing Style

Check the repo before choosing an abstraction. Search for:

- `ServiceMap.Service`
- `Effect.Service`
- `Context.Tag`
- `Effect.fn(`
- `Effect.gen(`
- `Schema.TaggedError`
- `Schema.TaggedErrorClass`
- `Config.schema(`
- `it.effect(`

If the repo already picked a style, stay consistent. If it has no clear style, prefer the defaults below.

## Control Flow

Use `Effect.gen` for inline sequential logic:

```ts
const program = Effect.gen(function* () {
  const config = yield* AppConfig
  const user = yield* loadUser(config.baseUrl)
  return user
})
```

Use `Effect.fn` for reusable effectful functions and service methods. Name the span after the domain action, not the implementation detail.

```ts
const findUser = Effect.fn("Users.findById")(function* (id: UserId) {
  const db = yield* Database
  return yield* db.findUser(id)
})
```

Use the transformer argument when a policy applies to the whole function, for example retries, timeout, or error translation.

## Data Modeling

Prefer `Schema` over ad hoc TypeScript-only types when values cross boundaries.

- Use `Schema.Class` for record-like domain objects.
- Use branded primitives aggressively for IDs and semantically distinct scalars.
- Use `Schema.TaggedClass` plus `Schema.Union` for sum types.
- Use `Schema.fromJsonString` when the boundary is a JSON string.

Example:

```ts
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

class User extends Schema.Class("User")({
  id: UserId,
  email: Schema.String,
}) {}
```

## Errors

Prefer typed expected errors for recoverable failures. Prefer defects for unrecoverable bugs or invariant violations.

- Use `Schema.TaggedErrorClass` in the effect-solutions style.
- Use `Schema.Defect` to wrap unknown errors from external libraries.
- Remember that tagged errors are yieldable inside `Effect.gen`.

Example:

```ts
class UserNotFound extends Schema.TaggedErrorClass("UserNotFound")(
  "UserNotFound",
  { id: UserId },
) {}

const loadUser = Effect.fn("Users.load")(function* (id: UserId) {
  const maybeUser = yield* repo.find(id)
  if (Option.isNone(maybeUser)) {
    yield* new UserNotFound({ id })
  }
  return maybeUser.value
})
```

Use `Effect.catchTag` or `Effect.catchTags` for selective recovery.

## Services And Layers

The `effect-solutions` default is `ServiceMap.Service` plus static layers:

```ts
class Users extends ServiceMap.Service<
  Users,
  { readonly findById: (id: UserId) => Effect.Effect<User, UserNotFound> }
>()("@app/Users") {
  static readonly layer = Layer.effect(
    Users,
    Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient

      const findById = Effect.fn("Users.findById")(function* (id: UserId) {
        const response = yield* http.get(`/users/${id}`)
        return yield* HttpClientResponse.schemaBodyJson(User)(response)
      })

      return Users.of({ findById })
    }),
  )
}
```

Rules:

- Use unique tag identifiers such as `@app/Users`.
- Keep service methods dependency-free when possible; acquire dependencies in the layer.
- Name layer exports predictably: `layer`, `testLayer`, `liveLayer`, `sqliteLayer`, and so on.
- Use `Effect.provide` near the runtime boundary, not in the middle of domain logic.
- Store parameterized layer constructors in constants before reusing them. Layer memoization is by reference identity.

Upstream Effect docs often show `Context.Tag` or `Effect.Service`. Those are valid. Match them when the repo already uses them.

## Promise And Client Boundaries

When a third-party library only exposes `Promise` APIs:

- Use `Effect.tryPromise`.
- Thread the `AbortSignal` when the API supports cancellation.
- Translate unknown failures into typed errors at the boundary.

For very large client surfaces, a service-level `use` wrapper is often cleaner than hand-wrapping every method.

```ts
const use = <A>(
  fn: (client: typeof fs_, signal: AbortSignal) => Promise<A>,
): Effect.Effect<A, FileSystemError> =>
  Effect.tryPromise({
    try: (signal) => fn(fs_, signal),
    catch: (cause) => new FileSystemError({ cause }),
  })
```

## Config

Treat configuration as a service boundary.

- Use `Config.schema` for validated config values.
- Use `Config.redacted` for secrets.
- Expose config through a service with a static `layer`.
- In tests, provide config values directly with `Layer.succeed`.

## Testing

Prefer `@effect/vitest` over manually running effects in plain Vitest tests.

- Use `it.effect` for most Effect tests.
- Use `it.live` only when you need the real runtime instead of `TestClock`.
- Prefer per-test layers so state does not leak.
- Use `it.layer` only when you intentionally want a shared expensive resource.

Example:

```ts
it.effect("retries after time advances", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.sleep("5 seconds").pipe(Effect.as("done"), Effect.forkChild)
    yield* TestClock.adjust("5 seconds")
    expect(yield* Fiber.join(fiber)).toBe("done")
  }),
)
```

## Avoid These Mistakes

- Mixing `ServiceMap.Service` and `Context.Tag` patterns arbitrarily inside one feature.
- Hiding raw `Promise` calls deep in business logic.
- Using plain strings for IDs, emails, URLs, and other domain primitives that deserve brands.
- Calling `Effect.runPromise` inside libraries or mid-stack code. Keep runtime execution at the edge.
- Parsing JSON with `JSON.parse` and then trusting the result without `Schema`.
- Duplicating parameterized layers and accidentally creating multiple pools or clients.
