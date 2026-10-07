# Worktree And VCS

## Checkout

Before writes, load `worktrees` and `vcs-detect`. Inspect repository instructions, root, branch, status, registered worktrees, and task ownership. Reuse the task’s checkout and preserve all existing work. Read-only investigation needs no new checkout. Local development uses a linked worktree while the canonical checkout stays on `main`; work directly in it only when the user asks. Cloud tasks follow their established isolation recipe.

Bind tools, artifacts, and delegates to the chosen path. One owner controls shared contracts, the index, Git/Graphite mutations, and verification resources. Ask about ambiguous ownership rather than moving or discarding changes.

## Authority

**Owner-approved standing grant (2026-10-06):** in `gocustodia/platform`, `gocustodia/infrastructure`, and `gocustodia/trowel`, an implementation or fix request includes scoped additive commits on the task branch, push, and opening or updating one draft PR after applicable local verification. It includes repair of task-caused required checks and additive updates for the same outcome. Identify the repository from its remote identity, not its directory name; the grant covers its task worktrees too.

Carry this permission through same-task resumes and remediation. Discussion, explicitly local-only work, and narrower task restrictions retain their stated boundary. This grant does not cover direct publication from `main`, readiness, new review requests, merge/auto-merge, deployment, policy waivers, destructive data changes, history rewrites, unrelated work, or external messages.

Other repositories require task-specific authority or an established repository grant for commit, push, and publication. Applicable repository restrictions still govern; if they conflict with the standing grant, report the exact instruction and smallest resolution rather than asking the generic permission question again. The policy here does not edit consumer instructions or synchronize skills.

## Commits And Publication

Inspect the intended diff, including staged, unstaged, untracked, and inherited work, before staging. Stage only task-owned changes. Use additive commits with the repository’s convention, defaulting to `<type>(<scope>): <description>`. Preserve existing commits; amendment and history rewriting need explicit approval. Verify the resulting subjects and file sets before publication.

When Graphite tracks the branch, load `graphite` and use its workflow. Mutate or submit only the current diff unless a stack-wide action was authorized; account for automatic descendant changes. Resolve tracking or remote-update guards from live local, remote, and tracking evidence. A guard override, history rewrite, broader stack mutation, or fallback Git push still needs its specific approval; switching tools does not resolve the guard.

New PRs start as drafts. Mark ready only within an authorized merge-ready or merge delivery; a draft grant alone is insufficient. Follow the repository’s description workflow and the [router’s PR-body rule](../SKILL.md#prove-and-finish).

After uncertain external actions, reconcile the observed branch, PR, or provider state before retrying. On completion, the remote head, base, draft/readiness state, and task-owned diff must match the requested action; report ambiguity instead of claiming success.

## Durable State

Use conversation state by default. For requested persistence, cross-session recovery, or coordination, keep one compact `.computa-please/handoff.md` in the task-owned checkout, or the project’s established equivalent. Retain the original outcome, accepted decisions, authority source, current state, evidence pointers, blockers, and next action. Update that record rather than creating parallel plans or logs. Keep workflow artifacts, secrets, customer data, and raw transcripts out of product commits and PRs.

Existing runtime logs are recovery evidence, not a prerequisite for new work. Preserve their spent-action records and reconcile live effects; do not overwrite them or infer new permission from them. If a caller explicitly retains the legacy runtime, follow its own [tool contract](../scripts/agent-runtime/README.md).
