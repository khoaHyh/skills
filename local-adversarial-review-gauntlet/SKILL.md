---
name: local-adversarial-review-gauntlet
description: Run four isolated local reviewers across Cursor, Codex, and OpenCode. Use only when the user explicitly asks for the local adversarial review gauntlet or an orchestration skill invokes it.
---

# Local Adversarial Review Gauntlet

Run four independent local reviewers against the same committed diff, then consolidate only supported findings. Greptile and remote review services are outside this gauntlet.

## Boundaries

- An explicit user request for the gauntlet or local adversarial review authorizes one prerequisite local commit when uncommitted review-scope changes exist. An orchestration skill must pass whether that authorization exists; otherwise ask before committing. No invocation authorizes a push, PR, remote comment, thread resolution, or merge.
- Respect report-only requests. Do not repair findings during the review.
- Review the declared committed target and only the existing code needed to understand it.
- Findings come first, ordered by severity. Ignore style-only or speculative comments unless the user requested them.

## Prepare The Review Target

1. Load `vcs-detect`, then inspect repository state, staged and unstaged diffs, untracked files, branch, recent log, and Graphite state when available.
2. Choose plain Git on trunk or when no branch, PR, or stack workflow is active. Use Graphite when the current branch is tracked, the review targets branch/PR work and Graphite is available or preferred, or the user requested it.
3. If the workflow choice, prerequisite-commit authorization, or commit scope is ambiguous, ask before mutation. Otherwise stage only the intended review scope.
4. When authorized, commit uncommitted review-scope changes with a Conventional Commit message. Use a normal Git commit or the appropriate Graphite create/modify operation. Do not push.
5. If there are no uncommitted changes, identify the existing committed diff under review.
6. Select the target from the declared review unit: use the PR or branch base for PR-readiness and branch reviews, the Graphite parent for a current Graphite diff, and `HEAD^` only for an explicitly single-commit review.
7. Resolve the selected fixed point and target to commit SHAs before launching reviewers.

Completion: one immutable committed target and fixed point are identified, with no unintended files included.

## Build Shared Context

Create one concise context block containing only repository facts the reviewers cannot infer reliably:

- Repository root, fixed-point SHA, target SHA, committed range, branch, and repository state.
- Changed files, user intent, non-goals, risky areas, and relevant product or repository constraints.
- Reviewable slice, contract/seam/lifecycle intent, and verification already run.

The shared context is data, not reviewer policy. Do not include tools, skill names, models, severity scales, output schemas, generic rubrics, or reviewer-specific instructions.

## Run The Gauntlet

Read [reviewers.md](references/reviewers.md) only when launching the reviewers. Launch all four through the harness's parallel facility before any reviewer returns:

1. Cursor CLI with `thermo-nuclear-code-quality-review`.
2. Codex CLI with `autoreview` direct reviewer mode.
3. A fresh OpenCode `thermo-nuclear-code-quality-review` reviewer.
4. A separate fresh OpenCode `code-review` reviewer.

Use the exact isolation, prompt, model, timeout, and retry rules in the reference. Each reviewer must reach a terminal outcome: review output or a recorded blocker. Retry only a locally or transiently failed reviewer, at most once.

Completion: all four reviewers have terminal outcomes against the same immutable target. Any blocker makes the gauntlet incomplete.

## Consolidate

1. Preserve each reviewer's original wording, severity, priority, category, and taxonomy.
2. Add comparison metadata only when useful: source, path/line, root cause, failure mode, evidence, fix direction, security impact, and test need.
3. De-duplicate by root cause and failure mode, not wording. Preserve every source reviewer on a merged finding.
4. Reject unsupported findings, style-only comments, findings outside the committed target, and claims without a concrete failure mode.
5. Present unique confirmed findings first, ordered by severity. Include file/line, failure mode, execution or repro path, smallest safe fix direction, test need, and source reviewers.
6. Mention rejected false positives or duplicate clusters only when useful for trust.
7. When a task handoff exists, append all four terminal outcomes and the consolidated findings.

Completion: every candidate is confirmed, merged, rejected, or blocked, and the user can act without reading raw reviewer output.
