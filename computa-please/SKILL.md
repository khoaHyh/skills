---
name: computa-please
description: Route engineering work from decision through the final human gate.
disable-model-invocation: true
---

# Computa Please

Route work through the least process that can prove the result: inspect before deciding, subtract before adding, ship one vertical slice, spend proof in proportion to risk, and reserve judgment for the user.

## Plain-Language Pass

Keep the rigor in the work, not in the wording. Before sending any user-facing progress update, question, checkpoint, or final answer:

1. Draft the message from the established facts.
2. For a final answer, retain each applicable fact: the result; changed artifacts or no change; the strongest relevant check and its outcome; material risk or a blocker; and the next human action or decision.
3. Rewrite it once in plain language: lead with the result or decision, use short direct sentences, and keep only the context the user needs to understand or act. Use concrete facts instead of workflow narration or repeated rationale. Translate internal workflow terms into their concrete meaning unless the user asks about the workflow itself.
4. Send only the rewrite.

Follow the user's requested format. Otherwise, a simple result is one or two sentences. Use flat bullets for several distinct facts and headings only when they make a substantial response easier to scan. Keep exact code identifiers, commands, paths, and error text when they matter.

Examples:

- Simple result: `Updated the retry path so a second attempt cannot duplicate the charge. The focused integration test and final checks pass.`
- Blocked result: `I left the code unchanged because the failure depends on production data I cannot inspect. I need a redacted example to continue.`
- No-change result: `The existing timeout already covers this failure. Another timer would duplicate behavior without improving recovery, so I recommend leaving the code unchanged.`

**Complete when:** the message reads like one human talking to another, makes sense without knowledge of this workflow, and contains no detail that can be removed without losing a needed fact.

Use this language internally:

- **Mode:** the one active workflow branch.
- **Gate:** a condition that blocks an action until its completion criterion is met; a Reference Gate also requires a runbook.
- **Task Worktree:** the one task-owned isolated checkout that contains all mutations and durable state. Locally it lives under `~/dev/worktrees/<repo-slug>__<branch-slug>`.
- **Work Frame:** Intent, Scope, Compatibility, Slice, Budget, and Proof.
- **Obligation:** an evidence-backed requirement that an existing contract survive.
- **Proof:** a risk, proving seam, command, and result status: pending or observed.
- **Review Receipt:** the immutable review target, terminal status, candidate dispositions, remediation commit, and verification that account for one Local Review.
- **Human Gate:** the final handoff; the agent reports the proven state and stops.

## 1. Select one Mode

- **Discuss:** compare, evaluate, design, decide, or resolve ambiguity. Read-only and ephemeral by default.
- **Spec:** produce a durable, implementation-ready plan. Production code stays read-only.
- **Implement:** make authorized code changes.
- **Finish Loop:** own autonomous delivery for one bounded accepted spec, completed change, or existing PR. Select it instead of Implement when the requested outcome includes driving a ready PR through external review or CI, making it merge-ready, merging, landing, shipping, verifying post-merge workflows, or running accepted work through delivery without stopping.
- **Debug:** diagnose a failure, regression, flake, or performance problem.
- **Review:** find defects in a diff, branch, commit, or PR.
- **Recall/Pickup:** recover live work from artifacts and repository state.
- **Reflect:** turn observed workflow evidence into a structural improvement.

Route by the requested terminal outcome, not by the presence of a PR. A one-pass PR status check routes to Discuss, defect-finding only routes to Review, and local verified code or draft-only publication routes to Implement. `Get this PR green`, `make it merge-ready`, `ship`, `land`, `merge`, and `run this through delivery` route to Finish Loop. These words authorize entry, not merge; only the Finish Loop's mandatory question-tool choice authorizes merge.

Default evaluative or ambiguous work to Discuss. Resolve inspectable facts yourself; ask the user only for decisions.

**Complete when:** one Mode is named with its mutation and persistence authority.

## 2. Satisfy every Reference Gate

Evaluate all matching Gates after selecting a Mode. Read each matched reference in full before its gated action; a mention or link is not a read.

- **Design:** When a request may introduce new behavior; change a public contract, domain rule, or retained datum; affect trust, security, money, deletion, deployment, or ownership; create or move a seam; make a nontrivial refactor or redesign; or enter Spec/Implement without an accepted contract, follow [Design Readiness](references/design-readiness.md) before substantial design or mutation. Production code stays read-only until the request is exempt or its user checkpoint passes.
- **Finish Loop:** After this mode is selected and before fresh-run bootstrap, persistence, polling, mutation, or external action, follow [Finish Loop](references/finish-loop.md) from its Entry Gate.
- **Worktree/VCS:** Treat the invocation checkout as inspection/bootstrap only. Follow [VCS Actions](references/vcs.md) to establish the Task Worktree before Recall/Pickup artifact recovery or any repository-content or Durable State write, then re-anchor every tool, artifact, and delegate path there. Follow it again before later VCS mutation or publication.
- **PR description:** Before drafting, returning, creating, or updating a PR body, follow [PR Description](references/pr-description.md) through **Verify** (`check-pr-body` exits 0).
- **Comprehension map:** A requested map selects or resumes Spec. At its checkpoint, or when a complex spec needs a visual misunderstanding check, follow [Comprehension Map](references/comprehension-map.md) before rendering.

