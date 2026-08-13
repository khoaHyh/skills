# Subtraction Model Eval

Compare coding models on behavior-preserving TypeScript refactors. The eval measures justified deletion and reader-load reduction, not raw code generation.

## Prerequisites

- A clean Git repository with representative TypeScript code.
- A behavior pin that fails on drift: integration/e2e test, characterization test, snapshot, replay, or equivalence harness.
- Repository-native focused and final verification commands.
- Every candidate confirmed by `opencode models`; do not guess provider/model IDs.

Kimi K3 is not currently exposed by the configured OpenCode providers. Add it only after a provider is configured and `opencode models` prints its exact ID.

## Case selection

Choose 5-10 focused refactors that contain at least one plausible burden: dead paths, one-caller wrappers, duplicate representations, redundant validation, spread-out branching, or parallel old/new APIs. Exclude feature work and known bug fixes.

For each case, record in `case.md`:

```md
# <Case>

## Repository and baseline SHA
## Allowed files
## Behavior contract
## Pin command
## Final verification commands
## Known compatibility obligations
## Maximum change budget
```

Run each model from an identical clean checkout at the same baseline. Hold the prompt, variant, available tools, allowed files, and timeout fixed. Start a fresh session for every run.

## Run

Use [prompt.md](prompt.md) with the attached case contract. Capture OpenCode's JSON event stream and the resulting patch outside the source checkout:

```bash
opencode run \
  --format json \
  --model <provider/model> \
  --variant <effort> \
  --dir <clean-case-checkout> \
  --file <case.md> \
  "$(< prompt.md)" \
  > <results>/<case>__<model>__<run>.jsonl
```

Run at least three repetitions per candidate. Randomize candidate order. A reviewer who does not know the model identity scores the final patch with [scorecard.md](scorecard.md).

## Decision rule

A run is invalid if it changes required behavior, exceeds scope, leaves compatibility paths without an observed obligation, or fails final verification.

Adopt a candidate for the refactoring role only when, across valid runs, it:

- has no worse behavior-drift or invalid-run rate than the baseline;
- reduces median reader-load score by at least 20%, or cost/elapsed time by at least 25%;
- adds no more public surface, wrappers, flags, or representations than the baseline;
- does not increase median changed-file count.

Begin Kimi K3 as a blinded proposal or review candidate. Promote it to editing only if it passes the same gate.
