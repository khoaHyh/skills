#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { compareEvaluationReports, scoreEvaluation } from "./evaluation.mjs";

function fail(tag, message, fields = {}) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: { tag, message, ...fields } })}\n`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (rest.length % 2 !== 0) return null;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag.startsWith("--") || value === undefined || values[flag.slice(2)] !== undefined) return null;
    values[flag.slice(2)] = value;
  }
  return { command, values };
}

function readJson(filePath, label) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(resolve(filePath), "utf8")) };
  } catch (cause) {
    return {
      ok: false,
      error: {
        tag: "InputError",
        message: `could not read ${label}`,
        detail: cause instanceof Error ? cause.message : String(cause),
      },
    };
  }
}

function readJsonLines(filePath, label) {
  let text;
  try {
    text = readFileSync(resolve(filePath), "utf8");
  } catch (cause) {
    return {
      ok: false,
      error: {
        tag: "InputError",
        message: `could not read ${label}`,
        detail: cause instanceof Error ? cause.message : String(cause),
      },
    };
  }
  const records = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() === "") continue;
    try {
      records.push(JSON.parse(lines[index]));
    } catch (cause) {
      return {
        ok: false,
        error: {
          tag: "InvalidJsonLine",
          message: `${label} contains invalid JSON`,
          line: index + 1,
          detail: cause instanceof Error ? cause.message : String(cause),
        },
      };
    }
  }
  return { ok: true, value: records };
}

function emit(value, outputPath) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  if (outputPath === undefined) {
    process.stdout.write(json);
    return { ok: true };
  }
  try {
    writeFileSync(resolve(outputPath), json, "utf8");
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: {
        tag: "OutputError",
        message: "could not write output",
        detail: cause instanceof Error ? cause.message : String(cause),
      },
    };
  }
}

function exactKeys(values, required, optional = []) {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => values[key] !== undefined) && Object.keys(values).every((key) => allowed.has(key));
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed === null) {
    fail("InvalidArguments", "usage: eval-cli.mjs <score|compare> [options]");
    return;
  }

  let result;
  if (parsed.command === "score" && exactKeys(parsed.values, ["scenarios", "responses"], ["out"])) {
    const scenarios = readJsonLines(parsed.values.scenarios, "scenarios");
    if (!scenarios.ok) {
      fail(scenarios.error.tag, scenarios.error.message, scenarios.error);
      return;
    }
    const responses = readJsonLines(parsed.values.responses, "responses");
    if (!responses.ok) {
      fail(responses.error.tag, responses.error.message, responses.error);
      return;
    }
    result = scoreEvaluation(scenarios.value, responses.value);
  } else if (parsed.command === "compare" && exactKeys(parsed.values, ["baseline", "candidate"], ["out"])) {
    const baseline = readJson(parsed.values.baseline, "baseline report");
    if (!baseline.ok) {
      fail(baseline.error.tag, baseline.error.message, baseline.error);
      return;
    }
    const candidate = readJson(parsed.values.candidate, "candidate report");
    if (!candidate.ok) {
      fail(candidate.error.tag, candidate.error.message, candidate.error);
      return;
    }
    result = compareEvaluationReports(baseline.value, candidate.value);
  } else {
    fail(
      "InvalidArguments",
      "score requires --scenarios and --responses; compare requires --baseline and --candidate; both accept --out",
    );
    return;
  }

  if (!result.ok) {
    fail(result.error.tag, result.error.message, result.error);
    return;
  }
  const emitted = emit(result.value, parsed.values.out);
  if (!emitted.ok) fail(emitted.error.tag, emitted.error.message, emitted.error);
}

main();
