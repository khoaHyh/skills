---
name: computa-please
description: "Use for /computa-please: route discussion-before-mutation, specs, RGR implementation, bounded finish loops, debugging, recall/pickup, reflection, and local adversarial review with Cursor, Codex, and OpenCode."
---

# computa-please

`computa-please` is the user's agent orchestration workflow. It routes a request into the right mode before artifacts or mutation, composes existing skills, protects context-window resets, runs accepted work to a machine-checkable PR gate when explicitly requested, and runs one local adversarial code-review gate across Cursor, Codex, and OpenCode when review is requested.

The quality bar is opencode-like TypeScript work: contract-first vertical slices, deep modules, explicit lifecycle vocabulary, typed boundaries and failures, real-seam verification, and PR-ready explanations of why the change works.

It is inspired by pstack, but it is not a pstack clone. Keep this skill as a compact OpenCode-native router and gatekeeper. Do not create extra principle files or broad process scaffolding unless the user asks.

## Start every run

1. Classify the request into one top-level mode: Discuss, Spec, Implement, Finish Loop, Debug, Review, Recall/Pickup, or Reflect.
2. State the selected mode, whether mutation is allowed, and whether durable artifacts are needed before doing substantial work.
3. If the request is about comparing, brainstorming, redesigning, evaluating, deciding, or workflow/meta work, default to Discuss. No artifacts or edits by default.
4. If routing is ambiguous, choose Discuss and ask whether to promote the result into artifacts or code changes.
5. Create or locate the task artifact directory only after routing to Spec, Implement, Finish Loop, Debug, or Review, and only when that mode needs durable context.
6. For multi-step implementation, finish-loop, debugging, review, or persisted spec work, open a todo list with the selected mode's steps when the harness supports todos.
7. For nontrivial code work, name the reviewable slice before editing: contract, seam, changed behavior, and verification loop.
8. Load only the skills that apply to the selected mode.
9. Ask fewer questions. Ask only for product direction, public API shape, production behavior, auth, security, secrets, money, data deletion, deploys, team ownership, or facts that cannot be observed.

## Principles

- Worthy friction before mutation: discussion, design, architecture, and review are real work, not delays.
- Evidence before action: inspect, reproduce, measure, or cite before editing.
- Contract before wiring: make the schema, protocol, domain type, or service interface own the shape before spreading behavior through callers.
- Tracer bullets before platforms: ship one observable vertical slice before broad horizontal scaffolding.
- Foundations first: fix data shape, seams, interfaces, observability, and test loops before polish.
- More with less: prefer deletion, narrower interfaces, and deep modules over new scaffolding.
- Small verifiable units: every implementation slice ends in a concrete check.
- Bounded loops: automate only against observable state, persist each transition, and stop on completion, a real decision fork, or repeated no-progress.
- Structure over reminders: repeated corrections become tests, lints, scripts, review agents, or proposed skill edits.
- Human judgment at real forks: ask for product, security, irreversible, public API, deploy, money, data deletion, or ownership calls; observe facts directly.
- Main agent owns synthesis: subagents gather, challenge, or implement scoped work, but the main agent decides.

## User-facing voice

In every message addressed to the user, including progress updates, questions, checkpoints, and the final response, speak simply, concisely, and coherently, like one human talking to another. Prefer plain language. Use technical terms only when they carry necessary meaning in context, and explain an unfamiliar term briefly when the user needs it to follow the point.

This voice applies only to messages sent to the user. Write code, artifacts, tool inputs, subagent prompts, reviewer prompts, commit messages, and external messages in the form best suited to their purpose.

## Code quality bar

Use these as execution anchors for TypeScript work:

- Tracer-bullet slice: one behavior through contract, core, adapter, and caller; split vocabulary-only refactors from behavior changes when practical.
- Contract-first design: schemas, protocol groups, domain types, service interfaces, and generated clients are the source of truth for shapes.
- Lifecycle vocabulary: model status, outcome, event, retry, idempotency, and recovery states explicitly instead of with loose flags or nullable bags.
- Deep modules: small interfaces hide policy, ordering, invariants, and incidental mechanics; delete pass-through wrappers that fail the deletion test.
- Typed boundaries and failures: parse external input at the seam, project output explicitly, and keep expected failures as tagged or otherwise semantic values.
- Real-seam verification: prove behavior through routes, service modules, adapters, local databases, representative runtimes, or public UI behavior.
- PR-ready narrative: nontrivial work can be summarized as Summary, Why, Design, Validation, and Follow-up/Risk.