After compaction or on Recall/Pickup, reload `computa-please` once before continuing, then re-select the Mode and re-evaluate Gates from the current references. Re-evaluate Gates after any other Mode or mutation/persistence authority change. Reuse a prior reference read only when working context or a durable handoff records it, the active step, and still-live constraints.

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

Execute when the requested terminal outcome selects this mode. The matching request authorizes entry only; the runbook's mandatory question is the sole source of merge authority. Use its state machine and ledger to prevent replayed external actions.

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

Read artifacts and live state first. Reconstruct done, pending, blocked, and risky work; separate inherited claims from reverified facts; route only the remainder. Resume a Finish Loop only from a nonterminal ledger entry with a recorded Entry Gate choice; a closed run provides no authority.

**Complete when:** inherited and reverified state are distinct and every remaining item is routed or blocked by a named decision.

### Reflect

Use corrections, retries, churn, and successful recipes as evidence. Prefer deleting or replacing instructions in place. Encode a surviving invariant in a mechanical control only when that replaces instruction load with cheaper, repeatable enforcement. Propose skill changes and evals before editing unless implementation is already authorized.

**Complete when:** each proposed or authorized change traces to observed workflow evidence and names how its effect will be evaluated.

## Work Frame

Name every field before nontrivial code work:

- **Intent:** requested outcome and observable change.
- **Scope:** allowed surface and explicit non-goals.
- **Compatibility:** Direct cutover or Protected evolution.
- **Slice:** changed contract, owning module, seam, and effects.
- **Budget:** reasonable file, concept, search, tool, and maintenance limits; zero speculative abstractions.
- **Proof:** important risk, selected proving seam, focused command, required final checks, and `pending` status. Replace `pending` with the observed result after execution; cache the exact command, exit status, and justified omissions for target attestation.

### Compatibility

Search public callers, known users or clients, deployments including mixed versions, integrations, retained data, in-flight work, and rollback constraints for Obligations.

- **Direct cutover:** evidence supports no Obligation. Migrate callers and delete the superseded path in the same Slice, leaving no alias, shim, dual path, speculative migration, or compatibility flag.
- **Protected evolution:** a named Obligation exists. Preserve it at the narrowest seam and record whether the mechanism is permanent or its removal condition.

Failure to find a dependency is not evidence of absence when external consumers or retention are unknowable. State the missing evidence and ask only when that uncertainty changes the safe posture. Repository age, naming, and a `legacy` label are not Obligations.

**Complete when:** all six Work Frame fields are explicit; every touched surface has compatibility evidence; and the Slice leaves one path or one named protection.

## Subtraction

Test code is an addition. Before adding, refactoring, or rewriting, inspect what can be deleted, collapsed, inlined, narrowed, or proved by an existing path. When subtraction could change the target shape, inventory every affected entrypoint and every changed concept, path, interface, dependency, and file; assign each the highest safe rung: delete, collapse, inline, narrow, or add. Sequence proven subtraction before construction.

**Complete when:** every addition, refactor, or rewrite has a proven subtraction sequenced first or a Work Frame reason none is safe, and every remaining addition is required by the reduced base.

## Execution Gate

Implement, Debug fixes, and Finish Loop implementation satisfy this Gate.

Treat the request, contracts, docs, code, tests, prior reviews, and your first answer as claims. Trace repository instructions and accepted contracts through public entrypoints, schemas, registries, owning implementations, callers, and tests; consult canonical upstream sources when external semantics matter. Try realistic counterexamples, challenge the work rather than its author, and stop broadening when the remaining uncertainty cannot change the design, finding, Compatibility, or Proof.

Select lenses by observed risk: behavior and spec; ownership and invariants; state and lifecycle; concurrency and retries; errors and recovery; trust boundaries; data and compatibility; operability; and performance.

- Prefer repository idioms and canonical upstream guidance.
- Pin behavior before a refactor only where existing proof cannot expose drift; use the smallest independent end-to-end, integration, characterization, snapshot, replay, or equivalence check that closes the gap. Typecheck and lint are not behavior pins.
- Build one complete vertical Slice. Keep adjacent cleanup outside Scope.
- Add an abstraction only when it hides current complexity that would otherwise spread to callers.
- Keep a refactor only when it reduces reader load through fewer concepts, branches, paths, representations, or indirection hops.
- Keep expected failures typed and boundary translation local. Add telemetry only to distinguish an operationally relevant outcome; use `observability-logging` for signal design.

Choose Proof by information gain per maintenance cost. Reuse a required check when it exercises the changed path and exposes the named risk. A new test earns its maintenance cost only when it uniquely closes a named detection, repeatability, or diagnosis gap; prefer the highest-value affordable real path:

