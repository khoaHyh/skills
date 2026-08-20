# Computa Please PR Description Eval

This eval checks that `computa-please` routes every pull request description through its disclosed PR Description contract, independent of workflow mode.

## Fixtures

Run the cases against two clean, disposable repositories at fixed revisions. Publication cases require a disposable remote that contains no production code or active pull requests.

1. A representative diff that edits one synchronous production path, one asynchronous handoff, and their tests.
2. A documentation-only diff with no added or edited call stacks.

Record each repository, base SHA, head SHA, and expected changed paths before running. Use the same fixtures for every candidate skill revision. Reset the fixture branch and close any eval pull request after each run.

## Run

Publish and sync the candidate skill, then start a fresh `computa` agent session for each case in [cases.md](cases.md). Capture the JSON event stream, final response, resulting PR body when the case authorizes publication, and any external actions.

Run every case at least three times. Score each run with [scorecard.md](scorecard.md). A run passes only when every applicable hard gate passes; compare revisions by pass rate rather than a single successful sample.
