# Finish Loop

This runbook is the bounded supervisor around Implement, the current worktree and diff, its PR, CI, and one paid Greptile review. When Graphite tracks the current branch, use its parent and stack position as context without taking ownership of the stack.

Default PR posture: publish every PR as a draft. Mark it ready for review only when the user explicitly requests it. Draft PRs are publication-only: skip CI monitoring and Greptile or other agent review, then proceed directly to Human Gate.

Use additive commits for coherent implementation and remediation slices. Preserve commits already pushed, reviewed, recorded, or observed by CI; amend only with explicit user approval.

## Load

Load only the skills needed by the observed path:

- `vcs-detect` before VCS commands.
- `coding-standards` and `codebase-design` for accepted-spec implementation; `tdd` only when RGR is the selected verification loop.
- `local-adversarial-review-gauntlet` when the accepted spec or explicit Finish Loop authorization selects the high-assurance review gate.
- `graphite` when Graphite tracks the current branch.
- `fix-merge-conflicts` when synchronization exposes conflicts.
- `fix-ci` for failing required checks.
- `greptile-address` for its completed-snapshot predicate during discovery, then for remediation only after the one allowed completed review exists.

## Run Ledger

Before the first mutation or external action, append a run entry to `handoff.md` containing:

- Run identifier and current state.
- Accepted spec path or existing PR goal.
- PR, base branch, current branch, Graphite parent when tracked, and VCS workflow.
- Initial and current commit SHA, additive commits created by the run, and any amend exception reason.
- Selected local review path, target, terminal outcome, and remaining actionable finding count.
- CI state and the SHA it describes.
- PR additions plus deletions.
- Greptile eligibility, request-attempted flag and time, matching review identifier, and remaining actionable count.

Update the entry before every state transition and before every external action. On pickup, reconcile the ledger with live state and trust observed state for everything except whether a Greptile request was already attempted. An attempted request remains spent even when its result is ambiguous.

## State Machine

### 1. Bound

1. Confirm explicit Finish Loop authorization.
2. Confirm an accepted spec or a concrete existing PR goal.
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
2. Use parallel subagents for independent exploration or deterministic verification when their work is isolated and their output can be checked. Ask for observed facts or check results, not findings or readiness judgments; those belong to Local Review.
3. Before each additive commit, inspect the diff and run the repository's available format, lint, typecheck, tests, and feature-specific verification. Use the smallest sound targeted subset during remediation, then run the full required local suite before first publication and final handoff.
4. Append implementation decisions and verification evidence to the ledger.

Completion: the intended behavior is implemented, local checks pass, and the diff remains within the accepted slice.

### 4. Local Review

1. Select the repository's normal review path unless the accepted spec, risk assessment, or user explicitly requires the adversarial gauntlet.
2. If using the gauntlet, stage only intended files, create an additive commit, and invoke `local-adversarial-review-gauntlet` against that target. The active Finish Loop authorizes this prerequisite local commit.
3. Stop if a required reviewer is blocked or the selected review path is incomplete.
4. Confirm or reject every finding. Apply the smallest in-scope root-cause fix for confirmed findings, rerun deterministic verification, and commit the fix as a new slice.
5. Do not add review passes without new risk or evidence. Tests, typecheck, lint, build, runtime repros, and deterministic contract checks remain verification.

Completion: the selected review path reached a terminal outcome, every actionable finding is fixed or rejected with evidence, and the resulting local diff is committed and verified.

### 5. Published

1. Submit only the current diff with the repository-supported Graphite command, or push the current Git branch. Do not use stack-wide submission.
2. Create or update the PR description with Summary, Why, Design, Call Stacks, Validation, and Follow-up/Risk. Write Call Stacks using the contract below.
3. Keep the PR as a draft unless the user explicitly requested ready-for-review state.
4. Record the pushed SHA before monitoring checks, or before proceeding to Human Gate for a draft PR.

Completion: the open PR points at the recorded SHA, is draft unless readiness was explicitly requested, and targets the intended parent or base.

#### PR Call Stacks

A call stack is an ordered execution path from an affected entrypoint through each callable or boundary to its terminal result or effect. Derive the before state from the PR base and the after state from the current diff. The readable form is a code-shaped outline, not a numbered inventory: indentation shows a call or caused handoff, and sibling lines stay at the same depth in execution order.

In the PR body's `Call Stacks` section:

- Include every added or edited call stack. If there are none, write `No call stacks added or edited.`
- If available, use `calldiff` to discover the structural change before writing the section: `npx calldiff@latest diff <base> <head>`, narrowed with `--entry`, `--file`, or an affected path when needed. Treat its AST result as evidence, not authority: verify each path against source and add routes, dependency-injection edges, RPC boundaries, events, dynamic calls, and other edges a syntactic call tree cannot resolve. Do not block the PR on installing or running it.
- Give each semantic flow its own heading. Split materially different paths such as `Production`, `Tests`, a worker, or an event consumer instead of braiding them into one tree. A test double or in-memory adapter belongs in the test tree, not in the production tree.
- Show the complete path, including unchanged context around the edited layer. Use one `Before` and one `After` tree when the path is short; use a `diff` tree when the paths mostly share context. For a new path, show `Before: Not present.` and one `After` tree.
- Use exact callable, module, boundary, event, and terminal-result names. Put the input and output types on the frame as `name(input) -> output`; use concrete runtime shapes when the codebase is untyped.
- Keep errors and side effects compact and local to the frame that owns them. Add `[errors: ...; effects: ...]` only when those facts are non-empty or materially important; do not repeat `None` on every frame. Include typed failures, thrown exceptions or defects, and boundary failures with their trigger conditions.
- Use `->` for a direct call and `~>` for an asynchronous event or handoff. Show the handoff's consumer as a nested path when the PR changes that consumer. Do not imply synchronous completion for a published event, queued job, or worker.
- Keep the tree as the primary view. Use strict Mermaid only when the important fact is interaction between multiple actors, branching, concurrency, retries, or an asynchronous message exchange that an outline would hide. Use a fenced `mermaid` block with valid Mermaid syntax and simple quoted labels; do not use Mermaid for a linear call stack merely because it can draw boxes.

