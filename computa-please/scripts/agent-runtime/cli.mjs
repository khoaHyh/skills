#!/usr/bin/env node

import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { applyEvent, compactCommandResult, parseEvent, reduceEvents } from "./runtime.mjs";

function fail(message, detail) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: { message, detail } })}\n`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) return null;
    values[key.slice(2)] = value;
  }
  return { command, values };
}

function readJson(filePath) {
  if (filePath === "-") return JSON.parse(readFileSync(0, "utf8"));
  return JSON.parse(readFileSync(resolve(filePath), "utf8"));
}

function readEvents(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function withMetadata(input) {
  const enriched = {
    ...input,
    id: typeof input.id === "string" ? input.id : randomUUID(),
    at: typeof input.at === "string" ? input.at : new Date().toISOString(),
  };
  if (input.type === "HumanRequested" && typeof input.decision === "object" && input.decision !== null) {
    enriched.decision = {
      ...input.decision,
      id: typeof input.decision.id === "string" ? input.decision.id : randomUUID(),
    };
  }
  return enriched;
}

function withLock(eventsPath, operation) {
  mkdirSync(dirname(eventsPath), { recursive: true });
  const lockPath = `${eventsPath}.lock`;
  let descriptor;
  try {
    descriptor = openSync(lockPath, "wx");
  } catch (cause) {
    return { ok: false, error: { tag: "RunLocked", message: `run is locked: ${lockPath}`, cause: String(cause) } };
  }
  try {
    return operation();
  } finally {
    closeSync(descriptor);
    unlinkSync(lockPath);
  }
}

function appendEvent(eventsPath, event) {
  appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", flush: true });
}

function runLaunch(eventsPath, inputPath) {
  return withLock(eventsPath, () => {
    if (readEvents(eventsPath).length > 0) {
      return { ok: false, error: { tag: "RunExists", message: `run already exists: ${eventsPath}` } };
    }
    const event = withMetadata({ ...readJson(inputPath), type: "RunLaunched" });
    const parsed = parseEvent(event);
    if (!parsed.ok) return parsed;
    const applied = applyEvent(null, parsed.value);
    if (!applied.ok) return applied;
    appendEvent(eventsPath, parsed.value);
    return applied;
  });
}

function runApply(eventsPath, inputPath) {
  return withLock(eventsPath, () => {
    const events = readEvents(eventsPath);
    const reduced = reduceEvents(events);
    if (!reduced.ok) return reduced;
    const parsed = parseEvent(withMetadata(readJson(inputPath)));
    if (!parsed.ok) return parsed;
    const applied = applyEvent(reduced.value, parsed.value);
    if (!applied.ok) return applied;
    appendEvent(eventsPath, parsed.value);
    return applied;
  });
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed === null) {
    fail("usage: cli.mjs <launch|apply|state|compact-check> --events <path> [--input <path>]");
    return;
  }
  const eventsPath = parsed.values.events ? resolve(parsed.values.events) : null;
  const inputPath = parsed.values.input;
  let result;

  try {
    switch (parsed.command) {
      case "launch":
        if (eventsPath === null || inputPath === undefined) {
          fail("launch requires --events and --input");
          return;
        }
        result = runLaunch(eventsPath, inputPath);
        break;
      case "apply":
        if (eventsPath === null || inputPath === undefined) {
          fail("apply requires --events and --input");
          return;
        }
        result = runApply(eventsPath, inputPath);
        break;
      case "state":
        if (eventsPath === null) {
          fail("state requires --events");
          return;
        }
        result = reduceEvents(readEvents(eventsPath));
        break;
      case "compact-check":
        if (inputPath === undefined) {
          fail("compact-check requires --input");
          return;
        }
        result = compactCommandResult(readJson(inputPath));
        break;
      default:
        fail(`unknown command: ${String(parsed.command)}`);
        return;
    }
  } catch (cause) {
    fail("command failed", cause instanceof Error ? cause.message : String(cause));
    return;
  }

  if (!result.ok) {
    fail(result.error.message, result.error);
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
