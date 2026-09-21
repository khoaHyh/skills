# Finish Loop

This runbook supervises delivery of the Task Worktree's diff or an explicitly requested Graphite stack, CI, external review, merge, and post-merge repair. Single-PR scope is the default; for a requested stack merge, read [Graphite Stack Merge](graphite-merge.md).

A run owns one recorded delivery ceiling and one or more delivery cycles. A delivery cycle owns one PR or selected stack goal from Bound through its Authority Boundary. Only an attributable post-merge repair may create another cycle; it inherits the run's delivery ceiling but receives its own review plan, at-most-once actions, frozen feedback set, CI state, and one `review-remediation` invocation.

## Entry Gate

Resolve the delivery ceiling from the user's request and prior context before mutation or external action:

- `stop-before-merge`: complete all agent-owned pre-merge work, mark the PR ready, run final CI, then stop before merge or auto-merge is armed.
- `merge-and-verify`: complete applicable gates, merge, monitor relevant post-merge workflows, and deliver attributable fixes through focused follow-up PRs until green or blocked.

An explicit request to merge, including natural-language or custom question answers, supplies merge authority for the named scope. Ask `How far may this Finish Loop go?` with the two choices only when context leaves the ceiling unresolved, after authorized read-only preparation. Reuse authority already supplied; a closed run supplies no authority for new work. A post-merge repair cycle inherits the active run's ceiling.

### CI Policy

Required CI is a gate by default. Honor an explicit instruction to skip CI or merge without successful per-PR checks: record the waived checks or PR scope and the user's instruction, then continue without waiting for or repairing that waived CI. Unless the user also waives post-merge verification, retain it. A waiver changes every CI gate and completion criterion below to require passing evidence or a recorded waiver; report waived checks as skipped, never green. It does not waive local verification, review, conflicts, permissions, or head/base consistency, nor authorize cancelling runs or changing repository protections. Apply later user instructions to the active runtime state and handoff without restarting the run or requiring an opt-out from this skill.

Use the router's [VCS Actions contract](vcs.md) to establish the Task Worktree before launching the Runtime-Owned Event Log.

## Load

Load only the skills needed by the observed path:

- Follow [Execution](execution.md) for implementation context and risk-matched verification; load its skills only when their conditions apply.
- `autoreview` for the single-pass Local Review.
- `graphite` when Graphite tracks the current branch.
- `fix-merge-conflicts` when synchronization exposes conflicts.
- `fix-ci` for failing required checks.
- `review-remediation` after the delivery cycle's external feedback set has been frozen.

## Runtime-Owned Event Log

