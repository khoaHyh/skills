import { createHash } from "node:crypto";

const SCENARIO_KEYS = new Set(["id", "prompt", "context", "assertions"]);
const ASSERTION_KEYS = new Set([
  "route",
  "outcome",
  "requiredEvents",
  "forbiddenEvents",
  "maxEventCounts",
  "orderedEventSubsequences",
  "requiredFinalText",
  "forbiddenFinalText",
  "maxContextTokens",
]);
const RESPONSE_KEYS = new Set([
  "scenarioId",
  "route",
  "outcome",
  "events",
  "finalText",
  "contextTokens",
]);
const EVENT_KEYS = new Set(["kind", "name", "summary"]);
const SELECTOR_KEYS = new Set(["kind", "name"]);
const COUNT_KEYS = new Set(["kind", "name", "max"]);

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

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function unknownKey(value, allowed) {
  return Object.keys(value).find((key) => !allowed.has(key));
}

function parseSelector(input, path, allowed = SELECTOR_KEYS) {
  if (!isRecord(input)) return err("InvalidScenario", `${path} must be an object`);
  const extra = unknownKey(input, allowed);
  if (extra !== undefined) return err("InvalidScenario", `${path} has unknown field: ${extra}`);
  if (input.kind !== undefined && !nonEmptyString(input.kind)) {
    return err("InvalidScenario", `${path}.kind must be a non-empty string`);
  }
  if (input.name !== undefined && !nonEmptyString(input.name)) {
    return err("InvalidScenario", `${path}.name must be a non-empty string`);
  }
  if (input.kind === undefined && input.name === undefined) {
    return err("InvalidScenario", `${path} requires kind or name`);
  }
  return ok({
    ...(input.kind === undefined ? {} : { kind: input.kind.trim() }),
    ...(input.name === undefined ? {} : { name: input.name.trim() }),
  });
}

function parseSelectorList(input, path) {
  if (input === undefined) return ok([]);
  if (!Array.isArray(input)) return err("InvalidScenario", `${path} must be an array`);
  const output = [];
  for (let index = 0; index < input.length; index += 1) {
    const parsed = parseSelector(input[index], `${path}[${index}]`);
    if (!parsed.ok) return parsed;
    output.push(parsed.value);
  }
  return ok(output);
}

