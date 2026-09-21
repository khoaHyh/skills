import { createHash } from "node:crypto";

const PHASES = [
  "bound",
  "synchronized",
  "implemented",
  "local-review",
  "published",
  "collect-review-and-ci",
  "remediate-review",
  "final-ci",
  "authority-boundary",
  "post-merge-verification",
  "human-gate",
];

const ACTIONS = new Set([
  "commit",
  "push",
  "publish-pr",
  "request-review",
  "reply-review",
  "resolve-review",
  "rerun-workflow",
  "mark-ready",
  "merge",
]);

const ACTION_PHASES = {
  commit: [
    "synchronized",
    "implemented",
    "local-review",
    "collect-review-and-ci",
    "remediate-review",
    "final-ci",
  ],
  push: ["published", "collect-review-and-ci", "remediate-review", "final-ci"],
  "publish-pr": ["published"],
  "request-review": ["collect-review-and-ci"],
  "reply-review": ["remediate-review"],
  "resolve-review": ["remediate-review"],
  "rerun-workflow": ["collect-review-and-ci", "final-ci", "post-merge-verification"],
  "mark-ready": ["collect-review-and-ci"],
  merge: ["authority-boundary"],
};

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/g,
  /github_pat_[A-Za-z0-9_]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /AKIA[0-9A-Z]{16}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /(?:api[_-]?key|token|secret|password|passwd)\s*[:=]\s*\S+/gi,
];

function ok(value) {
  return { ok: true, value };
}

function err(tag, message, fields = {}) {
  return { ok: false, error: { tag, message, ...fields } };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value) {
  return Array.isArray(value) && value.every(nonEmptyString);
}

function redact(text) {
  let output = text;
  for (const pattern of SECRET_PATTERNS) output = output.replace(pattern, "[redacted]");
  return output;
}

