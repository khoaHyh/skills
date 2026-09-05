# Execution

Use for Implement, Debug fixes, and Finish Loop implementation. Spec uses only Work Frame and Subtraction; its production code stays read-only. The request or accepted artifacts supply the contract; load only context that can change the implementation, compatibility posture, or proof.

Use `coding-standards` for TypeScript engineering, `codebase-design` for a nontrivial seam change, and relevant technology skills when their guidance applies. Consult canonical upstream sources when external semantics matter. For Debug, diagnose before choosing a fix; use `motel-debug` or `observability-logging` when the observed failure requires them.

## Work Frame

For nontrivial work, make these fields explicit in working context, reusing accepted artifacts rather than creating another document:

- **Intent:** requested outcome and observable change.
- **Scope:** allowed surface and non-goals.
- **Compatibility:** Direct cutover or Protected evolution, with evidence below.
- **Slice:** changed contract, owning module, seam, and effects.
- **Budget:** boundaries on change size and investigation justified by this task; no speculative abstractions.
- **Proof:** important risk, proving seam, focused command, required final checks, and `pending` or observed result.

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

Choose the smallest independent check that exposes the named production failure. Prefer a real end-to-end or integration path; use a focused unit, contract, or property test for a consequential local invariant broader proof cannot expose or diagnose. For behavior-preserving refactors, add a characterization or equivalence pin only when existing proof cannot expose drift. Typecheck and lint alone do not pin behavior.

For configuration, migrations, generated output, runtime-only failures, or a refactor with a pin, use the applicable repository command, repro, equivalence check, trace query, or safe observed run. Cover cases separately when they have distinct repository-owned behavior or consequences, rather than duplicating a shared path.

Run focused checks and repository-required final checks. When the environment establishes that local checks use disposable fixtures with no production access, run them, fix attributable failures, and rerun affected checks without asking at each step. Other checks remain subject to their actual access and side-effect boundaries. Remove temporary debug probes unless the user retains them as production telemetry.

Cache each exact command, exit status, and justified omission. Once focused and required checks pass, broaden or repeat only when relevant inputs change, a failure appears, or an unresolved concern justifies it. Documentation-only and low-impact changes need their relevant validation, not an automatic full application test run; repository-required checks still apply.

Before completion, inspect status and the complete diff, including untracked contents. Proof must describe the current result, with no new unexplained failure and every omitted required check or residual risk explicit. For PR-bound work, bind observed checks and omissions to the Local Review target commit and tree; changed relevant inputs invalidate that evidence.

For a complete Implement or Debug outcome, finish through the router's [Review Gate](../SKILL.md#review-gate), not after each intermediate commit. A Finish Loop owns its next state.
