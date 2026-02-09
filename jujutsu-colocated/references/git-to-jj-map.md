# Git to Jujutsu Mental Model

Use this map to avoid applying Git assumptions directly to `jj`.

## Concept Shifts

- Working copy commit `@` is a real commit with history impact.
- Bookmarks replace branch tips as publish pointers.
- Change IDs are stable coordination handles; commit IDs are rewrite-prone.
- Operation log is a first-class recovery mechanism.

## Common Command Mapping

| Git intent | Jujutsu command |
| --- | --- |
| View status | `jj status` |
| View history graph | `jj log` |
| Show diff | `jj diff` |
| Create new work from mainline | `jj new main@origin -m "<type(scope): description>"` |
| Amend current work | `jj describe -m "<type(scope): description>"` + edit files (no staging) |
| Split one mixed commit | `jj split -i` |
| Combine work | `jj squash --from <src> --into <dst>` |
| Rename/move branch pointer | `jj bookmark set <name> -r <rev>` |
| Fetch from remote | `jj git fetch --remote origin` |
| Push specific line of work | `jj git push --bookmark <name> --remote origin` |
| Undo most recent operation | `jj undo` |
| Inspect recovery timeline | `jj op log` |

## Replace Unsafe Git Habits

- Avoid `git add -p` mental model; use `jj split -i` and targeted `jj squash`.
- Avoid destructive hard resets; use operation-aware recovery.
- Avoid force-push reflexes; let `jj` safety checks guide reconciliation.

## Bookmark Guidance

- Create bookmark only when work is ready to share.
- Keep bookmark naming explicit and scoped (feature, fix, chore).
- Push only intended bookmark, not everything:

```bash
jj git push --bookmark <name> --remote origin
```
