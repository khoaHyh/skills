# Review

Spend review quota on consequential defects, not a fixed number of approval votes. Follow explicit user and repository review requirements first; the defaults below select additional reviews, not waivers of required gates. Review remains separate from the author's scope checks and behavioral proof.

## Select The Reviews

For PR-bound work, inspect the complete candidate, accepted requirements, affected owners and callers, existing review coverage, and direct verification. When reviews are authorized, choose the cheapest sufficient plan: None, Greptile Base, Codex Security, or Base + Security. Record the choice and one-line reason in working context or the existing PR. Local-only work needs no independent review unless requested.

| Choice | Criteria | Selection |
| --- | --- | --- |
| None | Focused, low-risk or mechanical changes whose behavior and failure cases are adequately established by direct inspection and verification; runtime code can qualify | No additional review; no approval or waiver needed unless an explicit external requirement applies |
| General correctness | An independent pass would add meaningful coverage of changed behavior beyond existing proof | Greptile Base |
| Security | Actual changes to authentication, authorization, account isolation, secrets, webhook verification, injection paths, or CI trust boundaries | Codex Security; add Base only for a distinct general-correctness gap |
| Premium proposal | A specific, high-impact failure mode is not adequately addressed by direct proof or a cheaper planned review | Recommend either Greptile above Base or Bugbot; wait for approval |

Choose the combination before invoking reviewers; do not run Base as an automatic stepping stone to Plus. Money, state, deployment, shared-contract changes, size, and file count prompt closer risk assessment, not an automatic paid tier or reviewer bundle. Classify by actual effects and remaining uncertainty, not filenames. Security review can stand alone or accompany one justified general reviewer.

For an authorized initial Greptile Base review, post `@greptileai review` once on the PR and observe the result. This is the normal GitHub route; it needs neither Greptile CLI authentication nor a dashboard/pricing audit. An unknown inherited tier or an unset `effort` field is not a reason to block or switch to the CLI.

### Premium Review Approval

**Bugbot and explicit above-Base Greptile requests require Khoa's approval.** Also ask when concrete configuration or provider evidence shows the normal request would use a higher tier or Auto. Uncertainty alone is not that evidence. A generic "run the appropriate reviews" request delegates the ordinary choices above, not a deliberate premium request.

For an unapproved premium proposal, use the question tool with Yes/No choices. Name the proposed reviewer/tier and scope, explain the concrete risk and why cheaper coverage is insufficient, and state the known credit/usage impact or uncertainty. Prefer one premium general reviewer; combining a premium Greptile tier with Bugbot is exceptional, needs distinct reasons for both, and requires explicit approval of the pair. Either approved reviewer may accompany Codex Security when security coverage is also needed.

An optional premium proposal is not a new gate. If declined, use sufficient lower-cost coverage or report residual risk; do not invent a waiver requirement. Explicit repository or user-required gates still apply.

## Run Only The Selected Reviews

1. Reuse applicable completed reviews and wait for relevant reviews already running before spending another request. An automatic Greptile review can satisfy the selected Greptile review when its coverage and effort meet the plan.
2. **Khoa's Greptile `excludeAuthors` entry is not a manual-review waiver.** Its intent is to suppress unsolicited automatic reviews, not this skill's selected, authorized manual review. An automatic "author excluded/skipped" notice neither waives the rubric nor counts as completed review coverage. Preserve each contributor's automation settings and author exclusions. Selecting None means requesting nothing additional; it does not disable someone else's automation. Changing bot settings, buying credits, or configuring integrations is separate work.
3. Finish implementation/iteration and applicable local verification, then pin the candidate's base and complete diff, including dirty work for a selected local review. Give reviewers the requirements and applicable repository contracts, not just the author's explanation. Confirm access, supported manual triggers, and authority before requesting a review; this policy grants no publication, paid-request, reply, or merge permission.
4. Request one initial review from each selected reviewer using the existing integrations. Record each request before invocation and retain it through timeouts and resumes. Hosted reviews run on the draft PR; perform any up-front local review before publication. Keep the PR draft through review, finding remediation, and affected verification. If a reviewer requires a ready PR, report that constraint rather than promoting the PR to trigger it. A requested named review follows its own workflow.

Documented PR comment triggers:

| Review | Comment |
| --- | --- |
| Greptile initial standard review | `@greptileai review` |
| Greptile Plus | `@greptileai effort: plus` |
| Bugbot | `bugbot run` |
| Codex Security GitHub route, only when explicitly requested or required | `@codex security review` |

