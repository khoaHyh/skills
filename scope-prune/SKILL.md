---
name: scope-prune
description: "Prune a completed implementation or PR back to the minimum durable change for its agreed problem. Use when asked what went beyond scope, whether the diff is too large, or to cut speculative behavior and tests after implementation."
---

# Scope Prune

Start with the problem, not the patch. The target is the smallest durable implementation of the **agreed outcome**, not the fewest lines and not a general cleanup of nearby code.

## 1. Recover the boundary

Find the accepted problem and observable result in the conversation, ticket, issue, Feature Contract, spec, or PR context. Separate agreed behavior from suggested mechanisms, and record the in-scope failure path, non-goals, real compatibility obligations, and proof needed to know the problem stays solved. If the boundary is missing or contradictory, ask for the decision that would change what can be removed; do not infer product intent from the implementation or its tests.

Establish the requested diff baseline before judging size. For a PR or branch, include commits since the intended base plus staged, unstaged, and relevant untracked work; distinguish inherited and unrelated changes. For a narrower target, follow the user's range. Use [`subtract`'s Change Scopes](../subtract/references/change-scopes.md) to protect the index and history when editing staged or committed work.

## 2. Challenge the entire diff

Inspect every changed surface, including production code, tests, fixtures, docs, configuration, and generated output. Trace additions through their callers and the accepted failure path. For each coherent change, classify it as:

- **Essential:** directly delivers the agreed result.
- **Necessary support:** required for that result to work safely in a realistic supported path, including a named compatibility, security, or data-integrity obligation.
- **Extra:** adjacent feature, speculative guard or fallback, generalized abstraction, redundant representation, broad refactor, or test that proves only an extra behavior or mirrors code without closing a risk.
- **Uncertain:** removal depends on missing contract or consumer evidence.

Put the burden on additions: what concrete failure of the agreed outcome would removing this introduce? A passing test, an imaginable edge case, or “while we're here” is not an answer. Trace coupled extras as a group: deleting an unneeded behavior may also delete its validator, branch, fixture, test, and documentation. Conversely, preserve the smallest mechanism that satisfies a real obligation; do not turn scope control into a brittle fix.

## 3. Cut and prove

An explicit request to scope the implementation down authorizes the supported edits. Otherwise return the ranked cuts and their evidence before changing code. Delete extra behavior and its dependent artifacts first, then collapse or narrow remaining machinery. Keep unrelated work intact; make follow-up suggestions instead of implementing them. If an uncertain item changes the product contract or risk posture, leave it intact and ask the smallest necessary question.

Treat every added test as part of the diff to justify. Keep it when it detects a meaningful regression in the agreed outcome or a distinct, realistic failure that existing tests would miss. Remove tests for behavior being cut, duplicated coverage, speculative permutations, and reversible, low-impact edits where the test merely mirrors the implementation. A passing test does not justify keeping either the test or the behavior it asserts. Run focused tests appropriate to the surviving change and complete required checks. Broaden or repeat testing only when a new edit, failure, or unresolved risk invalidates that evidence. Inspect the complete final diff and status; passing checks cannot substitute for the scope judgment.

Finish with a concise accounting: agreed outcome, baseline, cuts made or proposed, why each retained non-obvious addition is necessary, before/after footprint by meaningful surfaces, verification, and unresolved boundary decisions. Stop when every changed surface has a disposition, the agreed behavior has evidence, and unrelated work is untouched. If no cut is justified, say why the size is necessary.
