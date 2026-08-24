---
name: feature-grill
description: Grill a bounded feature with unresolved product or behavioral decisions into a user-confirmed Feature Contract before a tech spec.
---

# Feature Grill

Turn a concrete feature idea into shared, reviewable decisions before writing a spec. This skill is design-only: keep the repository read-only and return the Feature Contract inline unless the user or calling workflow authorizes durable design artifacts.

Load and follow `grilling`; it owns the rounds, decision-tree frontier, question format, and rule that facts are the agent's job while decisions belong to the user. When durable glossary or ADR updates are authorized, load `domain-modeling` if the feature changes domain language, relationships, states, or invariants. Load `codebase-design` only when an interface or seam is genuinely unsettled.

## 1. Establish the feature frame

Inspect repository instructions, current behavior, relevant code, tests, docs, and any repository-local feature-readiness guidance they point to. Resolve discoverable facts through inspection; reserve questions for decisions.

Confirm the root decisions before opening dependent branches:

- actor or caller;
- trigger;
- observable outcome;
- current behavior or missing capability;
- goals and explicit non-goals;
- success signal.

If the request is still a broad product direction rather than a concrete capability, say what remains too broad and continue grilling only the decisions needed to name one feature. If the effort cannot fit in one design session, recommend the repository's large-effort planning flow instead of pretending the whole map is visible.

**Complete when:** the feature has a bounded observable outcome and the user agrees on what it intentionally does not do.

## 2. Work the feature decision tree

Use this default edge map to build the grilling design tree:

```text
feature frame
  -> behavior and domain
    -> reachable scenarios and system fit
      -> applicable operations and delivery behavior
        -> evidence
          -> delivery slices
```

Inspect facts for later branches in parallel, but expose user decisions only after their prerequisites settle. Branches may move earlier when they depend only on the frame; for example, an existing trust boundary can be settled alongside domain behavior. The bullets below are probes for applicable risks, not mandatory questions. Give a recommendation for every decision and let each answer reshape later questions.

### Behavior and domain

- canonical terms and actors;
- lifecycle states and transitions;
- invariants before, during, and after the feature;
- permissions, ownership, and visibility;
- calculations, ordering rules, and time semantics.

Use concrete scenarios to expose fuzzy language. When the code and the user's model disagree, surface the contradiction and ask which becomes canonical. When durable domain-document mutation is authorized, let `domain-modeling` own glossary and ADR updates.

### Scenarios and failures

- smallest happy path;
- boundary values and empty or missing states;
- rejected, interrupted, partial, duplicate, delayed, and retried operations;
- concurrency, ordering, idempotency, and transaction behavior when reachable;
- cancellation, expiry, and recovery;
- abuse, authorization, and trust-boundary failures.

Trace only failure scenarios reachable from the agreed behavior and dependencies.

### System fit

- interfaces and callers affected;
- source of truth, persisted state, schema evolution, and backfills;
- external dependencies and protocol assumptions;
- compatibility obligations grounded in current consumers, retained data, or deployments;
- privacy, security, and data-lifecycle constraints.

Choose direct cutover when inspection finds no obligation to preserve an old path. Preserve compatibility only for a named obligation and identify its removal condition when temporary.

### Operations and delivery

- rollout, enablement, migration, and recovery;
- partial-deployment or mixed-version behavior when applicable;
- operational questions needed to distinguish success, rejection, retry, cancellation, and failure;
- support or incident evidence needed without exposing sensitive data;
- performance or resource limits that change behavior.

State operational questions before proposing telemetry. Load `observability-logging` only when detailed signal design is needed.

### Evidence

- acceptance scenarios stated as observable behavior;
- strongest practical automated seam for each important risk;
- real integration or end-to-end boundaries that must be exercised;
- manual, runtime, migration, or deployment evidence that tests cannot supply;
- evidence explicitly deferred and the resulting risk.

Design proof here; leave test implementation to the later implementation workflow. A test count is not evidence unless each important behavior and failure has a proving surface.

### Delivery slices

- smallest end-to-end behavior that can ship and be verified independently;
- prerequisites that genuinely block it;
- follow-up slices and their dependency edges;
- adjacent cleanup and speculative infrastructure excluded from the feature.

Prefer vertical behavior slices over architecture-layer batches. Each slice must produce an observable result or retire a named risk.

## 3. Handle questions conversation cannot settle

When a state model, business-logic rule, or UI question needs runnable evidence, identify the exact uncertainty and recommend a bounded `prototype`. For protocol, migration, deployment, concurrency, or performance questions, name the repository-native experiment, repro, benchmark, or research needed instead. Keep the unknown explicit and keep this session within design; running the follow-up requires separate authorization.

Record each deferred decision with:

- why conversation cannot settle it;
- the evidence needed;
- who or what will produce that evidence;
- which downstream decisions remain blocked.

## 4. Close on a Feature Contract

When the grilling frontier is empty, render a `Draft` using [FEATURE-CONTRACT.md](FEATURE-CONTRACT.md) and ask the user to correct or confirm it. Explain an omitted branch only when the omission is non-obvious or risk-bearing. After confirmation, render the final dated contract with one terminal status:

- `Confirmed - Ready for Spec` when no unresolved decision changes observable behavior, trust, retained data, operability, proof, or the first slice;
- `Confirmed - Blocked` when any such decision still needs evidence or a user decision.

The session is complete only when:

- every applicable branch is resolved or explicitly deferred;
- unresolved decisions that change externally observable behavior, trust, retained data, operability, proof, or the first delivery slice appear as blockers;
- contradictions between the requested model and current system are resolved or visible blockers;
- the first slice is independently observable and verifiable;
- the user confirms the Feature Contract represents the shared understanding.

Return a blocked contract to the caller with its evidence needs. Hand only `Confirmed - Ready for Spec` contracts to `tech-spec` or the repository's specification flow. Confirmation records shared understanding; it does not authorize specification, implementation, or durable mutation.

Optimize for decisions and risks becoming visible before implementation; an automated review score is not a completion criterion.
