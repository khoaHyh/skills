---
name: local-adversarial-review-gauntlet
description: Run a deadline-enforced local adversarial review with independent behavior and risk-specialist lanes. Invoke only on an explicit user request or a computa-please Review Gate selection.
---

# Local Adversarial Review Gauntlet

Falsify one immutable change through two independent perspectives, then return a bounded, mechanically assembled report within ten minutes. Greptile, Bugbot, and other remote PR reviewers remain outside this local gate.

## Boundaries

- Start only from an explicit user request or a `computa-please` packet naming the risk, specialist lens, fixed point, target, Proof attestation, and prerequisite-commit authority.
- An explicit gauntlet request authorizes one prerequisite local commit for intended review-scope changes. A `computa-please` packet carries that authority; otherwise ask before committing. No invocation authorizes push, PR, remote comment, merge, or finding repair.
- The complete local operation, including preflight, reviewer termination, cleanup, and report assembly, has a 600-second wall-clock ceiling. Invoke the supervisor through a shell tool with a 600-second process-tree timeout; its internal deadline is 570 seconds.
- Run the supervisor once. It uses no Task jobs, nested reviewers, retries, or multipass Autoreview. A larger or deeper review is a separate explicit workflow.
- Treat every finding as a candidate until the caller verifies it against the code or a deterministic reproducer. Report-only execution leaves the target unchanged.

## Freeze Target And Proof

1. Load `vcs-detect`; inspect status, staged and unstaged diffs, untracked files, branch, recent log, and Graphite state when available.
2. Select Git or Graphite through the repository workflow. Stage only the intended scope and create the authorized prerequisite commit when needed. The resulting commit is the target.
3. Resolve the fixed point and target to commit SHAs, compute their merge-base, record the target tree with `git rev-parse <target>^{tree}`, and stop when the triple-dot diff is empty.
4. Bind already-observed deterministic Proof to that exact target and tree in an owner-only temporary JSON file. Do not rerun fresh checks merely to populate the file; return to the Execution Gate when Proof is stale or incomplete.
5. Record the stated intent, applicable spec or contract, and one specialist lens: `architecture`, `compatibility`, `reliability`, or `security`. Material trust or security risk selects `security`; otherwise select the highest-consequence unresolved risk.

Proof attestation shape:

```json
{
  "target": "<target-sha>",
  "tree": "<target-tree-sha>",
  "checks": [
    {"command": "<exact command>", "exit_code": 0, "status": "passed"}
  ],
  "omissions": [
    {"check": "<expected check>", "reason": "<why it was unavailable or inapplicable>"}
  ]
}
```

Completion: the immutable diff, intent, risk lens, and fresh target-bound Proof are explicit.

## Run Bounded Lanes

Read [lanes.md](references/lanes.md), then invoke the bundled supervisor from the repository under review:

```bash
"<skill-path>/scripts/gauntlet" \
  --repo "<repo-root>" \
  --base "<fixed-point-sha>" \
  --target "<target-sha>" \
  --proof "<proof-json>" \
  --intent "<stated intent>" \
  --lens "<specialist-lens>" \
  --output "<owner-only-report-path>"
```

Add `--spec <repo-relative-path>` when the immutable target contains a local spec or contract. Use `--require-specialized-security` for material security risk; that requires an installed `codex-security` executable or `GAUNTLET_CODEX_SECURITY_BIN` override and fails closed when unavailable. Never let `npx` install a scanner during the timed run.

The supervisor:

- Validates Proof against the resolved target commit and tree.
- Creates one detached target checkout and extra lane checkout only for an adapter without enforced read-only execution.
- Runs a behavior/spec falsifier and one risk specialist concurrently.
- Prefers distinct available adapters but permits one adapter in two isolated role calls when only one exists.
- Accepts at most three structured P0-P2 findings per general-review lane.
- Disables repository Git hooks, bounds setup and cleanup commands by the same absolute deadline, terminates reviewer process groups and descendants, verifies target integrity, cleans temporary worktrees, and writes adjacent Markdown and JSON reports.
- De-duplicates matching structured findings by location and normalized failure mode without asking another model to consolidate them.

Completion: the supervisor exits with `complete`, or exits with `incomplete` and an explicit blocker or cleanup residue before the outer timeout.

## Disposition

1. Read the mechanically assembled Markdown and adjacent machine JSON reports; do not rerun or re-summarize the reviewers. The machine report preserves raw Codex Security output while its findings are normalized into the Markdown findings list.
2. Verify each candidate through its owning code path and strongest practical reproducer. Reject unsupported, speculative, style-only, duplicate, and out-of-target claims.
3. Present confirmed findings first, ordered by severity, with file/line, failure mode, evidence, smallest safe fix direction, and test need.
4. Treat missing behavior coverage, missing required specialist security coverage, stale Proof, malformed output, target drift, timeout, or cleanup residue as an incomplete gauntlet.
5. Record adapter availability as metadata. A missing optional provider such as Cursor is not a blocker when required role coverage completed through another adapter.

Completion: every candidate is confirmed or rejected, and required role coverage has a terminal, target-consistent outcome.
