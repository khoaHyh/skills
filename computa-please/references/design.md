# Design

Use this for architecture, module seam, or pattern decisions that are expensive to reverse: public interfaces, stored data or wire formats, contracts between services, or seams many callers depend on. Decide cheaper ones directly, or settle them with a prototype when a run can answer the fork.

Adapted from pstack's `architect` and `arena` skills ([cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack), MIT).

## Frame

Ground with `explore`: owners, callers, invariants, constraints the design must honor, and the repository's established example of each pattern the design touches.

Before any candidate exists, write 3–6 gradeable criteria for this decision. Always include one for the agent contributor: the next change will come from an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repository.

## Candidates

Launch two writers in parallel with the same grounding and writer brief, in fresh contexts: `computa` from the primary's model family and `architect` from the judge's. Neither sees the other's output. Do not assign opposing stances or constraints; diversity comes from independent contexts and model families, not forced disagreement.

Writer brief, included verbatim after the decision and grounding:

> You are one of two independent writers producing a candidate design for this decision. Do not edit files. Produce the best design you can; do not hedge toward a safe middle or try to differ from another writer. Sketch, don't implement: types, signatures, and module layout, with placeholder bodies and pseudocode only where logic is tricky. Return:
>
> - `Usage`: written first. Two or three realistic call sites in the caller's code; the shape must agree with them.
> - `Shape`: data structures first, then signatures and module layout. Name the seam, the invariants the types encode, where input is validated, and each piece of state's single owner.
> - `Depth`: what the interface hides, what remains exposed to callers, and why the interface is no larger than needed.
> - `Extension`: how an agent that sees only the files it opened and copies the nearest example would make the next likely change, and why that path is right for the whole repository.
> - `Tradeoffs`: one line each, "we accept X in exchange for Y."
> - `Rejected`: one structurally different whole design you considered and why it lost.
> - `Open facts`: facts a run could settle that would change the design.

If a writer returns nothing usable, continue with the other candidate and say so.

## Judge

Label the candidates A and B in an order chosen independently of authorship, and strip any authorship or model reference from their text.

Score each candidate against every criterion and the red flags below, then record `Primary pick: <label>` with its decisive reason before reading the judge's verdict. Send `judge` the grounding, criteria, red flags, and labelled candidates, never the primary's pick; scoring can proceed while it runs.

## Decide

- **Same pick:** adopt that base. Graft at most two parts from the other candidate or the judge's sketch, rewritten so the result follows one design.
- **Split:** write the one fact or assumption the picks disagree on. Settle it with a prototype or probe when a run can; otherwise ask the user with a recommendation. Do not run debate rounds. When each judge picked its own family's candidate, treat the split as bias until the fact is settled.

Record `Decision: <label> (+ grafts); judges <agreed | split on <fact>, settled by <probe | user>>` in the session.

## Red flags

A red flag is a reason to revise or reject a shape.

- **Shallow module:** callers coordinate several calls for one operation, or options expose internal stages.
- **Information leakage:** one representation, policy, or wire type is known in more than one module.
- **Temporal decomposition:** modules split by execution order rather than by the knowledge they own.
- **Pass-through layer:** a method forwards the same shape without adding policy or adaptation.
- **Split ownership:** more than one module writes the same state or keeps its own copy.
- **Two ways to do one task:** agents copy whichever they find first, so both keep gaining callers.
- **Importable internals:** an outside caller can import internals, so the shortest compiling path bypasses the interface.
- **Hand-synced lists:** adding an item means editing several lists; derive them from one, or fail the build when they disagree.

## Scrap

During implementation, the same workaround in unrelated places, escape hatches needed to compile, or callers needing the module's internal rules mean the design is wrong. Stop, re-ground on what was built, and rerun this procedure; the new design should be smaller than the old before it grows.
