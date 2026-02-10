# Colocated Workflows (`.git` + `.jj`)

Use these playbooks for parallel-agent collaboration in colocated repositories.

For policy and safety commitments, pair this with `parallel-agent-contract.md`.

## 1. Detect Repository Mode

Run:

```bash
jj root
git rev-parse --show-toplevel
jj git colocation status
```

Interpretation:

- Same root for `jj` and `git`: colocated.
- Different roots: non-colocated or nested repo situation; use `-R <repo-root>` explicitly.
- In colocated repos, prefer read-only `git` commands and use `jj` for mutations.

## 2. Allocate Per-Agent Workspace

Use one canonical token for workspace/worktree directories:

```text
<repo>-<agent>-<task>
```

For full naming rules, see `../SKILL.md` ("Workspace and Worktree Naming Convention").

Run:

```bash
jj git fetch --remote origin
jj workspace add --name <repo>-<agent>-<task> --revision main@origin \
  -m "feat(scope): short purpose" ../<repo>-<agent>-<task>
cd ../<repo>-<agent>-<task>
jj workspace list
jj workspace root
```

If you must use `git worktree` in the same repo, keep the same directory token and pass an explicit branch:

```bash
git worktree add -b wip/<agent>/<task> ../<repo>-<agent>-<task> origin/main
```

If `main@origin` does not resolve in this repo, inspect bookmarks first:

```bash
jj bookmark list
```

Then choose the tracked mainline bookmark explicitly.

## 3. Start Additional Scoped Work (Optional)

Run:

```bash
jj new -m "feat(scope): short purpose"
```

## 4. Shape Atomic Changes

Do not rely on path staging habits from Git. Shape changes directly in commits.

Split mixed work:

```bash
jj split -i
```

Move work into the correct change:

```bash
jj squash --from @ --into <target-change-id>
```

Create sibling work when needed:

```bash
jj new --insert-after <change-id> -m "feat(other-scope): message"
```

## 5. Coordinate Across Agents

- Treat uncertain ownership as shared ownership.
- Keep active agents in separate workspaces to avoid working-copy collisions.
- Prefer additive follow-up changes over rewriting others' history.
- Merge intentionally when integrating adjacent work:

```bash
jj new <your-change> <peer-change> -m "chore(integration): merge parallel work"
jj resolve --list
jj resolve
```

## 6. Inspect Before Publish

Run:

```bash
jj status
jj diff
jj log -r "main@origin..@" --reversed --no-graph \
  -T 'change_id.short() ++ " | " ++ description.first_line() ++ "\n"'
```

Publish selected change(s) explicitly:

```bash
# Single PR
jj bookmark set pr/<agent>/<task> -r <change-id>
jj git push --bookmark pr/<agent>/<task> --remote origin

# Stacked PRs
jj bookmark set pr/<agent>/<task>/01 -r <change-id-1>
jj bookmark set pr/<agent>/<task>/02 -r <change-id-2>
jj git push --bookmark pr/<agent>/<task>/01 --bookmark pr/<agent>/<task>/02 --remote origin
```

Notes:

- Current `jj` releases can create remote bookmarks from local bookmarks during push.
- Push only selected bookmarks and reuse stable bookmark names with `jj bookmark set` to limit unnecessary CI reruns.
- If command behavior looks different from expectations, check local syntax with `jj help <command>` first, then use Context7 for migration/best-practice nuance.

## 7. Reconcile Divergence Safely

If push is rejected or safety checks fail:

```bash
jj git fetch --remote origin
jj bookmark list
jj log -r "remote_bookmarks(remote=origin)..@"
```

Then integrate or move bookmarks intentionally. Do not bypass with backwards bookmark moves (`jj bookmark set --allow-backwards`) or destructive operations unless explicitly approved.

If a workspace becomes stale after other operations, refresh it:

```bash
jj workspace update-stale
```

When temporary workspaces are no longer needed, remove them from repo tracking:

```bash
jj workspace list
jj workspace forget <workspace-name>
```
