#!/usr/bin/env node
/**
 * Structural check for the computa-please PR Description contract.
 * Owns required ## heading presence. Call Stacks content rules stay in
 * references/pr-description.md.
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
  "Summary",
  "Why",
  "Design",
  "Call Stacks",
  "Validation",
  "Follow-up/Risk",
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

  const call = sections.get("Call Stacks");
  if (call) {
    const content = text
      .slice(call.start, call.end)
      .replace(/^##\s+Call Stacks\s*/m, "")
      .trim();
    if (!content) {
      errors.push(
        "## Call Stacks has no body (use trees or `No call stacks added or edited.`)",
      );
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
`);
}

function selfTest() {
  const good = `## Summary
x
## Why
y
## Design
z
## Call Stacks
No call stacks added or edited.
## Validation
ran check
## Follow-up/Risk
none
`;
  const badEmptyCall = good.replace("No call stacks added or edited.", "");
  const badMissing = `## Summary
only
`;
  const cases = [
    [good, true],
    [badEmptyCall, false],
    [badMissing, false],
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
