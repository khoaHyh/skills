# Graphite Stack Merge

Use only for an explicitly requested Graphite stack merge. The grant covers the selected chain and its resulting topology changes, not unrelated diffs or stack-wide publication. Apply [Finish Loop](finish-loop.md)’s authority, review, CI/waiver, production, and post-merge gates to the selected PRs, reusing valid evidence.

## Bound And Prepare

Identify the requested top, trunk, and ordered PR/head/base chain from live state. `gt merge` selects trunk through the current branch, not descendants or siblings. Use the intended top in the task-owned checkout without disturbing another task. Existing PRs need no artificial edit, commit, or republication.

## Preview And Merge

Check the installed `gt merge --help`, then run from the intended top branch:

```bash
gt merge --dry-run
```

Match the preview to the authorized chain and live revisions; resolve divergence within scope or name the blocker. Prepare the post-merge watch before the authorized merge:

```bash
gt merge --confirm
```

`--confirm` asks for confirmation; it does not pre-answer it. Answer through an interactive terminal under the existing grant when it matches the preview. Neither flag skips CI. Respect provider enforcement and explicit bypass authority; an unavailable interaction or unsupported waiver is a concrete blocker, not grounds to guess flags or change protections.

## Reconcile And Finish

Observe each selected PR and target lineage; accepted or queued is not merged. Reconcile ambiguous and partial outcomes before further actions. Retry only the remaining chain after a resolved blocker or changed precondition and a fresh matching preview.

Finish the requested post-merge verification. Report each PR’s observed result, waivers, and any partial completion or blocker. Done means the authorized chain is observed merged with applicable verification complete, or the unresolved boundary is explicit.

Command reference: <https://graphite.com/docs/command-reference#gt-merge>
