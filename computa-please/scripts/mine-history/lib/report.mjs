import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { candidateFixFor } from "./classify.mjs";

/** @typedef {import("./classify.mjs").MissEvent} MissEvent */
/** @typedef {import("./classify.mjs").MissClass} MissClass */
/** @typedef {import("./classify.mjs").Source} Source */
/** @typedef {import("./classify.mjs").CandidateFix} CandidateFix */
/** @typedef {{ class: MissClass, count: number, bySource: Record<Source, number>, exemplars: MissEvent[], candidateFix: CandidateFix }} MissClassRollup */
/** @typedef {{ id: string, title: string, directory: string, issueId?: string, prHints: unknown[], at: number }} SessionRef */
/** @typedef {{ at: number, argv: string[], counts: Record<string, number> }} RunMeta */
/** @typedef {{ sessionsIndex: SessionRef[], corrections: MissEvent[], remediations: MissEvent[], rollups: MissClassRollup[], runMeta: RunMeta }} Artifacts */

/**
 * @returns {Record<Source, number>}
 */
function emptySources() {
  return { user_correction: 0, bot_confirmed_fix: 0, bot_dismissed: 0 };
}

/**
 * @param {MissEvent[]} events
 * @returns {MissClassRollup[]}
 */
export function rollup(events) {
  /** @type {Map<MissClass, { bySource: Record<Source, number>, exemplars: MissEvent[] }>} */
  const buckets = new Map();
  for (const event of events) {
    let bucket = buckets.get(event.class);
    if (!bucket) {
      bucket = { bySource: emptySources(), exemplars: [] };
      buckets.set(event.class, bucket);
    }
    bucket.bySource[event.source] += 1;
    if (bucket.exemplars.length < 3) bucket.exemplars.push(event);
  }
  return [...buckets.entries()]
    .map(([cls, bucket]) => {
      const count =
        bucket.bySource.user_correction +
        bucket.bySource.bot_confirmed_fix +
        bucket.bySource.bot_dismissed;
      return {
        class: cls,
        count,
        bySource: bucket.bySource,
        exemplars: bucket.exemplars,
        candidateFix: candidateFixFor(cls, bucket.bySource),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * @param {string} filePath
 * @param {string} contents
 */
function writeAtomic(filePath, contents) {
  const tmp = `${filePath}.tmp.${process.pid}`;
  writeFileSync(tmp, contents);
  renameSync(tmp, filePath);
}

/**
 * @param {unknown[]} rows
 */
function toJsonl(rows) {
  if (rows.length === 0) return "";
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

/**
 * @param {MissClassRollup[]} rollups
 * @param {number} at
 */
function renderFailureLog(rollups, at) {
  const lines = [
    "# Failure-mode log",
    "",
    `Generated: ${new Date(at).toISOString()}`,
    "",
    "| class | count | user_correction | bot_confirmed_fix | bot_dismissed | candidateFix |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const r of rollups) {
    lines.push(
      `| ${r.class} | ${r.count} | ${r.bySource.user_correction} | ${r.bySource.bot_confirmed_fix} | ${r.bySource.bot_dismissed} | ${r.candidateFix} |`,
    );
  }
  if (rollups.length === 0) {
    lines.push("| _(none)_ | 0 | 0 | 0 | 0 | ignore |");
  }

  const reflect = rollups.filter((r) => r.candidateFix !== "ignore").slice(0, 3);
  lines.push("", "## Top 3 Reflect candidates", "");
  if (reflect.length === 0) {
    lines.push("No process-shaped misses with a non-ignore candidateFix.", "");
  } else {
    reflect.forEach((r, i) => {
      lines.push(`### ${i + 1}. ${r.class} (${r.candidateFix}) — ${r.count}`, "");
      for (const ex of r.exemplars) {
        const loc = [ex.issueId, ex.sessionId, ex.prNumber != null ? `PR#${ex.prNumber}` : ""]
          .filter(Boolean)
          .join(" · ");
        lines.push(`- ${ex.quote}${loc ? ` _(${loc})_` : ""}`);
      }
      lines.push("");
    });
  }
  return `${lines.join("\n")}\n`;
}

/**
 * @param {RunMeta} meta
 */
function renderHandoffSection(meta) {
  const when = new Date(meta.at).toISOString();
  const counts = Object.entries(meta.counts)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return [
    `## ${when}`,
    "",
    "```",
    meta.argv.join(" "),
    "```",
    "",
    counts,
    "",
    "Residual risk: regex heuristics false-positive; GitHub confirmation is a weak later-commit check and is skipped when uncertain.",
    "",
  ].join("\n");
}

/**
 * @param {string} outDir
 * @param {Artifacts} artifacts
 * @returns {string[]}
 */
export function writeArtifacts(outDir, artifacts) {
  mkdirSync(outDir, { recursive: true });
  const sessionsPath = join(outDir, "sessions-index.jsonl");
  const correctionsPath = join(outDir, "corrections.jsonl");
  const remediationsPath = join(outDir, "remediations.jsonl");
  const logPath = join(outDir, "failure-mode-log.md");
  const handoffPath = join(outDir, "handoff.md");

  writeAtomic(sessionsPath, toJsonl(artifacts.sessionsIndex));
  writeAtomic(correctionsPath, toJsonl(artifacts.corrections));
  writeAtomic(remediationsPath, toJsonl(artifacts.remediations));
  writeAtomic(logPath, renderFailureLog(artifacts.rollups, artifacts.runMeta.at));

  let prev = "";
  try {
    prev = readFileSync(handoffPath, "utf8");
  } catch {
    prev = "";
  }
  if (prev && !prev.endsWith("\n")) prev += "\n";
  writeAtomic(handoffPath, `${prev}${renderHandoffSection(artifacts.runMeta)}`);

  return [sessionsPath, correctionsPath, remediationsPath, logPath, handoffPath];
}
