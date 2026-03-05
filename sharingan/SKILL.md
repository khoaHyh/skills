---
name: sharingan
description: This skill should be used when the user asks to clone and analyze a repository into a portable context bundle, such as "clone this repo and build reusable context", "package repository context artifacts", or "prepare repo context for another skill or agent workflow".
---

# Sharingan

Build a portable repository context bundle and stop there.

Keep this skill consumer-agnostic. Do not invoke adapter-specific workflows.

## Core Contract

Follow this fixed lifecycle:

1. Clone repository into isolated `/tmp` workspace.
2. Analyze repository with hybrid retrieval-first context building.
3. Emit stable artifact contract (`artifact.json`) and companion files.
4. Validate artifact contract and checksums.
5. Exit.

Do not call downstream adapter skills.

## Trigger Examples

- "Clone this repo and build reusable context"
- "Analyze this repo and package context artifacts"
- "Prepare portable repo context for another workflow"
- "Create a codebase context bundle from this repository"

## Quick Start

Run the orchestrator:

```bash
scripts/run.sh \
  --repo-url https://github.com/owner/repo.git \
  --ref main \
  --output-dir /tmp/sharingan-output
```

Expected output:

- `artifact.json`
- `manifest.json`
- `repo_map.json`
- `chunks.ndjson`
- `selection_trace.json`
- `summary.md`
- `checksums.sha256`

## Workflow

### 1) Collect Inputs

Require:

- `repo-url`

Optional:

- `ref`
- `depth`
- `tmp-root`
- `output-dir`
- file and runtime limits

### 2) Clone in Isolated Temp Workspace

Use `scripts/clone_repo.sh`.

Rules:

- Clone under `/tmp` or configured temporary root.
- Use shallow clone by default (`--depth 1`).
- Disable recursive submodule behavior by default.
- Treat clone path as ephemeral operational state.

### 3) Build Context Bundle

Use `scripts/build_context_bundle.py`.

Build these artifacts:

- `manifest.json`: file inventory and checksums.
- `repo_map.json`: symbols, internal edges, and ranked key files.
- `chunks.ndjson`: chunked code/text units with metadata.
- `selection_trace.json`: ranking reasons and score details.
- `summary.md`: distilled repository briefing with citations.

### 4) Validate Contract

Use `scripts/validate_contract.py artifact.json`.

Validation requirements:

- required top-level contract fields exist
- required nested fields exist
- bundle URIs are relative and files exist
- checksums file includes all bundle files
- no required absolute temp paths in portable fields

### 5) Stop at Contract Boundary

After validation succeeds, return artifact paths and stop.

Do not auto-run any consumer-specific transformation.

## Safety Boundaries

- Never execute untrusted repository code by default.
- Never auto-run tests, build scripts, or install commands inside cloned repo.
- Enforce limits for file count, bytes, and runtime.
- Redact obvious secret-like tokens when generating summaries.
- Always cleanup temporary directories unless explicitly requested to keep.

For details, read `references/safety-and-limits.md`.

## Artifact Contract

Use schema versioning with additive-only changes in minor versions.

- Major: breaking changes
- Minor: additive fields
- Patch: non-structural fixes

For exact schema, read `references/artifact-contract-v1.md`.

## Downstream Consumer Read Order

To keep downstream context loading lean and reliable, consume bundle files in this order:

1. `artifact.json` - entrypoint, status, limits, and portable bundle URIs.
2. `summary.md` - high-level repository briefing with citations.
3. `selection_trace.json` - ranked file rationale and signal details.
4. `repo_map.json` - symbols and dependency edges for navigation.
5. `chunks.ndjson` - load selectively by cited chunk IDs and paths.
6. `manifest.json` and `checksums.sha256` - inventory and integrity verification.

## Retrieval Defaults

Use hybrid retrieval-first defaults documented in `references/retrieval-defaults.md`.

Core behavior:

- AST and symbol-aware chunk boundaries
- path priors, dependency centrality, and symbol density ranking blend
- deterministic output ordering for reproducibility

## Resources

- `scripts/run.sh` - orchestration entrypoint
- `scripts/clone_repo.sh` - isolated clone + metadata
- `scripts/build_context_bundle.py` - bundle generation
- `scripts/validate_contract.py` - contract and checksum validator
- `references/artifact-contract-v1.md` - contract reference
- `references/retrieval-defaults.md` - retrieval strategy and defaults
- `references/safety-and-limits.md` - safety envelope
- `assets/sample-artifact/` - example artifact bundle
