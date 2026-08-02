---
name: computa-please
description: "Use for /computa-please: route discussion-before-mutation, specs, RGR implementation, bounded finish loops, debugging, recall/pickup, reflection, and review workflows."
---

# computa-please

`computa-please` is the user's agent orchestration workflow. It routes a request into the right mode before artifacts or mutation, composes existing skills, protects context-window resets, and runs accepted work to a machine-checkable PR gate when explicitly requested.

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
- Small verifiable units: every implementation slice ends in a concrete check.
- Bounded loops: automate only against observable state, persist each transition, and stop on completion, a real decision fork, or repeated no-progress.
- Structure over reminders: repeated corrections become tests, lints, scripts, review agents, or proposed skill edits.
- Human judgment at real forks: ask for product, security, irreversible, public API, deploy, money, data deletion, or ownership calls; observe facts directly.
- Main agent owns synthesis: subagents gather, challenge, or implement scoped work, but the main agent decides.

## User-facing voice

In every message addressed to the user, including progress updates, questions, checkpoints, and the final response, speak simply, concisely, and coherently, like one human talking to another. Prefer plain language. Use technical terms only when they carry necessary meaning in context, and explain an unfamiliar term briefly when the user needs it to follow the point.

This voice applies only to messages sent to the user. Write code, artifacts, tool inputs, subagent prompts, reviewer prompts, commit messages, and external messages in the form best suited to their purpose.

## Reviewable slice

`coding-standards` owns general TypeScript policy and `codebase-design` owns module design. For nontrivial app-code work, keep one tracer-bullet behavior reviewable and answer:

- Domain or lifecycle: what concept, state, transition, or invariant owns this behavior?
- Contract surface: what public schema, API, route, service interface, or module contract changes?
- Boundary parser/projection: where does untrusted, persisted, or protocol-shaped data become refined, and where is it projected out?
- Service and adapter seams: what module owns policy, and what adapter owns external mechanics?
- Failure model: which failures are expected values, and which failures are defects?
- Async/resource ownership: who owns cancellation, transactions, idempotency, retries, detached work, and cleanup?
- Verification loop: what test, repro, trace, command, or runtime proves the changed behavior through the real seam?

Completion: the slice is coherent through contract, core, adapter, and caller; expected failures are typed; verification crosses the real seam; and the PR narrative states Summary, Why, Design, Validation, and Follow-up/Risk.

## Review boundary

Local code review is defined by purpose, not by its label or current mode. Any action that inspects app code, a diff, commit, branch, or PR to produce findings, risks, compliance judgments, or readiness judgments is Review, including an audit, recheck, second opinion, or final pass.

- Run `local-adversarial-review-gauntlet` for every local code review, including the Finish Loop's local review gate.
- Do not launch ad hoc code-review tasks or invoke `autoreview`, `code-review`, `thermo-nuclear-code-quality-review`, or another reviewer directly outside the gauntlet.
- Tests, typecheck, lint, build, runtime repros, and deterministic contract checks are verification, not review. Spec, design, and document review remain normal Discuss or Spec work.

## Subagent posture

- Use subagents aggressively for research, design, debugging support, and review, but keep ownership centralized.
- For research and design, use parallel `explore`, `librarian`, or `oracle` subagents when independent search helps. Use `field-lab` when the user selects a structured inquiry or dialectic, and `design-an-interface` when competing module shapes need comparison.
- For codebase exploration, give subagents scoped questions and file pointers; keep raw dumps out of the main thread.
- For debugging, build or identify the repro/evidence loop before fanning out hypotheses. After the symptom is bounded, delegate code path, history, docs, or hypothesis investigation.
- For local code review, apply the Review boundary and let `local-adversarial-review-gauntlet` own reviewer selection, isolation, execution, and consolidation.
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
- When deciding how to sequence an addition, refactor, or rewrite, load and apply `principle-subtract-before-you-add` before recommending a direction.
- End with a recommendation, options, tradeoffs, or a clear next decision.
- Ask whether to promote the discussion into a spec or implementation only when the user has not already decided.

Completion criterion: the user has a recommendation, decision point, or explicit promotion path, and no file or artifact was changed unless they asked for persistence.

If the user explicitly asks to persist the direction, route to Spec.

### Spec

Use when the user asks for a tech spec, PRD, durable plan, implementation phases, or says to persist a discussed direction.

Steps:

1. Create or locate the task artifact directory and select the existing or new tech spec path.
2. When the spec sequences an addition, refactor, or rewrite, load and apply `principle-subtract-before-you-add` before fixing the implementation order.
3. Load and run `tech-spec` with the available context and selected artifact path, following its branch selection through an implementation-ready artifact.
4. Check every slice-checklist item for app-code work and update the artifact for any missing applicable item.
5. Append `handoff.md`.
6. Run Spec checkpoint.

Output: draft tech spec and updated handoff. Do not change production code.

Completion criterion: the tech spec is concrete enough that a fresh session can identify the contract, slice boundaries, verification loop, and open questions without redoing discovery; when subtraction applies, it sequences safe removal before construction.

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
- `field-lab` when the user selects its dialectic workflow for a real unresolved tension.
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
- `principle-subtract-before-you-add` when the change adds, refactors, or rewrites behavior.
- `tdd`.
- `coding-standards`.
- `codebase-design` for nontrivial module seams.

Also load when relevant:

- `write-effect-ts`.
- `find-docs`.
- `typescript-magician`.
- `diagnosing-bugs`.
- `feedback-loop`.

Rules:

