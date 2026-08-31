# Finish Loop

This runbook is the bounded supervisor around Implement, the Task Worktree and diff, its PR, CI, and one frozen set of external review feedback. When Graphite tracks the current branch, use its parent and stack position as context without taking ownership of the stack.

For a draft PR, skip CI monitoring and external review collection or remediation, then proceed directly to Human Gate.

Use the router's [VCS Actions contract](vcs.md) to establish the Task Worktree before initializing the Run Ledger.

## Load

Load only the skills needed by the observed path:

- `coding-standards` and `codebase-design` for accepted-spec implementation; `tdd` only when RGR is the selected verification loop.
- `local-adversarial-review-gauntlet` when `computa-please`'s Review Gate selects it.
- `graphite` when Graphite tracks the current branch.
- `fix-merge-conflicts` when synchronization exposes conflicts.
- `fix-ci` for failing required checks.
- `review-remediation` after the run's external feedback set has been frozen.

## Run Ledger

After VCS Preflight establishes the Task Worktree, create `.computa-please/` and `handoff.md` when absent, then append the run entry below. Worktree bootstrap is the sole permitted earlier mutation; perform no repository-content mutation or external action until the entry exists:

- Run identifier and current state.
- Accepted spec path, completed-change delivery goal, or existing PR goal.
- PR, base branch, current branch, Graphite parent when tracked, and VCS workflow.
- Initial and current commit SHA, additive commits created by the run, and any amend exception reason.
- Selected local review path, specialist lens, target commit and tree, Proof attestation, terminal outcome, and remaining actionable finding count.
- CI state and the SHA it describes.
- PR additions plus deletions.
- Review plan: `existing-only`, `request-once`, or explicit `skip`; reviewer selectors; delivery surfaces; expected revision or time window; completion evidence; named request actions and the selectors each covers; and an absolute result deadline for `request-once`.
- Per-selector disposition, request-action attempts and times, completed artifact identifiers, frozen feedback payload, remaining actionable count, and per-item response or addressed-state action attempts.

Update the entry before every state transition and before every external action. On pickup, reconcile the ledger with live state and trust observed state except for recorded external-action attempts and the frozen feedback payload. Each attempted request, response, or addressed-state mutation remains spent when its result is ambiguous. The recorded IDs, authors, bodies, source surfaces, and revision or timestamps remain authoritative after the set freezes; live state can update only delivery and addressed status.

## State Machine

### 1. Bound

1. Confirm explicit Finish Loop authorization.
2. Confirm an accepted spec, a completed change with a concrete delivery goal, or a concrete existing PR goal.
3. Verify the Task Worktree path and inspect its diff, branch, PR, required checks, and Graphite parent when tracked.
4. Name the allowed files or behavioral slice, verifier, external actions, blockers, and review plan. A ready PR requires `existing-only`, `request-once`, or an explicit `skip`; `request-once` names each authorized request action, the reviewer selectors it covers, its mechanism, and an absolute result deadline.
5. Stop for unresolved product, public API, production behavior, auth, security, secrets, money, deletion, deploy, ownership, or scope decisions.

Completion: the goal, blast radius, verifier, PR target, review plan, and authorization are recorded with no unresolved decision fork.

### 2. Synchronized

1. Use the Git or Graphite workflow established by the VCS Actions preflight.
2. Inspect enough Graphite context to identify the current diff's intended parent and base. Do not switch to, edit, submit, or otherwise advance sibling diffs.
3. If the current diff's parent has changed, synchronize only the current diff before editing. If the required Graphite operation would mutate another diff, stop and ask the user.
4. Resolve mechanical conflicts with `fix-merge-conflicts`; stop when resolution requires product intent or changes outside the declared slice.
5. Reinspect the current diff against its intended parent.

Completion: the current branch has the intended base, no unresolved conflicts, and no accidental changes outside scope.

### 3. Implemented

