import test from "node:test";
import assert from "node:assert/strict";
import {
  compareEvaluationReports,
  parseResponse,
  parseScenario,
  scoreEvaluation,
} from "./evaluation.mjs";

function scenario(overrides = {}) {
  return {
    id: "debug-before-edit",
    prompt: "Diagnose and fix the failing parser.",
    assertions: {
      route: "Debug",
      outcome: "complete",
      requiredEvents: [{ kind: "evidence", name: "debug.reproduced" }],
      forbiddenEvents: [{ kind: "external", name: "vcs.commit" }],
      maxEventCounts: [{ kind: "tool", name: "repository.search", max: 2 }],
      orderedEventSubsequences: [[
        { name: "debug.reproduced" },
        { name: "repository.write" },
      ]],
      requiredFinalText: ["[Tt]ests? pass"],
      forbiddenFinalText: ["[Cc]ommitted"],
      maxContextTokens: 1_000,
    },
    ...overrides,
  };
}

function response(overrides = {}) {
  return {
    scenarioId: "debug-before-edit",
    route: "Debug",
    outcome: "complete",
    events: [
      { kind: "tool", name: "repository.search" },
      { kind: "evidence", name: "debug.reproduced", summary: "Parser fails on an empty token." },
      { kind: "action", name: "repository.write" },
    ],
    finalText: "Focused tests pass.",
    contextTokens: 800,
    ...overrides,
  };
}

function value(result) {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

test("passes every supported assertion and totals supplied context tokens", () => {
  const report = value(scoreEvaluation([scenario()], [response()]));

  assert.equal(report.passed, 9);
  assert.equal(report.total, 9);
  assert.equal(report.score, 1);
  assert.deepEqual(report.contextTokens, { total: 800, supplied: 1, missing: 0 });
  assert.deepEqual(report.scenarios[0].failures, []);
});

test("reports every failed assertion, including a missing token count", () => {
  const report = value(scoreEvaluation(
    [scenario()],
    [response({
      route: "Implement",
      outcome: "blocked",
      events: [
        { kind: "external", name: "vcs.commit" },
        { kind: "tool", name: "repository.search" },
        { kind: "tool", name: "repository.search" },
        { kind: "tool", name: "repository.search" },
        { kind: "action", name: "repository.write" },
        { kind: "evidence", name: "debug.reproduced" },
      ],
      finalText: "Committed without running tests.",
      contextTokens: undefined,
    })],
  ));

  assert.equal(report.passed, 1);
  assert.equal(report.total, 9);
  assert.deepEqual(
    report.scenarios[0].failures.map((failure) => failure.assertion),
    [
      "route",
      "outcome",
      "forbiddenEvents[0]",
      "maxEventCounts[0]",
      "orderedEventSubsequences[0]",
      "requiredFinalText[0]",
      "forbiddenFinalText[0]",
      "maxContextTokens",
    ],
  );
});

test("returns tagged errors for malformed scenario and response records", () => {
  const invalidRegex = parseScenario(scenario({
    assertions: { route: "Debug", requiredFinalText: ["["] },
  }));
  assert.equal(invalidRegex.ok, false);
  assert.equal(invalidRegex.error.tag, "InvalidScenario");

  const invalidResponse = parseResponse(response({ events: [{ kind: "tool", name: "x", surprise: true }] }));
  assert.equal(invalidResponse.ok, false);
  assert.equal(invalidResponse.error.tag, "InvalidResponse");

  const duplicate = scoreEvaluation([scenario(), scenario()], []);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.tag, "DuplicateScenario");
});

test("compares regressions, improvements, unchanged failures, and token deltas", () => {
  const noisyEvents = [
    ...response().events,
    { kind: "tool", name: "repository.search" },
    { kind: "tool", name: "repository.search" },
  ];
  const scenarios = [
    scenario(),
    {
      id: "read-only",
      prompt: "Recommend one option.",
      assertions: { route: "Discuss", forbiddenEvents: [{ name: "repository.write" }] },
    },
  ];
  const baseline = value(scoreEvaluation(scenarios, [
    response({ route: "Implement", events: noisyEvents, contextTokens: 900 }),
    {
      scenarioId: "read-only",
      route: "Discuss",
      outcome: "complete",
      events: [{ kind: "action", name: "repository.write" }],
      finalText: "Option A.",
      contextTokens: 200,
    },
  ]));
  const candidate = value(scoreEvaluation(scenarios, [
    response({ events: noisyEvents, finalText: "Committed after tests pass.", contextTokens: 700 }),
    {
      scenarioId: "read-only",
      route: "Implement",
      outcome: "complete",
      events: [],
      finalText: "Option A.",
      contextTokens: 250,
    },
  ]));

  const comparison = value(compareEvaluationReports(baseline, candidate));

  assert.deepEqual(comparison.improvements.map((item) => `${item.scenarioId}:${item.assertion}`), [
    "debug-before-edit:route",
    "read-only:forbiddenEvents[0]",
  ]);
  assert.deepEqual(comparison.regressions.map((item) => `${item.scenarioId}:${item.assertion}`), [
    "debug-before-edit:forbiddenFinalText[0]",
    "read-only:route",
  ]);
  assert.deepEqual(comparison.unchangedFailures.map((item) => `${item.scenarioId}:${item.assertion}`), [
    "debug-before-edit:maxEventCounts[0]",
  ]);
  assert.deepEqual(comparison.contextTokens, { baseline: 1_100, candidate: 950, delta: -150 });
  assert.equal(comparison.scenarios[0].contextTokens.delta, -200);
});

test("rejects comparison when scenario contracts differ", () => {
  const baseline = value(scoreEvaluation([scenario()], [response()]));
  const candidate = value(scoreEvaluation(
    [scenario({ prompt: "A changed prompt." })],
    [response()],
  ));

  const comparison = compareEvaluationReports(baseline, candidate);

  assert.equal(comparison.ok, false);
  assert.equal(comparison.error.tag, "ReportMismatch");
});
