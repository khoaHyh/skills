# Execution

Use for Implement, Debug fixes, and Finish Loop implementation. Spec uses only Work Frame and Subtraction; its production code stays read-only. The request or accepted artifacts supply the contract; load only context that can change the implementation, compatibility posture, or proof.

Use `coding-standards` for TypeScript engineering, `codebase-design` for a nontrivial seam change, and relevant technology skills when their guidance applies. Consult canonical upstream sources when external semantics matter. For Debug, diagnose before choosing a fix; use `motel-debug` or `observability-logging` when the observed failure requires them.

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

During editing, run focused checks that resolve a current uncertainty. Run broad final checks after the integrated candidate stabilizes and delegate writes finish; one owner runs shared-database verification. A check that supplies sufficient evidence needs no additional verification layer unless the repository requires it for the requested action. Keep a failed run as evidence and diagnose its first causal failure before rerunning a broad suite or distributing repairs.

For stack maintenance, inspect shared conflict causes and stabilize necessary ancestor repairs before processing descendants. Verify ancestry, preserved intent, and semantic resolutions; inherited features do not automatically require fresh local suites on every branch. Scope formatter and linter fixes to affected files during integration. Use repository-wide autofixes at their required checkpoint or for a demonstrated cross-cutting need, rather than on every intermediate branch.

Fix failures caused by the requested change and necessary for its agreed outcome autonomously, including broken fixtures and supported scale regressions. Establish attribution from the failing path or baseline, not proximity alone. Pre-existing failures and adjacent improvements remain reported follow-ups; if they block required proof, report the blocker or request scope for the smallest repair. A failing check does not itself authorize a subsystem rewrite. When local checks use disposable fixtures without production access, safe fixes and affected reruns need no additional approval. Other checks retain their actual access and side-effect boundaries. Remove temporary debug probes unless retained as production telemetry by the user.

Cache each exact command, relevant inputs, exit status, and justified omission. Once focused and required checks pass, broaden or repeat only when relevant inputs change, a failure appears, or an unresolved concern justifies it. A new commit SHA alone does not invalidate local evidence; changed dependencies, configuration, or base content may. Provider CI retains its required SHA binding. Documentation-only and low-impact changes need their relevant validation, not an automatic full application test run; repository-required checks still apply.

Before completion, inspect status and the complete diff, including untracked contents. Proof must describe the current result, with no new unexplained failure and every omitted required check or residual risk explicit. For PR-bound work, bind observed checks and omissions to the Local Review target commit and tree; changed relevant inputs invalidate that evidence.

For a complete Implement or Debug outcome, finish through the router's [Review Gate](../SKILL.md#review-gate), not after each intermediate commit. A Finish Loop owns its next state.
