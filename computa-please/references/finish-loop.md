# Finish Loop

This runbook is the bounded supervisor around Implement, the current worktree and diff, its PR, CI, and one paid Greptile review. When Graphite tracks the current branch, use its parent and stack position as context without taking ownership of the stack.

## Load

Load only the skills needed by the observed path:

- `vcs-detect` before VCS commands.
- `tdd`, `coding-standards`, and `codebase-design` for accepted-spec implementation.
- `graphite` when Graphite tracks the current branch.
- `fix-merge-conflicts` when synchronization exposes conflicts.
- `fix-ci` for failing required checks.
- `greptile-address` only after the one allowed review exists.

## Run Ledger

Before the first mutation or external action, append a run entry to `handoff.md` containing:

- Run identifier and current state.
- Accepted spec path or existing PR goal.
- PR, base branch, current branch, Graphite parent when tracked, and VCS workflow.
- Initial and current commit SHA.
- CI state and the SHA it describes.
- PR additions plus deletions.
- Greptile eligibility, request-attempted flag and time, matching review identifier, and remaining actionable count.

Update the entry before every state transition and before every external action. On pickup, reconcile the ledger with live state and trust observed state for everything except whether a Greptile request was already attempted. An attempted request remains spent even when its result is ambiguous.

## State Machine

### 1. Bound

1. Confirm explicit Finish Loop authorization.
2. Confirm an accepted post-grill spec or a concrete existing PR goal.
3. Inspect the current worktree, diff, branch, PR, required checks, and Graphite parent when tracked.
4. Name the allowed files or behavioral slice, verifier, external actions, and blockers.
5. Stop for unresolved product, public API, production behavior, auth, security, secrets, money, deletion, deploy, ownership, or scope decisions.

Completion: the goal, blast radius, verifier, PR target, and authorization are recorded with no unresolved decision fork.

### 2. Synchronized

1. Run `vcs-detect` and use Graphite when it tracks the current branch; otherwise use the repository's Git workflow.
2. Inspect enough Graphite context to identify the current diff's intended parent and base. Do not switch to, edit, submit, or otherwise advance sibling diffs.
3. If the current diff's parent has changed, synchronize only the current diff before editing. If the required Graphite operation would mutate another diff, stop and ask the user.
4. Resolve mechanical conflicts with `fix-merge-conflicts`; stop when resolution requires product intent or changes outside the declared slice.
5. Reinspect the current diff against its intended parent.

Completion: the current branch has the intended base, no unresolved conflicts, and no accidental changes outside scope.

### 3. Implemented

1. For an accepted spec, execute Implement one tracer-bullet slice at a time. For an existing PR, diagnose only the observed residue.
2. Use parallel subagents for independent exploration or verification when their work is isolated and their output can be checked.
3. Before each commit, inspect the diff and run the repository's available format, lint, typecheck, tests, and feature-specific verification. Use the smallest sound targeted subset during remediation, then run the full required local suite before first publication and final handoff.
4. Append implementation decisions and verification evidence to the ledger.

Completion: the intended behavior is implemented, local checks pass, and the diff remains within the accepted slice.

### 4. Published

1. Stage only intended files and create or update the scoped commit using the chosen VCS workflow.
2. Submit only the current diff with the repository-supported Graphite command, or push the current Git branch. Do not use stack-wide submission.
3. Create or update the PR description with Summary, Why, Design, Validation, and Follow-up/Risk.
4. Move a draft PR to ready-for-review state.
5. Record the pushed SHA before monitoring checks.

Completion: the open PR points at the recorded SHA, is ready for review, and targets the intended parent or base.

### 5. Initial CI Green

1. Wait for required checks on the recorded SHA.
2. If an attributable check fails, invoke `fix-ci`, apply the smallest root-cause fix, run risk-matched local verification, commit, publish, record the new SHA, and wait again.
3. Treat external outages and unavailable required infrastructure as blockers.
4. Stop for no-progress when two consecutive cycles produce no new evidence, diagnosis, code change, or check-state change. Report the repeated failure and attempted remedies.

Completion: every required check is green for the current recorded SHA.

### 6. Greptile Gate

Before applying the size threshold, fetch existing Greptile reviews on the PR.

- If any existing Greptile review exists, select the latest snapshot, record its review ID and reviewed SHA, and consume it without posting a request. Address every finding that still applies to the current diff; classify findings already covered by newer commits accordingly.
- If no review exists and the PR reports 300 changed lines or fewer, record `ineligible-size` and skip to Final CI.
- If no review exists and the PR reports more than 300 changed lines, record `request-attempted: true` and the time immediately before posting one `@greptileai` review request.

After selecting an existing review or attempting the one allowed request:

1. Never post another Greptile request during this agent run, including after fixes, a low confidence score, timeout, ambiguous delivery, context recovery, or a new pushed SHA.
2. For an existing review, invoke `greptile-address` once with its review ID. For a requested review, wait for the bot review attributable to the recorded request and invoke `greptile-address` once with the PR, request time, and reviewed SHA.
3. For a newly requested review, if no attributable review arrives or attribution is ambiguous, stop with a blocker rather than consuming an older review or retrying the request.
4. Treat the score as metadata, not an exit condition. The gate is whether every actionable finding in that one review snapshot is fixed or rejected with evidence; an unresolved finding is a blocker to report to the user.
5. Resolve addressed Greptile threads, run local verification, commit, publish, and record the new SHA when remediation changed files.
6. Ignore later automatic or manually requested Greptile reviews for this run. Never transition back to this state.

Completion: Greptile was skipped because no review existed and the diff was ineligible by size, or one existing or newly requested review snapshot was consumed and has zero unaccounted actionable findings.

### 7. Final CI

Wait for every required check on the final recorded SHA. Remediate attributable failures through the Initial CI loop without returning to the Greptile Gate. Reconfirm that the PR is conflict-free and points at that SHA.

Completion: required CI is green for the final SHA, the PR is conflict-free and ready for review, and the Greptile Gate remains complete.

### 8. Human Gate

Append the terminal state and report the PR URL, final SHA, local verification, required CI, Greptile eligibility and consumed review, addressed findings, and any residual risk. Stop and wait for the user.
