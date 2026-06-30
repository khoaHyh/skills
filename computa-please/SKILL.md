---
name: computa-please
description: Use for /computa-please, discussion-before-mutation workflow routing, brainstorming/design into optional specs, debugging and bug fixes, RGR TDD implementation, and local adversarial code review with Cursor CLI and Codex CLI.
---

# computa-please

`computa-please` is the user's agent orchestration workflow. It routes a request into the right mode before artifacts or mutation, composes existing skills, protects context-window resets, and runs one local adversarial code-review gate when review is requested.

It is inspired by pstack, but it is not a pstack clone. Keep this skill as a compact OpenCode-native router and gatekeeper. Do not create extra principle files or broad process scaffolding unless the user asks.

## Start every run

1. Classify the request into one top-level mode: Discuss, Spec, Implement, Debug, Review, Recall/Pickup, or Reflect.
2. If the request is about comparing, brainstorming, redesigning, evaluating, deciding, or workflow/meta work, default to Discuss. No artifacts or edits by default.
3. If routing is ambiguous, choose Discuss and ask whether to promote the result into artifacts or code changes.
4. Create or locate the task artifact directory only after routing to Spec, Implement, Debug, or Review, and only when that mode needs durable context.
5. For multi-step implementation, debugging, review, or persisted spec work, open a todo list with the selected mode's steps when the harness supports todos.
6. Load only the skills that apply to the selected mode.
7. Ask fewer questions. Ask only for product direction, public API shape, production behavior, auth, security, secrets, money, data deletion, deploys, team ownership, or facts that cannot be observed.

## Principles

- Worthy friction before mutation: discussion, design, architecture, and review are real work, not delays.
- Evidence before action: inspect, reproduce, measure, or cite before editing.
- Foundations first: fix data shape, seams, interfaces, observability, and test loops before polish.
- More with less: prefer deletion, narrower interfaces, and deep modules over new scaffolding.
- Small verifiable units: every implementation slice ends in a concrete check.
- Structure over reminders: repeated corrections become tests, lints, scripts, review agents, or proposed skill edits.
- Human judgment at real forks: ask for product, security, irreversible, public API, deploy, money, data deletion, or ownership calls; observe facts directly.
- Main agent owns synthesis: subagents gather, challenge, or implement scoped work, but the main agent decides.

## Subagent posture

- Use subagents aggressively for research, design, debugging support, and review, but keep ownership centralized.
- For research and design, use parallel `explore`, `librarian`, `oracle`, `dialectic`, or `design-an-interface` when the problem benefits from independent search or competing frames.
- For codebase exploration, give subagents scoped questions and file pointers; keep raw dumps out of the main thread.
- For debugging, build or identify the repro/evidence loop before fanning out hypotheses. After the symptom is bounded, delegate code path, history, docs, or hypothesis investigation.
- For review, use the local adversarial shape: Codex CLI and Cursor CLI run in parallel against the same committed diff, shared review context, and separate reviewer-specific prompts.
- For implementation, the main agent edits by default. Delegate only isolated, inspectable work.
- Never pass through subagent output blindly. Confirm, reject, and merge findings in the main thread.

## Artifact workflow

Artifacts live under `~/.computa-please`.

Task directory format:

```text
<repo-slug>__<branch-slug>
```

Fallback when the branch is unavailable:

```text
<repo-slug>__<task-slug>
```

Use this workflow only after the selected mode needs durable context. Discuss mode does not create artifacts unless the user explicitly asks to persist the outcome.

Create the task directory automatically when needed. It must contain only two files:

```text
<task-slug>-tech-spec-YYYY-MM-DD.md
handoff.md
```

If the task directory already has a tech spec, keep using that file. Do not create a second tech spec just because the date changed.

Use these rules:

- `repo-slug`: the repository root basename, lowercased and slugged. If no VCS root exists, use the current directory basename.
- `branch-slug`: the current branch name, lowercased and slugged. If no branch exists, use `task-slug`.
- `task-slug`: a short slug from the user request or the existing tech spec title.
- Slugs use lowercase letters, numbers, and single hyphens.
- `handoff.md` is cumulative and append-only. Add a dated section for each update.

Suggested commands are examples, not mandatory. Adapt them to the repository and shell:

```bash
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
branch=$(git branch --show-current 2>/dev/null || true)
```

Never place secrets, tokens, customer data, or raw private transcript dumps in either artifact.

## Tech spec template

Every tech spec includes:

- Context.
- Problem.
- Goals.
- Non-goals.
- Constraints.
- Current-state findings.
- Proposed direction.
- Alternatives considered.
- Decision.
- Implementation phases.
- Verification plan.
- Open questions.

For app-code work, include target-language pseudocode when the shape is obvious:

- Types.
- Public and internal APIs.
- Call stack.
- Seams.
- Adapters.
- Data flow.
- Error handling.
- Test seams.

Keep the spec concrete enough that a fresh session can implement from it after a context reset.

## Handoff format

`handoff.md` references the tech spec instead of duplicating it. Append a dated section when something material changes.

Include:

- Tech spec path.
- Suggested skills for the next session.
- Current state.
- Rabbit holes explored.
- Decisions made.
- Rejected approaches.
- Approved Plannotator annotations.
- Manual review notes.
- Adversarial review findings.
- Review and CI residue.
- Verification status.
- Next action.

Use the installed `handoff` skill when a normal conversation handoff is needed. This file is the durable task-local handoff.

## Mode router

### Discuss

Use when the user wants to compare, brainstorm, redesign, evaluate, decide, ask whether something is worth doing, or discuss workflow/meta-work.

Rules:

- Do not edit files.
- Do not create artifacts.
- Do not create a task directory.
- Use web, codebase, trace, or tool research when needed, but keep the output in chat.
- End with a recommendation, options, tradeoffs, or a clear next decision.
- Ask whether to promote the discussion into a spec or implementation only when the user has not already decided.

If the user explicitly asks to persist the direction, route to Spec.

### Spec

Use when the user asks for a tech spec, PRD, durable plan, implementation phases, or says to persist a discussed direction.

Steps:

1. Explore the problem.
2. Discuss possible directions if the direction is not already decided.
3. Identify constraints and unknowns.
4. Recommend a direction.
5. Create or update the task artifact directory.
6. Draft or update the tech spec.
7. Append `handoff.md`.
8. Run Spec checkpoint.

Output: draft tech spec and updated handoff. Do not change production code.

### Spec checkpoint

Always run after drafting or materially updating the tech spec.

Ask this checkpoint question using the harness's structured question tool when available:

```text
Are you satisfied with this tech spec?
```

Options:

- `Proceed to grill-with-docs`.
- `Skip grill and implement`.
- `Pause to review/annotate`.

Recommend `Proceed to grill-with-docs` for nontrivial work. Recommend `Skip grill and implement` only for small, obvious, low-risk work.

### Grill with docs

Use when the user chooses to grill, or when the task has architecture, product, or terminology risk.

Invoke:

- `grill-with-docs`.

Optional supporting skills:

- `design-an-interface` when API or interface shape matters.
- `dialectic` when there is a real unresolved tension.
- `documentation` when the output is docs-heavy.

Update the tech spec and append `handoff.md` with decisions, rejected approaches, and terminology changes.

### Pause to review or annotate

Use when the user wants to inspect the spec.

Steps:

1. Stop implementation.
2. Point to the tech spec path.
3. If Plannotator annotations exist, append approved annotations to `handoff.md`.
4. Wait for the user's next instruction.

### Implement from spec

Use when the user says to implement a persisted spec.

First load:

- the tech spec.
- `handoff.md`, if it exists.
- `tdd`.
- `coding-standards `
- `quality-code`.
- `reducing-entropy`.

Also load when relevant:

- `write-effect-ts`.
- `find-docs`.
- `typescript-magician`.
- `diagnosing-bugs`.
- `feedback-loop`.

Rules:

- Use red-green-refactor TDD.
- Make the smallest correct change.
- Prefer deletion.
- Do not preserve compatibility unless persisted data, shipped behavior, external consumers, or the user require it.
- Verify with real commands.
- Append implementation status, commands, and results to `handoff.md`.

### Debug

Use when the user reports a bug, failing test, runtime error, production error, performance regression, flaky behavior, CI failure, or asks to diagnose/fix something broken.

First load:

- `diagnosing-bugs`.
- `tdd`.
- `coding-standards`
- `quality-code`.

Also load when relevant:

- `dialectic`
- `feedback-loop`.
- `write-effect-ts`.
- `find-docs`.

Steps:

1. Classify the symptom: failing test, runtime bug, CI failure, production error, performance regression, flake, regression, or unknown.
2. Build a tight red-capable loop using `diagnosing-bugs`: failing test, curl/HTTP script, CLI fixture, browser script, trace replay, throwaway harness, fuzz loop, bisect loop, or HITL loop.
3. Reproduce and minimize. Confirm the loop catches the user's actual symptom, not a nearby failure.
4. Generate 3-5 ranked falsifiable hypotheses when the cause is not obvious from the evidence.
5. Instrument one variable at a time. Tag temporary debug logs and remove them before completion.
6. Decide whether a regression test has a correct seam. If yes, use `tdd` and make the bug red before fixing. If no seam exists, document that as a testability finding.
7. Apply the smallest root-cause fix. Do not paper over the symptom unless explicitly marking a contained mitigation.
8. Verify the original repro, the regression test if added, and relevant broader checks.
9. Remove temporary instrumentation and prototypes.
10. Record root cause, fix, verification, and remaining risk in `handoff.md` when a task artifact exists.

