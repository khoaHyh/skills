# Execution

Use for Implement, Debug fixes, and Finish Loop implementation. Spec uses only Work Frame and Subtraction; its production code stays read-only. The request or accepted artifacts supply the contract; load only context that can change the implementation, compatibility posture, or proof.

Use `coding-standards` for TypeScript engineering, `codebase-design` for a nontrivial seam change, and relevant technology skills when their guidance applies. Consult canonical upstream sources when external semantics matter. For Debug, diagnose before choosing a fix; use `motel-debug` or `observability-logging` when the observed failure requires them.

Pre-fetch route inputs that are deterministically required: repository instructions, accepted artifacts, current branch and diff, applicable scripts, and live PR or CI state. Do not spend a model turn deciding whether to obtain context the selected route always needs. Keep raw exploration and verbose output outside the primary context; delegate noisy retrieval when its compact, sourced result is sufficient.

## Browser Tools

For general browser automation and UI smoke tests, default to `playwright-cli` and load its skill before use. Use Chrome DevTools MCP through Executor for Chrome performance analysis or DevTools-specific diagnostics. Choose by task capability and session needs.

Continue with an existing browser session when its tabs, authentication, or state matter. Switch only when the selected tool is unavailable, fails for a tool-specific reason, or lacks a required capability. Establish the target session's state and check the outcome of any uncertain action before repeating it.

## Work Frame

For nontrivial work, make these fields explicit in working context, reusing accepted artifacts rather than creating another document:

- **Intent:** requested outcome and observable change.
- **Scope:** this delivery's allowed systems and behavior, rollout prerequisites that can be separate, follow-up work, and non-goals.
- **Compatibility:** Direct cutover or Protected evolution, with evidence below.
- **Slice:** changed contract, owning module, seam, and effects.
- **Budget:** expected owning modules, new public interfaces or storage, and approximate review surface, including tests. Use a rough file/line range when useful, not a quota or permission to pad the diff.
- **Proof:** important risk, proving seam, focused command, required final checks, and `pending` or observed result.

Before writing, state the smallest complete delivery and its expected footprint briefly to the user; continue without approval when it matches the request. Specs and handoff prompts preserve that boundary. Separate accepted product rules from proposed implementation mechanisms: accepting a rule does not establish that every suggested controller, endpoint, migration tool, or compatibility layer is necessary. If an accepted spec explicitly requires a larger delivery, surface the mismatch and recommend a smaller option rather than silently dropping requirements or implementing the whole program.

### Scope Checkpoints

Reconcile the actual diff with Scope and Budget after the first working vertical slice and before opening another workstream. Check earlier when adding an unplanned app, public interface, persistence mechanism, operator workflow, or descendant-PR feature. Inspect aggregate additions/deletions and changed surfaces, separating inherited changes, moves/generated output, production code, and tests. Review size signals a decision; passing checks do not justify size.

When the footprint materially exceeds the forecast (roughly twice a stated range is an alarm), first look for deletion, reuse, or consolidation that preserves the agreed outcome. If the remaining expansion changes the delivery boundary, present the concrete dependency, added cost/surface, and smallest viable alternative; ask before implementing that expansion. Continue useful work inside the boundary. Do not treat a refactor's need to adapt callers as permission to import their entire feature or descendant PR. PR splitting improves packaging but does not justify unnecessary implementation.

A newly discovered risk earns investigation when it threatens the agreed outcome. It earns implementation only when the remedy belongs to that outcome. Preserve security and data integrity; if they require a larger mechanism, make that a scope decision rather than silently relaxing the invariant or building the mechanism.

### Compatibility

An **Obligation** is an evidence-backed requirement that an existing contract survive. Look for affected callers, external consumers, mixed-version deployments, integrations, retained data, in-flight work, and rollback constraints.

- **Direct cutover:** evidence supports no Obligation. Migrate affected callers and delete the superseded path in the same Slice.
- **Protected evolution:** a named Obligation exists. Preserve it at the narrowest seam and record whether the mechanism is permanent or its removal condition.

An unsuccessful search does not establish absence when external consumers or retention are unknowable. State missing evidence and ask when it changes the safe posture. Age, naming, and a `legacy` label are not Obligations. The resulting Slice leaves one path or one named protection.

## Subtraction

Before construction, choose the highest safe reduction: delete, collapse, inline, or narrow. Keep an addition only when the reduced base still needs it; keep an abstraction only when it hides current complexity that would otherwise spread to callers. A refactor must reduce concepts, branches, paths, representations, or indirection without shifting the burden elsewhere. Keep adjacent cleanup outside Scope.

Test code is also an addition. Reuse existing proof when it exposes the changed path's risk. A new test earns its cost by closing a named detection, repeatability, or diagnosis gap, not by mirroring an edit or enumerating library behavior.

## Execution Gate

