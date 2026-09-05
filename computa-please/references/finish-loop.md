# Finish Loop

This runbook is the bounded supervisor around Implement, the Task Worktree and diff, its PR, CI, one frozen set of external review feedback per delivery cycle, and an optional merge and post-merge repair loop. When Graphite tracks the current branch, use its parent and stack position as context without taking ownership of the stack.

A run owns one Entry Gate choice and one or more delivery cycles. A delivery cycle owns one PR goal from Bound through its Authority Boundary. Only an attributable post-merge repair may create another cycle; it inherits the run's delivery ceiling but receives its own review plan, at-most-once actions, frozen feedback set, CI state, and one `review-remediation` invocation.

## Entry Gate

For every fresh Finish Loop run, before worktree bootstrap, persistence, polling, mutation, or external action, use the environment's question tool to ask `How far may this Finish Loop go?` with exactly these choices:

- `stop-before-merge`: complete all agent-owned pre-merge work, mark the PR ready, run final CI, then stop before merge or auto-merge is armed.
- `merge-and-verify`: complete the same gates, then merge; use admin bypass only when branch protection is the sole remaining blocker, monitor the relevant post-merge workflows, and deliver attributable fixes through focused follow-up PRs until green or blocked.

Explicit prose such as `ship it`, a standing preference, or a custom answer does not substitute for one of these tool choices. If the question tool is unavailable or neither choice is selected, stop. A pickup of the same nonterminal ledger entry reuses its recorded answer; a closed run requires a new question. A post-merge repair cycle remains inside the same run and inherits `merge-and-verify` without another question.

Use the router's [VCS Actions contract](vcs.md) to establish the Task Worktree before initializing the Run Ledger.

## Load

Load only the skills needed by the observed path:

- Follow [Execution](execution.md) for implementation context and risk-matched verification; load its skills only when their conditions apply.
- `autoreview` for Local Review; `thermo-nuclear-code-quality-review` only when its structural exception is selected.
- `graphite` when Graphite tracks the current branch.
- `fix-merge-conflicts` when synchronization exposes conflicts.
- `fix-ci` for failing required checks.
- `review-remediation` after the delivery cycle's external feedback set has been frozen.

## Run Ledger

After VCS Preflight establishes the Task Worktree, create `.computa-please/` and `handoff.md` when absent, then append the run entry below. Worktree bootstrap is the sole permitted earlier mutation; perform no repository-content mutation or external action until the entry exists:

- Run identifier, active owner, current state, Entry Gate answer and timestamps, active cycle, terminal predicate, no-progress counter, and terminal reason.
- Accepted spec path, completed-change delivery goal, or existing PR goal.
- PR, base branch, current branch, Graphite parent when tracked, and VCS workflow.
- Initial and current commit SHA, additive commits created by the run, and any amend exception reason.
- Review Receipt: base, reviewed target commit and tree, selected priority, command outcome, candidate dispositions, remediation commit, verification, stale reason, and remaining actionable finding count.
- CI state and the SHA it describes.
- PR additions plus deletions.
- Review plan: `existing-only`, `request-once`, or explicit `skip`; reviewer selectors; delivery surfaces; expected revision or time window; completion evidence; named request actions and the selectors each covers; and an absolute result deadline for `request-once`.
- Per-selector disposition, request-action attempts and times, completed artifact identifiers, frozen feedback payload, remaining actionable count, and per-item response or addressed-state action attempts.
- For `merge-and-verify`, the per-cycle expected head and base, merge mechanism and attempts, admin-bypass evidence and attempt, merged SHA and time, and post-merge workflow watch plan and results.
- An append-only external-action journal. Each entry records a stable action key, cycle, action type, target object, expected head or revision, exact payload or payload hash, prerequisite snapshot, attempted time, actor or tool, provider action ID, observed result, reconciliation result, and spent status.

Update the entry before every state transition. Before every external action, append its journal entry with `spent: true`, then act. Key review requests by cycle and named request action rather than SHA; key replies and addressed-state changes by frozen feedback ID; key PR creation by cycle; key normal or admin merge by cycle and expected head; key workflow reruns by provider run ID; and key pushes by commit SHA. A new action after a terminal failure requires a recorded changed precondition.

On pickup, reconcile the ledger with live state and trust observed state except for recorded external-action attempts and the frozen feedback payload. Every ambiguous attempt remains spent and may be reconciled but not replayed. The recorded IDs, authors, bodies, source surfaces, and revision or timestamps remain authoritative after a feedback set freezes; live state can update only delivery and addressed status.

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
2. Inspect enough Graphite context to identify the current diff's intended parent and base. Do not switch to, edit, submit, or otherwise advance sibling diffs.
3. If the current diff's parent has changed, synchronize only the current diff before editing. If the required Graphite operation would mutate another diff, stop and ask the user.
4. Resolve mechanical conflicts with `fix-merge-conflicts`; stop when resolution requires product intent or changes outside the declared slice.
5. Reinspect the current diff against its intended parent.

