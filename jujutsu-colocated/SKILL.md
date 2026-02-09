---
name: jujutsu-colocated
description: Safe, practical workflows for using Jujutsu (`jj`) in colocated repositories (`.git` + `.jj`) and parallel-agent environments. Use when planning, editing, splitting, recovering, coordinating, or publishing changes with `jj`, especially when avoiding destructive history/state operations.
---

# Jujutsu Colocated Workflow

Use this skill to execute `jj`-first workflows safely in repositories where `git` and `jj` coexist.

## Detect VCS First

Run this before any VCS command:

```bash
if jj root &>/dev/null; then echo "jj"
elif git rev-parse --show-toplevel &>/dev/null; then echo "git"
else echo "none"
fi
```

Interpretation:

- `jj`: continue with this skill (also covers colocated repos).
- `git`: stop and report that this is a Git-only repository. Ask the user to colocate before continuing with this skill (for example, run `jj git init --git-repo .` from the repo root, then verify with `jj git colocation status`).
- `none`: stop and report no repository detected.

Default to `jj help <command>` for command syntax to keep context lean. Use `Context7` selectively for nuanced or best-practice questions (for example colocation caveats, safety guidance, and version-migration differences).

In colocated repositories, prefer read-only `git` commands and use `jj` for mutating operations.

## Follow Non-Negotiable Safety Rules

- Treat working copy `@` as a real commit, not a staging area.
- Refer to work using change IDs when coordinating; commit IDs can change after rewrites.
- Use `jj op log` as the recovery source of truth.
- Treat bookmarks as publication pointers, not a current-branch model.
- Never run destructive history/state operations without explicit written approval in-thread.
- Never edit `.env` or environment variable files.
- Never revert or delete other agents' work without coordination.

Forbidden without explicit written approval:

- `jj op restore ...`
- `jj op abandon ...`
- `jj util gc`
- `jj bookmark set --allow-backwards ...`
- `jj abandon <shared-change>`
- `jj bookmark delete <shared-bookmark>`
- destructive Git fallbacks (`git reset --hard`, `git checkout --`, broad `git restore`, rollback `rm`)

## Use Conventional Commit Descriptions

In `jj`, the `-m` value is the change description (commit message equivalent). Require Conventional Commit format:

```text
<type>(<scope>): <description>
```

Allowed types:

- `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Examples:

- `feat(auth): add token refresh flow`
- `fix(sync): avoid duplicate bookmark tracking`
- `chore(integration): merge parallel agent changes`

## Core Workflow

1. Sync first:

```bash
jj git fetch --remote origin
```

2. Start isolated work from mainline:

```bash
jj new main@origin -m "<type(scope): description>"
```

3. Keep one logical concern per change:

```bash
jj split -i
jj squash --into <target-change>
```

4. Inspect before share:

```bash
jj status
jj diff
jj log -r "@ | @-"
```

5. Publish via bookmark pointer:

```bash
jj bookmark create <name> -r @-
jj git push --bookmark <name> --remote origin
```

6. Resolve conflicts intentionally (never by deleting peers' edits):

```bash
jj resolve --list
jj resolve
```

## Recovery Ladder

1. Use `jj undo` for immediate local mistakes.
2. Use `jj op log` and inspect prior states.
3. Use operation-level restore only with explicit approval.

## References

- Colocated playbooks: `references/colocated-workflows.md`
- Git-to-JJ mental model: `references/git-to-jj-map.md`
- Safety and recovery rules: `references/safety-and-recovery.md`
- Parallel multi-agent contract: `references/parallel-agent-contract.md`