Complete one vertical Slice and verify the observable result, not just successful tool execution. Trace the affected entrypoint through its owning implementation, callers, and existing checks far enough to expose realistic failure paths. Expand investigation when a finding or unresolved risk can change the result; otherwise keep it bounded.

Choose the smallest set of checks that establishes the requested outcome and satisfies applicable repository requirements. For behavior changes, exercise the real failure path through an existing integration check or a focused unit, contract, or property test at the owning seam. For behavior-preserving refactors, add a characterization or equivalence pin only when existing proof cannot expose drift. Typecheck and lint alone do not pin behavior.

For configuration, migrations, generated output, runtime-only failures, or a refactor with a pin, use the applicable repository command, repro, equivalence check, trace query, or safe observed run. Cover cases separately when they have distinct repository-owned behavior or consequences, rather than duplicating a shared path.

### Verification Budget

Treat verification as one coverage plan, not a command checklist. When repository commands may overlap, inspect their definitions and map each command to the checks it actually covers, its scope, cost, and whether it mutates files. Select the cheapest command set whose union covers the required Proof. A repository aggregate such as `prepare:push` or `verify:pr` supersedes only the constituent phases its definition covers; do not stack a wrapper with those commands unless a failed phase needs isolated diagnosis or the repository explicitly requires both.

Keep the edit loop tight. Use already-running editor or language-server diagnostics and source inspection as feedback. Invoke a focused repro or test during editing only to resolve a live uncertainty, demonstrate the changed behavior, or verify a repair. Commits and individual edits are not verification checkpoints: do not run formatting, linting, typechecking, broad tests, or aggregate verification merely because an edit or commit completed.

After implementation, delegate writes, synchronization, and any Local Review remediation stabilize the candidate, run one **final basic-verification checkpoint** before publication or handoff. Prefer a read-only repository aggregate. Run a mutating formatter or linter fixer at most once immediately before that checkpoint when repository policy or observed diagnostics require it, then inspect its diff. If the aggregate already performs the same mutation or validation, use the aggregate alone. One owner runs shared-database verification.

Tests follow risk rather than cadence. Preserve focused behavioral Proof gathered before Local Review. Include broad tests in the final checkpoint only when the changed surface, repository policy, or unresolved interaction risk requires them. Do not rerun an unchanged focused test merely because a broader command also covers it, and do not add a broad suite after a sufficient aggregate has already passed.

Keep a failed run as evidence and diagnose its first causal failure before rerunning a broad suite or distributing repairs.

Compact verification before retaining it in agent context. A passing command becomes its command, affected surface, exit status, and `passed`. A failure retains the first causal diagnostic, affected surface, attempt count, whether its fingerprint changed, and a pointer to full output. In a Finish Loop, resolve `scripts/agent-runtime/cli.mjs` from the loaded `computa-please` skill base, run `compact-check`, and append its value as `CheckRecorded`; never put raw `stdout` or `stderr` in the event log. Escalate, reset, or restructure after repeated unchanged failures instead of accumulating attempts.

For stack maintenance, inspect shared conflict causes and stabilize necessary ancestor repairs before processing descendants. Verify ancestry, preserved intent, and semantic resolutions; inherited features do not automatically require fresh local suites on every branch. Scope formatter and linter fixes to affected files during integration. Use repository-wide autofixes at their required checkpoint or for a demonstrated cross-cutting need, rather than on every intermediate branch.

Fix failures caused by the requested change and necessary for its agreed outcome autonomously, including broken fixtures and supported scale regressions. Establish attribution from the failing path or baseline, not proximity alone. Pre-existing failures and adjacent improvements remain reported follow-ups; if they block required proof, report the blocker or request scope for the smallest repair. A failing check does not itself authorize a subsystem rewrite. When local checks use disposable fixtures without production access, safe fixes and affected reruns need no additional approval. Other checks retain their actual access and side-effect boundaries. Remove temporary debug probes unless retained as production telemetry by the user.

Cache coverage, exact commands, relevant inputs, exit status, and justified omissions. A later edit invalidates only checks whose inputs or proven behavior changed. Refresh those checks at the focused seam; do not repeat the whole final checkpoint after review or CI remediation unless it has not yet run, the repository requires its aggregate on the exact final head, or the remediation changes its broader inputs. A new commit SHA alone does not invalidate local evidence; changed dependencies, configuration, or base content may. Provider CI retains its required SHA binding and is not replaced by local evidence. Documentation-only and low-impact changes need their relevant validation, not an automatic application test run; repository-required checks still apply.

Before completion, inspect status and the complete diff, including untracked contents. Proof must describe the current result, with no new unexplained failure and every omitted required check or residual risk explicit. For PR-bound work, bind focused behavioral Proof to the Local Review target and bind the final basic-verification checkpoint to the resulting local candidate; changed relevant inputs invalidate only their affected evidence.

For a complete Implement or Debug outcome, finish through the router's [Review Gate](../SKILL.md#review-gate), not after each intermediate commit. A Finish Loop owns its next state.
