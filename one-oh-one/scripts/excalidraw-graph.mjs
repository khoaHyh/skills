#!/usr/bin/env node
// Summarise an Excalidraw drawing as labelled nodes and edges, so a learner's
// diagram can be graded by the propositions it states rather than by its pixels.
//
// Usage: node excalidraw-graph.mjs <drawing>
//   <drawing> is a .excalidraw file, copied scene JSON, or a PNG/SVG exported
//   with "Embed scene" turned on.

import { readFileSync } from "node:fs"
import { inflateSync } from "node:zlib"

const MIME = "application/vnd.excalidraw+json"
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const NODE_TYPES = new Set(["rectangle", "diamond", "ellipse", "stickynote", "text", "image", "frame", "magicframe", "iframe", "embeddable"])
const FRAME_TYPES = new Set(["frame", "magicframe"])
// How close (px) an unbound arrow end must be to a shape to count as attached.
const SNAP = 24

// Mirrors decode() in excalidraw/packages/excalidraw/data/encode.ts.
function decodePayload(data) {
  if (!("encoded" in data)) return JSON.stringify(data)
  const bytes = Buffer.from(data.encoded, "latin1")
  return (data.compressed ? inflateSync(bytes) : bytes).toString("utf8")
}

function sceneFromPng(buf) {
  for (let offset = 8; offset + 8 <= buf.length; ) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString("latin1", offset + 4, offset + 8)
    if (type === "tEXt") {
      const data = buf.subarray(offset + 8, offset + 8 + length)
      const nul = data.indexOf(0)
      if (data.toString("latin1", 0, nul) === MIME) return decodePayload(JSON.parse(data.toString("latin1", nul + 1)))
    }
    offset += 12 + length
  }
  throw new Error("this PNG carries no scene; export again with \"Embed scene\" on, or save a .excalidraw file")
}

function sceneFromSvg(svg) {
  const payload = svg.match(/<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/s)
  if (!payload) throw new Error("this SVG carries no scene; export again with \"Embed scene\" on")
  const version = svg.match(/<!-- payload-version:(\d+) -->/)?.[1] ?? "1"
  const json = Buffer.from(payload[1], "base64").toString(version === "1" ? "utf8" : "latin1")
  return decodePayload(JSON.parse(json))
}

