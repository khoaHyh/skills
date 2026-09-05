# Local Review

Use one independent Codex Autoreview to challenge a complete PR candidate before publication. Keep implementation, review, remediation, and external review as separate stages.

## Entry

Run this gate for:

- Agent-authored work that will be published as a PR.
- An existing PR or branch entering a Finish Loop without a valid Review Receipt for its current semantic diff.

Non-PR Implement and Debug work is exempt unless the user requests independent review. Review mode follows its explicitly requested review workflow or the repository's normal review path.

**Complete when:** the work is exempt for a named reason or enters Freeze.

## Freeze

1. Finish the complete implementation slice and deterministic Proof.
2. Resolve the intended PR base to a commit. Under the existing VCS authority, commit the candidate, record the target commit and tree, and require a clean worktree with a non-empty branch diff. Local Review grants no commit, push, or publication authority.
3. Bind the cached focused and final checks, exit statuses, and justified omissions to that target and tree. Changed implementation bytes make the Proof stale and return the work to the [Execution Gate](execution.md#execution-gate).

**Complete when:** the base, target commit, target tree, complete branch diff, and target-bound Proof are explicit.

## Run

Load `autoreview` and follow its contract. Invoke its helper once against the committed branch diff with Codex and an explicit P1 threshold:

```bash
"$AUTOREVIEW" \
  --mode branch \
  --base "<resolved-pr-base>" \
  --engine codex \
  --max-priority P1 \
  --json-output "<owner-only-temporary-path>"
```

Add one concise `--prompt` only when an observed compatibility, reliability, security, or other production risk needs emphasis. The prompt names the concrete failure surface; it does not add reviewers or expand the target.

Treat `scoped-clean`, `filtered`, or validated `findings` as terminal outcomes for the selected P0-P1 scope. Preserve the exact status: `filtered` is not a general correctness certificate. Treat `incomplete`, target mismatch, malformed output, scanner refusal, provider failure, or target drift as a blocker rather than a clean review.

### Structural Exception

Load `thermo-nuclear-code-quality-review` in the same Local Review stage only when the diff presents a concrete structural-maintainability risk:

- A file crosses its 1,000-line threshold.
- A broad seam or ownership move increases coupling.
- New branching or state-model complexity materially raises reader load.
- A large behavior-preserving refactor may be moving rather than deleting complexity.
- Policy, helpers, or architectural decisions are duplicated across owners.

Apply it to the same frozen target and merge its candidates into the same disposition pass. Security, IAM, migration, deployment, and reliability risk alone do not select this code-quality review; emphasize those risks in Codex Autoreview and preserve the independent remote-review layer.

**Complete when:** the Codex result is terminal and any selected structural review has returned candidates against the same target.

## Disposition

1. Verify every candidate through its owning path and strongest practical reproducer. Reject unsupported, speculative, duplicate, stale-target, style-only, and out-of-scope claims.
2. Apply one bounded remediation pass for accepted findings, refresh affected Proof under the [Execution Gate](execution.md#execution-gate), and create an additive remediation commit.
3. Do not rerun Autoreview merely because remediation changed the target. Finding, CI, and external-review remediation do not trigger another local pass. New product scope or unreviewed behavior makes the receipt stale and returns the changed scope to this gate.
4. Record one Review Receipt in the active handoff or Finish Loop ledger: base commit, reviewed target commit and tree, command and selected priority, terminal status, candidate dispositions, remediation commit when present, verification outcomes, and stale reason when applicable.

**Complete when:** every candidate is fixed or rejected with evidence, remediation is verified, and the Review Receipt accounts for the reviewed and resulting heads.
