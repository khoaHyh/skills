// Builds a HyperFrames review cut from real takes, paired by action/result.
// Usage: node build-cut.mjs <edl.json> <project-dir>
// Writes index.html and chapters.md, copies takes, and extracts labelled freezes.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";

const [edlPath, dir] = process.argv.slice(2);
if (!edlPath || !dir) throw new Error("usage: node build-cut.mjs <edl.json> <project-dir>");
const edl = JSON.parse(readFileSync(edlPath, "utf8"));
if (!edl.takes?.after || !edl.beats?.length) throw new Error("EDL requires takes.after and beats; replace sequential sections with paired before/after ranges (see review-cut.md)");
const base = dirname(resolve(edlPath));
const W = 1920;
const H = 1080;
const BAR = 168; // each pane's label, source clock, and edit chips
const STRIP = 160; // shared caption strip, never over footage
const takes = ["before", "after"].filter((id) => edl.takes[id]).map((id) => ({ id, ...edl.takes[id] }));
const VIEW = { w: W / takes.length, h: H - BAR - STRIP };
const fullFrame = [0, 0, ...edl.source];
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const readTime = (s) => Math.max(1.5, 0.5 + 0.3 * words(s));
// Poster and end cards can also be read while the player is stopped.
const TITLE = Math.min(4.5, readTime(`${edl.title} Watch for: ${edl.watch}`));
const END = Math.min(6, Math.max(3.5, readTime(edl.results.map((r) => r[0]).join(" "))));
mkdirSync(`${dir}/assets/takes`, { recursive: true });
mkdirSync(`${dir}/assets/stills`, { recursive: true });
const clips = Object.fromEntries(takes.map((take) => [take.id, []]));
for (const take of takes) {
  take.src = resolve(base, take.src);
  take.asset = `assets/takes/${take.id}-${basename(take.src)}`;
  copyFileSync(take.src, `${dir}/${take.asset}`);
}

// A beat starts both actions together and aligns their measured result frames.
// Post-result footage retains its declared rate; the first finisher freezes.
let t = TITLE;
const prevTo = {};
const beats = edl.beats.map((b, bi) => {
  const sides = {};
  for (const take of takes) {
    const range = b[take.id];
    const resultAt = range?.resultAt ?? range?.to;
    const rate = range?.rate ?? 1;
    if (!range || ![range.from, resultAt, range.to, rate].every(Number.isFinite) || range.from < 0 || resultAt <= range.from || range.to < resultAt || rate <= 0) {
      throw new Error(`beat ${bi + 1} ${take.id}: require 0 <= from < resultAt <= to and rate > 0`);
    }
    const focus = range.focus ?? take.focus ?? fullFrame;
    sides[take.id] = { ...range, resultAt, rate, focus, cropped: focus.some((v, i) => v !== fullFrame[i]), markAt: range.markAt ?? resultAt, tone: range.tone ?? "look", cut: prevTo[take.id] !== undefined && range.from - prevTo[take.id] > 0.1 ? range.from - prevTo[take.id] : 0 };
    prevTo[take.id] = range.to;
  }
  const hold = b.hold ?? 0;
  if (!Number.isFinite(hold) || hold < 0) throw new Error(`beat ${bi + 1}: hold must be nonnegative`);
  const actionD = Math.max(...Object.values(sides).map((s) => (s.resultAt - s.from) / s.rate));
  const tailD = Math.max(...Object.values(sides).map((s) => (s.to - s.resultAt) / s.rate));
  const d = actionD + tailD + hold;
  for (const [ti, take] of takes.entries()) {
    const side = sides[take.id];
    side.stretches = [{ from: side.from, to: side.resultAt, start: t, d: actionD, rate: (side.resultAt - side.from) / actionD }];
    const tail = (side.to - side.resultAt) / side.rate;
    if (tail > 0) side.stretches.push({ from: side.resultAt, to: side.to, start: t + actionD, d: tail, rate: side.rate });
    side.motionD = actionD + tail;
    side.hold = d - side.motionD;
    for (const [pi, part] of side.stretches.entries()) {
      clips[take.id].push(`<video id="v-${take.id}-${bi}-${pi}" class="clip" src="${take.asset}" data-start="${part.start.toFixed(3)}" data-duration="${part.d.toFixed(3)}" data-media-start="${part.from.toFixed(3)}" data-playback-rate="${part.rate}" data-track-index="${ti * 2 + 1}" muted playsinline></video>`);
    }
    if (side.hold > 0.001) {
      // Extract the exact source endpoint shown by this pane's frozen clock.
      const still = `assets/stills/${take.id}-${bi}.png`;
      execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(side.to), "-i", take.src, "-frames:v", "1", `${dir}/${still}`]);
      clips[take.id].push(`<img id="h-${take.id}-${bi}" class="clip still" src="${still}" data-start="${(t + side.motionD).toFixed(3)}" data-duration="${side.hold.toFixed(3)}" data-track-index="${ti * 2 + 2}" />`);
    }
  }
  const beat = { bi, start: t, d, actionD, caption: b.caption, sides };
  t += d;
  return beat;
});
const endAt = t;
const total = endAt + END;

