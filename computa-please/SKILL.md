---
name: computa-please
description: Deliver scoped engineering outcomes with proportionate proof and authorized completion.
disable-model-invocation: true
---

# Computa Please

Deliver the agreed outcome through the least process that can prove it. Prefer deletion, reuse, or narrowing before adding structure.

## Scope

Keep the requested outcome, explicit decisions, exclusions, proof, and authority in working context. Discussion and planning are read-only unless edits are authorized. A clear implementation request needs no separate interview or spec.

Resolve facts from repository instructions, canonical code, existing proof, and linked task context. Choose routine details yourself. Ask through the question tool when an unresolved decision changes behavior, scope, consequential risk, or authority; recommend an answer and continue independent work.

For each non-obvious addition, ask: **what concrete failure of the agreed outcome would removing this cause?** Preserve evidenced caller, data, security, and rollback obligations at their owning boundary. Surface necessary scope expansion before implementing it; splitting extra work into PRs does not justify it.

## Routing

Load only the guidance that changes this task's approach. Let the selected skill or repository contract own its procedure and output format.

| Request | Route |
| --- | --- |
| Unsettled product behavior | `feature-grill` for decisions blocking this delivery; a single decision needs only a direct question. |
| Building, polishing, or reviewing web UI and interactions | `emil-design-eng`. |
| Mobile web or PWA touch, viewport, scroll, or safe-area behavior | `mobile-native`. |
| React Native or Expo motion, gestures, transitions, or haptics | `animate-expo`. |
| Finding places that would benefit from animation | `find-animation-opportunities` for read-only recommendations. |
| Naming a described web motion effect | `animation-vocabulary`. |
| Bug or performance regression | `diagnosing-bugs`; verify the original failing path after an authorized fix. |
| Optimization | Set a baseline, objective, constraints, and stopping condition; measure the actual result. |
| Simplification | `subtract`, or `scope-prune` for implementation drift. |
| New or changed tests | `test-audit`'s authoring bar and the target repository's checks. |
| PR-bound work or requested review | [Review](references/review.md) for reviewer selection and reuse. |
| Existing review feedback | `review-remediation` for the selected feedback set. |
| PR body | `pr-body` against the final diff. |

For UI work, load only the matching guidance and preserve the project's design system and existing dependencies.

Keep focused work in one PR. Split independent changes into separate PRs against the repository's default branch. For reviewable changes that depend on one another, use GitHub Stacks and the [official gh-stack guidance](https://github.com/github/gh-stack/blob/main/skills/gh-stack/SKILL.md). Check installed command help when using it.

## Authority

Before writes, establish the task-owned checkout using `worktrees` and the repository's rules. Preserve unrelated work and stage only task-owned changes.

**Standing grant (Khoa, 2026-10-06):** in `gocustodia/platform`, `gocustodia/infrastructure`, and `gocustodia/trowel`, an implementation or fix request includes scoped additive commits on the task branch (not `main`), push, and opening or updating one draft PR after applicable local verification, including repair of task-caused required checks. Identify the repository by its remote; the grant covers its task worktrees.

Carry same-task grants through fixes and resumes. Other repositories need an existing or task-specific grant. Honor narrower task and repository restrictions; name the conflicting instruction when it blocks delivery. Readiness, review requests, merge, deployment, policy bypasses, destructive changes, history rewrites, unrelated work, and external messages need their own authority. Follow the project's operations contract for production effects, including merge-triggered deployments.

New PRs start as drafts. Establish affected branches before stack mutations; selecting Stacks grants no stack-wide publication or history-rewrite permission.

## Verify And Finish

Exercise the changed behavior through the smallest relevant proof and repository-required checks. Reuse valid evidence until affected inputs change; avoid overlapping checks and repeated reviews. For failures, retain the causal diagnostic and investigate before retrying; stop after two consecutive attempts yield no new evidence. Report blocked or missing proof accurately.

For changed UI, inspect the rendered result and exercise the affected interaction. Distinguish browser or emulation evidence from checks requiring real hardware.

Inspect the complete final diff against the agreed outcome. Finish through the authorized delivery boundary, using repository readiness and CI gates. Before merging, establish the resulting effects and required authority; verify the actual merge and applicable post-merge results against the landed commit. Reconcile uncertain external actions before retrying them.

Report the outcome, proof, and any remaining blocker or decision. A pending action is not a completed delivery.

## Coordination

Delegate independent work when useful, with at most two concurrent subagents unless broader parallelism is requested. Keep coupled implementation, shared VCS state, and verification resources under one owner. Give each delegate its scope, path, authority, and required evidence; the primary integrates and verifies consequential claims.

Persist only for requested artifacts, recovery, or coordination. Keep one current, compact handoff with the outcome, decisions, authority, state, evidence pointers, blockers, and next action. On pickup, reconcile it with live checkout and provider state. Keep secrets, customer data, and raw transcripts out of shared artifacts.
