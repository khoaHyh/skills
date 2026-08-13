# Gauntlet Reviewers

Apply the same shared review context to four independent reviewers. Do not let one reviewer's output shape another's prompt.

## Common Isolation

Each reviewer-specific wrapper must:

- Inspect only the committed target and directly relevant existing code.
- Forbid edits, mutating commands, commits, pushes, PRs, and remote comments.
- Request findings-only output.
- Defer severity and output shape to that reviewer's assigned skill.

Only the Codex reviewer may load or use `autoreview`. Cursor and both OpenCode reviewers, including subagents nested by `code-review`, must not load it, invoke its helpers, or spawn a Codex/autoreview reviewer.

## Cursor

Use Cursor Agent print/headless mode with the Cursor Team Kit plugin, only `thermo-nuclear-code-quality-review`, default Agent execution mode, and Cursor-native Grok 4.6 High Fast. Pass `--model cursor-grok-4.6-high-fast` and omit `--mode`. If that exact model is unavailable, record a blocker rather than using Auto or another model.

Locate the plugin first under `~/.cursor/plugins/cache/cursor-public/cursor-team-kit/*`, then other local Cursor or agent plugin directories. The plugin directory is the hash directory containing `skills/thermo-nuclear-code-quality-review/SKILL.md`. If none exists, record a blocker.

Prompt:

```text
Perform a local adversarial review using `thermo-nuclear-code-quality-review`.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Use only `thermo-nuclear-code-quality-review`; do not load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Shared review context:
<shared-review-context>
```

Command, with a ten-minute timeout for the initial call and retry:

```bash
cursor-agent --print --output-format text --trust \
  --workspace "<repo-root>" \
  --plugin-dir "<cursor-team-kit-plugin-dir>" \
  --model cursor-grok-4.6-high-fast \
  "<cursor-review-prompt>"
```

If Cursor cannot inspect the diff because its permissions block shell execution, preserve its output but record that it was not a full diff review.

## Codex

Pin the fixed point and target to resolved SHAs. Use `autoreview` in direct reviewer mode, a read-only sandbox, the documented non-interactive command, and high reasoning. If the installed skill lacks direct reviewer mode, record a blocker.

Prompt:

```text
Load and use `autoreview` in direct reviewer mode for a local adversarial review.

Perform the review in this Codex session. Review exactly <fixed-point-sha>..<target-sha>. Apply the shared review context below. Inspect only that committed target and directly relevant tracked code needed to understand it. Use read-only inspection commands. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the priority, category, evidence, and output requirements from `autoreview` direct reviewer mode. Do not invoke the bundled autoreview helper, `codex review`, reviewer panels, or nested reviewers.

Shared review context:
<shared-review-context>
```

Command, with a thirty-minute timeout for the initial call and retry:

```bash
codex --ask-for-approval never \
  --model "gpt-5.6-sol" \
  -c 'model_reasoning_effort="high"' \
  exec \
  --ephemeral \
  --ignore-rules \
  -C "<repo-root>" \
  -s read-only \
  "<codex-review-prompt>"
```

## OpenCode Thermo-Nuclear

Use a fresh Task call with no `task_id`. Prefer built-in `general` when it is model-unpinned; otherwise use a review-capable subagent type with no effective model or variant override so it inherits both from the parent. Do not silently substitute a pinned model.

Prompt:

```text
Load and use `thermo-nuclear-code-quality-review` for a local adversarial review.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Use only `thermo-nuclear-code-quality-review`; do not load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Shared review context:
<shared-review-context>
```

## OpenCode Standards And Spec

Use a separate fresh Task call with no `task_id` and the same model-inheritance rule.

Prompt:

```text
Load and use `code-review` for a local adversarial review.

Use the review fixed point from the shared context as the skill's fixed point. Follow the skill's Standards and Spec workflow, including its nested Standards and Spec reviewers when required. Use only `code-review` and the workflows it explicitly requires. Neither this reviewer nor its nested reviewers may load `autoreview`, invoke its helper or scripts, or spawn a Codex/autoreview reviewer; include this guardrail in both nested reviewer prompts. Preserve the skill's separate `Standards` and `Spec` reports and summary. Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the remaining review rubric and output expectations from `code-review`.

Shared review context:
<shared-review-context>
```

If no model-unpinned review-capable OpenCode subagent is available, record both OpenCode reviewers as blocked rather than changing models.
