# Review Rubric

Use this rubric while exploring. Follow the highest-friction areas; do not score every file mechanically.

## Friction Signals

Pay attention when you must:

- jump across multiple files to understand one behavior
- remember hidden call-order constraints
- inspect thin wrapper chains before reaching real logic
- trace one concept through inconsistent folders or names
- read tests to understand production boundaries

## Inspection Dimensions

### Project Structure

- Are concepts grouped by ownership and responsibility?
- Is the primary behavior discoverable quickly?
- Do docs, code, and tests align around the same boundaries?

### File Structure

- Does each file hide a coherent concept?
- Are related decisions colocated?
- Does one behavior require reading many neighboring files?

### Module Boundaries

- Is interface complexity lower than hidden implementation complexity?
- Do callers manage internal sequencing, retries, defaults, or invariants?
- Is the module mostly pass-through?

### Dependency Patterns

Classify dominant coupling:

- `Shared information`: same rule repeated in many places
- `Temporal coupling`: correct behavior depends on call order
- `Cross-layer leakage`: UI/domain/storage/transport details bleed across boundaries
- `Policy/mechanism mixing`: decisions tangled with plumbing

### Testing Surface

- Are key behaviors testable at a stable boundary?
- Are tests forced to mock deep internals?
- Would a deeper boundary reduce setup and increase confidence?

## Candidate Quality Filter

A strong candidate usually has:

- recurring real friction
- clear reduction in caller knowledge burden
- consolidation of multiple moving parts behind a clearer boundary
- compatibility with domain constraints
- simpler verification path

## Candidate Output Shape

```markdown
1. Candidate name
   - Cluster: files/modules/concepts
   - Why it is hard: concrete friction
   - Coupling pattern: one category
   - Deepening move: likely simplification
   - Test impact: what moves to boundary tests
   - Payoff: why now
```

## Design Option Prompts

- What is the smallest honest interface?
- What complexity can be hidden safely?
- Which dependencies belong inside vs. outside the boundary?
- How does the common caller get easier?
- What new risks appear if the boundary gets too broad?

## Stop Conditions

Do not promote a candidate when:

- pain is mostly naming or formatting noise
- current boundaries are already constrained for valid reasons
- proposed abstraction adds indirection without reducing knowledge burden
- recommendation depends mainly on speculative future use