function parseRegexList(input, path) {
  if (input === undefined) return ok([]);
  if (!Array.isArray(input) || !input.every(nonEmptyString)) {
    return err("InvalidScenario", `${path} must be an array of non-empty regex strings`);
  }
  for (let index = 0; index < input.length; index += 1) {
    try {
      new RegExp(input[index]);
    } catch (cause) {
      return err("InvalidScenario", `${path}[${index}] is not a valid regex`, {
        detail: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }
  return ok([...input]);
}

function parseAssertions(input) {
  if (!isRecord(input)) return err("InvalidScenario", "scenario.assertions must be an object");
  const extra = unknownKey(input, ASSERTION_KEYS);
  if (extra !== undefined) return err("InvalidScenario", `scenario.assertions has unknown field: ${extra}`);
  if (input.route !== undefined && !nonEmptyString(input.route)) {
    return err("InvalidScenario", "scenario.assertions.route must be a non-empty string");
  }
  if (input.outcome !== undefined && !nonEmptyString(input.outcome)) {
    return err("InvalidScenario", "scenario.assertions.outcome must be a non-empty string");
  }
  if (
    input.maxContextTokens !== undefined &&
    (!Number.isInteger(input.maxContextTokens) || input.maxContextTokens < 0)
  ) {
    return err("InvalidScenario", "scenario.assertions.maxContextTokens must be a non-negative integer");
  }

  const requiredEvents = parseSelectorList(input.requiredEvents, "scenario.assertions.requiredEvents");
  if (!requiredEvents.ok) return requiredEvents;
  const forbiddenEvents = parseSelectorList(input.forbiddenEvents, "scenario.assertions.forbiddenEvents");
  if (!forbiddenEvents.ok) return forbiddenEvents;

  const maxEventCounts = [];
  if (input.maxEventCounts !== undefined) {
    if (!Array.isArray(input.maxEventCounts)) {
      return err("InvalidScenario", "scenario.assertions.maxEventCounts must be an array");
    }
    for (let index = 0; index < input.maxEventCounts.length; index += 1) {
      const item = input.maxEventCounts[index];
      const parsed = parseSelector(item, `scenario.assertions.maxEventCounts[${index}]`, COUNT_KEYS);
      if (!parsed.ok) return parsed;
      if (!Number.isInteger(item.max) || item.max < 0) {
        return err(
          "InvalidScenario",
          `scenario.assertions.maxEventCounts[${index}].max must be a non-negative integer`,
        );
      }
      maxEventCounts.push({ ...parsed.value, max: item.max });
    }
  }

  const orderedEventSubsequences = [];
  if (input.orderedEventSubsequences !== undefined) {
    if (!Array.isArray(input.orderedEventSubsequences)) {
      return err("InvalidScenario", "scenario.assertions.orderedEventSubsequences must be an array");
    }
    for (let index = 0; index < input.orderedEventSubsequences.length; index += 1) {
      const sequence = parseSelectorList(
        input.orderedEventSubsequences[index],
        `scenario.assertions.orderedEventSubsequences[${index}]`,
      );
      if (!sequence.ok) return sequence;
      if (sequence.value.length === 0) {
        return err(
          "InvalidScenario",
          `scenario.assertions.orderedEventSubsequences[${index}] must not be empty`,
        );
      }
      orderedEventSubsequences.push(sequence.value);
    }
  }

  const requiredFinalText = parseRegexList(input.requiredFinalText, "scenario.assertions.requiredFinalText");
  if (!requiredFinalText.ok) return requiredFinalText;
  const forbiddenFinalText = parseRegexList(input.forbiddenFinalText, "scenario.assertions.forbiddenFinalText");
  if (!forbiddenFinalText.ok) return forbiddenFinalText;

  const assertions = {
    ...(input.route === undefined ? {} : { route: input.route.trim() }),
    ...(input.outcome === undefined ? {} : { outcome: input.outcome.trim() }),
    requiredEvents: requiredEvents.value,
    forbiddenEvents: forbiddenEvents.value,
    maxEventCounts,
    orderedEventSubsequences,
    requiredFinalText: requiredFinalText.value,
    forbiddenFinalText: forbiddenFinalText.value,
    ...(input.maxContextTokens === undefined ? {} : { maxContextTokens: input.maxContextTokens }),
  };
  const assertionCount =
    (assertions.route === undefined ? 0 : 1) +
    (assertions.outcome === undefined ? 0 : 1) +
    assertions.requiredEvents.length +
    assertions.forbiddenEvents.length +
    assertions.maxEventCounts.length +
    assertions.orderedEventSubsequences.length +
    assertions.requiredFinalText.length +
    assertions.forbiddenFinalText.length +
    (assertions.maxContextTokens === undefined ? 0 : 1);
  if (assertionCount === 0) return err("InvalidScenario", "scenario.assertions must contain an assertion");
  return ok(assertions);
}

/**
 * Parse and normalize an untrusted behavioral evaluation scenario.
 *
 * @param {unknown} input - Untrusted scenario record.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} A normalized scenario or tagged validation error.
 */
export function parseScenario(input) {
  if (!isRecord(input)) return err("InvalidScenario", "scenario must be an object");
  if (!hasOnlyKeys(input, SCENARIO_KEYS)) {
    return err("InvalidScenario", `scenario has unknown field: ${unknownKey(input, SCENARIO_KEYS)}`);
  }
  if (!nonEmptyString(input.id)) return err("InvalidScenario", "scenario.id must be a non-empty string");
  if (!nonEmptyString(input.prompt)) return err("InvalidScenario", "scenario.prompt must be a non-empty string");
  if (input.context !== undefined && !nonEmptyString(input.context)) {
    return err("InvalidScenario", "scenario.context must be a non-empty string when supplied");
  }
  const assertions = parseAssertions(input.assertions);
  if (!assertions.ok) return assertions;
  return ok({
    id: input.id.trim(),
    prompt: input.prompt,
    ...(input.context === undefined ? {} : { context: input.context }),
    assertions: assertions.value,
  });
}

/**
 * Parse and normalize an untrusted runner response record.
 *
 * @param {unknown} input - Untrusted response record.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} A normalized response or tagged validation error.
 */
export function parseResponse(input) {
  if (!isRecord(input)) return err("InvalidResponse", "response must be an object");
  if (!hasOnlyKeys(input, RESPONSE_KEYS)) {
    return err("InvalidResponse", `response has unknown field: ${unknownKey(input, RESPONSE_KEYS)}`);
  }
  for (const field of ["scenarioId", "route", "outcome", "finalText"]) {
    if (!nonEmptyString(input[field])) return err("InvalidResponse", `response.${field} must be a non-empty string`);
  }
  if (!Array.isArray(input.events)) return err("InvalidResponse", "response.events must be an array");
  if (
    input.contextTokens !== undefined &&
    (!Number.isInteger(input.contextTokens) || input.contextTokens < 0)
  ) {
    return err("InvalidResponse", "response.contextTokens must be a non-negative integer when supplied");
  }

  const events = [];
  for (let index = 0; index < input.events.length; index += 1) {
    const event = input.events[index];
    if (!isRecord(event)) return err("InvalidResponse", `response.events[${index}] must be an object`);
    const extra = unknownKey(event, EVENT_KEYS);
    if (extra !== undefined) {
      return err("InvalidResponse", `response.events[${index}] has unknown field: ${extra}`);
    }
    if (!nonEmptyString(event.kind) || !nonEmptyString(event.name)) {
      return err("InvalidResponse", `response.events[${index}] requires non-empty kind and name`);
    }
    if (event.summary !== undefined && !nonEmptyString(event.summary)) {
      return err("InvalidResponse", `response.events[${index}].summary must be a non-empty string when supplied`);
    }
    if (typeof event.summary === "string" && event.summary.length > 500) {
      return err("InvalidResponse", `response.events[${index}].summary must not exceed 500 characters`);
    }
    events.push({
      kind: event.kind.trim(),
      name: event.name.trim(),
      ...(event.summary === undefined ? {} : { summary: event.summary }),
    });
  }

  return ok({
    scenarioId: input.scenarioId.trim(),
    route: input.route.trim(),
    outcome: input.outcome.trim(),
    events,
    finalText: input.finalText,
    ...(input.contextTokens === undefined ? {} : { contextTokens: input.contextTokens }),
  });
}

function eventMatches(event, selector) {
  return (selector.kind === undefined || event.kind === selector.kind) &&
    (selector.name === undefined || event.name === selector.name);
}

function hasSubsequence(events, sequence) {
  let sequenceIndex = 0;
  for (const event of events) {
    if (eventMatches(event, sequence[sequenceIndex])) sequenceIndex += 1;
    if (sequenceIndex === sequence.length) return true;
  }
  return false;
}

function scoreScenario(scenario, response) {
  const failures = [];
  let passed = 0;
  let total = 0;
  const record = (assertion, condition, message, expected, actual) => {
    total += 1;
    if (response !== null && condition) {
      passed += 1;
      return;
    }
    failures.push({
      assertion,
      message: response === null ? "response is missing" : message,
      expected,
      actual: response === null ? null : actual,
    });
  };
  const assertions = scenario.assertions;
  const events = response?.events ?? [];

  if (assertions.route !== undefined) {
    record("route", response?.route === assertions.route, "selected route differs", assertions.route, response?.route);
  }
  if (assertions.outcome !== undefined) {
    record("outcome", response?.outcome === assertions.outcome, "terminal outcome differs", assertions.outcome, response?.outcome);
  }
  assertions.requiredEvents.forEach((selector, index) => {
    const count = events.filter((event) => eventMatches(event, selector)).length;
    record(`requiredEvents[${index}]`, count > 0, "required event was not observed", selector, count);
  });
  assertions.forbiddenEvents.forEach((selector, index) => {
    const count = events.filter((event) => eventMatches(event, selector)).length;
    record(`forbiddenEvents[${index}]`, count === 0, "forbidden event was observed", selector, count);
  });
  assertions.maxEventCounts.forEach((limit, index) => {
    const count = events.filter((event) => eventMatches(event, limit)).length;
    const { max, ...selector } = limit;
    record(`maxEventCounts[${index}]`, count <= max, "event count exceeded maximum", { ...selector, max }, count);
  });
  assertions.orderedEventSubsequences.forEach((sequence, index) => {
    record(
      `orderedEventSubsequences[${index}]`,
      hasSubsequence(events, sequence),
      "ordered event subsequence was not observed",
      sequence,
      events.map(({ kind, name }) => ({ kind, name })),
    );
  });
  assertions.requiredFinalText.forEach((pattern, index) => {
    record(
      `requiredFinalText[${index}]`,
      new RegExp(pattern).test(response?.finalText ?? ""),
      "final text did not match required regex",
      pattern,
      response?.finalText,
    );
  });
  assertions.forbiddenFinalText.forEach((pattern, index) => {
    record(
      `forbiddenFinalText[${index}]`,
      !new RegExp(pattern).test(response?.finalText ?? ""),
      "final text matched forbidden regex",
      pattern,
      response?.finalText,
    );
  });
  if (assertions.maxContextTokens !== undefined) {
    record(
      "maxContextTokens",
      response?.contextTokens !== undefined && response.contextTokens <= assertions.maxContextTokens,
      response?.contextTokens === undefined ? "context token count was not supplied" : "context token count exceeded maximum",
      assertions.maxContextTokens,
      response?.contextTokens ?? null,
    );
  }

  return {
    scenarioId: scenario.id,
    scenarioFingerprint: createHash("sha256").update(JSON.stringify(scenario)).digest("hex").slice(0, 16),
    passed,
    total,
    score: passed / total,
    failures,
    ...(response?.contextTokens === undefined ? {} : { contextTokens: response.contextTokens }),
  };
}

/**
 * Score untrusted scenario and response collections without throwing for invalid records.
 *
 * Missing responses fail every assertion in their scenario. Extra or duplicate records are rejected.
 *
 * @param {unknown} scenariosInput - Array of untrusted scenario records.
 * @param {unknown} responsesInput - Array of untrusted normalized response records.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} An evaluation report or tagged validation error.
 */
export function scoreEvaluation(scenariosInput, responsesInput) {
  if (!Array.isArray(scenariosInput) || scenariosInput.length === 0) {
    return err("InvalidEvaluationInput", "scenarios must be a non-empty array");
  }
  if (!Array.isArray(responsesInput)) return err("InvalidEvaluationInput", "responses must be an array");

  const scenarios = [];
  const scenarioIds = new Set();
  for (let index = 0; index < scenariosInput.length; index += 1) {
    const parsed = parseScenario(scenariosInput[index]);
    if (!parsed.ok) return err(parsed.error.tag, parsed.error.message, { ...parsed.error, recordIndex: index });
    if (scenarioIds.has(parsed.value.id)) {
      return err("DuplicateScenario", `duplicate scenario id: ${parsed.value.id}`, { recordIndex: index });
    }
    scenarioIds.add(parsed.value.id);
    scenarios.push(parsed.value);
  }

  const responses = new Map();
  for (let index = 0; index < responsesInput.length; index += 1) {
    const parsed = parseResponse(responsesInput[index]);
    if (!parsed.ok) return err(parsed.error.tag, parsed.error.message, { ...parsed.error, recordIndex: index });
    if (!scenarioIds.has(parsed.value.scenarioId)) {
      return err("UnknownScenario", `response references unknown scenario: ${parsed.value.scenarioId}`, {
        recordIndex: index,
      });
    }
    if (responses.has(parsed.value.scenarioId)) {
      return err("DuplicateResponse", `duplicate response for scenario: ${parsed.value.scenarioId}`, {
        recordIndex: index,
      });
    }
    responses.set(parsed.value.scenarioId, parsed.value);
  }

  const scenarioReports = scenarios.map((scenario) => scoreScenario(scenario, responses.get(scenario.id) ?? null));
  const passed = scenarioReports.reduce((sum, report) => sum + report.passed, 0);
  const total = scenarioReports.reduce((sum, report) => sum + report.total, 0);
  const tokenReports = scenarioReports.filter((report) => report.contextTokens !== undefined);
  return ok({
    version: 1,
    passed,
    total,
    score: passed / total,
    scenarios: scenarioReports,
    ...(tokenReports.length === 0
      ? {}
      : {
          contextTokens: {
            total: tokenReports.reduce((sum, report) => sum + report.contextTokens, 0),
            supplied: tokenReports.length,
            missing: scenarioReports.length - tokenReports.length,
          },
        }),
  });
}

function parseReport(input, label) {
  if (!isRecord(input) || input.version !== 1 || !Array.isArray(input.scenarios)) {
    return err("InvalidReport", `${label} must be a version 1 evaluation report`);
  }
  if (
    !Number.isInteger(input.passed) ||
    !Number.isInteger(input.total) ||
    input.passed < 0 ||
    input.total < 1 ||
    input.passed > input.total ||
    typeof input.score !== "number" ||
    !Number.isFinite(input.score) ||
    input.score < 0 ||
    input.score > 1
  ) {
    return err("InvalidReport", `${label} has invalid aggregate scoring fields`);
  }

  const scenarios = [];
  const ids = new Set();
  for (let index = 0; index < input.scenarios.length; index += 1) {
    const scenario = input.scenarios[index];
    if (
      !isRecord(scenario) ||
      !nonEmptyString(scenario.scenarioId) ||
      !nonEmptyString(scenario.scenarioFingerprint) ||
      !Number.isInteger(scenario.passed) ||
      !Number.isInteger(scenario.total) ||
      scenario.passed < 0 ||
      scenario.total < 1 ||
      scenario.passed > scenario.total ||
      typeof scenario.score !== "number" ||
      !Number.isFinite(scenario.score) ||
      scenario.score < 0 ||
      scenario.score > 1 ||
      Math.abs(scenario.score - scenario.passed / scenario.total) > 1e-12 ||
      !Array.isArray(scenario.failures)
    ) {
      return err("InvalidReport", `${label}.scenarios[${index}] has invalid scoring fields`);
    }
    if (ids.has(scenario.scenarioId)) {
      return err("InvalidReport", `${label} has duplicate scenario id: ${scenario.scenarioId}`);
    }
    if (scenario.failures.length !== scenario.total - scenario.passed) {
      return err("InvalidReport", `${label}.scenarios[${index}] failure count does not match its score`);
    }
    const assertions = new Set();
    for (let failureIndex = 0; failureIndex < scenario.failures.length; failureIndex += 1) {
      const failure = scenario.failures[failureIndex];
      if (!isRecord(failure) || !nonEmptyString(failure.assertion) || !nonEmptyString(failure.message)) {
        return err("InvalidReport", `${label}.scenarios[${index}].failures[${failureIndex}] is invalid`);
      }
      if (assertions.has(failure.assertion)) {
        return err("InvalidReport", `${label}.scenarios[${index}] has duplicate failed assertion: ${failure.assertion}`);
      }
      assertions.add(failure.assertion);
    }
    if (
      scenario.contextTokens !== undefined &&
      (!Number.isInteger(scenario.contextTokens) || scenario.contextTokens < 0)
    ) {
      return err("InvalidReport", `${label}.scenarios[${index}].contextTokens is invalid`);
    }
    ids.add(scenario.scenarioId);
    scenarios.push(scenario);
  }

  const passed = scenarios.reduce((sum, scenario) => sum + scenario.passed, 0);
  const total = scenarios.reduce((sum, scenario) => sum + scenario.total, 0);
  if (passed !== input.passed || total !== input.total || Math.abs(input.score - passed / total) > 1e-12) {
    return err("InvalidReport", `${label} aggregate score does not match its scenarios`);
  }
  const tokenScenarios = scenarios.filter((scenario) => scenario.contextTokens !== undefined);
  if (input.contextTokens !== undefined) {
    const tokens = input.contextTokens;
    const tokenTotal = tokenScenarios.reduce((sum, scenario) => sum + scenario.contextTokens, 0);
    if (
      !isRecord(tokens) ||
      !Number.isInteger(tokens.total) ||
      !Number.isInteger(tokens.supplied) ||
      !Number.isInteger(tokens.missing) ||
      tokens.total !== tokenTotal ||
      tokens.supplied !== tokenScenarios.length ||
      tokens.missing !== scenarios.length - tokenScenarios.length
    ) {
      return err("InvalidReport", `${label}.contextTokens does not match its scenarios`);
    }
  } else if (tokenScenarios.length > 0) {
    return err("InvalidReport", `${label}.contextTokens is missing`);
  }
  return ok(input);
}

function tokenComparison(baseline, candidate) {
  const baselineValue = baseline ?? null;
  const candidateValue = candidate ?? null;
  return {
    baseline: baselineValue,
    candidate: candidateValue,
    delta:
      baselineValue === null || candidateValue === null ? null : candidateValue - baselineValue,
  };
}

/**
 * Compare untrusted baseline and candidate evaluation reports by failed assertion and token use.
 *
 * @param {unknown} baselineInput - Baseline report produced by scoreEvaluation.
 * @param {unknown} candidateInput - Candidate report produced by scoreEvaluation.
 * @returns {{ ok: true, value: Record<string, unknown> } | { ok: false, error: Record<string, unknown> }} A comparison or tagged validation error.
 */
export function compareEvaluationReports(baselineInput, candidateInput) {
  const baseline = parseReport(baselineInput, "baseline");
  if (!baseline.ok) return baseline;
  const candidate = parseReport(candidateInput, "candidate");
  if (!candidate.ok) return candidate;

  const candidateById = new Map(candidate.value.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
  if (
    baseline.value.scenarios.length !== candidate.value.scenarios.length ||
    baseline.value.scenarios.some((scenario) => !candidateById.has(scenario.scenarioId))
  ) {
    return err("ReportMismatch", "baseline and candidate reports must contain the same scenario ids");
  }

  const regressions = [];
  const improvements = [];
  const unchangedFailures = [];
  const scenarios = baseline.value.scenarios.map((baselineScenario) => {
    const candidateScenario = candidateById.get(baselineScenario.scenarioId);
    if (
      baselineScenario.scenarioFingerprint !== candidateScenario.scenarioFingerprint ||
      baselineScenario.total !== candidateScenario.total
    ) {
      return null;
    }
    const baselineFailures = new Map(baselineScenario.failures.map((failure) => [failure.assertion, failure]));
    const candidateFailures = new Map(candidateScenario.failures.map((failure) => [failure.assertion, failure]));
    const scenarioRegressions = [];
    const scenarioImprovements = [];
    const scenarioUnchanged = [];

    for (const [assertion, failure] of candidateFailures) {
      const item = { scenarioId: baselineScenario.scenarioId, assertion, failure };
      if (baselineFailures.has(assertion)) {
        scenarioUnchanged.push(failure);
        unchangedFailures.push(item);
      } else {
        scenarioRegressions.push(failure);
        regressions.push(item);
      }
    }
    for (const [assertion, failure] of baselineFailures) {
      if (!candidateFailures.has(assertion)) {
        scenarioImprovements.push(failure);
        improvements.push({ scenarioId: baselineScenario.scenarioId, assertion, failure });
      }
    }

    return {
      scenarioId: baselineScenario.scenarioId,
      baselineScore: baselineScenario.score,
      candidateScore: candidateScenario.score,
      scoreDelta: candidateScenario.score - baselineScenario.score,
      regressions: scenarioRegressions,
      improvements: scenarioImprovements,
      unchangedFailures: scenarioUnchanged,
      contextTokens: tokenComparison(baselineScenario.contextTokens, candidateScenario.contextTokens),
    };
  });

  if (scenarios.some((scenario) => scenario === null)) {
    return err("ReportMismatch", "baseline and candidate reports must use identical scenario contracts");
  }

  return ok({
    version: 1,
    baselineScore: baseline.value.score,
    candidateScore: candidate.value.score,
    scoreDelta: candidate.value.score - baseline.value.score,
    regressions,
    improvements,
    unchangedFailures,
    contextTokens: tokenComparison(
      baseline.value.contextTokens?.total,
      candidate.value.contextTokens?.total,
    ),
    scenarios,
  });
}