1. For an accepted spec, execute Implement one tracer-bullet slice at a time. For a completed change or existing PR, diagnose only the observed residue.
2. Use parallel subagents for independent exploration or deterministic verification when their work is isolated and their output can be checked. Ask for observed facts or check results, not findings or readiness judgments; those belong to Local Review.
3. Before each additive commit, inspect the diff, form its Conventional Commit subject under the VCS Actions contract, and run the repository's available format, lint, typecheck, tests, and feature-specific verification. Use the smallest sound targeted subset during remediation, then run the full required local suite before first publication and final handoff. Cache each exact command, exit status, and justified omission.
4. After committing a gauntlet target, record its commit and tree and bind the cached Proof to those exact bytes. A changed tree makes prior Proof stale.
5. Append implementation decisions and verification evidence to the ledger.

Completion: the intended behavior is implemented, local checks pass, the diff remains within the accepted slice, and every agent-authored commit has a verified Conventional Commit subject.

### 4. Local Review

1. Apply `computa-please`'s Review Gate to select the repository's normal review path or the adversarial gauntlet. For the gauntlet, select one specialist lens from the highest-consequence unresolved risk; material trust or security risk selects `security`.
2. If using the gauntlet, stage only intended files and create an additive commit. Record the target commit and tree, then create its Proof attestation from the cached observed checks. The active Finish Loop authorizes this prerequisite local commit.
3. Invoke `local-adversarial-review-gauntlet` once with the fixed point, target, Proof, intent, spec disposition, and lens through a shell tool with a 600-second process-tree timeout. Material security risk also passes `--require-specialized-security`. Do not place Task jobs, nested reviewers, retries, multipass Autoreview, or full deterministic checks on this timed path.
4. Stop if required behavior coverage, required risk coverage, target integrity, cleanup, or the selected review path is incomplete. Missing optional providers do not block completed role coverage.
5. Confirm or reject every finding. Apply the smallest in-scope root-cause fix for confirmed findings, rerun deterministic verification, and commit the fix as a new slice.
6. Do not add review passes without new risk or evidence. Tests, typecheck, lint, build, runtime repros, and deterministic contract checks remain verification.

Completion: the selected review path reached a terminal outcome, every actionable finding is fixed or rejected with evidence, and the resulting local diff is committed and verified.

### 5. Published

1. Submit only the current diff with the repository-supported Graphite command, or push the current Git branch. Do not use stack-wide submission.
2. Create or update the PR description by following [the PR Description contract](pr-description.md) through **Verify**.
3. Preserve the PR state authorized under the VCS Actions contract.
4. Record the pushed SHA before monitoring checks, or before proceeding to Human Gate for a draft PR.

Completion: the open PR points at the recorded SHA, retains its authorized draft or ready state, targets the intended parent or base, and `check-pr-body` exits 0 on that description.

### 6. Collect External Review and Monitor CI

Skip this state, Remediate Review Feedback, and Final CI for a draft PR. Record the skipped CI and review disposition, then proceed to Human Gate. Run the remainder of this state when the PR's authorized state is ready for review.

Immediately after publication and before waiting for CI, execute the fixed review plan:

1. Resolve each reviewer selector against the provider's current review surfaces. A selector may name one reviewer, several reviewers, or all current external feedback.
2. Discover submitted reviews, review bodies, inline comments, issue comments, check runs, annotations, or equivalent provider objects relevant to those selectors.
3. Apply the plan's provider-specific attribution and positive completion evidence. Author identity alone, progress notices, eligibility notices, duplicate summaries, and other artifacts without completed feedback do not qualify.
4. For `existing-only`, record completed results or `no-existing-feedback` separately for every configured reviewer selector. Treat an `all current external feedback` wildcard as one selector.
5. For `request-once`, reuse attributable completed results. Execute each request action required by the fixed plan at most once; one action may cover one or several reviewer selectors. Append its action ID, covered selectors, `request-attempted: true`, timestamp, and expected revision before invoking its documented mechanism.
6. For `skip`, record the explicit reason and perform no review action.

