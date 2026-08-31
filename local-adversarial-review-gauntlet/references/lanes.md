# Review Lanes

The supervisor owns commands, isolation, time, schema validation, and assembly. This reference owns the semantic coverage expected from each lane.

## Independent Roles

### Behavior

Falsify the change's intent and contracts through concrete counterexamples. Inspect changed behavior, missing or partial requirements, invariants, state transitions, error paths, and whether tests prove the claimed outcome.

### Specialist

Select one lens from observed risk:

- `architecture`: ownership, boundaries, coupling, structural maintainability, and whether new abstractions hide current complexity.
- `compatibility`: retained data, protocols, public APIs, migrations, rollout, rollback, and mixed-version operation.
- `reliability`: lifecycle, concurrency, retries, partial failure, recovery, resource handling, observability, and production operation.
- `security`: trust boundaries, authentication, authorization, validation, command execution, sensitive data, dependencies, credentials, and abuse paths.

The two roles receive the same immutable target facts and Proof, but neither sees the other's output. Model diversity is preferred when available; perspective independence and required risk coverage define completion.

## Finding Contract

Each general-review lane returns `clean` or at most three P0-P2 findings in the supervisor's JSON schema. A finding earns its place only with:

- A changed path and line when available.
- A concrete failure mode reachable through the code.
- Evidence, not reviewer agreement or severity alone.
- The smallest safe fix direction.
- The test or reproducer needed to prove the fix.

Style, taste, unsupported rewrites, unrelated pre-existing defects, and generic requests for checks already present in Proof are outside the lanes.

## Adapter Selection

The supervisor detects executables at runtime instead of pinning transient model names:

- Behavior auto-selection: Codex, then Cursor Agent, then OpenCode.
- Specialist auto-selection: prefer an available adapter different from Behavior; otherwise reuse the only available adapter in a fresh process and independent prompt.
- Override binaries with `GAUNTLET_CODEX_BIN`, `GAUNTLET_CURSOR_BIN`, `GAUNTLET_OPENCODE_BIN`, or `GAUNTLET_CODEX_SECURITY_BIN`.
- Override role adapters with `--behavior-adapter` and `--specialist-adapter` only to select an installed capability, not to increase lane count.

Codex runs in its read-only sandbox with ephemeral session state, disabled multi-agent execution, and schema-constrained output. Cursor runs in read-only ask mode, and OpenCode uses pure mode. OpenCode and Codex Security receive isolated detached checkouts because their CLIs do not expose the same read-only guarantee. Prompts require each general reviewer to perform its own lane without delegation, and every checkout must remain clean at the target SHA.

## Specialized Security

`--require-specialized-security` is reserved for material security risk. It requires the `security` lens and a locally installed Codex Security CLI; the supervisor never installs it or substitutes an ordinary maintainability reviewer. Exit status indicating partial or unknown coverage makes the lane incomplete. The supervisor mechanically maps the documented finding title, severity, confidence, location, summary, root cause, evidence, and remediation fields into the common findings list while preserving the complete raw JSON in the adjacent machine report.

Codex Security is security-only and may call remote model providers. Confirm access, source-handling policy, authentication, and representative warm-cache runtime before making it required in a repository.

## Deadline And Failure

The shell caller supplies the hard 600-second process-tree timeout. The supervisor applies one internal absolute deadline to Git setup, concurrent lanes, descendant termination, integrity checks, and cleanup, then stops by 570 seconds to reserve outer report time. Repository hooks and filesystem monitors are disabled for supervisor Git commands. There are no retries, sequential chunks, nested Task jobs, or model-based output repair.

A required lane is incomplete when its adapter is unavailable, times out, exits unexpectedly, returns malformed output, loses required security coverage, or changes its checkout. Optional provider absence is only capability metadata.
