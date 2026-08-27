# Gauntlet Reviewers

Apply the same shared review context to four independent reviewers. Do not let one reviewer's output shape another's prompt.

## Background Dispatch

Launch all four lanes as fresh Task jobs with `background: true` and no `task_id`, in one parallel dispatch. The Cursor and Autoreview lanes are runner jobs: each launches its specified subprocess, waits for it, and returns its complete terminal output without performing a second review. The two OpenCode lanes perform their reviews directly.

After dispatch, rely on task completion notifications rather than polling or sleeping. The parent session may continue independent work in its original checkout because every lane reads its own detached checkout pinned to the target SHA. Later work is not part of this gauntlet pass. Keep every lane checkout until all four jobs, including any retry, reach terminal outcomes.

Record whether each Task submission was accepted. If a parallel dispatch accepts only some jobs, let accepted jobs run and keep their checkouts. Retry each rejected submission once as a fresh background Task with the same frozen context; a second rejection is that lane's blocker. Remove an unused clean checkout only after its lane has no live or retryable Task.

## Common Isolation

Each reviewer-specific wrapper must:

- Use only its assigned detached review checkout and confirm its `HEAD` equals the target SHA before reviewing.
- Inspect only the committed target and directly relevant existing code.
- Forbid edits, mutating commands, commits, pushes, PRs, and remote comments.
- Request findings-only output.
- Defer severity and output shape to that reviewer's assigned skill.
- Return stdout, stderr, and numeric status for a runner subprocess. Before returning, confirm the assigned checkout remains clean and at the target SHA; otherwise return a blocker.

Only the Autoreview runner may load or use `autoreview`. Cursor and both OpenCode reviewers, including subagents nested by `code-review`, must not load it, invoke its helpers, or spawn a Codex/autoreview reviewer.

## Cursor

Use a background runner Task to execute Cursor Agent print/headless mode with the Cursor Team Kit plugin, only `thermo-nuclear-code-quality-review`, default Agent execution mode, and Cursor-native Grok 4.6 High Fast. Pass `--model cursor-grok-4.6-high-fast` and omit `--mode`. If that exact model is unavailable, record a blocker rather than using Auto or another model.

Locate the plugin first under `~/.cursor/plugins/cache/cursor-public/cursor-team-kit/*`, then other local Cursor or agent plugin directories. The plugin directory is the hash directory containing `skills/thermo-nuclear-code-quality-review/SKILL.md`. If none exists, record a blocker.

Prompt:

```text
Perform a local adversarial review using `thermo-nuclear-code-quality-review`.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Use only `thermo-nuclear-code-quality-review`; do not load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Use <cursor-review-checkout> as the repository root. Confirm its `HEAD` is <target-sha> before and after review.

Shared review context:
<shared-review-context>
```

Command, with a ten-minute timeout for the initial call and retry:

```bash
cursor-agent --print --output-format text --trust \
  --workspace "<cursor-review-checkout>" \
  --plugin-dir "<cursor-team-kit-plugin-dir>" \
  --model cursor-grok-4.6-high-fast \
  "<cursor-review-prompt>"
```

Invoke the command through a shell tool whose 600-second timeout terminates the whole subprocess tree. If the harness cannot guarantee process-tree termination, record a blocker rather than leaving a timed-out Cursor descendant running.

If Cursor cannot inspect the diff because its permissions block shell execution, preserve its output and record the lane as blocked because it was not a full diff review.

## Codex Through Autoreview

Use a background runner Task to load `autoreview`, resolve its documented helper path, and invoke the helper directly from the detached review checkout with the Codex engine. Autoreview owns bundle construction, secret scanning, model selection, engine isolation, structured validation, and the Codex subprocess. Do not run `codex exec`, `codex review`, or another reviewer around the helper.

Runner prompt:

```text
Load and use `autoreview` to run the Codex lane of a local adversarial review.

From <autoreview-review-checkout>, confirm that `HEAD` is <target-sha> and the checkout is clean. Resolve the documented `AUTOREVIEW` helper path, then invoke it exactly once in branch mode with <fixed-point-sha> as its base, the Codex engine, a P2 maximum priority, and a 30-minute per-pass engine timeout. Pass the shared review context as additional prompt text. The helper must launch Codex; do not invoke Codex directly and do not perform your own review. Return stdout, stderr, and numeric status. Any validated report is successful review output, including actionable findings or an incorrect verdict without discrete findings; provider, scanner, validation, targeting, or helper failures are blockers.

Shared review context:
<shared-review-context>
```

