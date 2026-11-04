#!/usr/bin/env node
// Render a worksheet spec into a self-contained HTML page the learner fills in.
// The page autosaves in the browser and exports answers as markdown.
//
// Usage: node worksheet.mjs <spec.json> <out.html>
//
// Spec: { "title", "course" (the course slug), "id" (a slug), "intro"?, "items": [item, ...] }
// Item: { "id", "kind": "text" | "choice" | "scale" | "diagram", "prompt",
//         "code"?        monospace block shown under the prompt (a scenario, log, or snippet)
//         "choices"?     choice only
//         "why"?         choice only; false hides the reasoning box
//         "min"?, "max"?, "low"?, "high"?   scale only; defaults 1–7
//         "confidence"?  false hides the 1–5 confidence row (scale hides it by default)
//         "placeholder"? text only }

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const KINDS = new Set(["text", "choice", "scale", "diagram"])

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

function validate(spec) {
  const problems = []
  if (typeof spec.title !== "string" || !spec.title) problems.push(`"title" must be a non-empty string`)
  // Both name the downloaded file (<course>-<id>.md) and the autosave key.
  for (const key of ["course", "id"]) if (!SLUG.test(spec[key] ?? "")) problems.push(`"${key}" must be a slug like "outbox" or "placement-1"`)
  if (!Array.isArray(spec.items) || !spec.items.length) problems.push(`"items" must be a non-empty array`)
  const ids = new Set()
  for (const [i, item] of (spec.items ?? []).entries()) {
    const where = `items[${i}]`
    if (!item.id || ids.has(item.id)) problems.push(`${where}.id must be present and unique`)
    ids.add(item.id)
    if (!KINDS.has(item.kind)) problems.push(`${where}.kind must be one of ${[...KINDS].join(", ")}`)
    if (typeof item.prompt !== "string" || !item.prompt) problems.push(`${where}.prompt must be a non-empty string`)
    if (item.kind === "choice" && !(Array.isArray(item.choices) && item.choices.length >= 2)) problems.push(`${where}.choices needs at least two options`)
    if (item.kind === "scale") {
      const [min, max] = [item.min ?? 1, item.max ?? 7]
      if (!Number.isInteger(min) || !Number.isInteger(max) || min >= max) problems.push(`${where} needs integer min < max`)
    }
  }
  return problems
}

const [specPath, outPath] = process.argv.slice(2)
if (!specPath || !outPath) {
  console.error("usage: node worksheet.mjs <spec.json> <out.html>")
  process.exit(2)
}
const spec = JSON.parse(readFileSync(specPath, "utf8"))
const problems = validate(spec)
if (problems.length) {
  console.error(`worksheet: invalid spec ${specPath}\n  - ${problems.join("\n  - ")}`)
  process.exit(1)
}
const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "worksheet.html"), "utf8")
// Escaping "<" keeps prompt text from closing the script tag that carries the spec.
const data = JSON.stringify(spec).replace(/</g, "\\u003c")
writeFileSync(outPath, template.replace("__WORKSHEET_SPEC__", () => data))
console.log(outPath)