The plain Greptile comment inherits configured settings; it does not force Base or lower a higher configured tier. If the provider actually rejects an authorized manual Greptile request because of a filter, report the missing coverage rather than silently skipping review or editing the configuration. Bugbot reads `.cursor/BUGBOT.md`, not Cursor's `.mdc` project rules.

Use `autoreview` only when requested or selected up front as the local route, not as a mandatory pass beneath hosted reviews. Load its skill, select the complete target, and use explicit P0/P1 scope (`--max-priority P1`) with `--max-review-passes 1`. Preparation or isolation failures remain blockers, not permission to truncate scope or switch hosts after launch.

### Dedicated Security Review

When dedicated security review is selected and authorized, prefer the installed open-source `codex-security` CLI. Use the GitHub `@codex security review` route only when explicitly requested or required by the owning contract; an unavailable GitHub connector does not mean the CLI is unavailable. Reconcile existing requests before launching another route, and report the status of each route precisely.

Read `codex-security scan --help` and the [official CLI guide](https://developers.openai.com/codex/security/cli) for version-current diff targeting, preflight, permissions, limits, and result handling. Use ChatGPT authentication (`--auth chatgpt`) rather than ambient API keys. Scan the pinned PR diff, report-only, within existing authority and applicable approved limits. Keep artifacts private outside Git worktrees and remove unrelated credentials from the scan environment.

Do not invent a per-scan dollar ceiling for ChatGPT-authenticated scans. Apply user- or repository-approved limits that actually govern the run. CLI dollar estimates use API prices; they are not actual charges or a measure of ChatGPT subscription allowance.

A completed CLI report supplies dedicated security coverage, not completion of a required GitHub check. Ordinary `codex review` with a security prompt is not the dedicated CLI. Report missing coverage as a blocker when explicitly required.

Product contracts: [Greptile triggers and effort](https://www.greptile.com/docs/code-review/review-tiers), [Bugbot](https://cursor.com/docs/bugbot), [Codex Security Review](https://developers.openai.com/codex/security/security-review). Verify current documentation when setup or trigger behavior is uncertain.

## Findings And Repeat Reviews

For completed PR feedback, use `review-remediation` on the frozen finding IDs and reviewed revision. Verify findings against the supported caller path and requirements. Fix evidenced consequential defects; reject unsupported, duplicate, speculative, or stale findings with a short reason. Refresh affected behavioral proof and required checks after fixes. Publish any fixes before authorized replies or resolutions.

**Default to no repeat review.** Compare the substantive diff and behavior against the last reviewed revision and scope. Commit count, branch age, or a newer SHA does not establish stale coverage. Lint/format fixes and minor edits that leave reviewed behavior intact normally reuse the existing assessment; fixing a finding, rebasing, repairing CI, or resuming a session is not by itself a reason to review again.

**Greptile re-reviews require Khoa's explicit approval.** Once a completed Greptile review exists for the PR, another pass—including an effort upgrade—spends additional credits and needs approval before invocation. A generic request to "run the appropriate reviews" does not authorize a Greptile re-review.

When substantive changes leave material risk uncovered, recommend a Greptile re-review by identifying the reviewed revision, meaningful changes since it, coverage gap, and proposed scope/tier and credit impact. Wait for approval; do not invoke it merely because the branch changed substantially. Small changes to a critical boundary can justify a recommendation; many mechanically equivalent commits do not.

For reviewers not covered by an approval gate, the agent may request another pass only for a concrete unresolved risk that existing review, direct inspection, and focused verification do not adequately cover. State the risk, why another pass is necessary, and the smallest useful reviewer/scope before invoking it within existing authority and spending limits.

Honor repository requirements for exact-head review, but surface missing required review approval as a blocker rather than spending automatically. Otherwise record subsequent changes and their proof without presenting an older review as a review of the final head.

Reconcile queued, timed-out, or ambiguous requests before considering another invocation. Silence, missing comments, summary scores, and failed or incomplete runs are not a clean review. Report unavailable coverage and resolve required missing evidence rather than spending repeated requests for a nicer verdict.

## Completion

Retain the selection, base and reviewed candidate, actual result, finding dispositions, subsequent fixes, and current verification in working context or the existing handoff; no new report is required. Finish when selected reviews are complete or explicitly waived by the owning authority, findings are dispositioned, and applicable gates and required proof are current, or report the concrete blocker. A None selection is not a claim that an agent reviewed the code.
