---
name: greptile-address
description: Consume and address one existing Greptile review snapshot on a pull request. Use when the user wants to fix Greptile comments or a PR loop has recorded one attributable review. This skill never requests or re-requests a review.
---

# Greptile Address

Consume exactly one Greptile review snapshot for a PR, remediate its actionable findings, and resolve addressed threads. The snapshot is fixed for the run: never request a review, wait for a second review, or replace it with newer feedback.

## Inputs

- **PR number** (optional): If omitted, detect the PR from the current branch.
- **Expected reviewed SHA** (optional): Required when a supervising loop requested the review.
- **Request-attempt time or review ID** (optional): Use to distinguish the paid review from stale feedback.

## One-Pass Workflow

1. Identify the PR and branch:

```bash
gh pr view --json number,headRefName -q '{number: .number, branch: .headRefName}'
```

2. Fetch pull-request reviews, inline review comments, and issue comments separately. Issue comments are status/context only and can never be review snapshots:

```bash
gh api --paginate repos/{owner}/{repo}/pulls/<PR_NUMBER>/reviews
gh api --paginate repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments
gh api --paginate repos/{owner}/{repo}/issues/<PR_NUMBER>/comments
```

3. Build candidates using this completed-snapshot predicate. Every condition is required:
   - The candidate is an object returned by `/pulls/<PR_NUMBER>/reviews`, not an issue comment, check run, reaction, or standalone inline comment.
   - `user.login` is exactly `greptile-apps[bot]` or `greptile-apps-staging[bot]`.
   - It has a numeric `id`, a non-empty `commit_id`, a non-empty `submitted_at`, and a submitted `state` rather than `PENDING` or `DISMISSED`.
   - It has positive completion evidence: either at least one inline comment whose `pull_request_review_id` equals its `id`, or its review body contains a Greptile completed-report signal such as a numeric confidence score (`0/5` through `5/5`) or explicit last-reviewed-commit/review-counter metadata.
   - Its body is not a status, skip, or eligibility notice. Text such as `PR author is in the excluded authors list`, `skipping review`, `not eligible`, `review was not triggered`, `indexing`, or `review in progress` disqualifies it regardless of author or GitHub object type.

   Be conservative: a bot-authored artifact without positive completion evidence is not an existing review. Record it as a status artifact, but do not select or consume it.

4. Select one immutable completed snapshot from the candidates:
   - When a review ID is supplied, select that exact review even when it targets an older commit.
   - Otherwise, when an expected SHA and request time are supplied, require an attributable review at that SHA and no earlier than the request attempt.
   - Otherwise use the latest existing Greptile review and state its review ID and commit SHA before mutation.
   - A supplied review ID must still satisfy the completed-snapshot predicate. If no candidate qualifies or attribution is ambiguous, stop. Do not request another review or consume stale comments.

5. Read only that review's summary and comments whose `pull_request_review_id` matches the selected review. Compare each finding with the current PR diff, even when the review targets an older commit, then classify every open finding as:
   - **Actionable**: needs code or test changes
   - **Informational**: no code change required
   - **Already addressed**: covered by newer commits
   - **Rejected with evidence**: incorrect or outside scope, with a concrete reason

6. Apply the smallest correct fix for every actionable finding. Add or update a test when the finding exposes a reproducible behavior gap.
7. Run focused verification for each fix and the repository's relevant broader checks.
8. Re-read the fixed snapshot, account for every finding, and resolve its addressed threads using [the GraphQL reference](references/graphql-queries.md). Do not inspect a later review as a new source of findings.

Completion criterion: every finding in the selected snapshot is fixed, informational, already addressed, or rejected with evidence; focused and relevant broader verification pass; and every addressed thread from that snapshot is resolved.

## Reporting

Return a concise result summary with:

- PR number and branch
- Review ID and reviewed SHA
- Greptile confidence score (if present)
- Actionable comments fixed
- Findings rejected with evidence
- Threads resolved
- Remaining unresolved comments

Use this format:

```text
Greptile Address complete.
  Review:        ID at SHA
  Confidence:    X/5 (if available)
  Fixed:         N comments
  Rejected:      N comments
  Resolved:      N threads
  Remaining:     N
```

If anything remains unresolved, list file + short reason for each remaining comment.

## Resource

- `references/graphql-queries.md` - GraphQL snippets for listing and resolving review threads.
