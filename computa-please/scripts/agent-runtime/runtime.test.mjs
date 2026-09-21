import test from "node:test";
import assert from "node:assert/strict";
import { applyEvent, compactCommandResult, parseEvent, reduceEvents } from "./runtime.mjs";

const at = "2026-09-20T12:00:00.000Z";

function launch(overrides = {}) {
  return {
    type: "RunLaunched",
    id: "launch",
    at,
    runId: "run-1",
    goal: "Deliver the PR",
    ceiling: "stop-before-merge",
    reviewPlan: "existing-only",
    authorizedActions: ["commit", "push", "publish-pr"],
    context: {
      taskWorktree: "/tmp/worktree",
      branch: "feature",
      base: "main",
      scope: "runtime",
      verifier: "node --test",
      terminalPredicate: "merge-ready",
    },
    ...overrides,
  };
}

function parse(input) {
  const result = parseEvent(input);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function advanceTo(state, targetPhase) {
  let current = state;
  let sequence = 0;
  while (current.phase !== targetPhase) {
    const advanced = applyEvent(
      current,
      parse({
        type: "PhaseCompleted",
        id: `phase-${sequence}`,
        at,
        phase: current.phase,
        evidence: { summary: `${current.phase} complete`, references: [] },
      }),
    );
    assert.equal(advanced.ok, true, JSON.stringify(advanced));
    current = advanced.value.state;
    sequence += 1;
  }
  return current;
}

test("reduces launch and advances phases in order", () => {
  const events = [
    launch(),
    {
      type: "PhaseCompleted",
      id: "bound",
      at,
      phase: "bound",
      evidence: { summary: "Goal and authority recorded", references: ["handoff.md"] },
    },
  ];

  const result = reduceEvents(events);

  assert.equal(result.ok, true);
  assert.equal(result.value.phase, "synchronized");
  assert.equal(result.value.completedPhases.length, 1);
});

test("rejects an out-of-order phase completion", () => {
  const launched = applyEvent(null, parse(launch()));
  assert.equal(launched.ok, true);

  const result = applyEvent(
    launched.value.state,
    parse({
      type: "PhaseCompleted",
      id: "wrong-phase",
      at,
      phase: "implemented",
      evidence: { summary: "Implementation complete", references: [] },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.tag, "InvalidTransition");
});

test("pauses for a structured human decision and resumes only on the matching answer", () => {
  const launched = applyEvent(null, parse(launch()));
  const requested = applyEvent(
    launched.value.state,
    parse({
      type: "HumanRequested",
      id: "question-event",
      at,
      decision: {
        id: "decision-1",
        question: "May this run merge the PR?",
        reason: "The current ceiling stops before merge.",
        recommendation: "Keep the existing ceiling.",
        options: [
          { label: "Stop before merge", consequence: "The PR remains merge-ready." },
          { label: "Merge and verify", consequence: "The run may merge and watch post-merge CI." },
        ],
        resumeEvent: "delivery-ceiling-chosen",
      },
    }),
  );

  assert.equal(requested.ok, true);
  assert.equal(requested.value.state.status, "paused");
  assert.equal(requested.value.effects[0].type, "contact-human");

  const wrong = applyEvent(
    requested.value.state,
    parse({
      type: "HumanResponded",
      id: "answer-wrong",
      at,
      decisionId: "other",
      resumeEvent: "delivery-ceiling-chosen",
      answer: "No",
    }),
  );
  assert.equal(wrong.ok, false);

  const resumed = applyEvent(
    requested.value.state,
    parse({
      type: "HumanResponded",
      id: "answer",
      at,
      decisionId: "decision-1",
      resumeEvent: "delivery-ceiling-chosen",
      answer: "Stop before merge",
    }),
  );
  assert.equal(resumed.ok, true);
  assert.equal(resumed.value.state.status, "active");
});

test("marks an authorized external action spent before emitting execution", () => {
  const launched = applyEvent(null, parse(launch()));
  const state = advanceTo(launched.value.state, "published");
  const request = parse({
    type: "ExternalActionRequested",
    id: "push-request",
    at,
    key: "push:abc123",
    action: "push",
    target: "origin/feature",
    payloadHash: "abc123",
  });

  const first = applyEvent(state, request);
  assert.equal(first.ok, true);
  assert.deepEqual(first.value.state.spentActionKeys, ["push:abc123"]);
  assert.equal(first.value.state.requestedActions["push:abc123"].target, "origin/feature");
  assert.equal(first.value.effects[0].type, "execute-external-action");

  const replay = applyEvent(first.value.state, { ...request, id: "push-request-replay" });
  assert.equal(replay.ok, false);
  assert.equal(replay.error.tag, "ActionAlreadySpent");
});

test("requires every guarded action to be observed before phase completion", () => {
  const launched = applyEvent(null, parse(launch()));
  const state = advanceTo(launched.value.state, "published");
  const requested = applyEvent(
    state,
    parse({
      type: "ExternalActionRequested",
      id: "publish-request",
      at,
      key: "publish:abc123",
      action: "publish-pr",
      target: "feature",
      payloadHash: "abc123",
    }),
  );
  assert.equal(requested.ok, true);

  const pending = applyEvent(
    requested.value.state,
    parse({
      type: "PhaseCompleted",
      id: "published-too-soon",
      at,
      phase: "published",
      evidence: { summary: "Published", references: [] },
    }),
  );
  assert.equal(pending.ok, false);
  assert.equal(pending.error.tag, "PendingExternalAction");

  const observed = applyEvent(
    requested.value.state,
    parse({
      type: "ExternalActionObserved",
      id: "publish-observed",
      at,
      key: "publish:abc123",
      outcome: "succeeded",
      summary: "Draft PR published.",
    }),
  );
  assert.equal(observed.ok, true);
  const completed = applyEvent(
    observed.value.state,
    parse({
      type: "PhaseCompleted",
      id: "published-complete",
      at,
      phase: "published",
      evidence: { summary: "Published", references: [] },
    }),
  );
  assert.equal(completed.ok, true);
  assert.equal(completed.value.state.phase, "collect-review-and-ci");
});

test("rejects external actions outside recorded authority", () => {
  const launched = applyEvent(null, parse(launch()));
  const result = applyEvent(
    launched.value.state,
    parse({
      type: "ExternalActionRequested",
      id: "merge-request",
      at,
      key: "merge:1",
      action: "merge",
      target: "PR#1",
      payloadHash: "def456",
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.tag, "ActionNotAuthorized");
});

test("rejects an authorized external action in the wrong phase", () => {
  const launched = applyEvent(null, parse(launch()));
  const result = applyEvent(
    launched.value.state,
    parse({
      type: "ExternalActionRequested",
      id: "early-push",
      at,
      key: "push:early",
      action: "push",
      target: "origin/feature",
      payloadHash: "early",
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.tag, "ActionOutOfPhase");
});

test("updates authority from an explicit source record", () => {
  const launched = applyEvent(null, parse(launch()));
  const result = applyEvent(
    launched.value.state,
    parse({
      type: "AuthorityUpdated",
      id: "authority",
      at,
      reason: "The user explicitly requested merge and verification.",
      sourceReference: "conversation:turn-42",
      ceiling: "merge-and-verify",
      authorizedActions: ["commit", "push", "publish-pr", "merge"],
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.value.state.ceiling, "merge-and-verify");
  assert.ok(result.value.state.authorizedActions.includes("merge"));
});

test("selects the authority-boundary branch from the recorded ceiling", () => {
  const stopLaunch = applyEvent(null, parse(launch()));
  const stopAuthority = advanceTo(stopLaunch.value.state, "authority-boundary");
  const stopped = applyEvent(
    stopAuthority,
    parse({
      type: "PhaseCompleted",
      id: "stop-authority",
      at,
      phase: "authority-boundary",
      evidence: { summary: "Stopped before merge", references: [] },
    }),
  );
  assert.equal(stopped.ok, true);
  assert.equal(stopped.value.state.phase, "human-gate");

  const mergeLaunch = applyEvent(
    null,
    parse(
      launch({
        ceiling: "merge-and-verify",
        authorizedActions: ["commit", "push", "publish-pr", "merge"],
      }),
    ),
  );
  const mergeAuthority = advanceTo(mergeLaunch.value.state, "authority-boundary");
  const merging = applyEvent(
    mergeAuthority,
    parse({
      type: "PhaseCompleted",
      id: "merge-authority",
      at,
      phase: "authority-boundary",
      evidence: { summary: "Merge observed", references: [] },
    }),
  );
  assert.equal(merging.ok, true);
  assert.equal(merging.value.state.phase, "post-merge-verification");
});

test("starts a post-merge repair cycle with inherited authority", () => {
  const launched = applyEvent(
    null,
    parse(
      launch({
        ceiling: "merge-and-verify",
        authorizedActions: ["commit", "push", "publish-pr", "merge"],
      }),
    ),
  );
  const postMerge = advanceTo(launched.value.state, "post-merge-verification");
  const result = applyEvent(
    postMerge,
    parse({
      type: "RepairCycleStarted",
      id: "repair-cycle",
      at,
      reason: "The landed change failed its deployment workflow.",
      failedWorkflow: "deploy-production#42",
      progressFingerprint: "root-cause-a",
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.value.state.cycle, 2);
  assert.equal(result.value.state.phase, "bound");
  assert.equal(result.value.state.ceiling, "merge-and-verify");
});

test("rejects raw command output in a CheckRecorded event", () => {
  const parsed = parseEvent({
    type: "CheckRecorded",
    id: "raw-check",
    at,
    check: {
      status: "failed",
      command: "npm test",
      exitStatus: 1,
      summary: "failed",
      stdout: "verbose output",
    },
  });

  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.tag, "InvalidEvent");
});

test("compacts passing output to a single success signal", () => {
  const result = compactCommandResult({
    command: "npm test",
    exitStatus: 0,
    stdout: "thousands of passing lines",
    stderr: "",
    affectedSurface: "runtime tests",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    command: "npm test",
    exitStatus: 0,
    affectedSurface: "runtime tests",
    attempt: 1,
    status: "passed",
    summary: "passed",
  });
});

test("keeps bounded diagnostic context and redacts secrets on failure", () => {
  const result = compactCommandResult({
    command: "npm test",
    exitStatus: 1,
    stdout: "secondary line",
    stderr: "Error: token=secret-value\nstack line",
    fullLogPointer: "/tmp/test.log",
    attempt: 2,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.status, "failed");
  assert.match(result.value.firstCausalError, /\[redacted\]/);
  assert.equal(result.value.fullLogPointer, "/tmp/test.log");
  assert.equal(result.value.attempt, 2);
});