Command after resolving `AUTOREVIEW` according to its skill, with `<autoreview-context>` containing the shared review context and findings-only instruction:

```bash
"$AUTOREVIEW" \
  --mode branch \
  --base "<fixed-point-sha>" \
  --engine codex \
  --max-priority P2 \
  --engine-timeout-seconds 1800 \
  --prompt "<autoreview-context>"
```

Give the complete helper process tree a five-hour outer shell-tool timeout. This bounds bundle construction, scanning, validation, and up to eight sequential 30-minute engine passes without making an individual engine timeout ineffective. A timeout is a blocker, and the runner must confirm the process tree terminated before returning. Because the detached checkout's `HEAD` is the resolved target SHA, Autoreview's `<base>...HEAD` bundle is the same frozen diff seen by the other reviewers. If the helper is unavailable or cannot express that target, record a blocker rather than falling back to a hand-written Codex invocation.

## OpenCode Thermo-Nuclear

Use a fresh background Task call with no `task_id`. Prefer built-in `general` when it is model-unpinned; otherwise use a review-capable subagent type with no effective model or variant override so it inherits both from the parent. Do not silently substitute a pinned model.

Prompt:

```text
Load and use `thermo-nuclear-code-quality-review` for a local adversarial review.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Use only `thermo-nuclear-code-quality-review`; do not load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Use <opencode-thermo-review-checkout> as the repository root. Read files only from that absolute path and run every Git command with `git -C <opencode-thermo-review-checkout>`. Confirm its `HEAD` is <target-sha> before and after review.

Shared review context:
<shared-review-context>
```

## OpenCode Standards And Spec

Use a separate fresh background Task call with no `task_id` and the same model-inheritance rule. The `code-review` skill's Standards and Spec subagents remain children of this background job; the outer job reaches a terminal outcome only after both reports complete. The parent must supply the spec or contract directly, or explicitly state that none exists, before dispatch.

Prompt:

```text
Load and use `code-review` for a local adversarial review.

Use the review fixed point from the shared context as the skill's fixed point. Follow the skill's Standards and Spec workflow, including its nested Standards and Spec reviewers when required. Use only `code-review` and the workflows it explicitly requires. Neither this reviewer nor its nested reviewers may load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer; include this guardrail in both nested reviewer prompts. Preserve the skill's separate `Standards` and `Spec` reports and summary. Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the remaining review rubric and output expectations from `code-review`.

Use <opencode-code-review-checkout> as the repository root. Read files only from that absolute path and run every Git command with `git -C <opencode-code-review-checkout>`. Pass that checkout root, <fixed-point-sha>, <target-sha>, and the exact `git -C <opencode-code-review-checkout> diff <fixed-point-sha>...<target-sha>` command to both nested reviewers; neither child may use the parent session's working directory or `HEAD`. Confirm the checkout's `HEAD` is <target-sha> before and after review.

Use <code-review-spec-disposition> as the already-resolved spec source. This composed gauntlet route does not use issue-tracker discovery: a missing `docs/agents/issue-tracker.md` is not a setup request or blocker when the parent supplied the spec or explicitly supplied `no spec available`. In the latter case, follow `code-review` by skipping the Spec child and reporting that disposition. Do not ask the user a question from this background job.

Shared review context:
<shared-review-context>
```

If background Task execution or a model-unpinned review-capable OpenCode subagent is unavailable, record the affected lanes as blocked rather than changing models or silently running them synchronously.

## Retry And Cleanup

Retry an eligible lane as a fresh Task with `background: true`, no `task_id`, and the same frozen context only after its original task and subprocess tree have terminated. Reuse its checkout only when it remains clean at the target SHA; otherwise preserve the dirty checkout for diagnosis and create a replacement detached checkout. A successful retry becomes the lane's terminal review outcome and supersedes the original transient failure; an ineligible or failed retry makes the lane blocked.

Record every temporary worktree path. After all original, retry, and nested processes terminate, verify each checkout's `HEAD` and status, remove clean checkouts idempotently, and report any dirty or unremovable checkout as cleanup residue. On pickup after cancellation or interruption, reconcile recorded task outcomes and process state before cleanup; never remove a checkout still used by a live process.
