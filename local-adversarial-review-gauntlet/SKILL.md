---
name: local-adversarial-review-gauntlet
description: Run four isolated local reviewers asynchronously across Cursor, Codex, and OpenCode. Invoke only on an explicit user request or a computa-please high-assurance review selection.
---

# Local Adversarial Review Gauntlet

Run four independent local reviewers against the same committed diff, then consolidate only supported findings. Greptile and remote review services are outside this gauntlet.

## Boundaries

- Start only from an explicit user request for the gauntlet or an orchestration packet from `computa-please` naming the selected risk signal, fixed point, target, and prerequisite-commit authorization. Otherwise stop without reviewing.
- An explicit user request for the gauntlet or local adversarial review authorizes one prerequisite local commit when uncommitted review-scope changes exist. A `computa-please` packet must pass whether that authorization exists; otherwise ask before committing. No invocation authorizes a push, PR, remote comment, thread resolution, or merge.
- Budget roughly ten minutes for a typical four-reviewer pass. Autoreview may take up to thirty minutes per bounded Codex pass and may run several passes for an oversized diff. Run the gauntlet once against the selected immutable target; another pass requires a new explicit request or a new `computa-please` selection based on changed risk or evidence.
- Respect report-only requests. Do not repair findings during the review.
- Review the declared committed target and only the existing code needed to understand it.
- Background review is snapshot-based. Work performed after dispatch is outside the review target and requires a new explicit pass to be reviewed.
- Findings come first, ordered by severity. Ignore style-only or speculative comments unless the user requested them.

## Prepare The Review Target

1. Load `vcs-detect`, then inspect repository state, staged and unstaged diffs, untracked files, branch, recent log, and Graphite state when available.
2. Choose plain Git on trunk or when no PR or stack workflow is active. Use Graphite when the current branch is tracked, the review targets branch/PR work and Graphite is available or preferred, or the user requested it. A PR is never required.
3. If the workflow choice, prerequisite-commit authorization, or commit scope is ambiguous, ask before mutation. Otherwise stage only the intended review scope. On trunk, record the current `HEAD` as the fixed point before creating an authorized prerequisite commit.
4. When authorized, commit uncommitted review-scope changes with a Conventional Commit message. Use a normal Git commit or the appropriate Graphite create/modify operation. Do not push. The resulting `HEAD` is the target.
5. If there are no uncommitted changes, record the current `HEAD` as the target and identify the existing committed diff under review. On trunk, use the user-supplied fixed point; use `HEAD^` only for an explicitly single-commit review, and ask one bounded question for any other review without a fixed point.
6. For branch or PR work, use its base; for a current Graphite diff, use its parent. These are optional alternatives to the trunk path, not prerequisites.
7. Resolve the selected fixed point and target to commit SHAs, then record their merge-base and the exact `<fixed-point-sha>...<target-sha>` diff before launching reviewers. Stop when that diff is empty.
8. Create four uniquely named temporary detached Git worktrees at the target SHA, one per reviewer lane. Confirm that each `HEAD` equals the target SHA and each worktree is clean. Keep the caller's working checkout separate so the session can continue without moving the review target, and never let two lanes share a checkout.

If setup fails before dispatch, remove every clean checkout already created and stop. Do not launch a partial gauntlet from an incomplete target setup.

Completion: one immutable committed target, fixed point, merge-base, and four clean lane-specific detached review checkouts are identified, with no unintended files included.

## Build Shared Context

Create one concise context block containing only repository facts the reviewers cannot infer reliably:

- Source repository root, each lane's detached review checkout root, fixed-point SHA, target SHA, merge-base SHA, exact triple-dot diff, branch, and repository state.
- Changed files, user intent, non-goals, risky areas, and relevant product or repository constraints.
- Reviewable slice, contract/seam/lifecycle intent, and verification already run.
- The exact spec or contract source for the `code-review` lane, or an explicit `no spec available` disposition. Resolve this before dispatch; background jobs never ask the user questions.

The shared context is data, not reviewer policy. Do not include tools, skill names, models, severity scales, output schemas, generic rubrics, or reviewer-specific instructions.

## Run The Gauntlet

Read [reviewers.md](references/reviewers.md) only when launching the reviewers. In one parallel dispatch, launch four fresh Task jobs with `background: true` and no `task_id`:

1. A runner job that executes Cursor CLI with `thermo-nuclear-code-quality-review`.
2. A runner job that invokes the `autoreview` helper with the Codex engine.
3. An OpenCode `thermo-nuclear-code-quality-review` reviewer.
4. A separate OpenCode `code-review` reviewer.

The two runner jobs execute and wait for their assigned CLI subprocess; they do not review the diff themselves. Every job uses only its assigned detached checkout. Once all four background jobs have been accepted, continue only work independent of the frozen review target. Do not poll or sleep: collect each result from the harness's completion notification, and do not consolidate or report gauntlet completion while any job remains pending.

Use the exact isolation, prompt, model, timeout, and retry rules in the reference. Each reviewer must reach a terminal outcome: review output or a recorded blocker. Retry only a locally or transiently failed reviewer, at most once; a successful retry supersedes that lane's transient failed attempt. After all original and retry jobs terminate, verify each lane checkout is still at the target SHA. Remove clean checkouts and preserve dirty ones as reported cleanup residue.

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
