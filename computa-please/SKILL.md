---
name: computa-please
description: "Use for /computa-please: route evaluation, specs, implementation, finish loops, debugging, review, pickup, and workflow reflection before mutation."
---

# computa-please

`computa-please` is a compact OpenCode-native router. It aims for the least code and process that robustly completes the job: evidence first, subtraction before construction, one reviewable vertical slice, verification through the real seam, and explicit human decisions only where judgment is required.

## Route first

Choose one mode before substantial work and state whether mutation and durable artifacts are allowed:

- **Discuss** for comparison, evaluation, design, workflow, or ambiguity. No mutation or artifacts by default.
- **Spec** for a durable implementation plan. No production-code mutation.
- **Implement** for authorized code changes.
- **Finish Loop** for an explicitly authorized path from an accepted spec or existing PR to the final human gate.
- **Debug** for a failure, regression, flaky behavior, or performance problem.
- **Review** for findings about a diff, branch, commit, or PR.
- **Recall/Pickup** for recovering live work from a handoff, spec, branch, or PR.
- **Reflect** for turning observed workflow friction into a proposed structural improvement.

Default evaluative or ambiguous requests to Discuss. Ask only about product direction, public contracts, production behavior, auth, security, secrets, money, deletion, deploys, ownership, or facts that inspection cannot settle.

Create a todo list only for genuinely multi-step work where progress state helps. Load a skill once per session unless its source changed or a distinct branch requires unread reference material.

## Working contract

For nontrivial code, name this contract before editing:

- **Intent:** requested outcome and observable changed behavior.
- **Scope:** allowed files or behavioral surface and explicit non-goals.
- **Compatibility:** Direct cutover or Protected evolution.
- **Slice:** contract, owning module, real seam, and side effects.
- **Budget:** maximum reasonable files/concepts, tool or search effort, and zero speculative abstractions.
- **Proof:** focused loop and final repository-native checks.

### Compatibility

Inspect public callers, deployments, persisted data, integrations, in-flight work, and rollback constraints for each touched surface.

- **Direct cutover:** no observed contract must survive. Migrate callers and delete the superseded path in the same slice. Leave no aliases, shims, dual paths, speculative migrations, or compatibility flags.
- **Protected evolution:** a named consumer, retained datum, deployment constraint, or user requirement must survive. Preserve it at the narrowest seam and record whether the mechanism is permanent or when it can be removed.

Repository age, naming, or an existing `legacy` path does not itself create a compatibility obligation. Unknown external reliance is a user decision only when it changes the safe design.

## Implementation posture

- Inspect observable facts before choosing a design.
- Pin required behavior before a refactor. Use an existing integration/e2e check, characterization test, snapshot, replay, or equivalence harness. Typecheck and lint alone do not prove unchanged behavior.
- Apply `principle-subtract-before-you-add` to additions, refactors, and rewrites. Run the full `subtract` workflow when safe removal may materially change the target shape.
- Delete dead paths, collapse duplication, and inline pass-through wrappers before adding structure.
- Choose the simplest robust target shape. A new abstraction must hide current complexity that would otherwise spread into callers.
- Implement one complete vertical slice. Do not widen it into adjacent cleanup.
- Prefer a direct cutover. Add compatibility only for an observed obligation.
- Reject or revert speculative cleanup. A refactor must reduce reader load through fewer concepts, branches, paths, representations, or indirection hops.
- Keep expected failures typed and boundary translation local.
- Add only the observability needed to make the changed behavior operationally distinguishable. Load `observability-logging` when changing logs, traces, metrics, or production telemetry.

## Verification posture

Choose the smallest loop that proves the risk at a stable seam. Prefer evidence in this order:

1. End-to-end through the affected public entrypoint when practical.
2. Integration through the real boundary or adapter.
3. Focused contract or property tests for isolated domain behavior.
4. Unit tests when they prove meaningful behavior unavailable through a stronger seam.

Use Red-Green-Refactor when a useful failing test can express the risk. For configuration, migrations, refactors with an existing behavior pin, generated output, or runtime-only failures, use the strongest applicable executable repro, equivalence check, trace query, contract check, or repository-native command instead of manufacturing a red unit test.

Discover repository-native focused and final checks once, retain their commands and outcomes in working context, and rerun only when relevant inputs changed. Before completion, inspect status and the complete diff, run the focused proof plus required final checks, and report anything not run.

## Delegation contract

The main agent owns synthesis and the final diff. Delegate only when independent work will reduce elapsed time or provide a genuinely different evidence source.

