---
name: deepen-codebase-design
description: Explore a codebase to find architectural and structural complexity using John Ousterhout's Philosophy of Software Design. Use when the user wants to improve project structure, file structure, module boundaries, patterns, practices, information hiding, testability, or refactoring strategy, especially when the goal is to create or update an RFC artifact under docs/.
---

# Deepen Codebase Design

Explore a codebase the way an experienced maintainer would: follow friction, identify complexity, and turn the strongest refactor direction into an RFC artifact under `docs/`.

Favor deeper modules, simpler interfaces, lower cognitive load, and better information hiding.

## Read Order

1. Read `references/review-rubric.md` before exploring.
2. Read `references/philosophy-of-software-design.md` when calibrating Ousterhout concepts and anti-patterns.
3. Read `references/rfc-template.md` only when drafting or updating the RFC artifact.

## Core Contract

Follow this lifecycle:

1. Explore the codebase organically and note architectural friction.
2. Present a short ranked list of improvement candidates.
3. Ask the user which candidate to explore.
4. Frame the chosen problem space and constraints.
5. Design multiple interface or boundary options in parallel.
6. Recommend one direction.
7. Create or update an RFC artifact under `docs/`.
8. Stop.

Never create GitHub issues in this skill.
Do not refactor production code unless the user explicitly asks for implementation after the RFC.

## Exploration Rules

Use friction as signal. Look for places where:

- understanding one concept requires bouncing across too many files
- modules are shallow, thin, or mostly pass-through wrappers
- the same knowledge leaks across files, layers, or functions
- project or file structure causes accidental complexity
- tests focus on seams created by over-decomposition instead of meaningful boundaries
- exceptions, configuration, or branching push complexity onto callers
- comments, names, or control flow hide important constraints

Evaluate findings with `references/review-rubric.md`.

## Candidate Presentation

Present 3-5 numbered candidates. For each candidate, include:

- `Cluster`: files, modules, or concepts involved
- `Why it is hard`: concrete complexity or friction
- `Coupling pattern`: shared information, temporal coupling, cross-layer leakage, or policy/mechanism mixing
- `Deepening move`: likely simplification path
- `Test impact`: what verification can move to a cleaner boundary
- `Payoff`: why this candidate matters now

Do not propose concrete interfaces yet. End with: `Which of these would you like to explore?`

## Chosen Candidate Workflow

After the user picks a candidate:

1. Explain the problem space in user-facing language.
2. State constraints any redesign must satisfy.
3. Identify dependencies to rely on, hide, or isolate.
4. Show a rough illustrative sketch to ground constraints. This is not the final proposal.

Then proceed immediately to parallel design work.

## Parallel Design Work

Launch at least 3 subagents in parallel using `Task`. Give each one relevant paths, coupling notes, and a different design pressure:

- minimize interface surface area and entry points
- maximize flexibility for multiple callers or extensions
- optimize for the most common caller and default flow
- when relevant, isolate external dependencies behind an adapter boundary

Require each subagent to return:

1. interface or module shape
2. usage example
3. complexity hidden internally
4. dependency strategy
5. trade-offs and likely failure modes

Present options sequentially, compare them, then recommend one. Be opinionated.

## RFC Artifact Rules

Final deliverable: an RFC artifact under `docs/`.

Before creating a new file:

1. Inspect `docs/` for existing related RFC/ADR/design docs/refactor plans.
2. If related documentation exists, update that document instead of creating a duplicate.
3. If no related document exists, follow repository docs conventions.
4. If no convention is visible, create `docs/rfcs/<slug>.md`.

Use `references/rfc-template.md` for structure.

The RFC must capture:

- problem and current friction
- design constraints
- options considered
- recommendation and rationale
- migration plan
- verification plan
- risks, rollback, and open questions

## Safety Boundaries

- Do not treat small files as a problem by default; shallow boundaries are the problem.
- Do not force deeper modules when callers need explicit semantics.
- Do not recommend abstractions only to satisfy a pattern or ideology.
- Do not reproduce long copyrighted excerpts from the book.
- Preserve existing product and domain constraints.

## Trigger Examples

- `Audit this codebase for architectural complexity using Ousterhout's philosophy.`
- `Find module-boundary refactors that would make this repo easier to change.`
- `Show deep-module opportunities in this project structure.`
- `Turn the best candidate into an RFC under docs/.`

## Resources

- `references/review-rubric.md` - audit checklist and scoring lens
- `references/philosophy-of-software-design.md` - Ousterhout concepts, cautions, and public-source notes
- `references/rfc-template.md` - RFC artifact contract for `docs/`