function loadScene(path) {
  const buf = readFileSync(path)
  if (buf.subarray(0, 8).equals(PNG_SIGNATURE)) return JSON.parse(sceneFromPng(buf))
  const text = buf.toString("utf8")
  if (text.includes(`payload-type:${MIME}`)) return JSON.parse(sceneFromSvg(text))
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${path} is not an Excalidraw scene; expected .excalidraw JSON or a PNG/SVG with an embedded scene`)
  }
}

const clean = (text) => text.replace(/\s+/g, " ").trim()

function graph(scene) {
  const elements = (scene.elements ?? []).filter((e) => !e.isDeleted)
  const byId = new Map(elements.map((e) => [e.id, e]))

  const labels = new Map()
  for (const e of elements) {
    if (e.type !== "text" || !e.containerId || !byId.has(e.containerId)) continue
    labels.set(e.containerId, [labels.get(e.containerId), clean(e.text ?? "")].filter(Boolean).join(" "))
  }

  const nodes = elements.filter((e) => NODE_TYPES.has(e.type) && !(e.type === "text" && e.containerId && byId.has(e.containerId)))
  const names = new Map()
  const seen = new Map()
  for (const e of nodes) {
    let name = e.type === "text" ? clean(e.text ?? "") : (labels.get(e.id) ?? (FRAME_TYPES.has(e.type) ? e.name : null))
    if (!name) name = `${e.type}#${e.id.slice(0, 4)}`
    const count = (seen.get(name) ?? 0) + 1
    seen.set(name, count)
    names.set(e.id, count > 1 ? `${name} (${count})` : name)
  }

  const contains = (e, [x, y]) => x >= e.x - SNAP && x <= e.x + e.width + SNAP && y >= e.y - SNAP && y <= e.y + e.height + SNAP
  const snapTargets = nodes.filter((e) => !FRAME_TYPES.has(e.type))
  // Prefer shapes over free text, since learners annotate beside boxes; then the smallest shape.
  const rank = (e) => [e.type === "text" ? 1 : 0, e.width * e.height]
  function attach(binding, point) {
    if (binding?.elementId && names.has(binding.elementId)) return { id: binding.elementId, how: "bound" }
    const hits = snapTargets.filter((e) => contains(e, point)).sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)]
      return ra[0] - rb[0] || ra[1] - rb[1]
    })
    if (!hits.length) return null
    return { id: hits[0].id, how: "snapped", near: hits.slice(1).map((e) => e.id) }
  }

  const edges = []
  for (const e of elements) {
    if ((e.type !== "arrow" && e.type !== "line") || !(e.points?.length >= 2)) continue
    const first = e.points[0]
    const last = e.points[e.points.length - 1]
    let from = attach(e.startBinding, [e.x + first[0], e.y + first[1]])
    let to = attach(e.endBinding, [e.x + last[0], e.y + last[1]])
    // An unattached line is usually decoration: a divider or an underline.
    if (e.type === "line" && !(from && to)) continue
    let dir = e.startArrowhead && e.endArrowhead ? "↔" : e.startArrowhead || e.endArrowhead ? "→" : "—"
    if (e.startArrowhead && !e.endArrowhead) [from, to] = [to, from]
    edges.push({ from, to, dir, label: labels.get(e.id), dashed: e.strokeStyle !== "solid" })
  }

  const frames = nodes.filter((e) => FRAME_TYPES.has(e.type)).map((frame) => ({
    name: names.get(frame.id),
    members: nodes.filter((e) => e.frameId === frame.id).map((e) => names.get(e.id)),
  }))
  const connected = new Set(edges.flatMap((edge) => [edge.from?.id, edge.to?.id]))
  return {
    nodes: nodes.filter((e) => !FRAME_TYPES.has(e.type)).map((e) => ({ id: e.id, name: names.get(e.id), type: e.type, connected: connected.has(e.id) })),
    edges: edges.map((edge) => {
      const side = (end) => end && { name: names.get(end.id), how: end.how, near: (end.near ?? []).map((id) => names.get(id)) }
      return { ...edge, from: side(edge.from), to: side(edge.to) }
    }),
    frames,
    freedraw: elements.filter((e) => e.type === "freedraw").length,
  }
}

function render(path, g) {
  const out = [`Drawing: ${path} (${g.nodes.length} nodes, ${g.edges.length} edges)`, "", "Nodes"]
  for (const n of g.nodes) out.push(`  - ${n.name} (${n.type})`)
  out.push("", "Edges")
  if (!g.edges.length) out.push("  (none)")
  for (const edge of g.edges) {
    const end = (side) => side?.name ?? "?"
    const snapped = (side, which) => side?.how === "snapped" && `${which} snapped${side.near.length ? `, also near ${side.near.join(" | ")}` : ""}`
    const notes = [
      edge.dashed && "dashed",
      snapped(edge.from, "start"),
      snapped(edge.to, "end"),
      !edge.from && "start unattached",
      !edge.to && "end unattached",
    ].filter(Boolean)
    out.push(`  - ${end(edge.from)} ${edge.dir} ${end(edge.to)} : ${edge.label ? `"${edge.label}"` : "(unlabelled)"}${notes.length ? `  [${notes.join(", ")}]` : ""}`)
  }
  const loose = g.nodes.filter((n) => !n.connected)
  if (loose.length) out.push("", `Not connected: ${loose.map((n) => n.name).join(", ")}`)
  for (const frame of g.frames) out.push("", `Frame "${frame.name}": ${frame.members.join(", ") || "(empty)"}`)
  if (g.freedraw) out.push("", `Freehand strokes: ${g.freedraw} (not interpreted; read an image export for them)`)
  return out.join("\n")
}

const path = process.argv[2]
if (!path) {
  console.error("usage: node excalidraw-graph.mjs <drawing.excalidraw | .png | .svg>")
  process.exit(2)
}
try {
  console.log(render(path, graph(loadScene(path))))
} catch (error) {
  console.error(`excalidraw-graph: ${error.message}`)
  process.exit(1)
}
