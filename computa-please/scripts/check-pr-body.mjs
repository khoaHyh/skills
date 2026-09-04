#!/usr/bin/env node
/**
 * Structural check for the computa-please PR Description contract.
 * Owns required ## heading and fenced-visual presence. Semantic visual rules
 * stay in references/pr-description.md.
 *
 * Usage:
 *   node check-pr-body.mjs --file body.md
 *   cat body.md | node check-pr-body.mjs
 *   node check-pr-body.mjs --self-test
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Single source of truth for required section headings (exact ## titles). */
export const REQUIRED_SECTIONS = [
  "What changed",
  "Where to look",
  "Why it is safe",
];

/**
 * @param {string} body
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function checkPrBody(body) {
  const errors = [];
  const text = String(body ?? "");
  if (!text.trim()) {
    return { ok: false, errors: ["PR body is empty"] };
  }

  /** @type {Map<string, { start: number, end: number }>} */
  const sections = new Map();
  const headingRe = /^##\s+(.+?)\s*$/gm;
  /** @type {{ title: string, index: number }[]} */
  const found = [];
  let m;
  while ((m = headingRe.exec(text)) !== null) {
    found.push({ title: m[1].trim(), index: m.index });
  }

  for (let i = 0; i < found.length; i++) {
    const title = found[i].title;
    const start = found[i].index;
    const end = i + 1 < found.length ? found[i + 1].index : text.length;
    if (!sections.has(title)) sections.set(title, { start, end });
  }

  for (const name of REQUIRED_SECTIONS) {
    if (!sections.has(name)) {
      errors.push(`missing ## ${name}`);
    }
  }

  const where = sections.get("Where to look");
  if (where) {
    const content = text
      .slice(where.start, where.end)
      .replace(/^##\s+Where to look\s*$/m, "")
      .trim();
    const fencedBlockRe =
      /^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n[ \t]*\1[ \t]*$/gm;
    const hasVisual = Array.from(content.matchAll(fencedBlockRe)).some(
      (match) => match[2].trim().length > 0,
    );
    if (!hasVisual) {
      errors.push("## Where to look needs a nonempty fenced visual");
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

function printHelp() {
  console.log(`Usage:
  node check-pr-body.mjs --file <body.md>
  <body> | node check-pr-body.mjs
  node check-pr-body.mjs --self-test

Required ## sections: ${REQUIRED_SECTIONS.join(", ")}
## Where to look must contain a nonempty fenced visual.
`);
}

function selfTest() {
  const good = [
    "## What changed",
    "Retries no longer duplicate a charge.",
    "## Where to look",
    "```diff",
    " charge",
    "+  rejectDuplicate",
    "```",
    "## Why it is safe",
    "The existing idempotency key remains authoritative.",
    "## Repository checklist",
    "- [x] Required item",
    "",
  ].join("\n");
  const badEmptyVisual = good.replace(
    "```diff\n charge\n+  rejectDuplicate\n```",
    "The charge path changed.",
  );
  const badEmptyFence = good.replace(
    "```diff\n charge\n+  rejectDuplicate\n```",
    "```text\n\n```",
  );
  const badMissing = `## What changed
Only one section.
`;
  const oldSchema = `## Summary
Old shape.
## Call Stacks
No call stacks added or edited.
`;
  const cases = [
    [good, true],
    [badEmptyVisual, false],
    [badEmptyFence, false],
    [badMissing, false],
    [oldSchema, false],
    ["", false],
  ];
  for (const [body, wantOk] of cases) {
    const r = checkPrBody(body);
    if (r.ok !== wantOk) {
      console.error("self-test fail", { wantOk, r });
      process.exit(1);
    }
  }
  console.log("check-pr-body self-test ok");
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  if (argv.includes("--self-test")) {
    selfTest();
    return;
  }

  let body;
  const fileIdx = argv.indexOf("--file");
  if (fileIdx !== -1) {
    const path = argv[fileIdx + 1];
    if (!path) throw new Error("--file needs a path");
    body = readFileSync(resolve(path), "utf8");
  } else if (!process.stdin.isTTY) {
    body = readFileSync(0, "utf8");
  } else {
    printHelp();
    process.exit(2);
  }

  const result = checkPrBody(body);
  if (!result.ok) {
    for (const e of result.errors) console.error(`check-pr-body: ${e}`);
    process.exit(1);
  }
  console.log("check-pr-body: ok");
}

main(process.argv.slice(2));
