# Comprehension Map Runbook

Use this runbook only at a Spec checkpoint. Build a concise visual projection of the tech spec for a developer who needs to understand the change without reading the full architecture handoff.

## Source discipline

Derive every claim from the tech spec or observed code. Mark missing information as `Unknown` and irrelevant areas as `Not applicable`. When the map and spec disagree, correct the spec first and regenerate the map.

## Delivery

- When Executor MCP artifact tools are available, create one saved artifact at the Spec map checkpoint and update that same artifact in place after spec revisions. Record its artifact ID or link in `handoff.md`.
- Otherwise, load `plannotator-visual-explainer`, use its Visual explainer path, and open it through the informational annotation flow. The Spec checkpoint owns approval. Record the HTML path and accepted annotations in `handoff.md`.

## Content

Show these views:

- **Business outcomes:** a visual chain from problem to capability or feature to business result. For a refactor, show the business capability, delivery benefit, reliability gain, or cost reduction it enables. State when there is no direct user-facing feature.
- **Guardrails:** what must stay true and what must never happen, translated from the spec's invariants.
- **Domains:** the business concepts and relationships touched by the change, using the codebase's ubiquitous language. Briefly define only terms a developer may not recognize.
- **Routes:** every added, changed, or removed route, with method/path or equivalent entrypoint and one plain-language responsibility.
- **Services:** every added, changed, or removed service module, with its exact code name and one plain-language responsibility.
- **Data:** what is stored, which schema elements or migrations change, and whether existing data is transformed. State `No database change` when true.
- **Before and after:** one compact flow through routes, services, and data. Include external systems only when they are affected.

## Visual rules

- Use diagrams, flow charts, and compact labeled groups as the primary language.
- Keep each label or explanation to one sentence.
- Leave typed contracts, exhaustive call stacks, file inventories, and the full test plan in the tech spec.
- Label each route, service, and data item as `Add`, `Change`, `Remove`, `Unchanged`, `Unknown`, or `Not applicable`. Do not rely on color alone.
- Prefer business and codebase vocabulary over architecture jargon. Define an unavoidable unfamiliar term where it appears.

## Completion check

Confirm all of these before showing the map:

- Every applicable content view is present; any omitted view is labeled `Not applicable` with a short reason.
- Every added, changed, or removed route, service module, and data/schema item in the tech spec appears with an explicit status.
- The before-and-after route-to-service-to-data flow is visual rather than prose-only.
- Diagrams, flows, or labeled groups carry the main explanation; prose only clarifies them.
- The map contains no unsupported claim or known disagreement with the tech spec.

Within 30 seconds, a developer can identify:

1. Why the work matters.
2. Which capabilities or features result.
3. What must stay true and what must never happen.
4. Which business domains are involved.
5. What changes across routes, services, and data.
6. Whether the database schema or existing data changes.
