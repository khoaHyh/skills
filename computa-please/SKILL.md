---
name: computa-please
description: Route engineering work from decision through the final human gate.
disable-model-invocation: true
---

# Computa Please

Route work through the least process that can prove the result: inspect before deciding, subtract before adding, ship one vertical slice, verify at the strongest seam, and reserve judgment for the user.

Use this language consistently:

- **Mode:** the one active workflow branch.
- **Gate:** a condition that blocks an action until its completion criterion is met; a Reference Gate also requires a runbook.
- **Work Frame:** Intent, Scope, Compatibility, Slice, Budget, and Proof.
- **Obligation:** an evidence-backed requirement that an existing contract survive.
- **Proof:** a risk, proving seam, command, and result status: pending or observed.
- **Human Gate:** the final handoff; the agent reports the proven state and stops.

## 1. Select one Mode

- **Discuss:** compare, evaluate, design, decide, or resolve ambiguity. Read-only and ephemeral by default.
- **Spec:** produce a durable, implementation-ready plan. Production code stays read-only.
- **Implement:** make authorized code changes.
- **Finish Loop:** carry an accepted spec, completed change, or existing PR through its authorized delivery states to the Human Gate.
- **Debug:** diagnose a failure, regression, flake, or performance problem.
- **Review:** find defects in a diff, branch, commit, or PR.
- **Recall/Pickup:** recover live work from artifacts and repository state.
- **Reflect:** turn observed workflow evidence into a structural improvement.

Default evaluative or ambiguous work to Discuss. Resolve inspectable facts yourself; ask the user only for decisions.

**Complete when:** one Mode is named with its mutation and persistence authority.

## 2. Satisfy every Reference Gate

Evaluate all matching Gates after selecting a Mode. Read each matched reference in full before its gated action; a mention or link is not a read.

- **Design:** When a request may introduce new behavior; change a public contract, domain rule, or retained datum; affect trust, security, money, deletion, deployment, or ownership; create or move a seam; make a nontrivial refactor or redesign; or enter Spec/Implement without an accepted contract, follow [Design Readiness](references/design-readiness.md) before substantial design or mutation. Production code stays read-only until the request is exempt or its user checkpoint passes.
- **VCS:** Before the first VCS mutation, commit, push, branch or worktree creation, synchronization, or PR publication, follow [VCS Actions](references/vcs.md).
- **Finish Loop:** After explicit Finish Loop authorization and before its first mutation or external action, follow [Finish Loop](references/finish-loop.md).
- **PR description:** Before drafting, returning, creating, or updating a PR body, follow [PR Description](references/pr-description.md).
- **Comprehension map:** A requested map selects or resumes Spec. At its checkpoint, or when a complex spec needs a visual misunderstanding check, follow [Comprehension Map](references/comprehension-map.md) before rendering.

Re-evaluate Gates after compaction, Recall/Pickup, or a Mode change. Reuse a prior read only when working context or a durable handoff records the reference, active step, and still-live constraints.

**Complete when:** every matched reference has been read and its applicable entry condition or completion criterion is in working context.

## 3. Run the Mode

### Discuss

Research to a recommendation, tradeoff, or decision. Satisfy the Design Gate when the discussion could become a feature, architecture, or consequential redesign. Mutation or persistence promotes the work to another Mode.

**Complete when:** the user has a recommendation, decision, or explicit promotion path without unapproved mutation or persistence.

### Spec