function firstDiagnostic(stdout, stderr) {
  const lines = `${stderr}\n${stdout}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return redact(lines.slice(0, 12).join("\n")).slice(0, 1_200);
}

function fingerprint(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function nextPhase(phase, ceiling) {
  if (phase === "authority-boundary") {
    return ceiling === "merge-and-verify" ? "post-merge-verification" : "human-gate";
  }
  const index = PHASES.indexOf(phase);
  return PHASES[index + 1] ?? null;
}

function initialState(event) {
  return {
    runId: event.runId,
    goal: event.goal,
    context: event.context,
    ceiling: event.ceiling,
    reviewPlan: event.reviewPlan,
    cycle: 1,
    authorizedActions: event.authorizedActions,
    status: "active",
    phase: "bound",
    completedPhases: [],
    eventIds: [event.id],
    spentActionKeys: [],
    requestedActions: {},
    observedActions: {},
    checks: [],
    decisions: [],
    compactions: [],
    repairCycles: [],
    noProgressCount: 0,
    blocker: null,
  };
}

function validateMetadata(input) {
  if (!nonEmptyString(input.id)) return err("InvalidEvent", "event.id must be a non-empty string");
  if (!nonEmptyString(input.at)) return err("InvalidEvent", "event.at must be an ISO timestamp");
  if (Number.isNaN(Date.parse(input.at))) return err("InvalidEvent", "event.at must be an ISO timestamp");
  return ok(input);
}

function metadata(input) {
  return { type: input.type, id: input.id, at: input.at };
}

/**
 * Parse an untrusted workflow event into a supported event shape.
 *
 * @param {unknown} input - Untrusted event input.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} A parsed event or a tagged parse error.
 */
export function parseEvent(input) {
  if (!isRecord(input)) return err("InvalidEvent", "event must be an object");
  const metadataResult = validateMetadata(input);
  if (!metadataResult.ok) return metadataResult;

  switch (input.type) {
    case "RunLaunched": {
      if (!nonEmptyString(input.runId) || !nonEmptyString(input.goal)) {
        return err("InvalidEvent", "RunLaunched requires runId and goal");
      }
      if (!new Set(["stop-before-merge", "merge-and-verify"]).has(input.ceiling)) {
        return err("InvalidEvent", "RunLaunched has an invalid ceiling");
      }
      if (!new Set(["existing-only", "request-once", "skip"]).has(input.reviewPlan)) {
        return err("InvalidEvent", "RunLaunched has an invalid reviewPlan");
      }
      if (
        !isRecord(input.context) ||
        !nonEmptyString(input.context.taskWorktree) ||
        !nonEmptyString(input.context.branch) ||
        !nonEmptyString(input.context.base) ||
        !nonEmptyString(input.context.scope) ||
        !nonEmptyString(input.context.verifier) ||
        !nonEmptyString(input.context.terminalPredicate)
      ) {
        return err("InvalidEvent", "RunLaunched requires complete execution and business context");
      }
      if (!stringArray(input.authorizedActions) || input.authorizedActions.some((action) => !ACTIONS.has(action))) {
        return err("InvalidEvent", "RunLaunched authorizedActions must contain supported actions");
      }
      return ok({
        ...metadata(input),
        runId: input.runId,
        goal: redact(input.goal).slice(0, 500),
        ceiling: input.ceiling,
        reviewPlan: input.reviewPlan,
        authorizedActions: [...new Set(input.authorizedActions)],
        context: {
          taskWorktree: redact(input.context.taskWorktree).slice(0, 500),
          branch: redact(input.context.branch).slice(0, 500),
          base: redact(input.context.base).slice(0, 500),
          scope: redact(input.context.scope).slice(0, 500),
          verifier: redact(input.context.verifier).slice(0, 500),
          terminalPredicate: redact(input.context.terminalPredicate).slice(0, 500),
          ...(nonEmptyString(input.context.pr) ? { pr: redact(input.context.pr).slice(0, 500) } : {}),
          ...(nonEmptyString(input.context.revision)
            ? { revision: redact(input.context.revision).slice(0, 500) }
            : {}),
        },
      });
    }
    case "PhaseCompleted":
      if (!PHASES.includes(input.phase)) return err("InvalidEvent", "PhaseCompleted has an invalid phase");
      if (!isRecord(input.evidence) || !nonEmptyString(input.evidence.summary)) {
        return err("InvalidEvent", "PhaseCompleted requires evidence.summary");
      }
      if (!stringArray(input.evidence.references ?? [])) {
        return err("InvalidEvent", "PhaseCompleted evidence.references must be strings");
      }
      return ok({
        ...metadata(input),
        phase: input.phase,
        evidence: {
          summary: redact(input.evidence.summary).slice(0, 500),
          references: (input.evidence.references ?? []).map((value) => redact(value).slice(0, 500)),
        },
      });
    case "HumanRequested": {
      const decision = input.decision;
      if (
        !isRecord(decision) ||
        !nonEmptyString(decision.id) ||
        !nonEmptyString(decision.question) ||
        !nonEmptyString(decision.reason) ||
        !nonEmptyString(decision.recommendation) ||
        !Array.isArray(decision.options) ||
        decision.options.length < 2 ||
        !decision.options.every(
          (option) =>
            isRecord(option) &&
            nonEmptyString(option.label) &&
            nonEmptyString(option.consequence),
        ) ||
        !nonEmptyString(decision.resumeEvent)
      ) {
        return err("InvalidEvent", "HumanRequested requires a complete structured decision");
      }
      return ok({
        ...metadata(input),
        decision: {
          id: decision.id,
          question: redact(decision.question).slice(0, 500),
          reason: redact(decision.reason).slice(0, 500),
          recommendation: redact(decision.recommendation).slice(0, 500),
          options: decision.options.map((option) => ({
            label: redact(option.label).slice(0, 200),
            consequence: redact(option.consequence).slice(0, 500),
          })),
          resumeEvent: decision.resumeEvent,
        },
      });
    }
    case "HumanResponded":
      if (
        !nonEmptyString(input.decisionId) ||
        !nonEmptyString(input.resumeEvent) ||
        !nonEmptyString(input.answer)
      ) {
        return err("InvalidEvent", "HumanResponded requires decisionId, resumeEvent, and answer");
      }
      return ok({
        ...metadata(input),
        decisionId: input.decisionId,
        resumeEvent: input.resumeEvent,
        answer: redact(input.answer).slice(0, 500),
      });
    case "AuthorityUpdated":
      if (
        !nonEmptyString(input.reason) ||
        !nonEmptyString(input.sourceReference) ||
        (input.ceiling === undefined && input.authorizedActions === undefined)
      ) {
        return err("InvalidEvent", "AuthorityUpdated requires a reason, sourceReference, and changed authority");
      }
      if (
        input.ceiling !== undefined &&
        !new Set(["stop-before-merge", "merge-and-verify"]).has(input.ceiling)
      ) {
        return err("InvalidEvent", "AuthorityUpdated has an invalid ceiling");
      }
      if (
        input.authorizedActions !== undefined &&
        (!stringArray(input.authorizedActions) || input.authorizedActions.some((action) => !ACTIONS.has(action)))
      ) {
        return err("InvalidEvent", "AuthorityUpdated authorizedActions must contain supported actions");
      }
      return ok({
        ...metadata(input),
        reason: redact(input.reason).slice(0, 500),
        sourceReference: redact(input.sourceReference).slice(0, 500),
        ...(input.ceiling === undefined ? {} : { ceiling: input.ceiling }),
        ...(input.authorizedActions === undefined
          ? {}
          : { authorizedActions: [...new Set(input.authorizedActions)] }),
      });
    case "ExternalActionRequested":
      if (
        !nonEmptyString(input.key) ||
        !ACTIONS.has(input.action) ||
        !nonEmptyString(input.target) ||
        !nonEmptyString(input.payloadHash)
      ) {
        return err("InvalidEvent", "ExternalActionRequested requires key, supported action, target, and payloadHash");
      }
      return ok({
        ...metadata(input),
        key: input.key,
        action: input.action,
        target: redact(input.target).slice(0, 500),
        payloadHash: input.payloadHash.slice(0, 200),
      });
    case "ExternalActionObserved":
      if (
        !nonEmptyString(input.key) ||
        !new Set(["succeeded", "failed", "ambiguous"]).has(input.outcome) ||
        !nonEmptyString(input.summary)
      ) {
        return err("InvalidEvent", "ExternalActionObserved requires key, outcome, and summary");
      }
      return ok({
        ...metadata(input),
        key: input.key,
        outcome: input.outcome,
        summary: redact(input.summary).slice(0, 500),
      });
    case "CheckRecorded": {
      const check = input.check;
      if (
        !isRecord(check) ||
        !new Set(["passed", "failed"]).has(check.status) ||
        !nonEmptyString(check.command) ||
        !Number.isInteger(check.exitStatus) ||
        !nonEmptyString(check.summary) ||
        (check.status === "passed" && check.exitStatus !== 0) ||
        (check.status === "failed" && check.exitStatus === 0) ||
        (check.status === "failed" && !nonEmptyString(check.firstCausalError)) ||
        (check.status === "failed" && !nonEmptyString(check.failureFingerprint)) ||
        "stdout" in check ||
        "stderr" in check
      ) {
        return err("InvalidEvent", "CheckRecorded requires a compact check record");
      }
      return ok({
        ...metadata(input),
        check: {
          status: check.status,
          command: redact(check.command).slice(0, 500),
          exitStatus: check.exitStatus,
          summary: redact(check.summary).slice(0, 1_200),
          affectedSurface: nonEmptyString(check.affectedSurface)
            ? redact(check.affectedSurface).slice(0, 500)
            : "unspecified",
          attempt: Number.isInteger(check.attempt) && check.attempt > 0 ? check.attempt : 1,
          ...(nonEmptyString(check.firstCausalError)
            ? { firstCausalError: redact(check.firstCausalError).slice(0, 1_200) }
            : {}),
          ...(nonEmptyString(check.failureFingerprint)
            ? { failureFingerprint: check.failureFingerprint.slice(0, 200) }
            : {}),
          ...(nonEmptyString(check.previousFailureFingerprint)
            ? { previousFailureFingerprint: check.previousFailureFingerprint.slice(0, 200) }
            : {}),
          ...(typeof check.changedSincePreviousAttempt === "boolean"
            ? { changedSincePreviousAttempt: check.changedSincePreviousAttempt }
            : {}),
          ...(nonEmptyString(check.fullLogPointer)
            ? { fullLogPointer: redact(check.fullLogPointer).slice(0, 500) }
            : {}),
        },
      });
    }
    case "ContextCompacted":
      if (!nonEmptyString(input.summary) || !nonEmptyString(input.nextAction)) {
        return err("InvalidEvent", "ContextCompacted requires summary and nextAction");
      }
      return ok({
        ...metadata(input),
        summary: redact(input.summary).slice(0, 1_200),
        nextAction: redact(input.nextAction).slice(0, 500),
      });
    case "RunBlocked":
      if (!nonEmptyString(input.reason) || !nonEmptyString(input.resumeEvent)) {
        return err("InvalidEvent", "RunBlocked requires reason and resumeEvent");
      }
      return ok({
        ...metadata(input),
        reason: redact(input.reason).slice(0, 500),
        resumeEvent: input.resumeEvent,
      });
    case "RunResumed":
      if (!nonEmptyString(input.resumeEvent) || !nonEmptyString(input.evidence)) {
        return err("InvalidEvent", "RunResumed requires resumeEvent and evidence");
      }
      return ok({
        ...metadata(input),
        resumeEvent: input.resumeEvent,
        evidence: redact(input.evidence).slice(0, 500),
      });
    case "RepairCycleStarted":
      if (
        !nonEmptyString(input.reason) ||
        !nonEmptyString(input.failedWorkflow) ||
        !nonEmptyString(input.progressFingerprint)
      ) {
        return err(
          "InvalidEvent",
          "RepairCycleStarted requires reason, failedWorkflow, and progressFingerprint",
        );
      }
      return ok({
        ...metadata(input),
        reason: redact(input.reason).slice(0, 500),
        failedWorkflow: redact(input.failedWorkflow).slice(0, 500),
        progressFingerprint: input.progressFingerprint.slice(0, 200),
      });
    default:
      return err("InvalidEvent", `unsupported event type: ${String(input.type)}`);
  }
}

/**
 * Apply one parsed event to a workflow state without performing side effects.
 *
 * @param {Record<string, unknown> | null} state - Current reduced state, or null before launch.
 * @param {Record<string, unknown>} event - Parsed workflow event.
 * @returns {{ ok: true, value: { state: Record<string, unknown>, effects: Array<Record<string, unknown>> } } | { ok: false, error: Record<string, unknown> }} The next state and requested effects, or a tagged transition error.
 */
export function applyEvent(state, event) {
  if (state === null) {
    if (event.type !== "RunLaunched") return err("InvalidTransition", "the first event must be RunLaunched");
    return ok({ state: initialState(event), effects: [] });
  }
  if (state.eventIds.includes(event.id)) {
    return err("DuplicateEvent", `event ${event.id} was already applied`, { eventId: event.id });
  }
  if (event.type === "RunLaunched") return err("InvalidTransition", "a run can only be launched once");
  if (state.status === "complete") return err("RunTerminal", "a complete run cannot accept more events");

  const base = { ...state, eventIds: [...state.eventIds, event.id] };

  if (event.type === "HumanResponded") {
    const pending = state.decisions.find((decision) => decision.status === "pending");
    if (
      state.status !== "paused" ||
      pending?.id !== event.decisionId ||
      pending.resumeEvent !== event.resumeEvent
    ) {
      return err("InvalidTransition", "HumanResponded does not match the pending decision");
    }
    return ok({
      state: {
        ...base,
        status: "active",
        decisions: state.decisions.map((decision) =>
          decision.id === event.decisionId
            ? { ...decision, status: "answered", answer: event.answer, answeredAt: event.at }
            : decision,
        ),
      },
      effects: [],
    });
  }

  if (event.type === "RunResumed") {
    if (state.status !== "blocked" || state.blocker?.resumeEvent !== event.resumeEvent) {
      return err("InvalidTransition", "RunResumed does not match the blocker resume event");
    }
    return ok({ state: { ...base, status: "active", blocker: null }, effects: [] });
  }

  if (state.status !== "active") {
    return err("RunPaused", `run is ${state.status}; resume it before applying ${event.type}`);
  }

  switch (event.type) {
    case "PhaseCompleted": {
      if (event.phase !== state.phase) {
        return err("InvalidTransition", `expected completion for ${state.phase}, received ${event.phase}`);
      }
      const pendingActions = state.spentActionKeys.filter(
        (key) => state.observedActions[key] === undefined,
      );
      if (pendingActions.length > 0) {
        return err("PendingExternalAction", "observe every requested external action before completing a phase", {
          pendingActions,
        });
      }
      const next = nextPhase(state.phase, state.ceiling);
      if (next === null) {
        return ok({
          state: {
            ...base,
            status: "complete",
            completedPhases: [...state.completedPhases, { ...event, cycle: state.cycle }],
          },
          effects: [],
        });
      }
      return ok({
        state: {
          ...base,
          phase: next,
          completedPhases: [...state.completedPhases, { ...event, cycle: state.cycle }],
        },
        effects: [
          {
            type: "compact-context",
            completedPhase: state.phase,
            retain: ["goal", "authority", "decisions", "evidence", "risks", "next-action"],
          },
        ],
      });
    }
    case "HumanRequested":
      if (state.decisions.some((decision) => decision.id === event.decision.id)) {
        return err("DuplicateDecision", `decision ${event.decision.id} already exists`);
      }
      return ok({
        state: {
          ...base,
          status: "paused",
          decisions: [...state.decisions, { ...event.decision, status: "pending", requestedAt: event.at }],
        },
        effects: [{ type: "contact-human", decision: event.decision }],
      });
    case "AuthorityUpdated": {
      const ceiling = event.ceiling ?? state.ceiling;
      const authorizedActions = event.authorizedActions ?? state.authorizedActions;
      if (authorizedActions.includes("merge") && ceiling !== "merge-and-verify") {
        return err("InvalidTransition", "merge authority requires the merge-and-verify ceiling");
      }
      return ok({
        state: { ...base, ceiling, authorizedActions },
        effects: [],
      });
    }
    case "ExternalActionRequested": {
      if (!state.authorizedActions.includes(event.action)) {
        return err("ActionNotAuthorized", `${event.action} is outside the run authority`, { action: event.action });
      }
      if (event.action === "merge" && state.ceiling !== "merge-and-verify") {
        return err("ActionNotAuthorized", "merge requires the merge-and-verify ceiling");
      }
      if (!ACTION_PHASES[event.action].includes(state.phase)) {
        return err("ActionOutOfPhase", `${event.action} is not allowed during ${state.phase}`, {
          action: event.action,
          phase: state.phase,
          allowedPhases: ACTION_PHASES[event.action],
        });
      }
      if (state.spentActionKeys.includes(event.key)) {
        return err("ActionAlreadySpent", `external action ${event.key} was already spent`, { key: event.key });
      }
      return ok({
        state: {
          ...base,
          spentActionKeys: [...state.spentActionKeys, event.key],
          requestedActions: { ...state.requestedActions, [event.key]: { ...event } },
        },
        effects: [
          {
            type: "execute-external-action",
            key: event.key,
            action: event.action,
            target: event.target,
            payloadHash: event.payloadHash,
          },
        ],
      });
    }
    case "ExternalActionObserved":
      if (!state.spentActionKeys.includes(event.key)) {
        return err("UnknownAction", `external action ${event.key} was not requested`);
      }
      if (state.observedActions[event.key] !== undefined) {
        return err("ActionAlreadyObserved", `external action ${event.key} already has an outcome`);
      }
      return ok({
        state: {
          ...base,
          observedActions: { ...state.observedActions, [event.key]: { ...event } },
        },
        effects: [],
      });
    case "CheckRecorded":
      return ok({ state: { ...base, checks: [...state.checks, event.check] }, effects: [] });
    case "ContextCompacted":
      return ok({
        state: {
          ...base,
          compactions: [
            ...state.compactions,
            { at: event.at, phase: state.phase, summary: event.summary, nextAction: event.nextAction },
          ],
        },
        effects: [],
      });
    case "RunBlocked":
      return ok({
        state: {
          ...base,
          status: "blocked",
          blocker: { reason: event.reason, resumeEvent: event.resumeEvent, blockedAt: event.at },
        },
        effects: [],
      });
    case "RepairCycleStarted": {
      if (state.ceiling !== "merge-and-verify" || state.phase !== "post-merge-verification") {
        return err("InvalidTransition", "a repair cycle can start only during post-merge verification");
      }
      const previous = state.repairCycles.at(-1);
      const noProgressCount =
        previous?.progressFingerprint === event.progressFingerprint ? state.noProgressCount + 1 : 0;
      if (noProgressCount >= 2) {
        return ok({
          state: {
            ...base,
            status: "blocked",
            noProgressCount,
            blocker: {
              reason: "two consecutive repair cycles produced no new progress evidence",
              resumeEvent: "new-repair-evidence",
              blockedAt: event.at,
            },
          },
          effects: [],
        });
      }
      return ok({
        state: {
          ...base,
          cycle: state.cycle + 1,
          phase: "bound",
          noProgressCount,
          repairCycles: [...state.repairCycles, { ...event, cycle: state.cycle + 1 }],
        },
        effects: [
          {
            type: "compact-context",
            completedPhase: "post-merge-verification",
            retain: ["goal", "authority", "failure", "repair-evidence", "next-action"],
          },
        ],
      });
    }
    default:
      return err("InvalidTransition", `${event.type} cannot be applied while the run is active`);
  }
}

/**
 * Reduce an event history into its current workflow state.
 *
 * @param {ReadonlyArray<unknown>} events - Untrusted workflow event history.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} The current state or the first parse/transition error.
 */
export function reduceEvents(events) {
  let state = null;
  for (let index = 0; index < events.length; index += 1) {
    const parsed = parseEvent(events[index]);
    if (!parsed.ok) return err(parsed.error.tag, parsed.error.message, { ...parsed.error, eventIndex: index });
    const applied = applyEvent(state, parsed.value);
    if (!applied.ok) return err(applied.error.tag, applied.error.message, { ...applied.error, eventIndex: index });
    state = applied.value.state;
  }
  if (state === null) return err("EmptyHistory", "event history is empty");
  return ok(state);
}

/**
 * Compact command output into a bounded verification record suitable for agent context.
 *
 * @param {unknown} input - Command result with command, exitStatus, stdout, stderr, and optional diagnostic fields.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} A compact check record or a tagged parse error.
 */
export function compactCommandResult(input) {
  if (
    !isRecord(input) ||
    !nonEmptyString(input.command) ||
    !Number.isInteger(input.exitStatus) ||
    typeof input.stdout !== "string" ||
    typeof input.stderr !== "string"
  ) {
    return err("InvalidCommandResult", "command, integer exitStatus, stdout, and stderr are required");
  }
  const common = {
    command: redact(input.command).slice(0, 500),
    exitStatus: input.exitStatus,
    affectedSurface: nonEmptyString(input.affectedSurface)
      ? redact(input.affectedSurface).slice(0, 500)
      : "unspecified",
    attempt: Number.isInteger(input.attempt) && input.attempt > 0 ? input.attempt : 1,
  };
  if (input.exitStatus === 0) {
    return ok({ ...common, status: "passed", summary: "passed" });
  }
  const diagnostic = firstDiagnostic(input.stdout, input.stderr) || "command failed without diagnostic output";
  const failureFingerprint = fingerprint(`${input.command}\n${diagnostic}`);
  return ok({
    ...common,
    status: "failed",
    summary: diagnostic.split("\n", 1)[0],
    firstCausalError: diagnostic,
    failureFingerprint,
    previousFailureFingerprint: nonEmptyString(input.previousFailureFingerprint)
      ? input.previousFailureFingerprint
      : null,
    changedSincePreviousAttempt:
      nonEmptyString(input.previousFailureFingerprint) && input.previousFailureFingerprint !== failureFingerprint,
    fullLogPointer: nonEmptyString(input.fullLogPointer) ? input.fullLogPointer : null,
  });
}

/** Supported Finish Loop phases in transition order. */
export const finishLoopPhases = Object.freeze([...PHASES]);

/** Supported externally observable actions. */
export const externalActions = Object.freeze([...ACTIONS]);