const rows = beats.map((b) => {
  const sides = Object.values(b.sides);
  const warn = b.d + 0.01 < readTime(b.caption) ? `short: needs ${readTime(b.caption).toFixed(1)} s` : sides.every((s) => !s.mark && s.stretches.every((p) => p.rate === 1)) && b.d > readTime(b.caption) + 4 ? "long at 1× with no mark" : "";
  return { beat: b.bi + 1, at: b.start.toFixed(1), shown: b.d.toFixed(1), ...Object.fromEntries(takes.map((take) => [take.id, b.sides[take.id].stretches.map((p) => `${Number(p.rate.toFixed(2))}×`).join(" → ")])), words: words(b.caption), warn };
});
console.table(rows);
console.log(`total ${total.toFixed(1)} s`);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const chapters = beats.map((b) => [
  `- **${mmss(b.start)} ${b.caption}**`,
  ...takes.map((take) => {
    const s = b.sides[take.id];
    return `  - ${take.label}: source ${s.from.toFixed(2)}–${s.to.toFixed(2)} s; result ${s.resultAt.toFixed(2)} s; ${s.stretches.map((p) => `${Number(p.rate.toFixed(2))}×`).join(" → ")}${s.cropped ? "; static crop" : ""}${s.cut ? `; ${s.cut.toFixed(1)} s cut` : ""}${s.hold > 0.001 ? `; ${s.hold.toFixed(1)} s freeze` : ""}`;
  }),
].join("\n")).join("\n");
writeFileSync(`${dir}/chapters.md`, `${chapters}\n`);
console.log(`\n${chapters}`);
const data = { W, H, BAR, STRIP, VIEW, TITLE, total, endAt, source: edl.source, beats, takes };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #111; }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: Inter, sans-serif; color: #f5f5f4; }
.pane { position: absolute; top: 0; width: ${VIEW.w}px; height: ${H - STRIP}px; overflow: hidden; }
.bar { position: absolute; left: 0; top: 0; width: 100%; height: ${BAR}px; display: flex; flex-direction: column; gap: 8px; padding: 12px 18px; background: #111; z-index: 5; }
.label { font: 800 28px/1.2 "JetBrains Mono", monospace; overflow-wrap: anywhere; }
.status { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font: 700 28px/1 "JetBrains Mono", monospace; padding: 6px 8px; border-radius: 7px; border: 2px solid #f5f5f4; color: #f5f5f4; display: none; }
.clock { font: 600 28px/1 "JetBrains Mono", monospace; color: #a8a29e; flex: none; }
.view { position: absolute; left: 0; top: ${BAR}px; width: 100%; height: ${VIEW.h}px; overflow: hidden; background: #e7e5e4; }
.cam { position: absolute; left: 0; top: 0; width: ${edl.source[0]}px; height: ${edl.source[1]}px; transform-origin: 0 0; }
.cam video, .cam .still { position: absolute; left: 0; top: 0; width: ${edl.source[0]}px; height: ${edl.source[1]}px; }
.mark { position: absolute; border: 6px solid #ff6a00; border-radius: 12px; box-shadow: 0 0 0 4px rgba(255,255,255,.85); display: none; }
#strip { position: absolute; left: 0; top: ${H - STRIP}px; width: ${W}px; height: ${STRIP}px; display: flex; align-items: center; gap: 26px; padding: 0 44px; background: #111; z-index: 5; }
#step { font: 700 28px/1 "JetBrains Mono", monospace; color: #a8a29e; white-space: nowrap; }
#caption { font: 700 38px/1.2 Inter, sans-serif; letter-spacing: -0.01em; }
.card { position: absolute; inset: 0; background: #111; z-index: 10; display: none; padding: 0 160px; flex-direction: column; justify-content: center; }
.kicker { font: 700 30px/1 "JetBrains Mono", monospace; color: #a8a29e; }
.big { margin-top: 22px; font: 800 72px/1.08 Inter, sans-serif; letter-spacing: -0.02em; }
.watch { margin-top: 34px; font: 600 40px/1.3 Inter, sans-serif; color: #d6d3d1; }
.row { margin-top: 22px; display: flex; gap: 22px; align-items: baseline; font: 600 38px/1.25 Inter, sans-serif; }
.row b { font: 800 34px/1 "JetBrains Mono", monospace; width: 270px; flex: none; white-space: nowrap; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total.toFixed(3)}" data-width="${W}" data-height="${H}" data-layout-allow-overlap data-layout-allow-overflow>
  ${takes.map((take, ti) => `<div id="pane-${take.id}" class="pane" style="left:${ti * VIEW.w}px">
    <div class="bar"><span id="label-${take.id}" class="label">${esc(take.label)}</span><div class="status"><span id="clock-${take.id}" class="clock"></span><div class="chips"><span id="framing-${take.id}" class="chip">static crop</span><span id="speed-${take.id}" class="chip"></span><span id="cut-${take.id}" class="chip"></span><span id="held-${take.id}" class="chip"></span></div></div></div>
    <div class="view"><div id="cam-${take.id}" class="cam">
      ${clips[take.id].join("\n      ")}
      <div class="mark"></div><div class="mark"></div><div class="mark"></div>
    </div></div>
  </div>`).join("\n  ")}
  <div id="strip"><span id="step"></span><span id="caption"></span></div>
  <div id="title" class="card" data-hold data-layout-allow-occlusion><div class="kicker">${esc(edl.ref)}</div><div class="big">${esc(edl.title)}</div><div class="watch">Watch for: ${esc(edl.watch)}</div></div>
  <div id="end" class="card" data-hold data-layout-allow-occlusion><div class="kicker">What this shows · originals kept unedited</div>
    ${edl.results.map(([claim, verdict]) => `<div class="row"><b style="color:${{ pass: "#4ade80", fail: "#f87171", judge: "#fbbf24" }[verdict]}">${{ pass: "✓ seen", fail: "✗ failed", judge: "? your call" }[verdict]}</b><span>${esc(claim)}</span></div>`).join("\n    ")}
  </div>
</div>
<script>
const D = ${JSON.stringify(data)};
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const fmt = (s) => Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0");
function camFor([x, y, w, h]) {
  const s = Math.min(D.VIEW.w / w, D.VIEW.h / h);
  return { s, x: D.VIEW.w / 2 - (x + w / 2) * s, y: D.VIEW.h / 2 - (y + h / 2) * s };
}
const show = (el, on, display = "flex") => (el.style.display = on ? display : "none");
function render(t) {
  show($("title"), t < D.TITLE);
  show($("end"), t >= D.endAt);
  const b = [...D.beats].reverse().find((x) => t >= x.start);
  if (!b || t >= D.endAt) return;
  const age = t - b.start;
  $("step").textContent = (b.bi + 1) + " / " + D.beats.length;
  $("caption").textContent = b.caption;
  for (const take of D.takes) {
    const id = take.id;
    const s = b.sides[id];
    const inHold = age >= s.motionD;
    const part = [...s.stretches].reverse().find((p) => t >= p.start);
    const src = inHold ? s.to : part.from + (t - part.start) * part.rate;
    // The complete source fits each pane; explicit readability crops stay static.
    const c = camFor(s.focus);
    $("cam-" + id).style.transform = "translate(" + c.x.toFixed(2) + "px," + c.y.toFixed(2) + "px) scale(" + c.s.toFixed(4) + ")";
    $("label-" + id).textContent = take.label;
    $("clock-" + id).textContent = "take " + id + " · " + fmt(src);
    show($("framing-" + id), s.cropped, "inline-block");
    show($("speed-" + id), Math.abs(part.rate - 1) > 0.0001 && !inHold, "inline-block");
    $("speed-" + id).textContent = (part.rate < 1 ? "⏵ " : "⏩ ") + Number(part.rate.toFixed(2)) + "× · real " + (part.to - part.from).toFixed(1) + " s";
    show($("cut-" + id), s.cut > 0 && age < 1.6, "inline-block");
    $("cut-" + id).textContent = "✂ cut " + s.cut.toFixed(1) + " s";
    show($("held-" + id), inHold, "inline-block");
    $("held-" + id).textContent = "⏸ freeze " + s.hold.toFixed(1) + " s";
    const rects = !s.mark ? [] : Array.isArray(s.mark[0]) ? s.mark : [s.mark];
    const markT = s.markAt <= s.resultAt ? b.start + (s.markAt - s.from) / s.stretches[0].rate : b.start + b.actionD + (s.markAt - s.resultAt) / s.rate;
    document.querySelectorAll("#cam-" + id + " .mark").forEach((m, i) => {
      const r = rects[i];
      if (!r || t < markT) return (m.style.display = "none");
      const a = t - markT;
      const [x, y, w, h] = r;
      const pad = 10 / c.s;
      m.style.display = "block";
      m.style.left = x - pad + "px";
      m.style.top = y - pad + "px";
      m.style.width = w + 2 * pad + "px";
      m.style.height = h + 2 * pad + "px";
      m.style.borderWidth = (6 / c.s).toFixed(2) + "px";
      m.style.borderRadius = (12 / c.s).toFixed(2) + "px";
      m.style.borderColor = s.tone === "fail" ? "#e5484d" : "#ff6a00";
      m.style.opacity = clamp(a / 0.12).toFixed(3);
      m.style.transform = "scale(" + (1 + 0.08 * Math.pow(1 - clamp(a / 0.25), 3)).toFixed(4) + ")";
    });
  }
}
const clock = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(clock, { t: D.total, duration: D.total, ease: "none", onUpdate: () => render(clock.t) }, 0);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
render(0);
tl.seek(0);
</script>
</body>
</html>
`);