- If no spec exists, inspect first and decide whether the request is a small direct slice or needs Discuss/Spec before mutation.
- Keep the slice checklist in working context when no artifact is needed.
- Use red-green-refactor TDD.
- Make the smallest correct change.
- Implement one tracer-bullet slice at a time.
- Prefer contract-first changes before wiring callers.
- Keep lifecycle/status/outcome vocabulary explicit.
- For applicable work, complete the `principle-subtract-before-you-add` subtraction pass before constructing the first slice.
- Do not preserve compatibility unless persisted data, shipped behavior, external consumers, or the user require it.
- For every new seam, name what it hides and why deleting it would spread complexity into callers.
- Keep expected failures typed and boundary translation local.
- Verify with real commands.
- Append implementation status, slice checklist decisions, commands, results, and PR-ready narrative to `handoff.md`.

Completion criterion: the slice has a failing-then-passing or otherwise risk-matched verification loop, the diff is inspectable as one coherent behavior, remaining risks are named, and applicable subtraction is visible in the diff or explicitly ruled out from observed usage.

### Finish Loop

Use only when the user explicitly asks to start a loop, take an accepted tech spec to an open PR, or babysit an existing PR to the final human gate. A post-grill spec is accepted only through the Spec checkpoint; completing the grill does not imply approval.

An active Finish Loop authorizes scoped implementation, verification, commits, the local adversarial review gate, synchronization and conflict remediation for the current Graphite diff when tracked, pushes, PR creation or updates, ready-for-review state changes, CI remediation, one eligible Greptile request, and resolution of addressed review threads. It does not authorize sibling Graphite diffs, scope expansion, deploys, destructive changes, or unrelated-file changes; route those to the user as real decision forks.

Load the accepted tech spec and `handoff.md`, then load the skills required by [the Finish Loop runbook](references/finish-loop.md) and execute its state machine. Persist every state transition before taking the next external action. A recovered run resumes from observed repository, PR, CI, and ledger state rather than replaying completed actions.

The loop ends with the local adversarial review gate complete, the open PR at its final pushed commit, conflict-free and ready for review, required CI green for that commit, and all actionable findings from the single eligible Greptile review addressed. Hand that state to the user and stop.

### Debug

Use when the user reports a bug, failing test, runtime error, production error, performance regression, flaky behavior, CI failure, or asks to diagnose/fix something broken.

First load:

- `diagnosing-bugs`.
- `tdd`.
- `coding-standards`.

Also load when relevant:

- `feedback-loop`.
- `write-effect-ts`.
- `find-docs`.

Steps:

1. Classify the symptom and use `diagnosing-bugs` to build a tight red-capable loop against the user's actual failure.
2. Reproduce and minimize before implementation. Fan out falsifiable hypotheses only after the symptom is bounded.
3. Use `tdd` when a regression test has a correct seam; otherwise record the testability gap.
4. When the fix adds, refactors, or rewrites behavior, apply `principle-subtract-before-you-add` before implementation.
5. Apply the smallest root-cause fix, then rerun the original repro and relevant broader checks.
6. Remove temporary instrumentation and record root cause, verification, and remaining risk in `handoff.md` when an artifact exists.

No implementation until the root cause is understood or explicitly marked unknown with a contained mitigation.

Completion criterion: the original symptom is reproduced or convincingly bounded, the fix addresses root cause rather than only symptoms, and the final verification reruns the repro loop plus relevant broader checks.

### Review

Use when the user asks for code review, local adversarial review, PR readiness, or a final local review gate.

Rules:

- Apply the Review boundary: every local code review runs through `local-adversarial-review-gauntlet`, regardless of whether it is called an audit, recheck, readiness check, or verification pass.
- Load and run `local-adversarial-review-gauntlet` as Review mode's single formal runbook.
- Spec, design, document, or plan review stays in the current Discuss or Spec phase as a normal conversation or checkpoint. Do not create a separate review runbook for it.
- Manual review notes stay in the current stage: discuss them, or route to Implement/Debug when the user asks for changes. Do not create a separate repair playbook.
- Pass the gauntlet the user's intent, non-goals, reviewable slice, contract/seam/lifecycle decisions, verification evidence, artifact path when one exists, and whether the user explicitly authorized its prerequisite local commit. A generic review or PR-readiness request does not supply that commit authorization.
- Greptile feedback and CI remediation remain separate workflows and require their own user intent or active Finish Loop authorization.

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

## Decision rules

Auto-choose defaults when the choice is spec-only, reversible, narrows scope, defers nonessential work, follows existing repo convention after inspection, or adds durable documentation for an architectural decision.

Ask the user when the decision changes product direction, affects public API shape, changes production behavior, touches auth, security, secrets, money, data deletion, deployments, team process, ownership, or cannot be observed.

Do not ask before checking facts discoverable from code, git history, existing docs, config, issue trackers, Slack, or connected MCPs.

## Commit History

When a commit is authorized, use additive history on the current PR or branch. Give every coherent implementation slice and each review, CI, or external-feedback remediation batch its own commit. Use a normal `git commit` with Git and `gt modify --commit` with Graphite. Preserve every commit whose SHA has been pushed, reviewed, recorded as a checkpoint, or observed by CI.

Amend only when the user explicitly requests it, or to repair the construction of the immediately preceding unpublished commit, such as its message or an accidentally omitted intended file. The repair exception requires that no review, CI run, durable checkpoint, or external actor has observed the commit SHA. Record the reason in the active Finish Loop ledger whenever the exception is used.

Completion: the branch history shows each completed slice and remediation batch as a distinct commit, or the active ledger records a qualifying amend exception.

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
