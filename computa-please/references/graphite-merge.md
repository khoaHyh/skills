# Graphite Stack Merge

Use this branch of Finish Loop when the user requests merging a Graphite stack. That request authorizes merging the selected chain and Graphite's resulting stack-topology changes; it does not authorize editing or publishing unrelated diffs. The user's explicit scope and CI instructions take precedence over this skill's single-PR and green-CI defaults. Keep other applicable delivery gates.

## Bound And Prepare

Identify the requested top branch, trunk, and ordered PR chain using live Graphite and provider state. `gt merge` selects all branches from trunk through the current branch, not descendants above it or sibling chains. Select the intended top in the task-owned checkout without disturbing another checkout's work.

Record the chain's PRs, heads, bases, review evidence, CI evidence or waivers, and intended target in the run ledger. Apply the existing delivery gates to each selected PR, reusing valid evidence; existing published PRs need no artificial edit, commit, or republication. A merge-only request does not grant blanket implementation or stack-wide submission authority. Scope synchronization and any necessary repair to the selected chain; ask only if it requires additional authority.

## Preview And Merge

Check the installed `gt merge --help`, then run from the intended top branch:

```bash
gt merge --dry-run
```

Match the preview to the authorized PR chain and live heads/bases. Prepare the post-merge watch plan before merging. If scope differs or local and remote branches diverge, resolve it within existing authority or report the concrete decision needed.

With merge authority and applicable gates satisfied, journal one stack merge attempt keyed by the ordered PR/head set, then run:

```bash
gt merge --confirm
```

`--confirm` asks for confirmation; it does not pre-answer it. Respond to the CLI confirmation under the user's existing authority when it matches the preview. Use an interactive terminal if needed; if unavailable, report that execution blocker rather than substituting an undocumented flag or repeated merge calls.

Neither flag means skip CI. A Finish Loop CI waiver permits proceeding without successful checks in its scope, subject to Graphite and GitHub enforcement. If the provider requires a separate bypass, use its documented mechanism within the recorded merge authority and CI waiver. Report a concrete provider or permission blocker when no supported path exists. Changing repository protections requires separate explicit authorization.

## Reconcile And Finish

An accepted or queued command is not proof that the stack merged. Observe each selected PR and the target branch, recording merged commits and remaining queued, open, or blocked PRs. An ambiguous attempt remains spent: reconcile it before any further action, and never replay the whole command blindly after a partial merge. A new attempt for a remaining chain requires a resolved blocker or other changed precondition, a fresh preview, and its own journal entry.

Return to Finish Loop's post-merge verification when every selected PR is confirmed merged into the intended target lineage. If verification was explicitly waived, record it as skipped and verify the merge result itself. Report every selected PR's outcome, CI waivers, post-merge result, and any partial completion or blocker. Completion means the entire authorized chain is observed merged and applicable post-merge verification is complete, or a concrete blocker is reported.

Command reference: <https://graphite.com/docs/command-reference#gt-merge>
