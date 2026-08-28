# Design Readiness Runbook

Use this runbook to decide whether a request is exempt, ready for direct work, or needs grilling. For a non-exempt request, this is a production-code read-only gate: inspect facts, expose consequential unknowns, and obtain the user's route choice before implementation. A user-selected `grill-with-docs` route may create or update only its authorized design documents while the implementation gate remains closed.

## 1. Decide whether the gate applies

Run the gate for a request that may introduce new behavior, change a public contract, alter domain rules or retained data, affect trust, security, money, deletion, deployment, or ownership, create or move an architectural seam, make a nontrivial refactor or redesign, or enter Spec/Implement without a user-confirmed contract.

The gate already passes when current evidence shows one of these conditions:

- Spec has a confirmed Feature Contract that settles the requested scope, or Implement has an accepted tech spec or equally explicit implementation contract, and the request stays within it;
- the change is local and mechanical, with an explicit outcome, boundary, and proof, and cannot change externally observable behavior, trust, retained data, or architecture;
- the mode is Review, Recall/Pickup, or Reflect;
- an authorized Finish Loop is executing its accepted scope;
- Debug is still gathering evidence or applying a contained fix that preserves every consequential surface named above.

In Debug, diagnose first. Return to this gate when the proposed fix crosses any trigger above. When applicability is uncertain, run the readiness test; uncertainty does not itself mandate a full grill.

**Complete when:** the request is either exempt for a named reason or enters the readiness test.

## 2. Test the request

Inspect the prompt, repository instructions, current behavior, relevant code, tests, docs, and accepted artifacts far enough to separate facts from decisions. Do not ask the user for a fact available through inspection.

Test all four claims:

1. **Right problem:** the beneficiary, current problem, intended outcome, and success signal are known; a requested mechanism has not been mistaken for the outcome; a smaller or no-build answer has been considered when plausible.
2. **Shared contract:** the actor or caller, trigger, observable result, scope, and non-goals are known, along with applicable failures, invariants, permissions, trust, data-lifecycle, and operational constraints.
3. **Coherent shape:** the likely owning seam, compatibility obligation, smallest vertical slice, and proving surface are known enough for the selected mode. Spec needs design decisions settled; Implement needs an accepted implementation boundary; Discuss may leave implementation details open.
4. **User authority:** every unresolved choice that can change product direction, observable behavior, domain language, public contracts, security, money, deletion, deployment, ownership, architecture, or durable artifacts is reserved for the user.

A claim passes only with evidence from the request, repository, or an accepted artifact. A plausible assumption is a gap, not evidence.

When all claims pass, state one concise readiness result naming the evidence, recommend **No grill**, and carry that recommendation into the user checkpoint. Do not ask content questions whose answers are already known.

**Complete when:** every claim is marked supported or reduced to a concrete decision gap.

## 3. Ask a calibration round

Every non-exempt request reaches one user checkpoint before substantial design or mutation. When all claims pass, ask only whether to accept the recommended **No grill** route or choose a grilling route. When a claim has a decision gap, ask one short round containing only the root decisions needed to choose the route. Ask at most three questions total, give a recommended answer and its reason for each, then wait. Adapt these probes rather than asking them mechanically:

- **Do we understand the request?** Restate the beneficiary, problem, trigger, outcome, and non-goals; ask the user to correct the model where evidence is missing or contradictory.
- **Are we building the right thing?** Separate the desired outcome from the proposed mechanism; present the strongest smaller, existing, or no-build alternative when one is credible.
- **How should we resolve the remaining design risk?** Name the unresolved decisions, recommend one route from the routing table, and ask the user to accept or change it.

Follow `grilling`'s question discipline: facts belong to the agent, decisions belong to the user, dependent questions wait for a later round, and every recommendation remains overridable. The calibration round is a checkpoint, not a compressed substitute for a selected grilling flow.

Re-run the readiness test after the answers. The user may explicitly accept named defaults or risks; record that choice rather than silently filling gaps. Consequential unknowns still awaiting facts or a user decision block Spec and Implement.

**Complete when:** the user has selected a route and any route-blocking root decision is answered.

## 4. Route the design work

Apply the route selected by the user. Recommend the narrowest flow that owns the remaining uncertainty, with this precedence:

- **No grill:** all readiness claims are supported, or the user confirms named defaults for a bounded, low-risk request.
- **`feature-grill`:** any concrete feature that still has unresolved product behavior, non-goals, domain rules, failure behavior, trust, operability, evidence, or delivery slices. It remains the owner when the feature also changes domain language or invariants. Resume Spec only with `Confirmed - Ready for Spec`; resume Implement only through an accepted spec or an equally explicit implementation contract.
- **`grill-with-docs`:** standalone domain-model or ADR work that does not need a Feature Contract and changes canonical language, relationships, states, invariants, or a durable architectural decision. Confirm permission before it mutates glossary or ADR artifacts.
- **`grilling`:** the unresolved decision is broader than one feature contract and does not require durable domain documents, such as an architecture direction, workflow, build-versus-buy choice, or engineering policy.

Load and follow the selected skill; it owns its rounds and completion criteria. Do not collapse a full grill into the calibration round. After it completes, re-run the readiness test and return to the selected computa-please mode only when the user confirms the resulting shared understanding.

**Complete when:** Design Readiness passes with cited evidence, the selected grill has reached its own completion state, or the request is explicitly blocked with the missing decision or evidence named.
