---
name: computa-please
description: Builder procedure for scoped implementation, proportionate proof, and authorized handoff.
disable-model-invocation: true
---

# Computa Please

Follow `ground-rules` for scope, authority, proof, and coordination. This skill owns builder procedure, not universal policy.
For named work items or multi-session work, load `work-ledger` first; its Decisions and Authority are accepted context. It owns ledger format, reconciliation, and phase-boundary handoffs.
Before writes, establish the task-owned checkout through `worktrees` and repository rules; preserve unrelated work and stage only task-owned changes. A clear implementation request needs no separate interview or spec.
Follow the harness's external-service/access rules; use computer use for UI-only work or verification. This Mac's compute placement is owned by `local-compute`.

## Routing

Load only guidance that changes this task's approach; the selected skill or repository contract owns its procedure and output format.

| Request | Route |
| --- | --- |
| Unsettled product behavior | `feature-grill`; one decision needs only a direct question. |
| Web UI and interactions | `emil-design-eng`; preserve the design system and dependencies. |
| User-visible UI or interaction changes | `record-verification` before implementation. |
| Mobile web/PWA touch, viewport, scroll, safe area | `mobile-native`. |
| React Native/Expo motion, gestures, transitions, haptics | `animate-expo`. |
| Animation opportunities / naming a described effect | `find-animation-opportunities` / `animation-vocabulary`. |
| Expensive architecture, seam, or pattern decision | [Design](references/design.md); otherwise decide directly or prototype. |
| Flow, protocol, retry, or lifecycle | `statechart`. |
| Small untrusted diff or what it could break | `blast-radius`. |
| Repeated user correction | `correct`. |
| Unclear bug, failed fix, performance regression | `diagnosing-bugs`. |
| Optimization | Set baseline, objective, constraints, stopping condition; measure the result. |
| Simplification / implementation drift | `subtract` / `scope-prune`. |
| PR-bound work or requested review | `review-policy` owns selection, request ownership, deduplication, and reuse. |
| Existing feedback | `review-remediation`. |
| PR body | `pr-body` against the final diff. |
| Stacked PRs or dependent branches | `gh-stack`. |

## Implement And Prove

For a straightforward bug with a clear cause, reproduce it, make the bounded fix, and recheck the original failing path.
Extend existing behavioral coverage for meaningful gaps, not implementation mirrors. CI may supply wider proof where repository policy allows; optional comfort checks are not gates.
Use Git for repository state and commits, and `gh` for ordinary PRs. Keep focused work in one PR; independent changes get separate PRs against the default branch.
Implementation delegates run as `computa` with this skill; grants reach them only through the brief. Return decisions to the owner with a recommendation, and account for every changed file and check.

## Handoff And Finish

New PRs start as drafts. Before stack mutations, establish affected branches, worktree owners, and command effects; selecting Stacks grants no stack-wide publication or history-rewrite permission.
The builder owns review fixes for its PR, including on landing-enabled repos. Finish proof and the PR body, mark your PR ready where landing is enabled, then go idle; never poll reviews or CI. The landing observer wakes the owning builder with findings when reviews finish or CI goes red. Fix the findings, verify affected proof, reply and resolve authorized threads, push additively, then return to idle. The observer requests Greptile; the builder never does.
Merges go only through shippa and the lane; conducta relays `/shippa N` with the approved ready head. Builders neither merge nor enqueue by hand. Repos without landing enabled retain their review/readiness authority and stop at authorized handoff.
For changed UI, finish `record-verification` and attach evidence to the authorized PR or handoff; distinguish browser/emulation proof from real-hardware checks.
Inspect the complete final diff against the agreed outcome. On landing-enabled repos, the observer owns the full [readiness check](scripts/pr-ready-check) and reports ready once reviews are dispositioned and CI is green; the lane owns exact-head landing and delivery observation. Post-merge failures belong to failure routing.
Elsewhere, before reporting a PR delivered, run `scripts/pr-ready-check <pr>`, fix every FAIL, explain WARNs, and stop at handoff. Missing required proof or authority is a blocker, not delivered work.
