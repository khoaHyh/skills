# Colocated Workflows (`.git` + `.jj`)

Use these playbooks for parallel-agent collaboration in colocated repositories.

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

## 2. Start New Scoped Work

Run:

```bash
jj git fetch --remote origin
jj new main@origin -m "feat(scope): short purpose"
```

If `main@origin` does not resolve in this repo, inspect bookmarks first:

```bash
jj bookmark list
```

Then choose the tracked mainline bookmark explicitly.

## 3. Shape Atomic Changes

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

## 4. Coordinate Across Agents

- Treat uncertain ownership as shared ownership.
- Prefer additive follow-up commits over rewriting others' history.
- Merge intentionally when integrating adjacent work:

```bash
jj new <your-change> <peer-change> -m "chore(integration): merge parallel work"
jj resolve --list
jj resolve
```

## 5. Inspect Before Publish

Run:

```bash
jj status
jj diff
jj log -r "@ | @-"
```

Use bookmarks as publication pointers:

```bash
jj bookmark create <bookmark-name> -r @-
jj git push --bookmark <bookmark-name> --remote origin
```

Notes:

- Current `jj` releases can create remote bookmarks from local bookmarks during push.
- If command behavior looks different from expectations, check local syntax with `jj help <command>` first, then use Context7 for migration/best-practice nuance.

## 6. Reconcile Divergence Safely

If push is rejected or safety checks fail:

```bash
jj git fetch --remote origin
jj bookmark list
jj log -r "remote_bookmarks(remote=origin)..@"
```

Then integrate or move bookmarks intentionally. Do not bypass with backwards bookmark moves (`jj bookmark set --allow-backwards`) or destructive operations unless explicitly approved.
