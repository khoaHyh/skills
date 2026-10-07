# Execution

Use for authorized implementation and fixes. The [router](../SKILL.md) owns the accepted boundary; load only context that can change this result, compatibility, or proof.

## Implement The Minimum Durable Change

For nontrivial work, briefly state the smallest complete delivery and its proving surface, then proceed within existing authority. Trace the affected entrypoint, owner, callers, and checks. Reuse the project’s vocabulary and established patterns.

Load specialists only for the affected work: `coding-standards` for TypeScript, `effect` for Effect, `codebase-design` for an unsettled module seam, `find-docs` for library-specific contracts, and `observability-logging` for necessary production signal design. A design uncertainty may need a bounded repro or experiment; routine patterns need neither an interview nor a prototype.

Delete, collapse, inline, or narrow before adding structure. An abstraction earns its place by hiding current complexity, not a hypothetical second implementation. A refactor should reduce concepts or paths without shifting the burden to callers. Remove temporary diagnostic probes when done.

Complete and prove one working slice before distributing dependent implementation. After that slice and before completion, compare the entire diff with the accepted result. Challenge new interfaces, persistence, fallback/recovery machinery, operator workflows, tests, and adjacent features. Separate inherited work and generated data from new mechanisms. If a necessary remedy changes the agreed behavior, systems, or risk, explain the concrete dependency and smallest viable alternative before expanding scope; continue independent authorized work.

### Compatibility

Inspect affected consumers, retained data, mixed-version deployments, in-flight work, and rollback requirements. With evidence that no old contract must survive, migrate supported callers and remove the superseded path together. Preserve a named obligation at its narrowest seam; give temporary support a removal condition. An empty search is not proof of absence when external consumers or retained state are unknown. Investigate or surface that evidence gap when it changes the safe approach.

## Tests Earn Their Place At Authoring Time

When adding or changing tests, use `test-audit`’s authoring and retention bar, not an automatic broad audit. Apply the target repository’s commands and delivery rules; OpenClaw-specific procedures apply only to OpenClaw.

Each test needs an observable behavior or invariant, a credible regression, and a gap in existing proof. Prefer the strongest practical existing boundary and extend an existing case when appropriate. Another layer needs a distinct risk. Meaningful unit and property tests can qualify; duplicated integration/UI cases, private call-shape assertions, library replays, and test-only production seams usually do not. Tests for removed extra behavior should leave with it. Add characterization or equivalence coverage only when existing proof cannot detect refactor drift.

## Verification

Exercise the real changed or failing path; lint and typecheck alone do not prove behavior. Use the appropriate integration test, domain test, safe runtime repro, migration/configuration command, or observed interaction. Preserve authorization, transaction, concurrency, and data-integrity proof where those obligations are affected.

Inspect command definitions and choose the smallest set covering the relevant risks and repository-required checks. An aggregate replaces only phases it actually includes. Keep editing feedback focused; run the final required checks after the candidate and any local-review remediation stabilize. Scope mutating formatters/fixers to intended files and inspect their changes. Give shared test databases and verification resources one owner; choose a safe available task-owned resource rather than taking another task’s.

Record commands, covered inputs, exit status, and omissions compactly. Refresh evidence only when its relevant code, dependency, configuration, or base inputs change; a commit SHA alone does not invalidate local proof. Provider CI still needs its required head binding. Documentation-only changes need relevant validation, not automatic application suites.

For failures, retain the first causal diagnostic and a pointer to full output. Establish attribution and fix task-caused failures within scope. A pre-existing failure or unavailable required environment is a reported blocker or bounded follow-up, not permission for a rewrite. Change the diagnosis or evidence before repeating failed attempts; stop a no-progress loop rather than accumulating reruns.

Before handoff or publication, inspect status and the complete diff, including untracked contents. Follow [Local Review](local-review.md) when applicable. Required evidence must describe the current result; report skipped or blocked checks honestly.

## UI Craft And Browser Tools

Reuse owning components and design tokens. Use `emil-design-eng` for interface polish, `animate-expo` for native Expo motion, and `mobile-native` for mobile-web behavior. Expo is native, not mobile web. Craft guidance supplies neither new product scope nor dependency authority.

Prove changed interactions through the project’s running-app recipe. Desktop emulation does not establish touch feel or on-device performance. Report unavailable checks as pending. Use `record-verification` only for an explicitly requested recording.

Default browser automation to `playwright-cli`; use Chrome DevTools for its specific diagnostics. Preserve an existing session when authentication or state matters. Before repeating an uncertain action, inspect its result. Report missing tools or verification access rather than installing or reconfiguring them without authority.

## Measured Optimization

Fix the objective, baseline, constraints, representative inputs, and stopping condition before tuning. Change one meaningful variable at a time, measure through the owning recipe, and compare against the baseline while preserving invariants. Report tradeoffs and unavailable evidence; simulation is not production proof. Stop at the agreed target or budget, a supported no-improvement result, or a named blocker. Experiments do not authorize new product behavior or live operational effects.
