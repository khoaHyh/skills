# Feature Contract Template

Use this template only after the grilling frontier is empty. Compress sections that are genuinely small; preserve explicit non-goals, invariants, failure behavior, evidence, and open decisions.

```md
# <Feature Name>

Status: Draft | Confirmed - Blocked | Confirmed - Ready for Spec

## Outcome

- Actor or caller:
- Trigger:
- Observable result:
- Current behavior:
- Success signal:

## Goals and Non-Goals

### Goals

### Non-Goals

## Domain Model

- Canonical terms:
- States and transitions:
- Invariants:
- Ownership, permissions, and visibility:

## Scenarios

### Happy Path

### Boundaries and Rejections

### Failure, Retry, and Recovery

### Concurrency and Ordering

## System Fit

- Affected callers and interfaces:
- Source of truth, persisted state, schema evolution, and backfills:
- Dependencies and protocol assumptions:
- Compatibility obligations:
- Security, privacy, and data lifecycle:

## Operations

- Rollout and enablement:
- Recovery or rollback:
- Operational questions and existing evidence:
- New telemetry needed, if any:
- Performance or resource limits:

## Evidence

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
