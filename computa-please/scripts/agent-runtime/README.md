# Agent Runtime And Evaluation

## Finish Loop Runtime

`runtime.mjs` is a pure reducer for Finish Loop state. `cli.mjs` is its filesystem adapter: it owns an append-only event log, serializes writers with a lock, adds event IDs and timestamps, and durably records guarded actions before returning an execution effect.

The examples below run from this skill source repository. In a consuming project, resolve the script from the loaded or installed `computa-please` skill base and keep `--events` pointed at the Task Worktree's `.computa-please/run-events.jsonl`.

Launch a run by piping one JSON object to the CLI:

```sh
node computa-please/scripts/agent-runtime/cli.mjs launch \
  --events .computa-please/run-events.jsonl \
  --input - <<'JSON'
{
  "runId": "delivery-42",
  "goal": "Make PR 42 merge-ready",
  "ceiling": "stop-before-merge",
  "reviewPlan": "existing-only",
  "authorizedActions": ["commit", "push", "publish-pr", "mark-ready"],
  "context": {
    "taskWorktree": "/path/to/task-worktree",
    "branch": "feature/example",
    "base": "main",
    "scope": "parser validation",
    "verifier": "node --test",
    "terminalPredicate": "PR is merge-ready"
  }
}
JSON
```

Use the same input mechanism for a typed event, and inspect reduced state at any time:

```sh
node computa-please/scripts/agent-runtime/cli.mjs apply \
  --events .computa-please/run-events.jsonl \
  --input event.json

node computa-please/scripts/agent-runtime/cli.mjs state \
  --events .computa-please/run-events.jsonl
```

The reducer accepts `PhaseCompleted`, `HumanRequested`, `HumanResponded`, `AuthorityUpdated`, `ExternalActionRequested`, `ExternalActionObserved`, `CheckRecorded`, `ContextCompacted`, `RunBlocked`, `RunResumed`, and `RepairCycleStarted`. Expected parse, authority, phase, replay, pause, and terminal failures are tagged values. `ExternalActionRequested` is flushed before the CLI emits `execute-external-action`; execute only that emitted effect and then record its observation.

The CLI adds `id` and `at` when omitted. Event payloads are:

| Event | Required payload |
| --- | --- |
| `PhaseCompleted` | `phase`, `evidence.summary`, `evidence.references[]` |
| `HumanRequested` | `decision` with `question`, `reason`, `recommendation`, at least two `{label, consequence}` options, and `resumeEvent`; `decision.id` is generated when omitted |
| `HumanResponded` | `decisionId`, the matching `resumeEvent`, and `answer` |
| `AuthorityUpdated` | `reason`, `sourceReference`, and at least one of `ceiling` or `authorizedActions` |
| `ExternalActionRequested` | stable `key`, `action`, `target`, and `payloadHash` |
| `ExternalActionObserved` | requested `key`, `outcome` (`succeeded`, `failed`, or `ambiguous`), and `summary` |
| `CheckRecorded` | `check` returned by `compact-check` |
| `ContextCompacted` | retained-state `summary` and `nextAction` |
| `RunBlocked` | `reason` and expected `resumeEvent` |
| `RunResumed` | matching `resumeEvent` and changed `evidence` |
| `RepairCycleStarted` | `reason`, `failedWorkflow`, and a `progressFingerprint` over failure evidence and diagnosis |

Guarded actions are phase-constrained:

| Action | Allowed phases |
| --- | --- |
| `commit` | Synchronized, Implemented, Local Review, Collect Review and CI, Remediate Review, Final CI |
| `push` | Published, Collect Review and CI, Remediate Review, Final CI |
| `publish-pr` | Published |
| `request-review`, `mark-ready` | Collect Review and CI |
| `reply-review`, `resolve-review` | Remediate Review |
| `rerun-workflow` | Collect Review and CI, Final CI, Post-Merge Verification |
| `merge` | Authority Boundary with a `merge-and-verify` ceiling |

Compact a command result before appending it as `CheckRecorded`:

```sh
node computa-please/scripts/agent-runtime/cli.mjs compact-check --input command-result.json
```

