---
name: computa-please
description: Route engineering work from decision through the final human gate.
disable-model-invocation: true
---

# Computa Please

Deliver the requested outcome through the least process that can prove it. Subtract before adding, preserve real compatibility obligations, and spend verification in proportion to risk.

## Outcome And Authority

Establish the intended result, scope, success evidence, and authority from the request and accepted artifacts. Choose the route by the requested terminal outcome, not by the presence of a PR. Keep this framing in the conversation unless [Durable State](#durable-state) is needed.

An implementation request includes completing the change, running or inspecting the result where relevant, and fixing attributable failures within scope. Continue authorized local work through verification without pausing for approval of each edit or safe check. A first implementation, plan, or passing intermediate check is not the endpoint when the requested outcome still has a gap.

Resolve inspectable facts yourself. Ask only when a missing decision changes the outcome, consequential behavior, scope, or authority. For unresolved product, public-contract, domain, security, money, data-lifecycle, deployment, ownership, or architectural choices, use [Design Readiness](references/design-readiness.md). A clear, bounded request needs no ceremonial approval or separate spec.

Before any repository-content or Durable State write, or Recall/Pickup artifact recovery, follow [VCS Actions](references/vcs.md) to establish the one task-owned checkout (the **Task Worktree**). Re-anchor tools, artifacts, and delegates there. Commit, push, publication, merge, deploy, destructive data changes, and external messages require explicit authority; authorized local work does not imply it. The Finish Loop runbook owns its scoped delivery authority and mandatory merge choice.

If an instruction forces a pause or conflicts with the intended outcome, identify the limiting instruction and distinguish it from your interpretation. Report the smallest decision or permission needed to continue.

## Route

Use only the selected route and references whose conditions apply. A matched reference owns its procedure and completion criterion; read it before the action it governs.

| Mode | Requested outcome and route |
| --- | --- |
| Discuss | Compare, evaluate, or decide. Read-only and ephemeral by default; finish with a recommendation, tradeoff, or decision. |
| Spec | A durable implementation plan. Use the [Work Frame and Subtraction](references/execution.md#work-frame), then `tech-spec` for contracts, call stacks, file ownership, and pending Proof. Production code stays read-only. A requested comprehension map selects or resumes Spec; use [Comprehension Map](references/comprehension-map.md) at its checkpoint. |
| Implement | Verified local changes or draft-only publication. Use the accepted request, spec, Feature Contract, and handoff where present, then follow [Execution](references/execution.md). A Feature Contract alone routes to Spec when implementation boundaries remain unresolved. |
| Finish Loop | Drive accepted work or an existing PR through delivery: get it green, make it merge-ready, ship, land, merge, or verify post-merge workflows. Follow [Finish Loop](references/finish-loop.md) from its Entry Gate **before** bootstrap, persistence, polling, mutation, or external action. These requests authorize entry, not merge. |
| Debug | Diagnose a failure, regression, flake, or performance problem with `diagnosing-bugs`. Finish diagnosis with the symptom reproduced or bounded and root cause or remaining uncertainty explicit. For an authorized fix, follow [Execution](references/execution.md) and rerun the original repro. Load telemetry skills only when the observed path needs them. |
| Review | Find defects, independently of author confidence or prior conclusions. Follow the [Review Gate](#review-gate); report findings first with severity and file/line references. A one-pass PR status check is Discuss, not delivery. |
| Recall/Pickup | Recover artifacts and live state in the Task Worktree, distinguish inherited claims from reverified facts, and route the remainder. Resume a Finish Loop only from a nonterminal ledger entry with a recorded Entry Gate choice. A closed run provides no authority. |
| Reflect | Use observed corrections, retries, churn, and successful recipes to improve the workflow. Prefer deleting or replacing instructions; propose changes and how to evaluate them before editing unless implementation is already authorized. |

Default evaluative or genuinely ambiguous requests to Discuss; explicit change requests to Implement. A discussion becomes persistent or mutating only with the corresponding authority. An explicitly requested temporary `show-me` HTML visual may be created outside the project without authorizing production changes.

After compaction or pickup, reload this router once, recover the active step and live constraints, and re-evaluate the route and applicable references. Reuse a reference read recorded in working context or a durable handoff; reload when its content or the applicable authority changes.

## Review Gate

- **Requested review:** follow the named review skill and its target, authority, and completion contract.
- **Normal review:** use the repository's review workflow, or inspect every changed hunk and confirm or reject each candidate defect through its owning call path and relevant evidence. Verification commands are not independent review.
- **Local Review:** Finish Loop and PR-bound Implement or Debug work follow [Local Review](references/local-review.md) once after deterministic Proof passes and before draft publication. It owns the frozen target, Codex Autoreview, disposition, remediation, and Review Receipt.

Non-PR Implement and Debug work is exempt unless independent review is requested. Review mode uses Requested or Normal review. A worktree review needs no commit unless its selected tool requires one and the user authorizes it. Use `review-remediation` for a frozen feedback set; keep CI repair in its own workflow.

New product scope or unreviewed behavior makes a Local Review receipt stale. Finding, CI, and external-review remediation do not trigger another local pass. Independent remote review remains a later delivery layer.

## Delegation

Delegate bounded, independent work when it materially improves speed, coverage, or evidence quality. Parallelize only independent questions or disjoint file surfaces; keep dependent work sequential. Give each delegate the task-owned path and revision, goal, relevant facts, authority, and expected evidence. The main agent owns synthesis, the final diff, and Durable State.

Research and implementation delegates return scoped changes, facts with sources, or observed check results. Independent defect finding and readiness judgment belong to the Review Gate. Resolve unsupported or conflicting claims before relying on them.

## Durable State

Keep state conversational unless the user requests persistence, work must survive sessions, agents or people must coordinate, or a Finish Loop needs its external-action ledger. Then follow [VCS Actions: Durable State](references/vcs.md#durable-state) for the local spec and handoff. Keep workflow state out of product diffs, commits, and PRs.

## Plain-Language Pass

Write like one human talking to another: lead with the result or decision, use concrete facts, and omit internal workflow narration. Follow the user's format; otherwise use one or two sentences for a simple result, flat bullets for distinct facts, and headings only when useful. Keep exact identifiers, paths, commands, and errors when they matter.

When an inline visual would materially clarify structure, sequence, state, interaction, or a before-and-after change, load `show-me` and use its smallest useful view. Follow it with exactly: `Say “create HTML” for a richer visual.` On explicit acceptance, create and open one renderer-owned temporary HTML file outside the project, not product code or Durable State.

Before drafting, returning, creating, or updating a PR body, follow [PR Description](references/pr-description.md) through **Verify** (`check-pr-body` exits 0). Keep its schema and omit the HTML invitation.

## Stop Cleanly

The **Human Gate** is the final handoff, not a checkpoint after the first implementation. Reach it when the requested outcome has its evidence and applicable review or delivery conditions are satisfied, or when no authorized path remains past a named blocker. Stop expanding once further work cannot change the result, risk assessment, or required evidence.

Report the result, changed artifacts or no change, strongest relevant check and outcome, any omitted required check, residual risk or blocker, and any next human decision. For a Finish Loop, use its terminal report and delivery ceiling. Then stop; a new outcome needs new authority.
