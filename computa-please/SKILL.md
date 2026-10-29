---
name: computa-please
description: Deliver scoped engineering outcomes with proportionate proof and authorized completion.
disable-model-invocation: true
---

# Computa Please

Start with the next concrete useful outcome and closest existing working path, data, and connection. Inspect source inputs and captures before arranging fresh access or tooling.

## Scope

Keep the requested outcome, explicit decisions, exclusions, proof, and authority in working context. Discussion and planning are read-only unless edits are authorized. A clear implementation request needs no separate interview or spec.

Resolve remaining facts from repository instructions, canonical code, existing proof, and linked context. Choose routine details; ask through the question tool for decisions affecting behavior, scope, consequential risk, or authority, recommending an answer while continuing independent work.

Size complexity for the actual workload and concrete failure modes; synthetic valid bounds are boundary evidence, not expected scale. For each non-obvious addition, ask: **what concrete failure of the agreed outcome would removing this cause?** Preserve evidenced caller, data, security, and rollback obligations at their owning boundary. Surface necessary scope expansion before implementing it; splitting extra work into PRs does not justify it.

## Tools And Access

Prefer an existing authorized structured tool for external-service work. When the capability or connection is unknown, check Executor when available before choosing computer use, arranging new access, or declaring access missing. Read Executor's own `execute` guide via `skills({ name: "execute" })`; search by service and operation, inspect matching schemas, and consult saved connections when needed. Reuse a known suitable path without repeating discovery.

For example, use Executor's connected Tailscale integration for tailnet administration when it supports the requested operation; configuring or troubleshooting the local VPN client is a separate task.

Use computer use for UI-only operations, UI verification, or an evidenced gap in structured tooling. If Executor is absent or lacks the operation, use another authorized existing path. Preserve the intended account and scope across fallbacks; report permission failures rather than routing around them. A connected tool establishes capability, not authority to change state.

## Routing

Load only the guidance that changes this task's approach. Let the selected skill or repository contract own its procedure and output format.

| Request                                                          | Route                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unsettled product behavior                                       | `feature-grill` for decisions blocking this delivery; a single decision needs only a direct question. |
| Building, polishing, or reviewing web UI and interactions        | `emil-design-eng`.                                                                                    |
| Implementing user-visible UI or interaction changes               | `record-verification` before implementation.                                                         |
| Mobile web or PWA touch, viewport, scroll, or safe-area behavior | `mobile-native`.                                                                                      |
| React Native or Expo motion, gestures, transitions, or haptics   | `animate-expo`.                                                                                       |
| Finding places that would benefit from animation                 | `find-animation-opportunities` for read-only recommendations.                                         |
| Naming a described web motion effect                             | `animation-vocabulary`.                                                                               |
| Bug with unclear cause, unsuccessful fix, or performance regression | `diagnosing-bugs`.                                                                                    |
| Optimization                                                     | Set a baseline, objective, constraints, and stopping condition; measure the actual result.            |
| Simplification                                                   | `subtract`, or `scope-prune` for implementation drift.                                                |
| PR-bound work or requested review                                | [Review](references/review.md) for reviewer selection and reuse.                                      |
| Existing review feedback                                         | `review-remediation` for the selected feedback set.                                                   |
| PR body                                                          | `pr-body` against the final diff.                                                                     |
| Stacked PRs or dependent branch work                             | `gh-stack` for GitHub's native Stacks.                                                                |

For UI work, load only the matching guidance and preserve the project's design system and existing dependencies.

For a straightforward bug with a clear cause, reproduce it, make the bounded fix, and recheck the original failing path.

Use Git for repository state and commits, and `gh` for ordinary PRs. Keep focused work in one PR. Split independent changes into separate PRs against the repository's default branch.

## Authority

Before writes, establish the task-owned checkout using `worktrees` and the repository's rules. Preserve unrelated work and stage only task-owned changes.

**Standing grant (Khoa, 2026-10-06):** in `gocustodia/platform`, `gocustodia/infrastructure`, and `gocustodia/trowel`, an implementation or fix request includes scoped additive commits on the task branch (not `main`), push, and opening or updating one draft PR after applicable local verification, including repair of task-caused required checks. Identify the repository by its remote; the grant covers its task worktrees.

Carry same-task grants through fixes and resumes. Other repositories need an existing or task-specific grant. Honor narrower task and repository restrictions; name the conflicting instruction when it blocks delivery. Readiness, review requests, merge, deployment, policy bypasses, destructive changes, history rewrites, unrelated work, and external messages need their own authority. Follow the project's operations contract for production effects, including merge-triggered deployments.

New PRs start as drafts. Establish affected branches, worktree owners, and command effects before stack mutations; selecting Stacks grants no stack-wide publication or history-rewrite permission.

## Verify And Finish

Choose one risk-matched verification plan: smallest behavioral proof plus owning required gates, run once on the stable candidate. Reuse unchanged proof; rerun only evidence invalidated by material changes. CI may supply wider proof where repository policy allows; optional comfort checks are not gates.

Extend existing behavioral coverage where possible; add tests only for meaningful gaps, not implementation mirrors.

Diagnose only failures blocking delivery; reuse a supported working fixture or path where sufficient. Retain the causal diagnostic; after two consecutive attempts yield no new evidence, switch paths or report the blocker. Resume diagnosis only with new evidence.

For changed UI, finish `record-verification` and deliver its evidence with the authorized handoff. Distinguish browser or emulation evidence from checks requiring real hardware.

Inspect the complete final diff against the agreed outcome, then finish through the authorized delivery boundary. Before merging, establish effects and authority; verify the merge and applicable post-merge results against the landed commit. Reconcile uncertain external actions before retrying.

Once proven, finish rather than extending review, polling, or cleanup cycles. If required proof, facts, or authority are missing, report the concrete blocker with the outcome and evidence. A pending action is not completed delivery.

## Coordination

Use delegation, extra review, or artifacts only to resolve a specific uncertainty blocking delivery or satisfy a request or requirement. Limit concurrent subagents to two unless requested otherwise. Keep coupled work and shared resources under one owner; give delegates scope, path, authority, and required evidence, then integrate and verify consequential claims.

Persist only for requested artifacts, recovery, or coordination. Keep one current, compact handoff with the outcome, decisions, authority, state, evidence pointers, blockers, and next action. On pickup, reconcile it with live checkout and provider state. Keep secrets, customer data, and raw transcripts out of shared artifacts.
