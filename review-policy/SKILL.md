---
name: review-policy
description: Select authorized PR reviewers, assign one request owner, and reuse substantive review coverage.
---

# Review Policy

Follow explicit user and repository requirements. Select additional review for consequential risks left after implementation and verification; preserve required approvals and checks. Codex is optional coverage, not a ship gate; if it ran, the builder dispositions every finding.

## Select

Inspect the complete candidate, requirements, existing proof, and review coverage. Before selecting or dispatching a security runner, inspect the repository's configured automatic hosted security review and existing or pending coverage for the target diff/head. When reviews are authorized, choose the least costly sufficient option and retain the reason in working context. Local-only work needs no independent review unless requested.

| Choice | Use when |
| --- | --- |
| None | Direct inspection and verification adequately cover the change; runtime code can qualify. No extra approval is needed to choose None. |
| Greptile Base | Medium/high `merge-risk` grade or a sensitive PR, when an independent correctness pass adds meaningful coverage. |
| Codex Security | Low-risk non-sensitive PRs, or changes affecting authentication, authorization, isolation, secrets, webhooks, injection, or CI trust boundaries. |
| Base + Security | Both reviews close distinct gaps. |

When the lane needs an AI correctness review, it routes Khoa's PRs to Neon and others to Greptile. Reuse sufficient existing coverage, including applicable Codex Security for low-risk non-sensitive PRs. If Neon cannot provide coverage, leave the PR held for the conductor; no Greptile fallback.

Above-Base Greptile requests require the user's approval, including when concrete configuration shows the normal trigger would use a premium or Auto tier. Recommend them only for a specific high-impact gap cheaper review cannot cover. Use the question tool with the reason and known credit impact; a declined proposal is not a new gate. An unknown tier alone does not justify a pricing investigation or block the normal route.

## Run

Only the lane posts `@greptileai` or any other AI-review request; builders and all other agents never do.

Finish implementation and applicable local checks first. Pin the base and complete candidate, including dirty work for local review; supply requirements and repository contracts. Reuse completed reviews. On lane-enabled repos, hand off through `computa-please`: Neon owns its remediation attempt; the builder handles fixes the lane assigns and never re-requests review. Elsewhere, preserve the repository's draft/readiness authority through review and remediation.

- **Greptile Base:** before the lane's first request, check comments and reviews across all heads; an existing request or review makes it a re-review under the approval rule below. An `excludeAuthors` setting suppresses automatic review, not an authorized lane request; an exclusion notice is not a completed review. Preserve other contributors' settings. The trigger inherits configured settings rather than forcing Base. See [Greptile's review tiers](https://www.greptile.com/docs/code-review/review-tiers) when provider behavior is uncertain.
- **Codex Security:** let applicable scheduled or in-flight hosted security review finish through its normal owner/event workflow, without polling or duplicating it locally. Reuse actual findings and their covered revision, not completion status alone. Ordinary Codex code review is not dedicated security coverage. Use the installed `codex-security` CLI only for an explicit local-scan request or a concrete remaining uncovered need with no applicable hosted security path. Follow its current help and [official guide](https://developers.openai.com/codex/security/cli), using ChatGPT authentication and a private, report-only scan of the selected diff. A local authentication failure affects only the local scan, not hosted review's availability or result. Only the lane posts a manual GitHub trigger, when requested or required. Apply actual approved usage limits; do not invent a per-scan dollar cap. A CLI report does not satisfy a required GitHub check.
- **Local review:** when installed or supplied by the repository, use `autoreview` only when requested or selected up front, not automatically beneath hosted review; follow its one-pass, P0/P1 procedure. Otherwise use the owning review contract, or report the missing tool if explicitly required.

## Remediate And Reuse

Use `review-remediation` for existing feedback. Refresh affected proof after fixes. Reuse review when the substantive behavior and scope remain covered; commit count, a base update, minor lint fixes, or a new SHA alone do not require another pass.

A reviewer bot's demand for a specific person's approval, from custom rules or reviewer memory, is not a merge gate unless the owner's instructions name that approval. For an unsupported demand, the builder replies once on that thread, "Rejected: not a gate in this workflow", and resolves it rather than waiting for that person.

**Any AI re-review requires the owner's explicit approval through the OpenCode question tool, asked by the conductor.** A new head, rebase or remediation alone never justifies one. Propose one only for a concrete uncovered risk, identifying what changed since the reviewed revision and the expected benefit and cost.

Report the selected review, covered revision, observed result, and remaining gaps. A request, silence, skipped review, or summary score alone does not establish coverage. Follow repository requirements for final-head review and report any missing approval without implying it passed.