Completion criterion for this bar: every nontrivial app-code slice either answers the slice checklist below or explicitly marks an item not applicable.

## Slice checklist

For nontrivial app-code work, answer these before or during implementation:

- Domain or lifecycle: what concept, state, transition, or invariant owns this behavior?
- Contract surface: what public schema, API, route, service interface, or module contract changes?
- Boundary parser/projection: where does untrusted, persisted, or protocol-shaped data become refined, and where is it projected out?
- Service and adapter seams: what module owns policy, and what adapter owns external mechanics?
- Failure model: which failures are expected values, and which failures are defects?
- Async/resource ownership: who owns cancellation, transactions, idempotency, retries, detached work, and cleanup?
- Verification loop: what test, repro, trace, command, or runtime proves the changed behavior through the real seam?

## Subagent posture

- Use subagents aggressively for research, design, debugging support, and review, but keep ownership centralized.
- For research and design, use parallel `explore`, `librarian`, `oracle`, `dialectic`, or `design-an-interface` when the problem benefits from independent search or competing frames.
- For codebase exploration, give subagents scoped questions and file pointers; keep raw dumps out of the main thread.
- For debugging, build or identify the repro/evidence loop before fanning out hypotheses. After the symptom is bounded, delegate code path, history, docs, or hypothesis investigation.
- For review, use the local adversarial shape: Cursor CLI, Codex CLI, and two OpenCode subagents run in parallel against the same committed diff, shared review context, and separate reviewer-specific prompts.
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

## Tech spec artifact

Use the installed `tech-spec` skill whenever Spec mode creates or materially updates the tech spec artifact. Pass it the available conversation and codebase context plus the selected artifact path; Spec mode's durable-artifact requirement is the instruction to save the result at that path.

The `tech-spec` skill is the source of truth for branch selection, required structure, typed contracts, call stacks, file mapping, and the RGR TDD plan. Apply this skill's slice checklist as an additional completion check rather than maintaining a second tech spec template here.

Completion criterion: the artifact satisfies `tech-spec`, every applicable slice-checklist item is represented or marked not applicable, and a fresh session can implement from it without redoing discovery.

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
- Current reviewable slice.
- Contract, seam, lifecycle, and failure-model decisions.
- PR-ready Summary, Why, Design, Validation, and Follow-up/Risk when implementation occurred.
- Next action.

For an active Finish Loop, also record the run identifier, accepted spec path, PR and base, current and final commit SHA, VCS workflow, CI status and checked SHA, Greptile eligibility, request-attempt state, matching review identifier, and remaining actionable finding count. This ledger prevents duplicate external actions after context recovery.

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

Completion criterion: the user has a recommendation, decision point, or explicit promotion path, and no file or artifact was changed unless they asked for persistence.

If the user explicitly asks to persist the direction, route to Spec.

### Spec

Use when the user asks for a tech spec, PRD, durable plan, implementation phases, or says to persist a discussed direction.

Steps:

1. Create or locate the task artifact directory and select the existing or new tech spec path.
2. Load and run `tech-spec` with the available context and selected artifact path, following its branch selection through an implementation-ready artifact.
3. Check every slice-checklist item for app-code work and update the artifact for any missing applicable item.
4. Append `handoff.md`.
5. Run Spec checkpoint.

Output: draft tech spec and updated handoff. Do not change production code.

Completion criterion: the tech spec is concrete enough that a fresh session can identify the contract, slice boundaries, verification loop, and open questions without redoing discovery.

### Spec checkpoint

Always run after drafting or materially updating the tech spec.

Ask this checkpoint question using the harness's structured question tool when available:

```text
Are you satisfied with this tech spec?
```

Options:

- `Proceed to grill-with-docs`.
- `Start Finish Loop`.
- `Skip grill and implement locally`.
- `Pause to review/annotate`.

Recommend `Proceed to grill-with-docs` for nontrivial work. Recommend `Skip grill and implement locally` only for small, obvious, low-risk work. `Start Finish Loop` is explicit approval to run the accepted spec through the bounded PR workflow.

### Grill with docs

Use when the user chooses to grill, or when the task has architecture, product, or terminology risk.

