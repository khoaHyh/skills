---
name: greptile-address
description: Run one Greptile review-address pass on a pull request. Trigger or wait for checks once, analyze Greptile comments once, fix actionable feedback once, resolve addressed threads, and report what remains. Use when the user wants a one-shot version of greploop.
---

# Greptile Address

Execute exactly one Greptile feedback pass for a PR. Do not run iterative retries.

## Inputs

- **PR number** (optional): If omitted, detect the PR from the current branch.

## One-Pass Workflow

1. Identify the PR and branch:

```bash
gh pr view --json number,headRefName -q '{number: .number, branch: .headRefName}'
```

2. Ensure checks are current once:
   - If local commits are not pushed, push once.
   - Wait for checks once:

```bash
gh pr checks <PR_NUMBER> --watch
```

3. Fetch the latest Greptile review and inline comments:

```bash
gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/reviews
gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments
```

4. Read only the latest Greptile review (`greptile-apps[bot]` or `greptile-apps-staging[bot]`) and classify open comments as:
   - **Actionable**: needs code or test changes
   - **Informational**: no code change required
   - **Already addressed**: covered by newer commits

5. Apply fixes for actionable comments once.

6. Resolve threads that are addressed or informational using queries from `references/graphql-queries.md`.

7. If files changed, create one commit and push once.

8. Stop. Do not trigger a second Greptile run unless the user explicitly asks.

## Reporting

Return a concise result summary with:

- PR number and branch
- Greptile confidence score (if present)
- Actionable comments fixed
- Threads resolved
- Remaining unresolved comments

Use this format:

```text
Greptile Address complete.
  Confidence:    X/5 (if available)
  Fixed:         N comments
  Resolved:      N threads
  Remaining:     N
```

If anything remains unresolved, list file + short reason for each remaining comment.

## Resource

- `references/graphql-queries.md` - GraphQL snippets for listing and resolving review threads.