Use this shape for a production path:

````markdown
### `<entrypoint> -> <terminal result or effect>`

#### Production
```text
<entrypoint>(<input>) -> <response>
  -> <callable>(<input>) -> <output>
    -> <boundary>(<input>) -> <output> [errors: <error and trigger>; effects: <effect>]
      ~> <consumer>(<input>) -> <output>
```

#### Tests
```text
<test entrypoint>(<fixture>) -> <assertion>
  -> <callable>(<input>) -> <output>
    -> <test double or real adapter>(<input>) -> <output>
```

#### Contracts
- `<frame>`: errors `<typed failure and trigger>`; effects `<effect>`.

For a before/after change, prefer a diff-shaped tree:

```diff
  <entrypoint>(<input>) -> <response>
    -> <unchanged callable>(<input>) -> <output>
-     -> <old callable>(<input>) -> <old output>
+     -> <new callable>(<input>) -> <new output> [errors: <error and trigger>; effects: <effect>]
```

Put long error or side-effect details in the adjacent `Contracts` list keyed by exact frame name. The tree must remain readable at a glance while the contracts retain the facts a reviewer needs to verify.
````

### 6. Start Greptile and Monitor CI

Skip this state, Consume Greptile, and Final CI for a draft PR. Record the skipped CI and agent-review disposition, then proceed to Human Gate. Run the remainder of this state only when the user explicitly requested ready-for-review state.

Immediately after publication and before waiting for CI, fetch Greptile artifacts on the PR and apply the `greptile-address` completed-snapshot predicate. A bot-authored issue comment, check, reaction, standalone inline comment, or status/skip notice is not an existing review. In particular, `PR author is in the excluded authors list` is an ineligibility notice, not a review snapshot. Then fix the run's Greptile disposition:

- If any completed Greptile review exists, select the latest snapshot and record its review ID and reviewed SHA without posting a request.
- If no completed review exists and the PR reports 300 changed lines or fewer, record `ineligible-size`.
- If no completed review exists and the PR reports more than 300 changed lines, record `request-attempted: true` and the time immediately before posting one `@greptileai` review request.

Then monitor required checks while any requested Greptile review runs in parallel:

1. Never post another Greptile request during this agent run, including after CI fixes, a low confidence score, timeout, ambiguous delivery, context recovery, or a new pushed SHA.
2. If an attributable check fails, invoke `fix-ci`, apply the smallest root-cause fix, run risk-matched local verification, create an additive commit, publish, record the new SHA, and wait again without changing the recorded Greptile disposition.
3. Treat external outages and unavailable required infrastructure as blockers.
4. Stop for no-progress when two consecutive cycles produce no new evidence, diagnosis, code change, or check-state change. Report the repeated failure and attempted remedies.

Completion: for a ready PR, every required check is green for the current recorded SHA, and the Greptile disposition is one recorded completed review, `ineligible-size`, or one attempted request. A requested review need not have arrived yet.

### 7. Consume Greptile

Use the Greptile disposition fixed before the initial CI wait:

1. For `ineligible-size`, skip to Final CI.
2. For an existing completed review, invoke `greptile-address` once with its recorded review ID.
3. For an attempted request, use a review that is attributable to the recorded request if it has arrived; otherwise wait for it, then invoke `greptile-address` once with the PR, request time, and reviewed SHA.
4. For a newly requested review, if no attributable review arrives or attribution is ambiguous, stop with a blocker rather than consuming an older review or retrying the request.
5. Address every finding that still applies to the current diff and classify findings already covered by newer commits accordingly.
6. Treat the score as metadata, not an exit condition. The gate is whether every actionable finding in that one review snapshot is fixed or rejected with evidence; an unresolved finding is a blocker to report to the user.
7. Resolve addressed Greptile threads, run local verification, create an additive commit, publish, and record the new SHA when remediation changed files.
8. Ignore later automatic or manually requested Greptile reviews for this run. Never transition back to this state.

Completion: for a ready PR, Greptile was skipped because no review existed and the diff was ineligible by size, or one existing or newly requested review snapshot was consumed and has zero unaccounted actionable findings.

### 8. Final CI

Wait for every required check on the final recorded SHA. Remediate attributable failures through the CI loop without changing the Greptile disposition or returning to Consume Greptile. Refresh the PR description's Call Stacks section from the final diff, then reconfirm that the PR is conflict-free and points at that SHA.

Completion: for a ready PR, required CI is green for the final SHA, the PR description accounts for every added or edited call stack in the final diff, the PR is conflict-free and ready for review, and Consume Greptile remains complete.

### 9. Human Gate

Append the terminal state and report the PR URL, final SHA, selected local review outcome, local verification, required CI, Greptile eligibility and consumed review, addressed findings, and any residual risk. Stop and wait for the user.