Invoke:

- `grill-with-docs`.

Optional supporting skills:

- `design-an-interface` when API or interface shape matters.
- `dialectic` when there is a real unresolved tension.
- `documentation` when the output is docs-heavy.

Re-run `tech-spec` with the new decisions and the existing artifact path, then append `handoff.md` with decisions, rejected approaches, and terminology changes. Run Spec checkpoint again so the post-grill artifact is explicitly accepted before implementation or a Finish Loop begins.

### Pause to review or annotate

Use when the user wants to inspect the spec.

Steps:

1. Stop implementation.
2. Point to the tech spec path.
3. If Plannotator annotations exist, append approved annotations to `handoff.md`.
4. Wait for the user's next instruction.

### Implement

Use when the user asks to make code changes, chooses implementation after a spec checkpoint, or says to implement a persisted spec.

First load:

- the tech spec, if implementing a persisted spec.
- `handoff.md`, if it exists.
- `tdd`.
- `coding-standards`.
- `codebase-design` for nontrivial module seams.

Also load when relevant:

- `write-effect-ts`.
- `find-docs`.
- `typescript-magician`.
- `diagnosing-bugs`.
- `feedback-loop`.
- `reducing-entropy` only when the user explicitly asks to minimize or delete code.

Rules:

- If no spec exists, inspect first and decide whether the request is a small direct slice or needs Discuss/Spec before mutation.
- Keep the slice checklist in working context when no artifact is needed.
- Use red-green-refactor TDD.
- Make the smallest correct change.
- Implement one tracer-bullet slice at a time.
- Prefer contract-first changes before wiring callers.
- Keep lifecycle/status/outcome vocabulary explicit.
- Prefer deletion.
- Do not preserve compatibility unless persisted data, shipped behavior, external consumers, or the user require it.
- For every new seam, name what it hides and why deleting it would spread complexity into callers.
- Keep expected failures typed and boundary translation local.
- Verify with real commands.
- Append implementation status, slice checklist decisions, commands, results, and PR-ready narrative to `handoff.md`.

Completion criterion: the slice has a failing-then-passing or otherwise risk-matched verification loop, the diff is inspectable as one coherent behavior, and remaining risks are named.

### Finish Loop

Use only when the user explicitly asks to start a loop, take an accepted tech spec to an open PR, or babysit an existing PR to the final human gate. A post-grill spec is accepted only through the Spec checkpoint; completing the grill does not imply approval.

An active Finish Loop authorizes scoped implementation, verification, commits, synchronization and conflict remediation for the current Graphite diff when tracked, pushes, PR creation or updates, ready-for-review state changes, CI remediation, one eligible Greptile request, and resolution of addressed review threads. It does not authorize sibling Graphite diffs, scope expansion, deploys, destructive changes, or unrelated-file changes; route those to the user as real decision forks.

Load the accepted tech spec and `handoff.md`, then load the skills required by [the Finish Loop runbook](references/finish-loop.md) and execute its state machine. Persist every state transition before taking the next external action. A recovered run resumes from observed repository, PR, CI, and ledger state rather than replaying completed actions.

The loop ends with the open PR at its final pushed commit, conflict-free and ready for review, required CI green for that commit, and all actionable findings from the single eligible Greptile review addressed. Hand that state to the user and stop.

### Debug

Use when the user reports a bug, failing test, runtime error, production error, performance regression, flaky behavior, CI failure, or asks to diagnose/fix something broken.

First load:

- `diagnosing-bugs`.
- `tdd`.
- `coding-standards`.

Also load when relevant:

- `dialectic`.
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

Completion criterion: the original symptom is reproduced or convincingly bounded, the fix addresses root cause rather than only symptoms, and the final verification reruns the repro loop plus relevant broader checks.

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
- Prefer fewer high-signal findings with proof over exhaustive commentary.
- Evaluate architecture through contract ownership, lifecycle modeling, boundary parsing, typed failures, async/resource ownership, and real-seam tests.

Run Local adversarial review. If the user explicitly asks for Greptile feedback or CI remediation, use the dedicated skill for that outside this Review mode.

### Recall/Pickup

Use when the user asks to resume, continue from a handoff/transcript/branch/PR, catch up, or reconstruct recent work.

Steps:

