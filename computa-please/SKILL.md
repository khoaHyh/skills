---
name: computa-please
description: Deliver scoped engineering outcomes with proportionate proof and authorized completion.
disable-model-invocation: true
---

# Computa Please

Deliver the requested result through the least process that can prove it. Start with deletion, reuse, or narrowing; add only what the supported outcome still needs.

## Bound The Result

Recover the user’s outcome, explicit decisions, non-goals, success evidence, and authority. Keep this boundary in working context. Plans, examples, tests, and handoffs are means, not permission to add capabilities. If accepted artifacts conflict, surface the specific mismatch rather than silently expanding or dropping requirements.

Resolve facts from repository instructions, the affected path, and existing proof. For issue-backed work, read the issue, comments, and linked decisions; search relevant Slack or Notion context only when a specific intent gap remains. Ask about a decision only when inspection cannot settle it and it changes behavior, a consequential contract or risk, scope, or authority. Recommend an answer through the question tool. Choose routine engineering details yourself; a blocker pauses only the affected work.

For every non-obvious addition, ask: **what concrete failure of the accepted result would removing this cause?** Supported callers, security, and data integrity can justify it; hypothetical future needs cannot. Judge scope against that result, not a line quota or how many PRs could package the extra work.

Before mutation, establish the task-owned checkout and [VCS authority](references/vcs.md). Follow applicable repository instructions; identify the limiting instruction when it prevents the requested completion.

## Route Only What Is Needed

| Request | Route |
| --- | --- |
| Discuss, compare, or plan | Read-only by default. Return the requested decision or proportional plan; persist only when authorized. |
| Implement a clear change | Go directly to [Execution](references/execution.md). No interview, separate spec, or confirmation ritual is required. |
| Feature with unsettled behavior | Use `feature-grill` for decisions blocking this delivery, then resume the already-authorized task. A single decision needs only a direct question. |
| Bug or performance regression | Use `diagnosing-bugs`; reproduce or bound the failure before an authorized fix, then verify the original path. |
| Optimize or search for a solution | Use [Measured Optimization](references/execution.md#measured-optimization) with a baseline, objective, fixed invariants, and stopping condition. |
| Simplify | Use `subtract`; use `scope-prune` for drift in an existing implementation. |
| Review or remediate feedback | Follow the requested review or repository workflow. Report evidenced findings first; use `review-remediation` for the selected feedback set. |
| Get work green, merge-ready, landed, or verified after merge | Use [Finish Loop](references/finish-loop.md) only to the requested boundary. A PR’s existence does not select this route. |

Bounded restacks, publication, and description updates need only their applicable procedure, not an end-to-end delivery cycle. Improve workflow instructions from observed failures; prefer removing a competing rule over adding ceremony.

## Prove And Finish

[Execution](references/execution.md) owns implementation, test selection, UI craft, and verification. For PR-bound work, [Local Review](references/local-review.md) owns the single independent pass and its exemptions. Inspect the complete final diff for necessity as well as defects; passing checks answer neither scope nor mechanism value.

Finish all authorized delivery, carrying same-task permission through fixes and resumes. Standing draft-publication permission is recorded under [Authority](references/vcs.md#authority); it grants neither readiness nor merge. PR bodies follow the repository’s workflow; use `visual-pr` when the user explicitly selects it, against the final diff.

Production effects, including merge-triggered deployment, follow the owning project’s operations contract and explicit authority for the action and target. Verify the actual effect; green CI alone does not establish production delivery.

Use concise diagrams when helpful and `show-me` or Paper for requested visual explanations. Create richer visual artifacts only when requested.

## Keep Context And Ownership Small

Delegate independent retrieval or isolated work when it shortens the critical path; keep coupled implementation with one owner. Give delegates the path, bounded result, write ownership, authority, and required evidence. Use at most two concurrently unless broader parallelism is requested. The primary verifies pivotal claims, integrates, and owns scope and human reporting; a supervised worker returns its result rather than assuming the whole workflow.

At a real context boundary, retain outcome, decisions, authority, compact evidence, blockers, and next action. Persist only for requested artifacts, recovery, or coordination. On pickup, reconcile live checkout and provider state, distinguish inherited claims from observations, and inspect uncertain external effects before retrying them.

Stop when the accepted result has applicable proof and authorized delivery, or report the concrete blocker. Lead with the outcome, checks actually run, missing required evidence, and any human decision. Adjacent improvements remain follow-ups.
