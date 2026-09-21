# Local Review

Use at most one independent Codex provider pass to challenge a complete PR candidate before publication. Keep implementation, local review, remediation, final basic verification, and external review as separate stages.

## Entry

Run this gate for:

- Agent-authored work that will be published as a PR.
- An existing PR or branch entering a Finish Loop without a valid Review Receipt for its current semantic diff.

Non-PR Implement and Debug work is exempt unless the user requests independent review. Review mode follows its explicitly requested review workflow or the repository's normal review path.

Outside Finish Loop, mechanical restacks, synchronization, submission of existing work, and PR-description updates are exempt when they introduce no substantive implementation change and no review gate is already pending for agent-authored work. Inspect the operation's changes to establish that exemption. A substantive conflict repair or port retains the normal gate; maintenance does not waive repository-required review or an explicit review request.

**Complete when:** the work is exempt for a named reason or enters Freeze.

## Freeze

1. Finish the complete implementation slice and its focused behavioral Proof. Complete known synchronization or restacking before review; defer the [final basic-verification checkpoint](execution.md#verification-budget) until disposition and remediation finish.
2. Resolve the intended PR base to a commit. Under the existing VCS authority, commit the candidate, record the target commit and tree, and require a clean worktree with a non-empty branch diff. Local Review grants no commit, push, or publication authority.
3. Bind the cached behavioral checks, exit statuses, and justified omissions to that target and tree. Reuse evidence whose relevant inputs are unchanged; refresh only affected checks through the [Execution Gate](execution.md#execution-gate) before binding Proof to a changed candidate.

**Complete when:** the base, target commit, target tree, complete branch diff, and target-bound Proof are explicit.

## Run

The Local Review budget is one Autoreview provider pass per delivery cycle. The budget is spent when a provider call begins and is never replenished by findings, remediation, restacking, target drift, CI repair, publication, or context recovery.

Load `autoreview` and follow its contract. First run the same invocation with `--dry-run` and record its predicted provider-pass count. If preparation predicts more than one provider pass, do not start Autoreview: record `review-budget-exceeded` and return the blocker at the Human Gate. Do not narrow the semantic target or omit authoritative artifacts merely to fit the budget.

Invoke the helper once against the committed branch diff with Codex and an explicit P1 threshold:

```bash
"$AUTOREVIEW" \
  --mode branch \
  --base "<resolved-pr-base>" \
  --engine codex \
  --max-priority P1 \
  --json-output "<owner-only-temporary-path>"
```

Add one concise `--prompt` only when an observed compatibility, reliability, security, or other production risk needs emphasis. The prompt names the concrete failure surface; it does not add reviewers or expand the target.

Treat `scoped-clean`, `filtered`, or validated `findings` as terminal outcomes for the selected P0-P1 scope. Preserve the exact status: `filtered` is not a general correctness certificate. Treat `incomplete`, target mismatch, malformed output, scanner refusal, provider failure, target drift, or a multi-pass requirement as a blocker rather than a clean review. Do not add a structural review to this stage; an explicitly requested named review follows the router's Requested Review path instead of silently spending another local pass.

**Complete when:** the Codex result is terminal after one provider pass, or the unspent review is blocked before a provider call. A blocked outcome skips Disposition and terminates at the Human Gate.

## Disposition

1. Verify every candidate through its owning path and strongest practical reproducer. Reject unsupported, speculative, duplicate, stale-target, style-only, and out-of-scope claims.
2. Apply one bounded remediation pass for accepted findings and refresh only affected behavioral Proof under the [Execution Gate](execution.md#execution-gate).
3. Run the Execution Gate's single final basic-verification checkpoint against the resulting local candidate, then create the additive remediation or finalization commit when files changed.
4. Never rerun Autoreview in the delivery cycle. For a later mechanical target change, prove the semantic patch and relevant base inputs unchanged and carry the receipt forward. New product scope or any other unreviewed behavior makes the receipt incomplete and blocks publication pending a new human-authorized outcome; it does not return to Run.
5. Record one Review Receipt in the active handoff: base commit, reviewed target commit and tree, provider-pass count, command and selected priority, terminal status, candidate dispositions, resulting commit, final verification coverage and outcomes, and incomplete reason when applicable. A Finish Loop references it from compact phase evidence.

**Complete when:** every candidate is fixed or rejected with evidence, affected behavioral Proof and the one final basic-verification checkpoint pass, and the Review Receipt accounts for the reviewed and resulting heads without spending another provider pass.