Completion: the current branch has the intended base, no unresolved conflicts, and no accidental changes outside scope.

### 3. Implemented

1. For an accepted spec, execute Implement one tracer-bullet slice at a time. For a completed change or existing PR, diagnose only the observed residue.
2. Use the router's [Delegation](../SKILL.md#delegation) guidance for bounded independent work.
3. Before each additive commit, inspect the diff, form its Conventional Commit subject under the VCS Actions contract, and run focused checks affected by that slice. Satisfy the [Execution Gate](execution.md#execution-gate) against the complete candidate before first publication and final handoff; reuse passing evidence when its relevant inputs are unchanged.
4. Before Local Review, record the candidate commit and tree and bind the cached Proof to those exact bytes. Changed implementation bytes make prior Proof stale.
5. Append implementation decisions and verification evidence to the ledger.

Completion: the intended behavior is implemented, local checks pass, the diff remains within the accepted slice, and every agent-authored commit has a verified Conventional Commit subject.

### 4. Local Review

1. Follow [Local Review](local-review.md) against the complete committed candidate. For new work, finish this state before draft publication. For an existing PR, review the current semantic diff before readiness or the Human Gate when no valid Review Receipt covers it.
2. Append its Review Receipt and resulting verified commit to the ledger.

Completion: the Review Receipt is complete, every actionable finding is fixed or rejected with evidence, and the resulting local diff is committed and verified.

### 5. Published

1. Submit only the current diff with the repository-supported Graphite command, or push the current Git branch. Do not use stack-wide submission.
2. Create or update the PR description by following [the PR Description contract](pr-description.md) through **Verify**.
3. Create or retain the PR as a draft and record the pushed SHA before monitoring checks.

Completion: the draft PR points at the recorded SHA, targets the intended parent or base, and `check-pr-body` exits 0 on that description.

### 6. Collect External Review and Monitor CI

Immediately after publication and before waiting for CI, execute the fixed review plan:

1. Mark the draft PR ready under the recorded delivery ceiling. When readiness is a named automatic-review request action, append its action journal entry before the transition and treat that transition as its sole request attempt.
2. Resolve each reviewer selector against the provider's current review surfaces. A selector may name one reviewer, several reviewers, or all current external feedback.
3. Discover submitted reviews, review bodies, inline comments, issue comments, check runs, annotations, or equivalent provider objects relevant to those selectors.
4. Apply the plan's provider-specific attribution and positive completion evidence. Author identity alone, progress notices, eligibility notices, duplicate summaries, and other artifacts without completed feedback do not qualify.
5. For `existing-only`, record completed results or `no-existing-feedback` separately for every configured reviewer selector. Treat an `all current external feedback` wildcard as one selector.
6. For `request-once`, reuse attributable completed results. Execute each unspent request action required by the fixed plan at most once; one action may cover one or several reviewer selectors. Append its action ID, covered selectors, `request-attempted: true`, timestamp, and expected revision before invoking its documented mechanism.
7. For `skip`, record the explicit reason and perform no review action.

Then monitor required checks while any requested reviews run in parallel:

1. Preserve each recorded review disposition. A named request action is attempted at most once during the delivery cycle, including after CI fixes, timeouts, ambiguous delivery, context recovery, or a new pushed SHA.
2. If an attributable check fails, invoke `fix-ci`, apply the smallest root-cause fix, run risk-matched local verification, create an additive commit, publish, record the new SHA, and wait again without changing the review plan or request attempts.
3. Retain feedback that targets an earlier SHA; `review-remediation` will compare every finding with the current diff.
4. Treat external outages and unavailable required infrastructure as blockers.
5. Stop for no-progress when two consecutive CI-fix iterations for the same failure produce no new evidence, diagnosis, code change, reviewer state, or check-state change. Passive pending states follow their recorded or provider deadline and do not count as iterations.

Completion: the PR is ready, every required check is green for the current recorded SHA, and every configured reviewer selector is represented by completed artifacts, `no-existing-feedback`, explicit `skip`, or one recorded pending request. Requested feedback need not have arrived yet.

### 7. Remediate Review Feedback

Use the review plan and dispositions fixed before the initial CI wait:

1. For explicit `skip`, or when every `existing-only` selector has `no-existing-feedback`, skip to Final CI.
2. For `request-once`, wait for every configured reviewer selector to produce an attributable completed result until its recorded absolute deadline. At the deadline, an absent or ambiguous result is a blocker and every covering request action remains spent.
3. Build one feedback set from every claim, requested change, question, and informational item requiring acknowledgement in the completed results. Freeze each item's stable ID or URL, reviewer, delivery surface, body, and reviewed SHA or observed timestamp in the ledger. Record completed results with zero feedback items as `completed-no-feedback`.
4. Treat the frozen ledger payload as the source of truth on recovery. A live edit to an object with the same ID does not change the finding under remediation; re-fetch only to observe delivery, deletion, and addressed state.
5. Run exactly one `review-remediation` pass against the frozen records. Complete classification, primary-source research, minimum, durable, robust implementation, and verification, but defer provider replies and addressed-state changes until the remediation is published.
6. Treat every blocked item as a Finish Loop blocker. Scores, severity summaries, and approval labels remain metadata.
7. When files changed, create an additive remediation commit, publish it, confirm the PR head contains it, and record the new SHA.
8. After publication, complete `review-remediation` responses and provider-native addressed-state changes through per-item external-action journal entries. Attempt each once and record the observed result. An ambiguous attempt is a blocker rather than permission to replay it. A deleted item receives terminal `delivery-unavailable: deleted` status instead of a reply or state mutation. When no files changed, respond after verification and classification.
9. Treat feedback arriving after the set freezes as a separate run. Never transition back to this state.

Completion: the plan was explicitly skipped; every `existing-only` selector had `no-existing-feedback`; or every selector has a terminal disposition, every completed result is represented by frozen items or `completed-no-feedback`, every item is accounted for with no blocker, and changed remediation was published before its response or addressed-state update.

### 8. Final CI

Wait for every required check on the final recorded SHA. Remediate attributable failures through the CI loop without changing the review plan or frozen set and without returning to Remediate Review Feedback. Refresh the PR description from the final diff using [the PR Description contract](pr-description.md) through **Verify**, then reconfirm that the PR is conflict-free and points at that SHA.

Completion: required CI is green for the final SHA, `check-pr-body` exits 0 on the final description, the PR is conflict-free and ready for delivery, and Remediate Review Feedback remains complete.

### 9. Authority Boundary

1. For `stop-before-merge`, record `merge-ready`, proceed to Human Gate, and perform no merge or auto-merge action.
2. For `merge-and-verify`, reconfirm that the PR still points at the final-CI SHA, targets the recorded base, is conflict-free, and has complete review and CI gates. Use the provider's expected-head precondition when available.
3. Freeze the final post-merge watch plan against the current workflow configuration and expected merge lineage before any merge action.
4. Stop if the PR targets an unmerged Graphite parent or merging would mutate a sibling diff or stack topology. The Finish Loop owns only its current diff.
5. Record and attempt the repository's normal merge mechanism. An accepted, queued, pending, or ambiguous normal action is not permission for admin bypass; reconcile or wait.
6. Admin bypass is authorized at most once for that head only when the provider conclusively rejects normal merge and live state names branch protection as the sole remaining blocker. It never bypasses failed or pending CI, unresolved frozen feedback, a conflict, stale head or base, an outage, missing permission, or an unowned stack.
7. Treat every ambiguous merge attempt as spent. Reconcile live PR and target-branch state without replaying it. Record the merged commit and time only after the provider reports merged and the target branch contains the result.
8. `merge-and-verify` does not authorize deploy approval, release, data migration, customer communication, destructive rollback, or history rewriting.

Completion: `stop-before-merge` is recorded with no merge action, or `merge-and-verify` has an observed merged commit on the intended target branch.

### 10. Post-Merge Verification

Run this state only for `merge-and-verify`:

1. Discover runs from the frozen watch plan by workflow identity, target branch, merged commit lineage, and causal run IDs. Squash or rebase merges may require the observed merge commit rather than the former PR head.
2. Wait through the discovery and terminal deadlines. Green means every expected relevant run for the latest merged cycle reaches an accepted terminal conclusion. An expected run that never appears is a blocker, not success. If no applicable post-merge workflow exists, record `none-configured` from repository and provider evidence and verify the target branch contains the merged result.
3. Classify every failure from its exact logs and changed path. Temporal proximity alone is not attribution. Retry only a proven flake or infrastructure failure under the provider's safe retry policy.
4. For a failure attributable to the landed change, append a focused follow-up cycle from the current protected target branch. Inherit `merge-and-verify` and the review plan kind and selectors, but give the new PR fresh per-cycle request actions, deadlines, frozen feedback, CI state, and merge actions. Execute states 1 through 9 for that cycle, then return here for its merged result.
5. Keep the run's no-progress counter across cycles. Stop after two consecutive repair cycles that do not change the failure evidence, root-cause diagnosis, or terminal workflow state; code churn alone is not progress. Stop sooner for an external blocker or a real user decision.
6. A repair is a new PR, never a direct target-branch edit, force-push, or history rewrite.

Completion: every expected relevant post-merge workflow is green for the latest merged cycle, or the run is blocked by a named no-progress condition, external dependency, missing evidence, or user decision.

### 11. Human Gate

Append the terminal state with every cycle and PR URL, the delivery ceiling, final PR or merged SHA, merge and admin-bypass outcomes, Review Receipt, local verification, required CI, review plan, per-selector dispositions, frozen feedback sets, addressed findings, post-merge workflow results, follow-up repairs, and any residual risk. In the user-facing message, report the relevant PR URLs and final SHA, whether review, required checks, merge, and post-merge verification succeeded, and only unresolved findings, risk, or human action. Stop and wait for the user.