After VCS Preflight establishes the Task Worktree, resolve [`scripts/agent-runtime/cli.mjs`](../scripts/agent-runtime/README.md#finish-loop-runtime) from the loaded `computa-please` skill base and use it to launch `.computa-please/run-events.jsonl` in the Task Worktree. Do not assume the consuming repository contains the script. `RunLaunched` records the delivery goal, Task Worktree, branch and base, scope, verifier, terminal predicate, ceiling, review plan, and explicitly authorized external-action kinds. Worktree bootstrap is the sole permitted earlier mutation; perform no repository-content mutation or external action until launch succeeds.

The runtime is the transition authority:

1. Reduce state with `state` before acting, including after pickup or compaction.
2. Append every event through `apply`; never hand-edit the log.
3. Complete only the phase named by current state. Append `PhaseCompleted` with a compact summary and evidence pointers; continue only when the runtime advances the phase.
4. When `PhaseCompleted` emits `compact-context`, retain only the goal, authority, decisions, compact evidence, unresolved risks, and next action. Append `ContextCompacted` after doing so.
5. Compact command results through `compact-check`, then append `CheckRecorded`. Keep full output behind its pointer.
6. Append `HumanRequested` before contacting a person. It must name the decision, recommendation, alternatives and consequences, and resume event. Resume only with the matching `HumanResponded` event. When the answer changes delivery authority, append `AuthorityUpdated` with the answer's source reference before relying on it.
7. Before a runtime-guarded action such as commit, push, publication, review mutation, workflow rerun, readiness, or merge, append `ExternalActionRequested` with a stable action key, target, and payload hash. Execute only the `execute-external-action` effect returned by that call, then append `ExternalActionObserved`. The requested event is durably flushed before the effect is emitted; a failed or ambiguous action remains spent and cannot be replayed.
8. Append `RunBlocked` with the required resume event for a concrete blocker. Resume only when changed evidence supports the matching `RunResumed` event.
9. Start an attributable post-merge repair only with `RepairCycleStarted` during post-merge verification. Its progress fingerprint drives the no-progress guard and returns the runtime to Bound with inherited authority.

Keep detailed design decisions, Review Receipts, frozen feedback payloads, provider identifiers, CI observations, and post-merge watch results in `handoff.md`, referenced from compact phase evidence. On pickup, reduce the event log, reconcile referenced live state, and trust observed provider state except for spent external actions and frozen feedback. The runtime controls what may happen next; the handoff explains why.

## State Machine

### 1. Bound

1. Confirm the recorded Entry Gate answer. A post-merge repair cycle records its inherited `merge-and-verify` ceiling instead of reopening the question.
2. Confirm an accepted spec, a completed change with a concrete delivery goal, or a concrete existing PR goal.
3. Verify one active run owner, the Task Worktree path, and its diff, branch, PR, required checks, and Graphite parent when tracked. If exclusive ownership cannot be established, stop before any external action.
4. Name the allowed files or behavioral slice, verifier, external actions, blockers, and review plan. A ready PR requires `existing-only`, `request-once`, or an explicit `skip`; `request-once` names each authorized request action, the reviewer selectors it covers, its mechanism, and an absolute result deadline. Include a quota-limited manual reviewer only for a named unresolved risk and a stable intended review head.
5. For `merge-and-verify`, name the protected target branch and post-merge watch requirements: workflow IDs or names, triggers, expected commit lineage or causal run IDs, discovery deadline, terminal deadline, and accepted terminal conclusions.
6. Stop for unresolved product, public API, production behavior, auth, security, secrets, money, deletion, deploy, ownership, or scope decisions.

Completion: the goal, blast radius, verifier, PR target, review plan, delivery ceiling, applicable post-merge predicate, and authorization are recorded with no unresolved decision fork.

### 2. Synchronized

1. Use the Git or Graphite workflow established by the VCS Actions preflight.
2. Inspect enough Graphite context to identify the current diff's intended parent and base. For an authorized stack merge, use the selected chain from [Graphite Stack Merge](graphite-merge.md); otherwise keep scope to the current diff.
3. If the intended parent has changed, synchronize within the authorized scope before editing. Ask only if the required operation would mutate a diff outside that scope.
4. Resolve mechanical conflicts with `fix-merge-conflicts`; stop when resolution requires product intent or changes outside the declared slice.
5. Reinspect the current diff against its intended parent.

Completion: the current branch has the intended base, no unresolved conflicts, and no accidental changes outside scope.

### 3. Implemented

1. For an accepted spec, execute Implement one tracer-bullet slice at a time. For a completed change or existing PR, diagnose only the observed residue.
2. Use the router's [Delegation](../SKILL.md#delegation) guidance for bounded independent work.
3. Before each additive commit, inspect the diff and form its Conventional Commit subject under the VCS Actions contract. A commit is not a verification checkpoint; run a focused check only for a live uncertainty or changed behavioral seam.
4. Before Local Review, record the candidate commit and tree and bind focused behavioral Proof to those exact bytes. Refresh only checks whose relevant inputs changed; leave the one final basic-verification checkpoint until Local Review disposition is complete.
5. Append implementation decisions and detailed verification evidence to the handoff; reference their compact form from the phase event.

Completion: the intended behavior and focused behavioral Proof are complete, the diff remains within the accepted slice, every agent-authored commit has a verified Conventional Commit subject, and broad basic verification has not been redundantly spent before Local Review.

### 4. Local Review

1. Follow [Local Review](local-review.md) against the complete committed candidate, spending at most one provider pass for the delivery cycle. For new work, finish its disposition and final basic-verification checkpoint before draft publication. For an existing PR, review the current semantic diff before readiness or the Human Gate when no valid Review Receipt covers it.
2. Append its Review Receipt and resulting verified commit to the handoff; reference it from the phase event.

Completion: the Review Receipt is complete, every actionable finding is fixed or rejected with evidence, the resulting local diff is committed, and the single final basic-verification checkpoint is recorded.

### 5. Published

1. Publish through the workflow established by [VCS Actions](vcs.md#branches-and-publication): submit the current Graphite diff, or push the current branch for a Git workflow. Follow that contract's guard-resolution and fallback approval rules. Do not use stack-wide submission.
2. Create or update the PR description through `visual-pr`.
3. Create or retain the PR as a draft and record the pushed SHA before monitoring checks.

Completion: the draft PR points at the recorded SHA, targets the intended parent or base, and `visual-pr` confirms the description update.

### 6. Collect External Review and Monitor CI

Immediately after publication and before waiting for CI, execute the fixed review plan:

1. Mark the draft PR ready under the recorded delivery ceiling. When readiness is a named automatic-review request action, request it through the runtime before the transition and treat that transition as its sole request attempt.
2. Resolve each reviewer selector against the provider's current review surfaces. A selector may name one reviewer, several reviewers, or all current external feedback.
3. Discover submitted reviews, review bodies, inline comments, issue comments, check runs, annotations, or equivalent provider objects relevant to those selectors.
4. Apply the plan's provider-specific attribution and positive completion evidence. Author identity alone, progress notices, eligibility notices, duplicate summaries, and other artifacts without completed feedback do not qualify.
5. For `existing-only`, record completed results or `no-existing-feedback` separately for every configured reviewer selector. Treat an `all current external feedback` wildcard as one selector.
6. For `request-once`, reuse attributable completed results. Execute each unspent request action required by the fixed plan at most once; one action may cover one or several reviewer selectors. Append its action ID, covered selectors, `request-attempted: true`, timestamp, and expected revision before invoking its documented mechanism.
7. For `skip`, record the explicit reason and perform no review action.

Then monitor required checks while any requested reviews run in parallel:

1. Preserve each recorded review disposition. A named request action is attempted at most once during the delivery cycle, including after CI fixes, timeouts, ambiguous delivery, context recovery, or a new pushed SHA.
2. If an attributable check fails, invoke `fix-ci`, apply the smallest root-cause fix, refresh only affected local Proof, create an additive commit, publish, record the new SHA, and wait again without rerunning the local aggregate, Autoreview, or review request.
3. Retain feedback that targets an earlier SHA; `review-remediation` will compare every finding with the current diff.
4. Treat external outages and unavailable required infrastructure as blockers.
5. Stop for no-progress when two consecutive CI-fix iterations for the same failure produce no new evidence, diagnosis, code change, reviewer state, or check-state change. Passive pending states follow their recorded or provider deadline and do not count as iterations.

Completion: the PR is ready, every required check is green for the current recorded SHA, and every configured reviewer selector is represented by completed artifacts, `no-existing-feedback`, explicit `skip`, or one recorded pending request. Requested feedback need not have arrived yet.

### 7. Remediate Review Feedback

Use the review plan and dispositions fixed before the initial CI wait:

1. For explicit `skip`, or when every `existing-only` selector has `no-existing-feedback`, skip to Final CI.
2. For `request-once`, wait for every configured reviewer selector to produce an attributable completed result until its recorded absolute deadline. At the deadline, an absent or ambiguous result is a blocker and every covering request action remains spent.
3. Build one feedback set from every claim, requested change, question, and informational item requiring acknowledgement in the completed results. Freeze each item's stable ID or URL, reviewer, delivery surface, body, and reviewed SHA or observed timestamp in the handoff, then reference that payload from phase evidence. Record completed results with zero feedback items as `completed-no-feedback`.
4. Treat the frozen handoff payload as the source of truth on recovery. A live edit to an object with the same ID does not change the finding under remediation; re-fetch only to observe delivery, deletion, and addressed state.
5. Run exactly one `review-remediation` pass against the frozen records. Complete classification, primary-source research, minimum, durable, robust implementation, and verification, but defer provider replies and addressed-state changes until the remediation is published.
6. Treat every blocked item as a Finish Loop blocker. Scores, severity summaries, and approval labels remain metadata.
7. When files changed, create an additive remediation commit, publish it, confirm the PR head contains it, and record the new SHA.
8. After publication, complete `review-remediation` responses and provider-native addressed-state changes through per-item runtime external actions. Attempt each once and record the observed result. An ambiguous attempt is a blocker rather than permission to replay it. A deleted item receives terminal `delivery-unavailable: deleted` status instead of a reply or state mutation. When no files changed, respond after verification and classification.
9. Treat feedback arriving after the set freezes as a separate run. Never transition back to this state.

Completion: the plan was explicitly skipped; every `existing-only` selector had `no-existing-feedback`; or every selector has a terminal disposition, every completed result is represented by frozen items or `completed-no-feedback`, every item is accounted for with no blocker, and changed remediation was published before its response or addressed-state update.

### 8. Final CI

Wait for every required check on the final recorded SHA. Remediate attributable failures through the CI loop without changing the review plan or frozen set and without returning to Remediate Review Feedback. Refresh the PR description from the final diff through `visual-pr`, then reconfirm that the PR is conflict-free and points at that SHA.

Completion: required CI is green for the final SHA, `visual-pr` confirms the refreshed description, the PR is conflict-free and ready for delivery, and Remediate Review Feedback remains complete.

### 9. Authority Boundary

1. For `stop-before-merge`, record `merge-ready`, proceed to Human Gate, and perform no merge or auto-merge action.
2. For `merge-and-verify`, reconfirm that the PR still points at the final-CI SHA, targets the recorded base, is conflict-free, and has complete review and CI gates. Use the provider's expected-head precondition when available.
3. Freeze the final post-merge watch plan against the current workflow configuration and expected merge lineage before any merge action.
4. For single-PR scope, stop if the PR targets an unmerged Graphite parent or merging would mutate an unowned diff. For an authorized stack, use [Graphite Stack Merge](graphite-merge.md) for merge selection, execution, and reconciliation instead of the single-PR merge procedure in steps 5 through 7.
5. Record and attempt the repository's normal merge mechanism. An accepted, queued, pending, or ambiguous normal action is not permission for admin bypass; reconcile or wait.
6. Admin bypass is authorized at most once for that head only when the provider conclusively rejects normal merge and live state names branch protection as the sole remaining blocker. A recorded CI waiver permits bypass of the waived checks. Unwaived CI, unresolved frozen feedback, conflicts, stale head or base, outages, missing permission, and unowned diffs remain blockers.
7. Treat every ambiguous merge attempt as spent. Reconcile live PR and target-branch state without replaying it. Record the merged commit and time only after the provider reports merged and the target branch contains the result.
8. `merge-and-verify` does not authorize deploy approval, release, data migration, customer communication, destructive rollback, or history rewriting.

Completion: `stop-before-merge` is recorded with no merge action, or `merge-and-verify` has an observed merged commit on the intended target branch.

### 10. Post-Merge Verification

Run this state only for `merge-and-verify`:

1. Discover runs from the frozen watch plan by workflow identity, target branch, merged commit lineage, and causal run IDs. Squash or rebase merges may require the observed merge commit rather than the former PR head.
2. Wait through the discovery and terminal deadlines. Green means every expected relevant run for the latest merged cycle reaches an accepted terminal conclusion. An expected run that never appears is a blocker, not success. If no applicable post-merge workflow exists, record `none-configured` from repository and provider evidence and verify the target branch contains the merged result.
3. Classify every failure from its exact logs and changed path. Temporal proximity alone is not attribution. Retry only a proven flake or infrastructure failure under the provider's safe retry policy.
4. For a failure attributable to the landed change, append `RepairCycleStarted` and create a focused follow-up cycle from the current protected target branch. Inherit `merge-and-verify` and the review plan kind and selectors, but give the new PR fresh per-cycle request actions, deadlines, frozen feedback, CI state, and merge actions. Execute states 1 through 9 for that cycle, then return here for its merged result.
5. Keep the run's no-progress counter across cycles. Stop after two consecutive repair cycles that do not change the failure evidence, root-cause diagnosis, or terminal workflow state; code churn alone is not progress. Stop sooner for an external blocker or a real user decision.
6. A repair is a new PR, never a direct target-branch edit, force-push, or history rewrite.

Completion: every expected relevant post-merge workflow is green for the latest merged cycle, or the run is blocked by a named no-progress condition, external dependency, missing evidence, or user decision.

### 11. Human Gate

Append the terminal state with every cycle and PR URL, the delivery ceiling, final PR or merged SHA, merge and admin-bypass outcomes, Review Receipt, local verification, required CI, review plan, per-selector dispositions, frozen feedback sets, addressed findings, post-merge workflow results, follow-up repairs, and any residual risk. In the user-facing message, report the relevant PR URLs and final SHA, whether review, required checks, merge, and post-merge verification succeeded, and only unresolved findings, risk, or human action. Stop and wait for the user.
