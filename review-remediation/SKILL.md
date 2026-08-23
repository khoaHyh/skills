---
name: review-remediation
description: Address an existing pull-request feedback set from any human or automated reviewer. Use when the user asks to remediate review comments, bot findings, security feedback, or a supervising loop supplies a fixed review snapshot. Researches primary sources before implementing the minimum durable, robust fix; it does not request another review.
---

# Review Remediation

Consume one frozen set of existing PR feedback, establish the truth of every finding, and remediate confirmed problems. Treat reviewer identity and delivery surface as metadata: humans, review bots, security tools, review bodies, inline comments, issue comments, and check annotations all enter the same workflow.

The run addresses existing feedback only. Do not request, trigger, or wait for another review unless the user explicitly starts a separate workflow.

## Inputs

- **PR** (optional): Number or URL. If omitted, detect it from the current branch.
- **Feedback selector** (optional): Review, comment, check, thread, or run IDs/URLs; reviewer identity; or an exact set supplied by a supervising loop.
- **Expected SHA or time window** (optional): Use when feedback must be attributable to a particular revision or request.

## Workflow

### 1. Freeze The Feedback Set

Identify the PR, branch, current head SHA, and provider. Collect feedback from every surface relevant to the selector. On GitHub this can include submitted reviews, review bodies, inline comments, issue comments, review threads, check runs, and annotations; other providers may expose different objects.

Selection rules:

- When exact IDs or URLs are supplied, use only those objects and their directly attached findings.
- When a reviewer and revision or time window are supplied, require feedback attributable to all supplied constraints.
- When only a reviewer is supplied, use that reviewer's currently open feedback.
- When no selector is supplied, use all currently open feedback on the PR, regardless of author or delivery surface.
- Exclude progress notices, eligibility notices, duplicate summaries, and other artifacts without a concrete claim, question, or requested change.
- Stop for ambiguous attribution instead of guessing which feedback the user intended.

Before mutation, record each selected item's stable ID or URL, author, source surface, body, and reviewed SHA or observed timestamp. State the selected reviewers and item count. This frozen set is the run's scope; later feedback is a separate run.

Completion: every in-scope item is identifiable and attribution is unambiguous.

### 2. Establish Each Finding

Read the PR goal, current diff, repository instructions, and the full code path implicated by each item. Reproduce claimed behavior when feasible. A reviewer's diagnosis and suggested patch are hypotheses, not implementation instructions.

Classify every item:

- **Confirmed**: evidence shows a behavior, correctness, security, or maintainability gap.
- **Already addressed**: the current head no longer has the reported gap.
- **Question or informational**: requires an answer or acknowledgement, not code.
- **Rejected with evidence**: the claim does not apply, conflicts with requirements, or would make the system worse.
- **Blocked**: remediation needs product intent, credentials, infrastructure, or another user decision.

Completion: every item has one disposition backed by code, runtime evidence, requirements, or authoritative documentation.

### 3. Research Before Editing

For each distinct mechanism involved in a confirmed finding:

1. Identify the exact language, library, framework, protocol, platform, or security control and the version used by the repository.
2. Consult current, version-matched primary sources: official documentation, API references, specifications, maintainers' source or tests, changelogs, and security advisories as applicable. Use third-party material only to find or clarify primary sources.
3. Extract the documented behavior, idiomatic extension point, constraints, and relevant edge cases. Compare them with established repository patterns.
4. Record the source links and the implementation conclusion they support. If no relevant primary source exists, record what was searched and use repository contracts plus direct evidence.

Research the underlying claim even when the reviewer supplied links. External guidance informs the fix but does not override repository requirements or the installed version.

Completion: every confirmed finding has enough current external guidance to identify the idiomatic implementation before code changes begin.

### 4. Apply Minimum Durable Robust Remediation

Implement the smallest semantic change that fixes the root cause:

- Put the invariant at the boundary that owns it rather than compensating at a caller or symptom site.
- Use documented public APIs and the repository's established architecture.
- Preserve unrelated behavior and avoid opportunistic refactors.
- Cover relevant boundary, failure, concurrency, and security behavior without speculative machinery.
- Add a regression test at the lowest stable public boundary when the finding exposes a reproducible behavior gap.
- Prefer deleting the faulty path over adding parallel state, branches, retries, suppressions, or special cases.

A remediation is **minimum** when no smaller semantic change fixes the confirmed problem, **durable** when it encodes the invariant at its owner using supported interfaces, and **robust** when it handles the evidenced boundary and failure modes. If only a workaround is currently possible, stop and report the constraint instead of landing the workaround.

Completion: every confirmed item is fixed at its root cause with no unrelated behavior or complexity added.

### 5. Verify And Respond

Run the focused reproduction or regression test for each fix, then the repository's relevant format, lint, typecheck, test, build, and security checks. Inspect the final diff against the PR goal and the frozen feedback set.

Re-fetch the selected items by stable ID before responding. For each item:

- Summarize the disposition and evidence.
- For a fix, name the root-cause change and verification.
- For a rejection, explain the concrete conflicting evidence.
- For a question, answer it directly.
- Use the provider's native reply and addressed/resolved state when available and permitted by repository convention.

Account for all selected items. Do not pull later reviews or unrelated comments into this run.

Completion: focused and relevant broader checks pass; every selected item has a disposition and response; addressed state is updated where supported; blocked or intentionally unresolved items are explicit.

## Reporting

Report the PR and head SHA, selected reviewers and item count, dispositions by count, fixes made, primary sources consulted, verification run, provider replies or state changes, and every blocked or unresolved item with its URL and reason.