1. Read the supplied handoff, spec, transcript, branch, PR, or live state first.
2. Reconstruct what is done, pending, blocked, and risky.
3. Do not redo completed research or implementation unless verification requires it.
4. Route the remaining work to Discuss, Spec, Implement, Finish Loop, Debug, or Review. Resume Finish Loop only when its ledger records the original explicit authorization.
5. State the resume point and what was inherited versus re-verified.

### Reflect

Use after a complex run, a user correction, a routing mistake, repeated workflow friction, or a successful recipe worth keeping.

Rules:

- Propose durable lessons and where they belong.
- Prefer structural enforcement: tests, lints, scripts, metadata, review agents, or skill edits.
- Do not edit skills automatically. Present proposed changes and wait for explicit approval.
- Use evals before promoting behavior-changing routing, prompt, or skill changes when practical.

### Local adversarial review

Use when Review mode is explicitly selected. This is the only formal Review runbook. Greptile is not part of this review.

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

1. Build one shared review context before launching the reviewers. Treat it as data, not prompt policy. Keep it concise and include only repo-specific facts that the reviewers cannot infer reliably: repository root, review fixed point or base ref, committed review target, branch, commit, repository state, changed files, user intent, non-goals, risky areas, review-relevant product or repo constraints, the reviewable slice, contract/seam/lifecycle intent, and verification already run. Keep the fixed point as a single resolvable ref such as `HEAD^`; keep a range such as `HEAD^..HEAD` in the separate committed-target field.
2. The shared review context must not include reviewer-specific tools, skill names, plugins, models, severity scales, output schemas, generic review rubrics, or finding templates. Do not include sections such as `Rules`, `For each actionable finding`, `Output format`, `Cursor`, or `Codex` in the shared context.
3. Compose a separate prompt for each reviewer by adding a reviewer-specific wrapper around the shared context. The wrapper must mention only that reviewer's toolchain, skill, rubric, and safety constraints. Do not pass the shared context alone as the full reviewer prompt.
4. Each reviewer-specific wrapper must apply the shared context, inspect only the committed target and directly relevant existing code, forbid edits, mutating commands, commits, pushes, PRs, and remote comments, request findings-only output, and defer the finding scale and output shape to that reviewer's own review skill.
5. The gate has four independent reviewers against the same committed diff and repository state: one Cursor CLI reviewer, one Codex CLI reviewer, one OpenCode `thermo-nuclear-code-quality-review` reviewer, and one OpenCode `code-review` reviewer. Do not let any reviewer's output shape another's prompt.
6. The two OpenCode reviewers must be separate fresh Task calls with no `task_id`, using a review-capable subagent type that has no effective model or variant override. Prefer built-in `general` only when it is model-unpinned. Do not add or pass a model or variant: OpenCode then inherits both from the invoking parent agent. For example, a parent running `openai/gpt-5.6-sol` with the `xhigh` variant yields two OpenCode reviewers on that same model and variant. If no model-unpinned review-capable subagent is available, mark both OpenCode reviews incomplete instead of silently using another model.
7. Cursor CLI reviewer: use the Cursor Agent documented print/headless mode with the Cursor Team Kit plugin, only the `thermo-nuclear-code-quality-review` skill, a Cursor-only prompt, default Agent execution mode, and the Auto model. Pass `--model auto` and omit `--mode`, because Cursor documents Agent as the default when no mode is specified. `--auto-review` controls approvals, not model selection, and is not a substitute for `--model auto`. Locate the plugin before giving up: first check `~/.cursor/plugins/cache/cursor-public/cursor-team-kit/*`, then other local Cursor/agent plugin directories. The plugin directory is the hash directory that contains `skills/thermo-nuclear-code-quality-review/SKILL.md`, not the skill directory itself. If no Cursor Team Kit plugin directory containing the thermo-nuclear skill can be found after those searches, mark the Cursor review incomplete.

Cursor-only prompt shape:

```text
Perform a local adversarial review using `thermo-nuclear-code-quality-review`.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Shared review context:
<shared-review-context>
```

```bash
cursor-agent --print --output-format text --trust \
  --workspace "<repo-root>" \
  --plugin-dir "<path-to-cursor-team-kit-plugin-dir>" \
  --model auto \
  "<cursor-review-prompt>"
```

