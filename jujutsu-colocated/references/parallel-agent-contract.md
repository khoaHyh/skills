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
- Use one workspace per active agent; do not share workspace directories.
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

## Parallel Workspace Workflow

Use one canonical token for workspace/worktree directories:

```text
<repo>-<agent>-<task>
```

For full naming rules, see `../SKILL.md` ("Workspace and Worktree Naming Convention").

- One active agent per workspace path.
- Bootstrap from up-to-date mainline with `jj workspace add ... --revision <mainline> -m "<type(scope): description>"`.
- Create additional changes only when needed (`jj new -m ...`).
- Verify workspace isolation before edits (`jj workspace list`, `jj workspace root`).
- Use explicit integration changes for cross-agent work instead of rewriting peers' changes.
- Resolve conflicts intentionally; never delete peer edits to force resolution.
- If a workspace becomes stale, run `jj workspace update-stale`.

For command-level examples (including optional `git worktree` fallback), use `colocated-workflows.md`.

## Publication and Push Discipline

- Inspect status/diff/log before publishing.
- Publish only selected bookmarks with explicit remote (for example `--remote origin`).
- Reuse stable bookmark names with `jj bookmark set` to limit unnecessary CI reruns.
- Fetch and reconcile first if remote diverged; do not bypass safety checks with backward pushes.

For command-level publish/reconcile flows, use `colocated-workflows.md`.

When integration is complete, retire temporary workspaces:

```bash
jj workspace list
jj workspace forget <workspace-name>
```

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
