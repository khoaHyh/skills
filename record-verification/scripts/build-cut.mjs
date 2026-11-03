// Builds a HyperFrames review cut from an edit decision list (EDL) of real
// takes. Usage: node build-cut.mjs <edl.json> <project-dir>
// Writes <project-dir>/index.html, copies the takes into assets/takes, extracts
// freeze stills, and prints a pacing table. Render with `npx hyperframes render`.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";

const [edlPath, dir] = process.argv.slice(2);
if (!edlPath || !dir) throw new Error("usage: node build-cut.mjs <edl.json> <project-dir>");
const edl = JSON.parse(readFileSync(edlPath, "utf8"));
const base = dirname(resolve(edlPath));

const W = 1920;
const H = 1080;
const BAR = 72; // section label and take timecode
const STRIP = 160; // caption strip under the footage, never over it
const VIEW = { w: W, h: H - BAR - STRIP };
// A line a viewer must read stays up 0.5 s plus 0.3 s a word (HyperFrames' floor).
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const readTime = (s) => Math.max(1.5, 0.5 + 0.3 * words(s));
// The title card is also the poster frame, readable before play, and players
// hold the last frame, so neither card needs a full read time.
const TITLE = Math.min(4.5, readTime(`${edl.title} Watch for: ${edl.watch}`));
const END = Math.min(6, Math.max(3.5, readTime(edl.results.map((r) => r[0]).join(" "))));

mkdirSync(`${dir}/assets/takes`, { recursive: true });
mkdirSync(`${dir}/assets/stills`, { recursive: true });

// Lay every beat on the output clock.
let t = TITLE;
const beats = [];
const clips = [];
const sections = edl.sections.map((sec, si) => {
  const src = resolve(base, sec.src);
  const name = `${si}-${basename(src)}`;
  copyFileSync(src, `${dir}/assets/takes/${name}`);
  // A section card names the take (Before · main, After · branch) before its footage.
  const cardAt = t;
  const card = readTime(sec.label);
  t += card;
  let prevTo = null;
  let focus = sec.focus ?? [0, 0, edl.source[0], edl.source[1]];
  for (const [bi, b] of sec.beats.entries()) {
    const rate = b.rate ?? 1;
    const d = (b.to - b.from) / rate;
    const cut = prevTo !== null && b.from - prevTo > 0.1 ? b.from - prevTo : 0;
    const from = focus;
    focus = b.focus ?? focus;
    const beat = { si, bi, start: t, d, rate, cut, srcFrom: b.from, srcTo: b.to, caption: b.caption, focusFrom: from, focus, mark: b.mark, markAt: b.markAt ?? Math.max(b.from, b.to - 1.5), tone: b.tone ?? "look", hold: b.hold ?? 0, take: sec.take ?? si + 1 };
    clips.push(`<video id="v${si}-${bi}" class="clip" src="assets/takes/${name}" data-start="${t.toFixed(3)}" data-duration="${d.toFixed(3)}" data-media-start="${b.from.toFixed(3)}" data-playback-rate="${rate}" data-track-index="1" muted playsinline></video>`);
    t += d;
    if (beat.hold > 0) {
      // A freeze is a still of the take's last frame, labelled on screen as held.
      const still = `assets/stills/${si}-${bi}.png`;
      execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.max(0, b.to - 0.04)), "-i", src, "-frames:v", "1", `${dir}/${still}`]);
      clips.push(`<img id="h${si}-${bi}" class="clip still" src="${still}" data-start="${t.toFixed(3)}" data-duration="${beat.hold.toFixed(3)}" data-track-index="2" />`);
      t += beat.hold;
    }
    beats.push(beat);
    prevTo = b.to;
  }
  return { label: sec.label, cardAt, card };
});
const endAt = t;
const total = endAt + END;

// Pacing lint: every caption gets its read time, and a 1× beat that outlasts
// its read time by 4 s with nothing marked is probably dead air.
const rows = beats.map((b) => {
  const need = readTime(b.caption);
  const shown = b.d + b.hold;
  const warn = shown + 0.01 < need ? `short: needs ${need.toFixed(1)} s` : b.rate === 1 && !b.mark && shown > need + 4 ? "long at 1× with no mark" : "";
  return { beat: `${b.si + 1}.${b.bi + 1}`, at: b.start.toFixed(1), shown: shown.toFixed(1), rate: b.rate, cut: b.cut ? b.cut.toFixed(1) : "", words: words(b.caption), warn };
});
console.table(rows);
console.log(`total ${total.toFixed(1)} s`);

// Chapters for the PR body, from the same clock as the video.
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const chapters = sections
  .map((s, si) => [`- **${s.label} (${mmss(s.cardAt)})**`, ...beats.filter((b) => b.si === si).map((b) => `  - ${mmss(b.start)} ${b.caption}${b.rate !== 1 ? ` (${b.rate}×)` : ""}${b.cut ? ` (after a ${b.cut.toFixed(1)} s cut)` : ""}${b.hold ? ` (${b.hold.toFixed(1)} s freeze)` : ""}`)].join("\n"))
  .join("\n");
writeFileSync(`${dir}/chapters.md`, `${chapters}\n`);
console.log(`\n${chapters}`);

const data = { W, H, BAR, STRIP, VIEW, TITLE, total, endAt, source: edl.source, beats, sections };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

