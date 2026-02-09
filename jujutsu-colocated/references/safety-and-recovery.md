# Safety and Recovery

Apply this order whenever a `jj` workflow becomes risky or unclear.

## Safety Baseline

- Inspect before mutation: `jj status`, `jj diff`, `jj log -r "@ | @-"`.
- Prefer reversible commands first.
- Coordinate before touching uncertain/shared history.
- Never mutate `.env` files.

## Forbidden Without Explicit Written Approval

- `jj op restore ...`
- `jj op abandon ...`
- `jj util gc`
- `jj bookmark set --allow-backwards ...`
- `jj abandon <shared-change>`
- `jj bookmark delete <shared-bookmark>`
- destructive Git rollback patterns (`git reset --hard`, `git checkout --`, broad `git restore`, rollback `rm`)

## Recovery Ladder

1. Undo immediate mistake:

```bash
jj undo
```

2. Inspect operation timeline:

```bash
jj op log
jj op show <operation-id>
```

3. Validate view of older state before any restore:

```bash
jj --at-op=<operation-id> status
jj --at-op=<operation-id> log -r "@ | @-"
```

4. Use operation restore only with explicit approval.

## Conflict Handling

List conflicts:

```bash
jj resolve --list
```

Resolve with tool/editor:

```bash
jj resolve
```

After resolving, inspect and continue with intentional commit shaping (split/squash) instead of deleting peers' edits.
