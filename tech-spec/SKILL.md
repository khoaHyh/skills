---
name: tech-spec
description: Write an implementation-ready typed call-stack architecture handoff. Use when the user requests a tech spec, durable implementation plan, API design, module design, or phased engineering plan.
---

# Tech Spec

A tech spec makes implementation decisions reviewable before code changes. Prefer typed contracts and call stacks over broad prose. This skill is design-only: do not implement.

Return the spec inline unless the user requests a file or the calling workflow provides an artifact path.

## 1. Establish evidence

Inspect the request, repository instructions, relevant code, tests, docs, and runtime constraints. Reuse the project's vocabulary and existing patterns for types, errors, adapters, telemetry, and tests.

Record:

- current behavior and problem;
- users or callers;
- goals and non-goals;
- invariants and constraints;
- affected entrypoints and side effects;
- Compatibility posture and its evidence;
- operational risks and open decisions.

Inspect discoverable facts instead of asking. Keep unresolved product or architecture decisions as open questions rather than inventing them.

Choose **Direct cutover** when no observed external behavior, retained data, deployment constraint, or user requirement must survive; the spec must leave one path. Choose **Protected evolution** only for a named obligation and keep its compatibility mechanism at the narrowest seam with a permanent status or removal condition.

**Complete when:** every requirement and constraint is grounded in user input, code, docs, runtime evidence, or an explicit open question.

## 2. Name the smallest complete slice

Define one end-to-end behavior from ingress to observable result. State what is intentionally outside the slice and give it a rough file/concept budget.

For an addition, refactor, or rewrite, inspect what can be deleted, collapsed, inlined, or narrowed before proposing new structure. For a refactor, pin current behavior and require a measurable reduction in reader load. A refactor that changes behavior must be split or renamed as a feature or fix.

**Complete when:** the slice can ship and be verified independently, and speculative infrastructure is excluded.

## 3. Compare designs when the seam matters

Generate materially different alternatives only when interface shape, ownership, runtime topology, or module seams are genuinely unsettled. Small or locally conventional changes may state one chosen design and why alternatives would add no useful information.

Compare applicable options on caller burden, reader load, module depth, locality, boundary translation, failures, cancellation, operational fit, and implementation cost.

**Complete when:** the recommendation follows from observed constraints rather than a mandatory option count.

## 4. Specify contracts

Show every added, changed, or deleted contract that callers must understand, using TypeScript pseudocode where useful:

- domain values, refined types, and lifecycle states;
- application inputs and outcomes;
- expected tagged failures;
- public functions, modules, routes, or messages;
- boundary parsers and projections;
- application-owned ports and concrete adapters;
- persistence or protocol records;
- compatibility mechanism and removal condition, when required.

Name what each seam hides. Do not add a port, adapter, wrapper, or configuration point for a hypothetical second implementation.

**Complete when:** each changed boundary has a concrete contract or an explicit reason none is needed.

## 5. Trace call stacks

Trace each changed behavior from public entrypoint to side effects and response:

```text
raw input
  -> boundary parser
  -> domain/application input
  -> owning module
  -> external adapter or persistence
  -> typed outcome
  -> boundary projection
  -> observable result
```

Include current versus proposed flow when behavior moves. Add failure, authorization, transaction, idempotency, retry, cancellation, and resource-lifecycle branches only when reachable.

For observability, state what operational question must become answerable. Specify spans, events/logs, metrics, and safe fields only when existing signals cannot distinguish the relevant outcome. Use `observability-logging` for detailed policy.

**Complete when:** no affected behavior disappears between the contract sketch and an unnamed side effect.

## 6. Map files

List files or modules to add, change, and delete. Give each one a single responsibility in the proposed call stack. Prefer deleting superseded files and APIs in the same slice over leaving old and new paths.

**Complete when:** every contract and call-stack step has an owner, and every proposed file earns its existence.

## 7. Plan risk-matched verification

Choose the strongest practical evidence in this order:

1. End-to-end through the affected public entrypoint.
2. Integration through the real boundary or adapter.
3. Focused contract or property tests for isolated domain behavior.
4. Unit tests for meaningful behavior not covered by a stronger seam.

Use Red-Green-Refactor when a useful failing test can express the risk at a stable seam. Do not manufacture red unit tests for configuration, migrations, generated output, behavior-preserving refactors with an existing pin, or runtime-only failures. Use an executable repro, characterization test, replay, equivalence harness, trace query, contract check, or repository-native command as appropriate.

For each risk, name:

- the command or test surface;
- why it can fail before the change or otherwise prove the contract;
- focused iteration check;
- final repository-native checks;
- any evidence that cannot be automated.

**Complete when:** every changed public behavior, invariant, important failure path, and real boundary has a proof or a concrete reason it cannot be tested.

## Required output

Use this shape, compressing or omitting sections that do not apply:

```md
# <Title>

## Summary
## Current State
## Goals and Non-Goals
## Invariants and Constraints
## Compatibility Posture
## Reviewable Slice
## Alternatives and Recommendation
## Typed Contracts
## Call Stacks and Data Flow
## Files to Add / Change / Delete
## Observability
## Verification Plan
## Risks and Open Questions
```

The result is implementation-ready when another engineer can identify the exact behavior, target shape, contract changes, call flow, file ownership, proof, and unresolved decisions without repeating discovery.

## Writing rules

- Types and call stacks define what; prose explains why.
- Prefer one source of truth. Point to a section instead of restating it.
- Use project vocabulary and direct file paths.
- Keep unknowns visible.
- Keep the design proportional to the changed behavior.
- Sequence safe deletion before construction and leave one path after a Direct cutover.
