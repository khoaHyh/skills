# Parallel Agent Contract (`jj`)

Use this contract when multiple autonomous agents collaborate in the same repository.

## File Safety

- Delete obsolete files only when your own changes make them irrelevant.
- Ask before deleting files only to silence local lint/type/test failures.
- Never edit `.env` or environment variable files.
- Coordinate before removing, rewriting, or abandoning in-progress work from other agents.
- Move/rename/restore files when it preserves intent and traceability.
- Never run destructive history/state operations without explicit written instruction.

## Jujutsu Safety Model

- Treat working copy `@` as a real commit.
- Refer to shared work using change IDs.
- Use `jj op log` as recovery source of truth.
- Treat bookmarks as publication pointers, not active-branch state.

## Forbidden Without Explicit Written Approval

- `jj op restore ...`
- `jj op abandon ...`
- `jj util gc`
- `jj bookmark set --allow-backwards ...`
- `jj abandon <shared-change>`
- `jj bookmark delete <shared-bookmark>`
- direct destructive Git fallback (`git reset --hard`, `git checkout --`, broad `git restore`, rollback `rm`)

## Revert and Restore Rules

- Do not use `jj restore` to revert files you did not author without coordination.
- Recover your own mistakes in this order:
  1. `jj undo`
  2. `jj op log` + targeted recovery
  3. `jj op restore` only with explicit approval

## Parallel Workflow

Start isolated work from up-to-date mainline:

```bash
jj git fetch
jj new main@origin -m "<type(scope): description>"
```

Keep one logical concern per change. Split mixed changes before sharing:

```bash
jj split -i
jj squash --into <target>
```

Use explicit integration commits for cross-agent work instead of rewriting peers' changes.

Resolve conflicts; do not delete peers' edits to make them disappear:

```bash
jj resolve
```

## Publication and Push Discipline

Inspect before publish:

```bash
jj status
jj diff
jj log -r "@ | @-"
```

Use bookmark pointers for shared work:

```bash
jj bookmark create <name> -r @-
jj git push --bookmark <name>
```

Fetch and reconcile first if remote diverged. Do not bypass safety checks with backward pushes.

## Atomicity

- Keep commits atomic.
- Shape atomic commits with split/squash/move operations instead of path staging habits.
- Do not bundle unrelated edits into one shared change.

## Shell and Automation Hygiene

- Quote paths containing brackets, parentheses, or spaces.
- Use explicit Conventional Commit descriptions (`-m`) in non-interactive automation.
- Avoid interactive editors in automation; prefer explicit deterministic flags.

## Coordination

- Stop and coordinate if command results indicate overlapping active work.
- Treat uncertain shared ownership as shared until proven otherwise.
- Prefer additive follow-up changes over history-destructive rewrites.
