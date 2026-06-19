---
name: computa-please
description: Use for /computa-please, brainstorming into a persisted tech spec, grill-with-docs checkpoints, RGR TDD implementation from a spec, manual review repair prompts, local adversarial review, and Greptile/CI final gates.
---

# computa-please

`computa-please` is the user's agent orchestration workflow. It turns a request into a durable task artifact, routes through the right existing skills, protects context-window resets, and keeps Greptile as the final merge gate.

It is inspired by pstack, but it is not a pstack clone. Keep this skill as a router and gatekeeper. Do not create extra principle files or broad process scaffolding unless the user asks.

## Start every run

1. Classify the request into one playbook: Brainstorm, Spec checkpoint, Grill with docs, Pause to review or annotate, Implement from spec, Manual review repair, Local adversarial review, or Greptile final gate.
2. For multi-step work, open a todo list with the selected playbook steps when the harness supports todos.
3. Create or locate the task artifact directory before drafting, editing, implementing, or reviewing.
4. Load only the skills that apply to the selected playbook.
5. Ask fewer questions. Ask only for product direction, public API shape, production behavior, auth, security, secrets, money, data deletion, deploys, team ownership, or facts that cannot be observed.

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

Create the task directory automatically. It must contain only two files:

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
- Greptile and CI residue.
- Verification status.
- Next action.

Use the installed `handoff` skill when a normal conversation handoff is needed. This file is the durable task-local handoff.

## Playbook router

### Brainstorm

Use when the problem or direction is still fuzzy.

Steps:

1. Explore the problem.
2. Discuss possible directions.
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
- `quality-code`.
- `reducing-entropy`.

Also load when relevant:

- `write-effect-ts`.
- `find-docs`.
- `typescript-magician`.
- `diagnose`.
- `feedback-loop`.

Rules:

- Use red-green-refactor TDD.
- Make the smallest correct change.
- Prefer deletion.
- Do not preserve compatibility unless persisted data, shipped behavior, external consumers, or the user require it.
- Verify with real commands.
- Append implementation status, commands, and results to `handoff.md`.

### Manual review repair

Use after the user manually reviews the code or provides review notes.

Output a fresh repair prompt suitable for a new session or tree recovery. The prompt must include:

- Tech spec path.
- Current branch or worktree context.
- Exact requested changes.
- Constraints from `handoff.md`.
- Skills to load.
- Verification commands to run.
- A warning not to broaden scope.

Append the review notes and repair prompt path or content summary to `handoff.md`.

### Local adversarial review

Use before finalizing nontrivial changes. Greptile is not part of this review.

Default local mode:

1. Spawn or invoke a reviewer to find concrete issues.
2. Spawn or invoke a critic with a refute-by-default posture to audit the findings.
3. Synthesize confirmed issues and false positives.
4. Append confirmed findings to `handoff.md`.

Codex CLI mode, when requested:

1. Explain that Codex CLI review runs outside the current harness.
2. Inspect `git status`, unstaged diff, staged diff, and recent log.
3. Codex review should run against committed changes.
4. If changes are unstaged, ask whether to stage intended changes and create a conventional commit.
5. If approved, stage only intended files.
6. Generate a conventional commit message.
7. Commit.
8. Run Codex CLI adversarial review against the committed diff.
9. Append review results to `handoff.md`.
10. Do not push unless explicitly requested.

### Greptile final gate

Use after implementation, manual review, and local adversarial review.

Greptile is the final merge gate, not adversarial review.

Invoke:

- `greptile-address`.

If CI fails, invoke:

- `actions-ci-address`.

Rules:

- Fix actionable feedback once.
- Dismiss non-issues with concrete rationale.
- Report what remains.
- Do not merge unless explicitly requested.

## Decision rules

Auto-choose defaults when the choice is spec-only, reversible, narrows scope, defers nonessential work, follows existing repo convention after inspection, or adds durable documentation for an architectural decision.

Ask the user when the decision changes product direction, affects public API shape, changes production behavior, touches auth, security, secrets, money, data deletion, deployments, team process, ownership, or cannot be observed.

Do not ask before checking facts discoverable from code, git history, existing docs, config, issue trackers, Slack, or connected MCPs.

## Verification gate

For every implementation:

1. Inspect repository status.
2. Inspect the diff.
3. Run relevant tests, typecheck, lint, or build.
4. Run feature-specific verification when available.
5. Append commands and results to `handoff.md`.
6. Do not claim done if verification is inconclusive.

Before commit, push, merge, deploy, destructive data changes, or external messages, ask for explicit approval.

## Final response

Keep the final response short. Include:

- Playbook used.
- Artifact paths.
- What changed.
- Verification run and result.
- Remaining risks or next action.

If no code was changed, say so directly.