writeFileSync(
  `${dir}/index.html`,
  `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #111; }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: Inter, sans-serif; color: #f5f5f4; }
#bar { position: absolute; left: 0; top: 0; width: ${W}px; height: ${BAR}px; display: flex; align-items: center; gap: 14px; padding: 0 28px; background: #111; z-index: 5; }
#label { font: 800 30px/1 "JetBrains Mono", monospace; padding: 10px 16px; border-radius: 10px; background: #f5f5f4; color: #111; }
#chips { margin-left: auto; display: flex; gap: 12px; }
.chip { font: 700 28px/1 "JetBrains Mono", monospace; padding: 9px 14px; border-radius: 9px; border: 2px solid #f5f5f4; color: #f5f5f4; display: none; }
#clock { font: 600 28px/1 "JetBrains Mono", monospace; color: #a8a29e; }
#view { position: absolute; left: 0; top: ${BAR}px; width: ${VIEW.w}px; height: ${VIEW.h}px; overflow: hidden; background: #e7e5e4; z-index: 1; }
#cam { position: absolute; left: 0; top: 0; width: ${edl.source[0]}px; height: ${edl.source[1]}px; transform-origin: 0 0; }
#cam video, #cam .still { position: absolute; left: 0; top: 0; width: ${edl.source[0]}px; height: ${edl.source[1]}px; }
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
  <div id="bar"><span id="label"></span><div id="chips"><span id="speed" class="chip"></span><span id="cut" class="chip"></span><span id="held" class="chip"></span></div><span id="clock"></span></div>
  <div id="view"><div id="cam">
    ${clips.join("\n    ")}
    <div class="mark"></div><div class="mark"></div><div class="mark"></div>
  </div></div>
  <div id="strip"><span id="step"></span><span id="caption"></span></div>
  <div id="title" class="card" data-hold data-layout-allow-occlusion><div class="kicker">${esc(edl.ref)}</div><div class="big">${esc(edl.title)}</div><div class="watch">Watch for: ${esc(edl.watch)}</div></div>
  <div id="section" class="card" data-hold data-layout-allow-occlusion><div class="kicker">Section</div><div id="sectionLabel" class="big"></div></div>
  <div id="end" class="card" data-hold data-layout-allow-occlusion><div class="kicker">What this shows · originals kept unedited</div>
    ${edl.results.map(([claim, verdict]) => `<div class="row"><b style="color:${{ pass: "#4ade80", fail: "#f87171", judge: "#fbbf24" }[verdict]}">${{ pass: "✓ seen", fail: "✗ failed", judge: "? your call" }[verdict]}</b><span>${esc(claim)}</span></div>`).join("\n    ")}
  </div>
</div>
<script>
const D = ${JSON.stringify(data)};
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const fmt = (s) => Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0");
function camFor([x, y, w, h]) {
  const s = Math.min(D.VIEW.w / (w * 1.06), D.VIEW.h / (h * 1.06));
  return { s, x: D.VIEW.w / 2 - (x + w / 2) * s, y: D.VIEW.h / 2 - (y + h / 2) * s };
}
const lerpRect = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const show = (el, on, display = "flex") => (el.style.display = on ? display : "none");
function render(t) {
  show($("title"), t < D.TITLE);
  const sec = D.sections.find((s) => t >= s.cardAt && t < s.cardAt + s.card);
  show($("section"), !!sec);
  if (sec) $("sectionLabel").textContent = sec.label;
  show($("end"), t >= D.endAt);
  const b = [...D.beats].reverse().find((x) => t >= x.start);
  if (!b || t >= D.endAt) return;
  const age = t - b.start;
  const inHold = age >= b.d;
  // The camera glides to a new focus inside continuous footage and cuts with the footage at a cut.
  const u = b.cut ? 1 : ease(clamp(age / 0.6));
  const c = camFor(lerpRect(b.focusFrom, b.focus, u));
  $("cam").style.transform = "translate(" + c.x.toFixed(2) + "px," + c.y.toFixed(2) + "px) scale(" + c.s.toFixed(4) + ")";
  const src = inHold ? b.srcTo : b.srcFrom + age * b.rate;
  $("label").textContent = D.sections[b.si].label;
  $("clock").textContent = "take " + b.take + " · " + fmt(src);
  show($("speed"), b.rate !== 1 && !inHold, "inline-block");
  $("speed").textContent = "⏩ " + b.rate + "× · real " + (b.srcTo - b.srcFrom).toFixed(1) + " s";
  show($("cut"), b.cut > 0 && age < 1.6, "inline-block");
  $("cut").textContent = "✂ cut " + b.cut.toFixed(1) + " s";
  show($("held"), inHold, "inline-block");
  $("held").textContent = "⏸ freeze " + b.hold.toFixed(1) + " s";
  const n = D.beats.filter((x) => x.si === b.si).length;
  $("step").textContent = (b.bi + 1) + " / " + n;
  $("caption").textContent = b.caption;
  // Marks frame the evidence: one box per rect, in source pixels, so they zoom with the footage.
  const rects = !b.mark ? [] : Array.isArray(b.mark[0]) ? b.mark : [b.mark];
  const markT = b.start + (b.markAt - b.srcFrom) / b.rate;
  document.querySelectorAll(".mark").forEach((m, i) => {
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
    m.style.borderColor = b.tone === "fail" ? "#e5484d" : "#ff6a00";
    m.style.opacity = clamp(a / 0.12).toFixed(3);
    m.style.transform = "scale(" + (1 + 0.08 * Math.pow(1 - clamp(a / 0.25), 3)).toFixed(4) + ")";
  });
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
`,
);