No implementation until the root cause is understood or explicitly marked unknown with a contained mitigation.

### Review

Use when the user asks for code review, local adversarial review, PR readiness, or a final local review gate.

Rules:

- Review mode has one runbook: Local adversarial review.
- Spec, design, document, or plan review stays in the current Discuss or Spec phase as a normal conversation or checkpoint. Do not create a separate review runbook for it.
- Manual review notes stay in the current stage: discuss them, or route to Implement/Debug when the user asks for changes. Do not create a separate repair playbook.
- Respect report-only instructions exactly.
- Do not edit, resolve comments, trigger remote reviews, install tools, commit, push, or merge unless the user explicitly asks. A request for local adversarial review is approval for that mode's prerequisite local commit only; still do not push.
- Findings come first, ordered by severity.
- Each finding should include file/line, failure mode, execution path or repro scenario, smallest safe fix direction, and whether a test is needed.
- Ignore style, naming, formatting, or speculative maintainability unless the user asks for them.

Run Local adversarial review. If the user explicitly asks for Greptile feedback or CI remediation, use the dedicated skill for that outside this Review mode.

### Recall/Pickup

Use when the user asks to resume, continue from a handoff/transcript/branch/PR, catch up, or reconstruct recent work.

Steps:

1. Read the supplied handoff, spec, transcript, branch, PR, or live state first.
2. Reconstruct what is done, pending, blocked, and risky.
3. Do not redo completed research or implementation unless verification requires it.
4. Route the remaining work to Discuss, Spec, Implement, Debug, or Review.
5. State the resume point and what was inherited versus re-verified.

### Reflect

Use after a complex run, a user correction, a routing mistake, repeated workflow friction, or a successful recipe worth keeping.

Rules:

- Propose durable lessons and where they belong.
- Prefer structural enforcement: tests, lints, scripts, metadata, review agents, or skill edits.
- Do not edit skills automatically. Present proposed changes and wait for explicit approval.
- Use evals before promoting behavior-changing routing, prompt, or skill changes when practical.

### Local adversarial review

Use before finalizing nontrivial code changes, or whenever Review mode is selected. This is the only formal Review runbook. Greptile is not part of this review.

Prerequisite commit:

1. Run `vcs-detect` before any mutating VCS command. Inspect repository state, staged and unstaged diffs, untracked files, current branch, recent log, and Graphite stack state when `gt` is available.
2. Choose the commit workflow before staging. Use plain Git on `main` or trunk, or when no branch, PR, or stack workflow is active. Use Graphite when the work is already in a Graphite branch or stack, when the review is for branch/PR work and Graphite is available or preferred, or when the user asks for Graphite.
3. If the workflow choice is ambiguous, or unrelated or unsafe changes are present, stop and ask which workflow and files to include. Otherwise stage only the intended staged, unstaged, and untracked changes.
4. Generate a Conventional Commit message from the diff using `<type>(<scope>): <description>`.
5. Commit or update the current change before running reviewers. In Git, create a normal commit. In Graphite, use the appropriate `gt create` or `gt modify` flow for the current branch or stack.
6. Reviewers must target committed changes, normally `HEAD^..HEAD` for a Git commit or the current Graphite branch/stack slice under review.
7. If there are no staged, unstaged, or untracked changes, skip the commit and identify the committed diff under review.
8. Do not push unless explicitly requested.

Parallel reviewers:

1. Build one shared review context before launching either reviewer. Treat it as data, not prompt policy. Keep it concise and include only repo-specific facts that neither reviewer can infer reliably: repository root, committed review target, branch, commit, repository state, changed files, user intent, non-goals, risky areas, review-relevant product or repo constraints, and verification already run.
2. The shared review context must not include reviewer-specific tools, skill names, plugins, models, severity scales, output schemas, generic review rubrics, or finding templates. Do not include sections such as `Rules`, `For each actionable finding`, `Output format`, `Cursor`, or `Codex` in the shared context.
3. Compose a separate prompt for each reviewer by adding a reviewer-specific wrapper around the shared context. The wrapper must mention only that reviewer's toolchain, skill, rubric, and safety constraints. Do not pass the shared context alone as the full reviewer prompt.
4. Each reviewer-specific wrapper must apply the shared context, inspect only the committed target and directly relevant existing code, forbid edits, mutating commands, commits, pushes, PRs, and remote comments, request findings-only output, and defer the finding scale and output shape to that reviewer's own review skill.
5. Spawn two independent CLI reviewers in parallel against the same committed diff and repository state. Do not let either reviewer's output shape the other's prompt.
6. Cursor CLI reviewer: use the Cursor Agent documented print/headless mode with the Cursor Team Kit plugin, only the `thermo-nuclear-code-quality-review` skill, a Cursor-only prompt, and an exact Opus 4.8 model ID from `cursor-agent models` or `agent models`. Prefer `claude-opus-4-8-thinking-high` when listed. Do not invent parameterized aliases such as `claude-opus-4-8[context=1m,effort=high,fast=false]`; if no Opus 4.8 model is listed, mark the Cursor review incomplete.

