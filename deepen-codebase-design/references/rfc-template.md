# RFC Template

Use this template for the final artifact under `docs/`.

## Placement Rules

1. Inspect `docs/` for related RFCs, ADRs, design notes, or refactor plans.
2. If related documentation exists, update that file instead of creating a duplicate.
3. If none exists, follow repository docs conventions.
4. If no convention is visible, create `docs/rfcs/<slug>.md`.

## Template

```markdown
# RFC: <title>

- Status: Proposed
- Owner: <team or person if known>
- Related code: <paths>
- Related docs: <existing docs reviewed or updated>

## Summary

<One paragraph describing current complexity and the proposed deepening move.>

## Problem

- What is hard today?
- Where does change amplification occur?
- What callers/readers must know that they should not need to know?

## Current Friction

- <example 1>
- <example 2>
- <example 3>

## Constraints

- <domain constraint>
- <technical constraint>
- <migration constraint>

## Options Considered

### Option 1: <name>

- Shape:
- Benefits:
- Risks:

### Option 2: <name>

- Shape:
- Benefits:
- Risks:

### Option 3: <name>

- Shape:
- Benefits:
- Risks:

## Recommendation

<State one recommended option and why it best reduces complexity.>

## Proposed Design

### Boundary

<Describe the desired module or architectural boundary.>

### Hidden Complexity

<List details callers should no longer manage.>

### Dependency Strategy

<What stays outside, what moves inside.>

## Migration Plan

1. <step>
2. <step>
3. <step>

## Verification Plan

- Boundary-level tests to add or simplify
- Manual verification if needed
- Success signals

## Risks and Rollback

- Risk:
- Mitigation:
- Rollback approach:

## Open Questions

- <question>
```

## Writing Notes

- Prefer concrete file paths and examples.
- Keep the recommendation opinionated.
- Explain why the new boundary is deeper, not just different.
- Name the complexity being removed.
