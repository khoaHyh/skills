# Review

Spend review quota on consequential defects, not a fixed number of approval votes. Follow explicit user and repository review requirements first; the defaults below select additional reviews, not waivers of required gates. Review remains separate from the author's scope checks and behavioral proof.

## Select The Reviews

For PR-bound work, inspect the complete candidate, accepted requirements, affected owners and callers, and existing review coverage. Record the category, one-line reason, and selected reviewers in working context or the existing PR. Local-only work needs no independent review unless requested.

| Category | Criteria | Default reviews |
| --- | --- | --- |
| None | Presentation-only styling, ordinary copy/docs, or demonstrably mechanical edits without effects on business terms, security, retained data, CI, deployment, or agent behavior | Request no additional review |
| Standard | Ordinary feature or bug fix confined to one domain, without the High or security conditions | Greptile Base |
| High | Money or commercial calculations; durable state transitions, transactions or retries; destructive data changes; deployment controls; shared contracts affecting multiple apps; or more than 500 changed handwritten runtime lines or 15 runtime files, excluding formatting and generated output | Greptile Plus and Bugbot |
| Security add-on | Authentication, authorization, account isolation, secrets, webhook verification, untrusted input reaching SQL/HTML/commands, or CI credential and trust boundaries | High reviews plus a configured dedicated security reviewer |

Size can raise scrutiny, never lower it. Classify documentation, configuration, tests, and agent instructions by their effects, not their file extension. Use the owning repository's vocabulary for the concrete risk rather than hard-coding one project's domains here.

## Run Only The Selected Reviews

1. Reuse applicable completed reviews and wait for relevant reviews already running before spending another request. An automatic Greptile review can satisfy the selected Greptile review when its coverage and effort meet the plan.
2. Preserve each contributor's automatic-review preferences and author exclusions. Selecting None means requesting nothing additional; it does not disable someone else's automation. Changing bot settings, buying credits, or configuring integrations is separate work.
3. Stabilize the candidate and pin its base and complete diff, including dirty work for a selected local review. Give reviewers the requirements and applicable repository contracts, not just the author's explanation. Confirm access, author-filter behavior, supported triggers, and authority before requesting a review; this policy grants no publication, paid-request, reply, or merge permission.
4. Request one initial review from each selected reviewer using the existing integrations. Hosted reviews require an existing PR; perform selected local review before publication. A requested named review follows its own workflow.

Documented PR comment triggers:

| Review | Comment |
| --- | --- |
| Greptile Base, with Base configured | `@greptileai review` |
| Greptile Plus | `@greptileai effort: plus` |
| Bugbot | `bugbot run` |
| Codex Security Review, when access and setup are verified | `@codex security review` |

Greptile requests can raise configured effort, not lower it. Bugbot reads `.cursor/BUGBOT.md`, not Cursor's `.mdc` project rules. Ordinary Codex review with a security prompt is not the dedicated Security Review. Codex Security setup remains pending until verified; report the missing dedicated coverage rather than claiming it ran. An explicitly required unavailable review is a blocker.

Use `autoreview` only when requested or selected up front as the local route, not as a mandatory pass beneath hosted reviews. Load its skill, select the complete target, and use explicit P0/P1 scope (`--max-priority P1`) with `--max-review-passes 1`. Preparation or isolation failures remain blockers, not permission to truncate scope or switch hosts after launch.

Product contracts: [Greptile triggers and effort](https://www.greptile.com/docs/code-review/review-tiers), [Bugbot](https://cursor.com/docs/bugbot), [Codex Security Review](https://developers.openai.com/codex/security/security-review). Verify current documentation when setup or trigger behavior is uncertain.

## Findings And Repeat Reviews

Verify findings against the supported caller path and requirements. Fix evidenced consequential defects; reject unsupported, duplicate, speculative, or stale findings with a short reason. Refresh affected behavioral proof and required checks after fixes. Follow the owning remediation workflow when one applies.

**Default to no repeat review.** The agent may request another review only when it identifies a concrete unresolved risk that existing review, direct inspection, and focused verification do not adequately cover. Examples include a repair that changes a critical transaction or security boundary, newly introduced consequential behavior, or an incomplete assessment that still needs coverage. State the risk, why another reviewer pass is necessary, and the smallest useful reviewer/scope before invoking it, within existing authority and spending limits.

Fixing a finding, pushing commits, rebasing, repairing CI, or resuming a session is not by itself a reason to review again. A newer SHA alone does not erase useful review evidence. Obey any repository requirement for exact-head review; otherwise record subsequent changes and their proof without presenting an older review as a review of the final head.

Reconcile queued, timed-out, or ambiguous requests before considering another invocation. Silence, missing comments, summary scores, and failed or incomplete runs are not a clean review. Report unavailable coverage and resolve required missing evidence rather than spending repeated requests for a nicer verdict.

## Completion

Retain the selection, base and reviewed candidate, actual result, finding dispositions, subsequent fixes, and current verification in working context or the existing handoff; no new report is required. Finish when selected reviews are complete or explicitly waived by the owning authority, findings are dispositioned, and applicable gates and required proof are current, or report the concrete blocker. A None selection is not a claim that an agent reviewed the code.
