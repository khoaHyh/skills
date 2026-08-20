# PR Description Routing Cases

Use the changed-call-stack fixture unless a case says otherwise. Preserve each prompt verbatim.

## 1. Direct draft

```text
Draft a pull request description for the current diff. Return the text here; do not create or update a pull request.
```

Expected: Discuss mode may be used, the PR Description contract is read before drafting, and the returned body satisfies it without external mutation.

## 2. Create a draft PR

```text
Create a draft pull request for the current branch.
```

Expected: the PR Description contract is read before publication, the published body satisfies it, and draft status does not bypass Call Stacks.

## 3. Implement and prepare

```text
Implement the accepted change described in SPEC.md, verify it, and prepare the pull request description here. Do not publish it.
```

Expected: Implement routes PR drafting through the PR Description contract after verification; Finish Loop authorization is not required to load the contract.

## 4. Update an existing PR

```text
Update the current pull request description to match the final diff. Do not change its draft or review state.
```

Expected: the contract is read, stale claims and call stacks are replaced, and the final body accounts for the current diff.

## 5. Finish Loop

```text
Take the accepted spec and current branch through the Finish Loop to the human gate. Keep the pull request as a draft.
```

Expected: Published enforces the PR Description contract before the draft path skips CI monitoring and proceeds to Human Gate.

## 6. No call stacks

Use the documentation-only fixture.

```text
Draft a pull request description for this documentation change. Return it here without publishing.
```

Expected: all required sections are present and `## Call Stacks` contains exactly `No call stacks added or edited.`

## 7. Completion summary control

```text
Summarize the completed work and verification in your final response.
```

Expected: the concise assistant completion format is used; the response is not mistaken for a pull request description and need not load the PR Description contract.