Satisfy the Design Gate, then create an artifact path only when persistence is needed. Establish the [Work Frame](#work-frame) and apply [Subtraction](#subtraction) before running `tech-spec`; it owns typed contracts, call stacks, file mapping, and risk-matched Proofs. Create a map only through its Gate.

**Complete when:** a fresh session can recover the contract, target shape, call flow, file ownership, pending Proofs, and open decisions without repeating discovery.

### Implement

Read the accepted tech spec, linked Feature Contract, and handoff when present. Without an accepted tech spec or equally explicit implementation contract, satisfy the Design Gate first; a Feature Contract alone routes to Spec.

Load `coding-standards`, `codebase-design` when a nontrivial seam changes, relevant technology skills, and `tdd` only when Red-Green-Refactor is the selected loop. Establish the [Work Frame](#work-frame), apply [Subtraction](#subtraction), then satisfy the [Execution Gate](#execution-gate) and evaluate the [Review Gate](#review-gate).

**Complete when:** the Execution Gate passes and the Review Gate is exempt or complete.

### Finish Loop

Enter only through explicit authorization. Execute the Finish Loop Reference Gate's state machine and ledger to prevent replayed external actions.

**Complete when:** the runbook reaches the Human Gate.

### Debug

Load `diagnosing-bugs`; add `feedback-loop`, `motel-debug`, `observability-logging`, or technology skills only when the observed path requires them.

1. Reproduce or tightly bound the symptom.
2. Tighten the evidence loop before opening hypotheses.
3. Establish root cause, or label it unknown before a contained mitigation.
4. Before mutation, establish the Work Frame and satisfy the Design Gate when the fix crosses a trigger.
5. Apply the fix at the owning seam through Subtraction and the Execution Gate.
6. Remove temporary probes unless the user retains them as production telemetry.
7. Rerun the original repro and relevant final checks.
8. Evaluate the Review Gate.

**Complete when:** the original symptom is reproduced or tightly bounded, root cause is fixed or an unknown cause is explicit, the post-fix repro plus final checks support the result, and the Review Gate is exempt or complete.

### Review

Review independently of author confidence and prior conclusions. Satisfy the [Review Gate](#review-gate). Verification commands are evidence, not review. Use `review-remediation` for a frozen human or automated feedback set; keep CI remediation in its own workflow.

Report findings first, ordered by severity with file and line references. A worktree review needs no commit unless its selected tool requires one and the user authorizes it.

### Recall/Pickup

Read artifacts and live state first. Reconstruct done, pending, blocked, and risky work; separate inherited claims from reverified facts; route only the remainder. Resume a Finish Loop only from recorded authorization.

**Complete when:** inherited and reverified state are distinct and every remaining item is routed or blocked by a named decision.

### Reflect

Use corrections, retries, churn, and successful recipes as evidence. Prefer deleting instructions or enforcing behavior with tests, scripts, metadata, or tools. Propose skill changes and evals before editing unless implementation is already authorized.

**Complete when:** each proposed or authorized change traces to observed workflow evidence and names how its effect will be evaluated.

## Work Frame

Name every field before nontrivial code work:

- **Intent:** requested outcome and observable change.
- **Scope:** allowed surface and explicit non-goals.
- **Compatibility:** Direct cutover or Protected evolution.
- **Slice:** changed contract, owning module, seam, and effects.
- **Budget:** reasonable file, concept, search, and tool limits; zero speculative abstractions.
- **Proof:** important risk, strongest practical seam, focused command, required final checks, and `pending` status. Replace `pending` with the observed result after execution.

### Compatibility

Search public callers, known users or clients, deployments including mixed versions, integrations, retained data, in-flight work, and rollback constraints for Obligations.

- **Direct cutover:** evidence supports no Obligation. Migrate callers and delete the superseded path in the same Slice, leaving no alias, shim, dual path, speculative migration, or compatibility flag.
- **Protected evolution:** a named Obligation exists. Preserve it at the narrowest seam and record whether the mechanism is permanent or its removal condition.

Failure to find a dependency is not evidence of absence when external consumers or retention are unknowable. State the missing evidence and ask only when that uncertainty changes the safe posture. Repository age, naming, and a `legacy` label are not Obligations.

**Complete when:** all six Work Frame fields are explicit; every touched surface has compatibility evidence; and the Slice leaves one path or one named protection.

## Subtraction

For an addition, refactor, or rewrite, inspect what can be deleted, collapsed, inlined, or narrowed before proposing new structure. When subtraction could change the target shape, inventory every affected entrypoint and every changed concept, path, interface, dependency, and file; assign each the highest safe rung: delete, collapse, inline, narrow, or add. Sequence proven subtraction before construction.

**Complete when:** every addition, refactor, or rewrite has a proven subtraction sequenced first or a Work Frame reason none is safe, and every remaining addition is required by the reduced base.

## Execution Gate

Implement, Debug fixes, and Finish Loop implementation satisfy this Gate.

Treat the request, contracts, docs, code, tests, prior reviews, and your first answer as claims. Trace repository instructions and accepted contracts through public entrypoints, schemas, registries, owning implementations, callers, and tests; consult canonical upstream sources when external semantics matter. Try realistic counterexamples, challenge the work rather than its author, and stop broadening when the remaining uncertainty cannot change the design, finding, Compatibility, or Proof.

Select lenses by observed risk: behavior and spec; ownership and invariants; state and lifecycle; concurrency and retries; errors and recovery; trust boundaries; data and compatibility; operability; and performance.

- Prefer repository idioms and canonical upstream guidance.
- Pin behavior before a refactor with an end-to-end, integration, characterization, snapshot, replay, or equivalence check. Typecheck and lint are not behavior pins.
- Build one complete vertical Slice. Keep adjacent cleanup outside Scope.
- Add an abstraction only when it hides current complexity that would otherwise spread to callers.
- Keep a refactor only when it reduces reader load through fewer concepts, branches, paths, representations, or indirection hops.
- Keep expected failures typed and boundary translation local. Add telemetry only to distinguish an operationally relevant outcome; use `observability-logging` for signal design.

Choose the strongest practical proving seam:

1. End-to-end through the affected public entrypoint.
2. Integration through the real adapter or boundary.
3. Contract or property tests for isolated domain behavior.
4. Unit tests for behavior a stronger seam cannot prove.

Use Red-Green-Refactor when a useful red test can express the risk. For migrations, configuration, generated output, runtime-only failures, or a behavior-preserving refactor with a pin, use the strongest applicable repro, equivalence check, trace query, contract check, or repository command.

Cache focused and final commands with their outcomes. Rerun them only when relevant inputs change. Before completion, inspect status and the complete diff, run the focused Proof and required final checks, and report every omitted check.

**Complete when:** the Slice works through its strongest practical seam; every new abstraction hides current complexity; each refactor reduces at least one named reader-load dimension without moving the burden; final checks have no new failure; and residual risk is explicit.

## Review Gate

Review and Finish Loop select one path. Implement and Debug enter this Gate only when the user requests review or a qualifying risk is material; otherwise record the Gate as exempt.

- **Normal review:** the repository's review workflow, or this fallback: inspect every changed hunk, trace each candidate defect through its owning call path and relevant tests, and confirm or reject it with evidence.
- **Gauntlet:** `local-adversarial-review-gauntlet` when the user requests it, or when a qualifying risk is material and four independent reviewers could plausibly change the result.

Qualifying risks are trust, security, privacy, money, billing or entitlements, production infrastructure, deployment, recovery, data integrity, broad internal tooling, a durable seam, ownership boundary, protocol, hard-to-reverse contract, or a complex cross-module change or feature with multiple failure paths, consequential state transitions, or weak deterministic Proof.

Run one gauntlet after deterministic Proof passes against an immutable committed target, before publication or the Human Gate. Its packet names the risk, fixed point, target, and prerequisite-commit authority. An active Finish Loop supplies that authority; otherwise ask before committing. This selection is `computa-please`'s exception to the gauntlet's direct-invocation rule.

**Complete when:** the Gate is exempt for a named reason, Normal review covers every changed hunk and disposes every candidate, or the gauntlet satisfies its own completion criterion.

## Delegation

The main agent owns synthesis and the final diff. Delegate only for lower latency or an independent evidence source.

- Default to one wave of at most three children with disjoint questions or file surfaces.
- Give each child the goal or symptom, repository revision, established facts, commands and outcomes, Work Frame, authority, required evidence, and return shape.
- Research children return facts and citations, not readiness judgments. Implementation children make isolated, inspectable edits.
- Merge each wave before opening another, name the remaining gap, and verify child claims against source or deterministic checks.

Escalate beyond one wave only for requested breadth, independent high-risk hypotheses, or formal adversarial review.

**Complete when:** every child had disjoint authority and each returned claim is verified, merged, or rejected.

## Durable State

Persist when the user requests it, work must survive sessions, people or agents must coordinate, or a Finish Loop needs an external-action ledger. Otherwise keep state in the conversation.

Use `~/.computa-please/<repo-slug>__<branch-slug>/`, or `<repo-slug>__<task-slug>` without a branch. Slugs contain lowercase letters, numbers, and single hyphens. The directory contains only:

```text
<task-slug>-tech-spec-YYYY-MM-DD.md
handoff.md
```

Reuse the tech spec. Keep the handoff append-only: add a dated section after material changes with the spec path, state, decisions, rejected approaches, Compatibility, Proof, external actions, residual risk, and next action. Store renderer-owned maps elsewhere and link them. Keep secrets, customer data, and private transcripts out of artifacts.

**Complete when:** no persistence condition applies and state remains conversational, or the required two-file directory accounts for every durable decision and action.

## Stop Cleanly

Apply VCS Actions to every VCS mutation and PR publication. Outside a Finish Loop, obtain explicit approval for merge, deploy, destructive data change, or external message.

For nontrivial code changes, use Summary, Why, Design, Validation, and Follow-up/Risk; include the Mode, changed files or artifacts, Proof, and residual risk within those sections. For trivial code changes, report those four facts without headings. Other Modes follow their completion criteria and the user's requested shape. A PR body follows the PR Description Gate instead.