Successful output drops command noise. Failed output retains a bounded first diagnostic, a stable fingerprint, attempt metadata, and an optional pointer to the full log. Raw command output does not belong in `run-events.jsonl`.

## Behavior Evaluation

The dependency-free Node ESM harness measures prompt or runtime behavior changes. It does not call a model or train one. A separate runner must execute each scenario with a fixed model and settings, normalize the observed agent trace, and write `responses.jsonl`.

Use the harness to capture a baseline, change the prompt or runtime, capture a candidate with the same runner, model, and settings, score both captures, and compare them. Inspect the comparison's per-scenario regressions before accepting an aggregate score improvement.

## Commands

```sh
node computa-please/scripts/agent-runtime/eval-cli.mjs score \
  --scenarios computa-please/scripts/agent-runtime/scenarios.jsonl \
  --responses /path/to/baseline-responses.jsonl \
  --out /path/to/baseline-report.json

node computa-please/scripts/agent-runtime/eval-cli.mjs score \
  --scenarios computa-please/scripts/agent-runtime/scenarios.jsonl \
  --responses /path/to/candidate-responses.jsonl \
  --out /path/to/candidate-report.json

node computa-please/scripts/agent-runtime/eval-cli.mjs compare \
  --baseline /path/to/baseline-report.json \
  --candidate /path/to/candidate-report.json \
  --out /path/to/comparison.json
```

Omit `--out` to print JSON to standard output. Boundary parse and I/O errors are emitted as one-line JSON on standard error with a nonzero exit status.

## Scenario Schema

`scenarios.jsonl` contains one JSON object per line:

```json
{
  "id": "debug-reproduce-before-edit",
  "prompt": "Debug the crash and fix it if confirmed.",
  "context": "Optional prior state supplied to the runner.",
  "assertions": {
    "route": "Debug",
    "outcome": "complete",
    "requiredEvents": [{ "kind": "evidence", "name": "debug.reproduced" }],
    "forbiddenEvents": [{ "name": "vcs.commit" }],
    "maxEventCounts": [{ "kind": "tool", "name": "repository.search", "max": 8 }],
    "orderedEventSubsequences": [[
      { "name": "debug.reproduced" },
      { "name": "repository.write" }
    ]],
    "requiredFinalText": ["(root cause|Root cause)"],
    "forbiddenFinalText": ["(committed|Committed)"],
    "maxContextTokens": 9000
  }
}
```

`context` is optional. Event selectors require `kind`, `name`, or both. A selector with both fields matches both exactly. Ordered sequences need not be contiguous. Final-text patterns are JavaScript regex strings without separate flags. Every scenario must contain at least one assertion.

## Response Schema

The runner adapter writes one normalized response per JSONL line:

```json
{
  "scenarioId": "debug-reproduce-before-edit",
  "route": "Debug",
  "outcome": "complete",
  "events": [
    { "kind": "evidence", "name": "debug.reproduced", "summary": "Crash reproduced with empty config." },
    { "kind": "action", "name": "repository.write" }
  ],
  "finalText": "The root cause was an unchecked empty config; the repro now passes.",
  "contextTokens": 4210
}
```

`route` and `outcome` are exact labels chosen by the runner contract. Events stay in observed order and contain exact `kind` and `name` labels plus an optional summary of at most 500 characters. `contextTokens` is optional; when present it must be a non-negative integer. Keep trace normalization stable between baseline and candidate captures.

## Reports

A score report includes assertion-level `passed`, `total`, and `score` values overall and per scenario. Each failed assertion has a stable assertion ID, expected value, actual value, and message. Missing responses remain scoreable: every assertion for that scenario fails. Token totals appear when at least one response supplies `contextTokens`.

A comparison requires identical scenario contracts in both reports; each score record carries a scenario fingerprint to prevent accidental comparison after editing the corpus. It lists regressions, improvements, and unchanged failures overall and per scenario. It also reports candidate-minus-baseline score and context-token deltas; a token delta is `null` when either side omitted the measurement.

The seeded event names are runner-facing normalization labels, not runtime event types. An adapter should map model/tool traces onto these labels rather than exposing provider-specific payloads or raw logs.