- End-to-end through the public entrypoint for system behavior.
- Integration through real adapters or boundaries for most new behavior.
- A focused unit, contract, or property test only for a complex, high-consequence local invariant that broader proof does not naturally exercise or make diagnosable.

Before writing a test, name the production failure it uniquely detects, why existing end-to-end or integration Proof misses it, and its maintenance cost. When that case cannot be made, keep the existing check or repro as Proof. Cover one representative from cases that share an implementation path; cover each case only when it has distinct repository-owned behavior or consequence. For CI/CD wiring, use the pipeline's own validation or a safe observed run when it exposes the outcome. Tests that only match source text, enumerate a declarative schema or library's behavior, or replay embedded implementation logic add no independent evidence.

Use Red-Green-Refactor when a test meets that criterion. For migrations, configuration, generated output, runtime-only failures, or a behavior-preserving refactor with a pin, use the least costly applicable repro, equivalence check, trace query, contract check, or repository command.

Cache focused and final commands with their outcomes. Rerun them only when relevant inputs change. Before completion, inspect status and the complete diff, run the focused Proof and required final checks, and report every omitted check. When the Review Gate selects Local Review, bind those observed outcomes and omissions to its target commit and tree; stale Proof returns to this Gate instead of being rerun inside review.

**Complete when:** the selected Proof can expose the named risk; each added test uniquely exposes a named production failure at the highest-value affordable seam and earns its maintenance cost; every new abstraction hides current complexity; each refactor reduces at least one named reader-load dimension without moving the burden; final checks have no new failure; and residual risk is explicit.

## Review Gate

Finish Loop and PR-bound Implement or Debug work enter Local Review. Review mode follows an explicitly requested review workflow or uses Normal review. Non-PR Implement and Debug work is exempt unless the user requests independent review.

- **Requested review:** follow the named review skill and its target, authority, and completion contract.
- **Normal review:** the repository's review workflow, or this fallback: inspect every changed hunk, trace each candidate defect through its owning call path and relevant tests, and confirm or reject it with evidence.
- **Local Review:** follow [Local Review](references/local-review.md) once after deterministic Proof passes against the complete committed PR candidate and before draft publication. It owns the Codex Autoreview target, optional structural exception, one disposition and remediation pass, and Review Receipt.

Independent remote PR review remains a later delivery layer over the remediated published head. New product scope or unreviewed behavior after Local Review makes its receipt stale; finding, CI, and external-review remediation do not trigger another local pass.

**Complete when:** the Gate is exempt for a named reason, the requested review reaches its completion criterion, Normal review covers every changed hunk and disposes every candidate, or a complete Review Receipt accounts for Local Review and its resulting head.

## Delegation

The main agent owns synthesis and the final diff. Delegate only for lower latency or an independent evidence source.

Independent defect finding and readiness judgment occur only in the Review Gate. Implementation and Debug delegates return scoped code, observed facts, or deterministic verification results.

- Default to one wave of at most three children with disjoint questions or file surfaces.
- Give each child the goal or symptom, repository revision, established facts, commands and outcomes, Work Frame, authority, required evidence, and return shape.
- Research children return facts and citations, not readiness judgments. Implementation children receive disjoint file authority within the Task Worktree; the main agent alone writes Durable State.
- Merge each wave before opening another, name the remaining gap, and verify child claims against source or deterministic checks.

Escalate beyond one wave only for requested breadth or independent high-risk hypotheses.

**Complete when:** every child had disjoint authority and each returned claim is verified, merged, or rejected.

## Durable State

Persist when the user requests it, work must survive sessions, people or agents must coordinate, or a Finish Loop needs an external-action ledger. Otherwise keep state in the conversation.

Establish the Task Worktree before persisting. Use `<task-worktree>/.computa-please/`; it contains only:

```text
<task-slug>-tech-spec-YYYY-MM-DD.md
handoff.md
```

Reuse the tech spec. Keep the handoff append-only: add a dated section after material changes with the spec path, state, decisions, rejected approaches, Compatibility, Proof, external actions, residual risk, and next action. Store renderer-owned maps elsewhere and link them. Keep secrets, customer data, and private transcripts out of artifacts.

Account for `.computa-please/` in status checks, but keep this workflow-owned local state out of product diffs, commits, and PRs.

**Complete when:** no persistence condition applies and state remains conversational, or the Task Worktree's two-file directory accounts for every durable decision and action.

## Stop Cleanly

Merge requires recorded `merge-and-verify` authority in the active Finish Loop; otherwise obtain explicit approval. A Finish Loop never authorizes deploy or destructive data change. An external message requires explicit approval unless it is pre-recorded in an active Finish Loop review plan and action journal.

At the Human Gate, apply the [Plain-Language Pass](#plain-language-pass). A PR body keeps the PR Description Gate's schema; write its prose as plainly as that contract allows.