Cursor-only prompt shape:

```text
Perform a local adversarial review using `thermo-nuclear-code-quality-review`.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Shared review context:
<shared-review-context>
```

```bash
cursor-agent --print --output-format text --mode=plan --trust \
  --workspace "<repo-root>" \
  --plugin-dir "<path-to-cursor-team-kit-plugin-dir>" \
  --model "claude-opus-4-8-thinking-high" \
  "<cursor-review-prompt>"
```

7. Codex CLI reviewer: use the OpenAI-documented non-interactive `codex exec` shape. The prompt must use `code-review` as the primary review skill, apply the shared context, and contain no Cursor-specific instructions. Keep the sandbox read-only and put the committed diff target in the prompt. Do not use `codex review --commit` or `codex exec review --commit` when passing a custom review prompt, because installed Codex versions can reject commit targets combined with prompts. If setting approval policy, place global Codex flags before `exec`; do not put `--ask-for-approval` after `exec`. Do not force brittle model aliases such as `gpt-5.5-xhigh` or `gpt-5.5-extra-high`; use the configured default model unless the user explicitly requests a documented, account-supported override.

Codex-only prompt shape:

```text
Use the `code-review` skill for a local adversarial review.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review rubric and output expectations from `code-review`.

Shared review context:
<shared-review-context>
```

```bash
codex --ask-for-approval never exec \
  --ephemeral \
  -C "<repo-root>" \
  -s read-only \
  "<codex-review-prompt>"
```

For structured output, use the same shape with Codex's documented schema flags and pass the Codex-only prompt on stdin:

```bash
codex --ask-for-approval never exec \
  --ephemeral \
  -C "<repo-root>" \
  -s read-only \
  --output-schema "<schema.json>" \
  -o "<codex-review-output.json>" \
  -
```

8. Let each reviewer produce its authentic review output. If Cursor cannot inspect the diff because read-only mode blocks shell execution, keep its output but note that limitation during consolidation instead of treating it as a full diff review.
9. If a reviewer fails because of local or transient tooling, retry it once with the documented command shape above. If it still fails, mark the local adversarial review incomplete and report the blocker instead of pretending the review passed.

Aggregation and consolidation:

1. Wait for both reviewer outputs before judging findings.
2. Normalize enough metadata to de-duplicate candidates while preserving each reviewer's original wording, severity, priority, category, and taxonomy. Add comparison fields only when useful: source reviewer, path/line, root cause, failure mode, evidence or repro path, fix direction, security impact, and test need.
3. De-duplicate by root cause and failure mode, not wording. Merge duplicate entries, keep the strongest evidence, and preserve all source reviewers.
4. Reject unsupported findings, style-only comments, findings outside the reviewed committed diff, and items without a concrete failure mode.
5. Present all unique confirmed findings first, ordered by severity. Include the source reviewer list for each finding.
6. Briefly list rejected false positives or duplicate clusters only when useful for trust or follow-up.
7. Append both individual raw reviewer outputs and the consolidated adversarial review findings to `handoff.md` when a task artifact exists.

## Decision rules

Auto-choose defaults when the choice is spec-only, reversible, narrows scope, defers nonessential work, follows existing repo convention after inspection, or adds durable documentation for an architectural decision.

Ask the user when the decision changes product direction, affects public API shape, changes production behavior, touches auth, security, secrets, money, data deletion, deployments, team process, ownership, or cannot be observed.

Do not ask before checking facts discoverable from code, git history, existing docs, config, issue trackers, Slack, or connected MCPs.

## Verification gate

For every implementation or debug fix:

1. Inspect repository status.
2. Inspect the diff.
3. Run relevant tests, typecheck, lint, or build.
4. Run feature-specific verification when available.
5. Append commands and results to `handoff.md` when a task artifact exists.
6. Do not claim done if verification is inconclusive.

Before commit, push, merge, deploy, destructive data changes, or external messages, ask for explicit approval.

## Final response

Keep the final response short. Include:

- Mode used.
- Artifact paths, if any.
- What changed.
- Verification run and result.
- Remaining risks or next action.

If no code was changed, say so directly.
