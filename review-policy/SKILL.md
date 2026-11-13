---
name: review-policy
description: Select authorized PR reviewers, assign one request owner, and reuse substantive review coverage.
---

# Review Policy

Follow explicit user and repository requirements. Select additional review for consequential risks left after implementation and verification; this policy does not waive required approvals or checks.

## Select

Inspect the complete candidate, requirements, existing proof, and review coverage. When reviews are authorized, choose the least costly sufficient option and retain the reason in working context. Local-only work needs no independent review unless requested.

| Choice | Use when |
| --- | --- |
| None | Direct inspection and verification adequately cover the change; runtime code can qualify. No extra approval or waiver is needed to choose None. |
| Greptile Base | An independent correctness pass adds meaningful coverage. |
| Codex Security | Changes affect authentication, authorization, isolation, secrets, webhooks, injection, or CI trust boundaries. |
| Base + Security | Both reviews close distinct gaps. |

Greptile Base is the usual PR choice; None fits lower-risk changes, and the report says it was chosen.

Above-Base Greptile requests require the user's approval, including when concrete configuration shows the normal trigger would use a premium or Auto tier. Recommend them only for a specific high-impact gap cheaper review cannot cover. Use the question tool with the reason and known credit impact; a declined proposal is not a new gate. An unknown tier alone does not justify a pricing investigation or block the normal route.

## Run

Finish implementation and applicable local checks first. Pin the base and complete candidate, including dirty work for local review; supply requirements and repository contracts. Reuse completed reviews. The builder owns its PR's review fixes, including on landing-enabled repos: mark ready after proof there, then go idle without polling. The landing observer wakes the owning builder with findings when reviews finish or CI goes red; the builder fixes them, verifies affected proof, replies/resolves authorized threads, pushes additively, and returns to idle. Elsewhere, preserve the repository's draft/readiness authority through review and remediation.

- **Greptile Base:** the landing observer requests it after handoff, never the builder. Before posting `@greptileai review` at most once per PR, check the PR's comments and reviews across all heads; skip posting if any Greptile request or review exists unless the user explicitly approved a repeat. A new head or push never authorizes another request. An `excludeAuthors` setting suppresses automatic review, not an authorized manual request; an exclusion notice is not a completed review. Preserve other contributors' settings. The trigger inherits configured settings rather than forcing Base. See [Greptile's review tiers](https://www.greptile.com/docs/code-review/review-tiers) when provider behavior is uncertain.
- **Codex Security:** prefer the installed `codex-security` CLI and its current help and [official guide](https://developers.openai.com/codex/security/cli), using ChatGPT authentication and a private, report-only scan of the selected diff. Use the GitHub trigger only when requested or required. Apply actual approved usage limits; do not invent a per-scan dollar cap. A CLI report does not satisfy a required GitHub check, and ordinary Codex review is not dedicated security coverage.
- **Local review:** when installed or supplied by the repository, use `autoreview` only when requested or selected up front, not automatically beneath hosted review; follow its one-pass, P0/P1 procedure. Otherwise use the owning review contract, or report the missing tool if explicitly required.

## Remediate And Reuse

Use `review-remediation` for existing feedback. Refresh affected proof after fixes. Reuse review when the substantive behavior and scope remain covered; commit count, a base update, minor lint fixes, or a new SHA alone do not require another pass.

**Greptile re-reviews require the user's explicit approval.** Propose one only for a concrete uncovered risk, identifying what changed since the reviewed revision and the expected benefit and cost. For other reviewers, another pass still needs a material coverage gap and authority for the request.

Report the selected review, covered revision, observed result, and remaining gaps. A request, silence, skipped review, or summary score alone does not establish coverage. Follow repository requirements for final-head review and report any missing approval without implying it passed.