Then monitor required checks while any requested reviews run in parallel:

1. Preserve each recorded review disposition. A named request action is attempted at most once during the run, including after CI fixes, timeouts, ambiguous delivery, context recovery, or a new pushed SHA.
2. If an attributable check fails, invoke `fix-ci`, apply the smallest root-cause fix, run risk-matched local verification, create an additive commit, publish, record the new SHA, and wait again without changing the review plan or request attempts.
3. Retain feedback that targets an earlier SHA; `review-remediation` will compare every finding with the current diff.
4. Treat external outages and unavailable required infrastructure as blockers.
5. Stop for no-progress when two consecutive remediation cycles for the same failure produce no new evidence, diagnosis, code change, reviewer state, or check-state change. Passive pending states follow their recorded or provider deadline and do not count as remediation cycles.

Completion: for a ready PR, every required check is green for the current recorded SHA, and every configured reviewer selector is represented by completed artifacts, `no-existing-feedback`, explicit `skip`, or one recorded pending request. Requested feedback need not have arrived yet.

### 7. Remediate Review Feedback

Use the review plan and dispositions fixed before the initial CI wait:

1. For explicit `skip`, or when every `existing-only` selector has `no-existing-feedback`, skip to Final CI.
2. For `request-once`, wait for every configured reviewer selector to produce an attributable completed result until its recorded absolute deadline. At the deadline, an absent or ambiguous result is a blocker and every covering request action remains spent.
3. Build one feedback set from every claim, requested change, question, and informational item requiring acknowledgement in the completed results. Freeze each item's stable ID or URL, reviewer, delivery surface, body, and reviewed SHA or observed timestamp in the ledger. Record completed results with zero feedback items as `completed-no-feedback`.
4. Treat the frozen ledger payload as the source of truth on recovery. A live edit to an object with the same ID does not change the finding under remediation; re-fetch only to observe delivery, deletion, and addressed state.
5. Run `review-remediation` once against the frozen records. Complete classification, primary-source research, minimum, durable, robust implementation, and verification, but defer provider replies and addressed-state changes until the remediation is published.
6. Treat every blocked item as a Finish Loop blocker. Scores, severity summaries, and approval labels remain metadata.
7. When files changed, create an additive remediation commit, publish it, confirm the PR head contains it, and record the new SHA.
8. After publication, complete `review-remediation` responses and provider-native addressed-state changes. Before each external action, record its item ID, exact payload or intended state, and `attempted` status; then execute it once and record the observed result. An ambiguous attempt is a blocker rather than permission to replay it. A deleted item receives terminal `delivery-unavailable: deleted` status instead of a reply or state mutation. When no files changed, respond after verification and classification.
9. Treat feedback arriving after the set freezes as a separate run. Never transition back to this state.

Completion: for a ready PR, the plan was explicitly skipped; every `existing-only` selector had `no-existing-feedback`; or every selector has a terminal disposition, every completed result is represented by frozen items or `completed-no-feedback`, every item is accounted for with no blocker, and changed remediation was published before its response or addressed-state update.

### 8. Final CI

Wait for every required check on the final recorded SHA. Remediate attributable failures through the CI loop without changing the review plan or frozen set and without returning to Remediate Review Feedback. Refresh the PR description from the final diff using [the PR Description contract](pr-description.md) through **Verify**, then reconfirm that the PR is conflict-free and points at that SHA.

Completion: for a ready PR, required CI is green for the final SHA, `check-pr-body` exits 0 on the final description, the PR is conflict-free and ready for review, and Remediate Review Feedback remains complete.

### 9. Human Gate

Append the terminal state and report the PR URL, final SHA, selected local review outcome, local verification, required CI, review plan, per-selector dispositions, frozen feedback set, addressed findings, and any residual risk. Stop and wait for the user.