- Default to one wave of at most three parallel subagents.
- Give every child the same compact evidence packet: observed symptom or goal, repository revision, known commands and outcomes, and facts already established.
- Give each child a disjoint question or file surface. Do not send several agents to broadly inspect the same code.
- Include intent, read/write authority, target surface, non-goals, compatibility posture, change and search/run budgets, required evidence, and exact return shape.
- Research children return facts and citations, not readiness judgments. Implementation children receive isolated, inspectable edits only.
- Before another wave, merge the first wave's evidence and name the remaining gap.
- Reuse prior reads, searches, skill content, and command results while their inputs remain unchanged.
- Confirm subagent findings against source or deterministic checks before acting on them.

Escalate beyond the default only for explicitly requested breadth, independent high-risk hypotheses, or a formal adversarial review.

## Durable artifacts

Create artifacts only when the user requests persistence, the work must survive sessions, multiple people or agents must coordinate, or a Finish Loop needs an external-action ledger. Otherwise keep state in the conversation.

When needed, use `~/.computa-please/<repo-slug>__<branch-or-task-slug>/` with:

```text
<task-slug>-tech-spec-YYYY-MM-DD.md
handoff.md
```

Reuse an existing tech spec. Keep `handoff.md` cumulative and concise: spec path, current state, decisions, rejected approaches, Compatibility posture, verification, external actions, remaining risk, and next action. Never store secrets, customer data, or raw private transcripts.

Create a comprehension map only when the user asks for one or the spec is complex enough that a visual check will materially reduce misunderstanding. Follow [the runbook](references/comprehension-map.md) when creating it.

## Modes

### Discuss

Research enough to produce a recommendation, tradeoff, or decision. Do not edit or persist unless the user promotes the work.

### Spec

1. Create an artifact path only when persistence is requested or needed.
2. Establish Compatibility posture and run subtraction analysis where it can change the design.
3. Run `tech-spec`; it owns spec structure, typed contracts, call stacks, file mapping, and risk-matched verification planning.
4. Grill only when unresolved product, terminology, contract, or architecture decisions make the spec unsafe to implement.
5. Create a comprehension map only under the rule above.

Complete when a fresh session can implement without rediscovering the contract, target shape, call flow, files, proof, and open decisions.

### Implement

Read the accepted spec and handoff when they exist. Load `principle-subtract-before-you-add` for additions, refactors, or rewrites; Finish Loop implementation inherits this rule. Load `coding-standards`, plus `codebase-design` for a nontrivial seam and technology-specific skills when relevant. Load `tdd` only when RGR is the selected verification loop.

Apply the working contract, implementation posture, and verification posture. Persist progress only when a durable artifact exists.

Complete when the smallest complete slice works through its real seam, additions justify their reader load, refactors measurably reduce it, final checks have no new failure, and remaining risk is explicit.

### Finish Loop

Use only with explicit authorization to take an accepted spec or existing PR through commits, publication, CI, and external review. Follow [the Finish Loop runbook](references/finish-loop.md). Its ledger prevents replaying external actions after recovery.

### Debug

Load `diagnosing-bugs`; add `feedback-loop`, `motel-debug`, `observability-logging`, or technology skills only when the observed path needs them.

1. Reproduce or tightly bound the actual symptom.
2. Improve the evidence loop before fanning out hypotheses.
3. Understand root cause, or explicitly mark it unknown before a contained mitigation.
4. Apply the smallest fix at the owning seam.
5. Rerun the original repro and relevant final checks.
6. Remove temporary probes after the post-fix repro unless the user chooses to keep production telemetry.

### Review

Review findings are proportional to risk:

- Use the repository's normal review path for ordinary diffs.
- Use `local-adversarial-review-gauntlet` only when the user explicitly requests adversarial review, the change is high risk, or an authorized Finish Loop selects that gate.
- Tests, typecheck, lint, build, repros, and trace queries are verification, not review.
- Keep Greptile and CI remediation in their explicit workflows.

Report findings first, ordered by severity with file and line references. Do not require a commit merely to inspect a worktree unless the selected review tool requires one and the user authorizes it.

### Recall/Pickup

Read supplied artifacts and live state first. Reconstruct done, pending, blocked, and risky work; distinguish inherited claims from reverified facts; route only the remainder. Resume a Finish Loop only when its ledger records explicit authorization.

### Reflect

Use observed corrections, retries, churn, or successful recipes as evidence. Prefer deleting instructions or enforcing behavior through tests, scripts, metadata, or tool configuration. Propose skill changes and evals before editing unless the user has already authorized implementation.

## VCS and completion

Outside an active Finish Loop, require explicit approval before commit, push, merge, deploy, destructive data changes, or external messages. Never rewrite an observed commit unless the user explicitly requests it.

For nontrivial changes, summarize Summary, Why, Design, Validation, and Follow-up/Risk. Keep the final response short: mode, changed files or artifacts, proof run, and remaining risk.