8. Codex CLI reviewer: use the OpenAI-documented non-interactive `codex exec` shape below, which pins the required model and reasoning effort. The prompt must use `code-review` as the primary review skill, apply the shared context, and contain no Cursor-specific instructions. Keep the sandbox read-only and put the committed diff target in the prompt. Do not use `codex review --commit` or `codex exec review --commit` when passing a custom review prompt, because installed Codex versions can reject commit targets combined with prompts. Place global Codex flags before `exec`; do not put `--ask-for-approval`, `--model`, or the reasoning override after `exec`.

Codex-only prompt shape:

```text
Use the `code-review` skill for a local adversarial review.

Use the review fixed point from the shared context as the skill's fixed point. Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review rubric and output expectations from `code-review`.

Shared review context:
<shared-review-context>
```

```bash
codex --ask-for-approval never \
  --model "gpt-5.6-sol" \
  -c 'model_reasoning_effort="xhigh"' \
  exec \
  --ephemeral \
  -C "<repo-root>" \
  -s read-only \
  "<codex-review-prompt>"
```

9. OpenCode thermo-nuclear reviewer prompt shape:

```text
Load and use `thermo-nuclear-code-quality-review` for a local adversarial review.

Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the review scale and output expectations from `thermo-nuclear-code-quality-review`.

Shared review context:
<shared-review-context>
```

10. OpenCode code-review reviewer prompt shape:

```text
Load and use `code-review` for a local adversarial review.

Use the review fixed point from the shared context as the skill's fixed point. Follow the skill's Standards and Spec workflow, including its nested Standards and Spec reviewers when required. Preserve the skill's separate `Standards` and `Spec` reports and summary. Apply the shared review context below. Inspect only the committed review target and directly relevant existing code needed to understand it. Do not edit files, run mutating commands, commit, push, create PRs, or comment remotely. Findings only. Follow the remaining review rubric and output expectations from `code-review`.

Shared review context:
<shared-review-context>
```

11. Launch the two Task calls and both CLI calls through the harness's parallel tool facility so all four receive their prompts before any reviewer returns. Set the harness timeout for every Cursor and Codex CLI Bash call, including retries, to exactly 600000 milliseconds (ten minutes); the command itself does not configure this timeout.
12. Let each reviewer produce its authentic review output. If Cursor cannot inspect the diff because its permissions block shell execution, keep its output but note that limitation during consolidation instead of treating it as a full diff review.
13. If a reviewer fails because of local or transient tooling, retry only that reviewer once with the documented shape above. If it still fails, record a blocker as that reviewer's terminal outcome and mark the local adversarial review incomplete instead of pretending the review passed.

Aggregation and consolidation:

1. Wait for all four reviewers to reach a terminal outcome: review output or recorded blocker. Consolidate successful outputs and report any blocker as an incomplete gate.
2. Normalize enough metadata to de-duplicate candidates while preserving each reviewer's original wording, severity, priority, category, and taxonomy. Add comparison fields only when useful: source reviewer, path/line, root cause, failure mode, evidence or repro path, fix direction, security impact, and test need.
3. De-duplicate by root cause and failure mode, not wording. Merge duplicate entries, keep the strongest evidence, and preserve all source reviewers.
4. Reject unsupported findings, style-only comments, findings outside the reviewed committed diff, and items without a concrete failure mode.
5. Present all unique confirmed findings first, ordered by severity. Include the source reviewer list for each finding.
6. Briefly list rejected false positives or duplicate clusters only when useful for trust or follow-up.
7. Append all four terminal outcomes, including raw reviewer output or a recorded blocker, and the consolidated adversarial review findings to `handoff.md` when a task artifact exists.

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
5. Summarize the PR-ready narrative for nontrivial code changes: Summary, Why, Design, Validation, and Follow-up/Risk.
6. Append commands, results, and PR-ready narrative to `handoff.md` when a task artifact exists.
7. Do not claim done if verification is inconclusive.

Outside an active Finish Loop, ask for explicit approval before commit, push, merge, deploy, destructive data changes, or external messages. Inside a Finish Loop, its declared scope supplies approval only for the operations listed in that mode; stop at any operation or decision outside that boundary.

## Final response

Follow the user-facing voice and keep the final response short. Include:

- Mode used.
- Artifact paths, if any.
- What changed.
- Reviewable slice and contract/seam decisions when nontrivial.
- Verification run and result.
- Remaining risks or next action.

If no code was changed, say so directly.
