# Design Readiness

Use when a consequential decision remains unresolved or the user requests a design interview. A clear, bounded change request or accepted contract is sufficient authority to proceed within scope; a separate spec and a confirmation of "No grill" are not prerequisites.

## Find The Decision

Separate facts you can inspect from choices the user owns. Determine what is missing from the outcome and success signal, observable behavior and non-goals, affected invariants, compatibility obligations, owning seam, and proving surface. Read only the context needed to resolve those gaps.

Ask when an unresolved choice changes product direction, public contracts, domain rules, security, money, retained data, deployment, ownership, architecture, or the authority to create durable artifacts. Choose routine implementation details within the accepted boundary yourself. Review, recovery, and evidence-gathering Debug do not require design approval; a fix returns here only when it exposes such a choice.

When the request and evidence settle these decisions, continue the selected mode. Otherwise name the blocking decision, recommend the smallest defensible option, and ask only what is needed to resolve it. Keep the affected design or implementation read-only until answered; continue independent authorized work when useful. Record explicitly accepted defaults or risks rather than silently assuming them.

## Route Unresolved Design

For a bounded decision, a direct question is enough. When an interview is needed, recommend the narrowest route and let the user choose:

- **`feature-grill`:** a concrete feature with unresolved product behavior, non-goals, domain rules, failures, trust, operability, evidence, or delivery slices, including features that change domain language. It owns the Feature Contract and its confirmation.
- **`grill-with-docs`:** standalone domain-model or ADR work requiring canonical language, relationships, states, invariants, or durable architectural decisions, but not a Feature Contract. Confirm authority for glossary or ADR writes.
- **`grilling`:** a broader architecture, workflow, build-versus-buy, or engineering-policy decision that needs neither a Feature Contract nor durable domain documents.

Follow the selected skill's rounds and completion criteria. A confirmed Feature Contract settles product behavior; use Spec when implementation boundaries still need an architecture handoff. Resume the selected mode once its decisions are settled, without another approval of the same scope.

**Ready when:** the requested outcome, consequential constraints, implementation boundary needed by the selected mode, and authority are supported by the request, evidence, or explicit user decisions. Otherwise report the specific missing decision or evidence.
