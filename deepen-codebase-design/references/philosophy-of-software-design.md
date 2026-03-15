# Philosophy of Software Design

Use this file to calibrate judgment before proposing refactors. Apply the lens; do not copy the book.

## Core Objective

Good design reduces complexity. Complexity is anything that makes a system harder to understand or modify.

Track three manifestations:

- `Change amplification`: simple changes require edits in many places
- `Cognitive load`: too much information must be held at once
- `Unknown unknowns`: it is unclear what code matters or what might break

## Primary Lens

Prefer deep modules:

- simple interface
- substantial hidden capability
- reduced knowledge burden for callers

Watch for shallow modules:

- wrappers that mostly pass data through
- abstractions that force file-hopping to understand one behavior
- interfaces almost as complex as implementations

Depth matters more than line count.

## Principles

### Information Hiding

Hide design decisions inside boundaries. Leakage appears when the same rule must be remembered in many places.

Common leakage signs:

- repeated rules or policy checks across layers
- comments documenting caller sequencing constraints
- callers managing internal bookkeeping details
- tests that must reach through many seams to verify behavior

### Pull Complexity Downward

Prefer complexity in implementation over complexity in interfaces. If callers juggle flags, sequences, or defaults, consider redesigning the boundary.

### General-Purpose Boundaries Can Be Deeper

A stable concept boundary is often better than a caller-shaped utility. Avoid speculative generality; keep interfaces simple and grounded in real use.

### Define Errors Out of Existence

When practical, design APIs so callers do not handle avoidable edge cases. Eliminating fragile branches often beats documenting them.

### Strategic Programming

Do not optimize only for immediate coding speed. Invest where modest redesign now repeatedly reduces future effort.

## Red Flags (Heuristics, Not Laws)

- shallow modules
- information leakage
- pass-through methods
- conjoined methods that must be read together
- repeated branching/policy logic
- special-case logic embedded in general modules
- comments that restate code instead of intent or constraints
- vague names that hide real concepts
- interfaces exposing implementation details
- configuration knobs compensating for weak defaults

## Translation to Architecture and Structure

Use the same lens at project and file levels.

### Project Structure

Look for concept scattering across directories or mixed ownership boundaries.

### File Structure

Look for files that split one idea too thinly or combine unrelated mechanisms.

### Architecture

Look for cross-layer leakage where one layer must know internal policy of another.

## Misapplication Risks

Avoid these traps:

- equating deep with long methods
- splitting only to make functions smaller
- merging only to reduce file count
- adding abstractions for style purity
- turning context objects into grab-bags
- pushing one architectural style everywhere

The test is simple: does this reduce complexity for the next person who changes the system?

## Public Sources

- John Ousterhout's official book page: `https://web.stanford.edu/~ouster/cgi-bin/book.php`
- Official second-edition extract linked there
- Stanford CS 190 software design materials
- Public `aposd-vs-clean-code` discussion on GitHub
- Practitioner notes (secondary interpretation only)

Never use pirated PDFs or long copyrighted excerpts.
