#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyFinding, classifyTurn } from "./lib/classify.mjs";
import { collectRemediations } from "./lib/github.mjs";
import { openReadOnly } from "./lib/opencode.mjs";
import { rollup, writeArtifacts } from "./lib/report.mjs";

/**
 * @typedef {{ dbPath: string, outDir: string, limitSessions?: number, github?: boolean, now?: number, argv?: string[] }} MineOptions
 * @typedef {{ sessions: number, turns: number, events: number, rollups: import("./lib/report.mjs").MissClassRollup[], outFiles: string[] }} MineReport
 */

const USAGE = `Usage: node mine.mjs --db <path> --out <dir> [--limit-sessions N] [--github]

Read-only OpenCode history miner. Writes sessions-index.jsonl,
corrections.jsonl, remediations.jsonl, failure-mode-log.md, and a
dated section on handoff.md.

  --db               OpenCode sqlite path (opened file:<path>?mode=ro)
  --out              Output directory
  --limit-sessions   Cap correlatable sessions after regex refine
  --github           Fold greptile/bugbot remediations via gh CLI
  --help             Show this help
`;

/**
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  /** @type {{ help?: boolean, dbPath?: string, outDir?: string, limitSessions?: number, github: boolean }} */
  const opts = { github: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") return { help: true, github: false };
    if (arg === "--github") {
      opts.github = true;
      continue;
    }
    const next = argv[i + 1];
    if (arg === "--db") {
      if (!next) throw new Error("--db requires a path");
      opts.dbPath = next;
      i++;
      continue;
    }
    if (arg === "--out") {
      if (!next) throw new Error("--out requires a directory");
      opts.outDir = next;
      i++;
      continue;
    }
    if (arg === "--limit-sessions") {
      if (!next) throw new Error("--limit-sessions requires a number");
      const n = Number(next);
      if (!Number.isFinite(n) || n < 1) throw new Error("--limit-sessions must be a positive number");
      opts.limitSessions = n;
      i++;
      continue;
    }
    throw new Error(`unknown flag: ${arg}`);
  }
  return opts;
}

/**
 * @param {MineOptions} opts
 * @returns {Promise<MineReport>}
 */
export async function mine(opts) {
  const db = openReadOnly(opts.dbPath);
  try {
    const sessions = db.correlatableSessions(opts.limitSessions);
    const turns = db.userTurns(sessions.map((s) => s.id));
    const byId = new Map(sessions.map((s) => [s.id, s]));
    const corrections = [];
    for (const turn of turns) {
      const session = byId.get(turn.sessionId);
      if (!session) continue;
      const event = classifyTurn(turn, session);
      if (event) corrections.push(event);
    }

    const remediations = [];
    if (opts.github) {
      const findings = await collectRemediations(sessions);
      for (const finding of findings) remediations.push(classifyFinding(finding));
    }

    const events = [...corrections, ...remediations];
    const rollups = rollup(events);
    const argv =
      opts.argv ??
      [
        "node",
        "mine.mjs",
        "--db",
        opts.dbPath,
        "--out",
        opts.outDir,
        ...(opts.limitSessions ? ["--limit-sessions", String(opts.limitSessions)] : []),
        ...(opts.github ? ["--github"] : []),
      ];
    const outFiles = writeArtifacts(opts.outDir, {
      sessionsIndex: sessions,
      corrections,
      remediations,
      rollups,
      runMeta: {
        at: opts.now ?? Date.now(),
        argv,
        counts: {
          sessions: sessions.length,
          turns: turns.length,
          corrections: corrections.length,
          remediations: remediations.length,
          events: events.length,
          classes: rollups.length,
        },
      },
    });
    return {
      sessions: sessions.length,
      turns: turns.length,
      events: events.length,
      rollups,
      outFiles,
    };
  } finally {
    db.close();
  }
}

/**
 * @param {string[]} argv
 */
export async function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }
  if (parsed.help) {
    console.log(USAGE);
    return;
  }
  if (!parsed.dbPath || !parsed.outDir) {
    console.error("missing --db or --out");
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }
  const report = await mine({
    dbPath: parsed.dbPath,
    outDir: parsed.outDir,
    limitSessions: parsed.limitSessions,
    github: parsed.github,
    argv: ["node", "mine.mjs", ...argv],
  });
  const classBits = report.rollups.map((r) => `${r.class}:${r.count}`).join(" ");
  console.log(
    `${report.events} events across ${report.rollups.length} classes (${report.sessions} sessions, ${report.turns} turns)${classBits ? ` ${classBits}` : ""}`,
  );
}

const invoked =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
