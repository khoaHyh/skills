---
name: feature-grill
description: Settle unresolved product behavior for a bounded feature, stopping when the selected delivery can be implemented and proved.
---

# Feature Grill

Settle the product choices needed for the selected delivery. A clear request needs no interview. Keep the affected implementation read-only while a blocking choice remains; continue independent authorized work.

## Inspect Before Asking

Recover the actor, trigger, requested result, explicit decisions, non-goals, and success signal. Read the relevant issue, comments, linked decisions, affected code, and existing proof. Search available Slack or Notion context only for a specific remaining intent gap. Facts and routine implementation choices are the agent’s work.

Ask through the question tool only about unsettled choices that change this delivery’s observable behavior, domain rules, public contract, trust, retained data, or consequential risk. Explain why inspection cannot settle the choice, recommend a concrete answer, and give meaningful alternatives. Reuse answered decisions rather than asking for confirmation again.

## Bound The Interview

Choose the smallest complete delivery with an independently observable result. Challenge contradictions and missing behavior on that supported path. Examine permissions, failure handling, concurrency, compatibility, rollout, or operations only when an actual affected obligation makes them relevant. A product rule does not mandate a proposed controller, recovery system, or migration tool.

Stop asking when the selected delivery can be implemented and verified without another product decision. Later capabilities stay deferred; they do not keep this interview open. Use exhaustive `grilling` only when the user explicitly requests a broader stress test.

If a blocker needs empirical evidence, name the exact uncertainty and the smallest useful repository-native repro, experiment, or research step. Run it only within existing authority. Use `codebase-design` for a genuinely unsettled seam and `domain-modeling` for requested glossary or ADR work, not to create additional stages.

## Return And Resume

Summarize the accepted boundary inline using [FEATURE-CONTRACT.md](FEATURE-CONTRACT.md), omitting empty sections. Ask for acceptance only of choices or a proposed boundary the user has not yet accepted. Mark it **Ready** when no decision or evidence gap blocks this delivery, otherwise **Blocked** with what would unblock it. A ready delivery can still have deferred later decisions.

Write a durable contract only when requested or authorized for recovery/coordination. A standalone design request ends here. When the calling task already authorized implementation, resume it within the accepted boundary; this checkpoint neither cancels that authority nor grants new publication or operational permission.
