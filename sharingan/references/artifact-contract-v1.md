# Sharingan Artifact Contract v1

## Required Top-Level Fields

Every artifact must contain:

- `schema_version` (semver)
- `artifact_type` (`repo-context-bundle`)
- `artifact_id`
- `generated_at_utc`
- `status` (`success`, `partial`, or `failed`)
- `provenance`
- `source`
- `bundle`
- `retrieval`
- `safety`
- `extensions`

## Required `source` Fields

- `repo_url`
- `requested_ref`
- `resolved_commit`
- `clone_depth`

`source.ephemeral_clone_path` is optional and debug-only.

## Required `bundle` URIs

URIs must be relative paths from `artifact.json` directory.

- `manifest_uri`
- `repo_map_uri`
- `chunks_uri`
- `selection_trace_uri`
- `summary_uri`
- `checksums_uri`

## Versioning Rules

- Major: breaking field changes or removals
- Minor: additive fields only
- Patch: bug fixes or clarifications with stable schema

## Extension Rules

Keep consumer-specific data under `extensions`.

- Do not add adapter-specific required top-level fields.
- Keep required fields portable and consumer-agnostic.
- Preserve deterministic ordering for serialized outputs.
