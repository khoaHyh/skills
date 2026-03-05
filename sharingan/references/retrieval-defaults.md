# Retrieval Defaults

Use these defaults unless the user requests overrides.

## Pipeline

1. Collect text/code files with exclusions and limits.
2. Extract symbols and imports.
3. Chunk content with symbol and boundary awareness.
4. Rank key files using hybrid signals.
5. Emit stable context artifacts.

## Default Limits

- max files: `1500`
- max bytes: `8000000`
- max runtime: `120` seconds
- max single file size: `1000000` bytes

## Chunking Defaults

- chunk size: `2000` characters
- chunk overlap: `200` characters
- split preference: function/class/module boundaries

## Ranking Signals

Use a weighted combination of:

- path priors for likely entrypoints (`path_prior`)
- dependency centrality (`dependency_centrality`)
- symbol density (`symbol_density`)

Selection trace signal labels must match emitted scoring logic.

## Determinism

- Sort files by path before processing.
- Sort symbols and edges before writing outputs.
- Use stable JSON field ordering.
