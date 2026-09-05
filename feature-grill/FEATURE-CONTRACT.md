# Feature Contract Template

Draft the contract after every applicable decision is resolved or explicitly deferred. Delete inapplicable rows and compress small sections, but preserve non-goals, invariants, reachable failure behavior, compatibility obligations, evidence gaps, and blockers.

```md
# <Feature Name>

Status: Draft | Confirmed - Blocked | Confirmed - Ready for Spec

## Outcome And Scope

- Actor or caller:
- Trigger:
- Observable result:
- Current behavior:
- Success signal:
- Goals:
- Explicit non-goals:

## Domain Model

- Canonical terms:
- States and transitions:
- Invariants:
- Ownership, permissions, and visibility:
- Calculations, ordering, and time semantics:

## Reachable Behavior

| Scenario | Preconditions or trigger | Observable result | Rejection, failure, or recovery behavior |
| --- | --- | --- | --- |

Include the happy path and applicable boundaries, rejection, interruption, partial or duplicate work, delay, retry, cancellation, expiry, concurrency, authorization, recovery, and abuse cases.

## System Fit And Operations

- Affected callers and interfaces:
- Source of truth, persisted state, schema evolution, and backfills:
- Dependencies and protocol assumptions:
- Compatibility posture: Direct cutover | Protected evolution - <named obligation; permanent support or removal condition>
- Security, privacy, and data lifecycle:
- Rollout, mixed-version behavior, migration, and recovery:
- Operational questions and existing evidence:
- New telemetry needed, if any:
- Performance or resource limits:

## Proof

| Risk or behavior | Proving surface | Expected evidence | Remaining gap |
| --- | --- | --- | --- |

## Delivery Slices

| Slice | Observable result or risk retired | Prerequisites | Verification | Depends on / Follow-up |
| --- | --- | --- | --- | --- |

Excluded cleanup or speculative infrastructure:

## Deferred Decisions

| Decision | Evidence needed | Owner or method | Blocks |
| --- | --- | --- | --- |

## Blockers

| Blocker | Needed to unblock |
| --- | --- |

## Confirmation

- User-confirmed shared understanding:
- Confirmation date:
```
