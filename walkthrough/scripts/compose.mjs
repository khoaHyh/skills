// Cuts every pane with one EDL, writes a HyperFrames project, renders the film, a 720p copy
// and a contact sheet.
// Usage: node compose.mjs <walkthrough.config.json> [--take <dir>] [--beats id,id] [--quality draft|looks|delivery]
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpeg, loadConfig, probe, requireDeps } from "./lib.mjs";

const config = loadConfig(process.argv[2]);
requireDeps(config, { compose: true });
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const take = arg("--take") ? resolve(arg("--take"))
  : join(config.out, readdirSync(config.out).filter((d) => d.startsWith("take-")).sort().at(-1));
const only = arg("--beats")?.split(",");
const quality = arg("--quality") ?? "delivery";
const sync = JSON.parse(readFileSync(join(take, "masters/sync.json"), "utf8"));
const events = JSON.parse(readFileSync(join(take, "masters/events.json"), "utf8"));
const beats = config.beats.filter((b) => !only || only.includes(b.id));
const name = config.name ?? "walkthrough";
const tag = only ? `${name}-excerpt-${only.join("-")}` : name;
const proj = join(config.out, `film-${tag}`);
rmSync(proj, { recursive: true, force: true });
mkdirSync(join(proj, "assets"), { recursive: true });
mkdirSync(join(proj, "compositions"), { recursive: true });

// ---- EDL: one list of (master_start, master_end, speed) shared by every pane.
const segs = [];
let t = 0;
for (const b of beats) {
  for (const [a, z, speed = 1] of b.cut) {
    segs.push({ beat: b.id, title: b.title, edit_start: t, edit_end: t + (z - a) / speed, master_start: a, master_end: z, speed });
    t += (z - a) / speed;
  }
}
const WALK = Math.round(t * 1000) / 1000;
const m2e = (m) => { const s = segs.find((x) => x.master_start <= m && m < x.master_end); return s ? s.edit_start + (m - s.master_start) / s.speed : null; };
const e2m = (e) => { const s = segs.find((x) => x.edit_start <= e && e < x.edit_end) ?? segs.at(-1); return s.master_start + (Math.min(e, s.edit_end) - s.edit_start) * s.speed; };
writeFileSync(join(proj, "edl.json"), JSON.stringify({ t0: sync.t0, edit_duration: WALK, segments: segs }, null, 2));

for (const s of config.surfaces) {
  const parts = segs.map((g, i) => `[0:v]trim=${g.master_start}:${g.master_end},setpts=(PTS-STARTPTS)/${g.speed},fps=30[s${i}]`);
  ffmpeg(["-i", sync.surfaces[s.name].file, "-filter_complex", `${parts.join(";")};${segs.map((_, i) => `[s${i}]`).join("")}concat=n=${segs.length}:v=1:a=0,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-g", "30", join(proj, "assets", `${s.name}.mp4`)]);
}

// ---- Layout: panes share one height and keep their aspect; captions sit under each pane.
const st = { ground: "#F6F5F2", ink: "#1D2430", muted: "#5E6672", accent: "#E4572E", chipInk: "#6B4A00", chip: "#FBE7BF",
  display: "Playfair Display", body: "Inter", colors: ["#2F6FED", "#E4572E", "#2E9D6B", "#8B5CF6"], ...config.style };
const TITLE = config.titleSeconds ?? 5.5;
const END = config.endSeconds ?? 13;
const TOTAL = Math.round((TITLE + WALK + END) * 100) / 100;
const M = 56, GAP = 40, TOP = 158;
const aspects = config.surfaces.map((s) => sync.surfaces[s.name].width / sync.surfaces[s.name].height);
const PH = Math.min(700, (1920 - 2 * M - GAP * (aspects.length - 1)) / aspects.reduce((a, b) => a + b, 0));
let x = (1920 - PH * aspects.reduce((a, b) => a + b, 0) - GAP * (aspects.length - 1)) / 2; // centre the row
const panes = config.surfaces.map((s, i) => { const p = { ...s, x, y: TOP, w: aspects[i] * PH, h: PH, color: s.color ?? st.colors[i % st.colors.length] }; x += p.w + GAP; return p; });
const pane = Object.fromEntries(panes.map((p) => [p.name, p]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const f = (n) => Number(n).toFixed(3);

const els = [], tw = [], inner = Object.fromEntries(panes.map((p) => [p.name, []]));
const beatSpans = beats.map((b) => { const own = segs.filter((g) => g.beat === b.id); return { ...b, start: own[0].edit_start, end: own.at(-1).edit_end }; });
beatSpans.forEach((b, i) => {
  const d = f(b.end - b.start);
  els.push(`<div id="hd-${b.id}" class="clip hd" data-start="${f(b.start)}" data-duration="${d}"><div class="hd-in"><span class="beatno">${config.beats.indexOf(config.beats.find((x) => x.id === b.id)) + 1} / ${config.beats.length}</span><span class="beattitle">${esc(b.title)}</span></div></div>`);
  tw.push(`tl.fromTo("#hd-${b.id} .hd-in",{opacity:0,y:10},{opacity:1,y:0,duration:0.45,ease:"power2.out"},${f(b.start)});`);
  panes.forEach((p, col) => {
    const text = b.captions?.[p.name];
    if (!text) return;
    const id = `cap-${b.id}-${col}`;
    els.push(`<div id="${id}" class="clip cap" data-start="${f(b.start)}" data-duration="${d}" style="left:${f(p.x)}px;width:${f(p.w)}px"><div class="cap-in"><div class="cap-label">${esc(p.captionLabel ?? p.label ?? p.name)}</div><div class="cap-text">${esc(text)}</div></div></div>`);
    tw.push(`tl.fromTo("#${id} .cap-in",{opacity:0,y:8},{opacity:1,y:0,duration:0.5,ease:"power2.out"},${f(b.start + 0.25 + 0.15 * col)});`);
  });
  if (i > 0) {
    els.push(`<div id="dip-${b.id}" class="clip dip" data-start="${f(b.start - 0.35)}" data-duration="0.7"><div class="dip-in"></div></div>`);
    tw.push(`tl.fromTo("#dip-${b.id} .dip-in",{opacity:0},{opacity:0.9,duration:0.35,ease:"power1.in"},${f(b.start - 0.35)});`, `tl.to("#dip-${b.id} .dip-in",{opacity:0,duration:0.35},${f(b.start)});`);
  }
  const em = b.emphasis;
  if (em) {
    const [x0, y0, x1, y1] = em.box, p = pane[em.surface], es = m2e(em.from), ee = m2e(em.to - 0.01);
    inner[em.surface].push(`<div id="ring-${b.id}" class="clip ring" data-start="${f(es)}" data-duration="${f(ee - es)}" style="left:${f(x0 * p.w)}px;top:${f(y0 * p.h)}px;width:${f((x1 - x0) * p.w)}px;height:${f((y1 - y0) * p.h)}px"><div class="ring-in"></div></div>`);
    tw.push(`tl.fromTo("#ring-${b.id} .ring-in",{opacity:0,scale:1.06},{opacity:1,scale:1,duration:0.5,ease:"power2.out"},${f(es)});`, `tl.to("#ring-${b.id} .ring-in",{opacity:0,duration:0.3},${f(ee - 0.3)});`);
    if (em.zoom && em.zoom !== 1) {
      tw.push(`tl.set("#zoom-${em.surface}",{transformOrigin:"${em.origin ?? `${x0 * 100}% ${((y0 + y1) / 2) * 100}%`}"},${f(es - 0.01)});`,
        `tl.to("#zoom-${em.surface}",{scale:${em.zoom},duration:0.9,ease:"power2.inOut"},${f(es)});`, `tl.to("#zoom-${em.surface}",{scale:1,duration:0.6,ease:"power2.inOut"},${f(ee - 0.6)});`);
    }
  }
  (b.callouts ?? []).forEach((c, k) => {
    const es = m2e(c.from), ee = m2e(c.to - 0.01), id = `call-${b.id}-${k}`;
    inner[c.surface].push(`<div id="${id}" class="clip call" data-start="${f(es)}" data-duration="${f(ee - es)}"><div class="call-in"><div class="call-label">${esc(c.label)}</div><div class="call-body">${esc(c.body)}</div></div></div>`);
    tw.push(`tl.fromTo("#${id} .call-in",{opacity:0,y:24},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${f(es)});`, `tl.to("#${id} .call-in",{opacity:0,duration:0.3},${f(ee - 0.3)});`);
  });
});
segs.forEach((g, k) => {
  if (g.speed > 1) els.push(`<div id="spd-${k}" class="clip spd" data-start="${f(g.edit_start)}" data-duration="${f(g.edit_end - g.edit_start)}"><span>${g.speed}× · waiting sped up on all screens</span></div>`);
});
events.forEach((e, k) => {
  const at = m2e(e.m);
  if (at === null || !pane[e.surface] || at > WALK - 0.8) return;
  if (e.kind === "tap" && e.x !== undefined) {
    const p = pane[e.surface];
    inner[e.surface].push(`<div id="tap-${k}" class="clip tap" data-start="${f(at)}" data-duration="0.8" style="left:${f(e.x * p.w)}px;top:${f(e.y * p.h)}px"><div class="tap-ring"></div><div class="tap-dot"></div></div>`);
    tw.push(`tl.fromTo("#tap-${k} .tap-ring",{scale:0.3,opacity:0.95},{scale:1.5,opacity:0,duration:0.75,ease:"power2.out"},${f(at)});`, `tl.fromTo("#tap-${k} .tap-dot",{scale:1,opacity:0.85},{scale:0.6,opacity:0,duration:0.45},${f(at)});`);
  }
  if (e.kind === "reload" || e.kind === "nav") {
    inner[e.surface].push(`<div id="ref-${k}" class="clip refresh" data-start="${f(at)}" data-duration="1.6"><span>↻ ${e.kind === "reload" ? "Reload" : "Open page"}</span></div>`);
    tw.push(`tl.fromTo("#ref-${k} span",{opacity:0,y:-6},{opacity:1,y:0,duration:0.25},${f(at)});`, `tl.to("#ref-${k} span",{opacity:0,duration:0.3},${f(at + 1.25)});`);
  }
});
// Wall clock: one clip per displayed second.
const fmt = new Intl.DateTimeFormat("en-US", { timeZone: config.timezone, hour: "numeric", minute: "2-digit", second: "2-digit" });
const marks = [];
for (let e = 0; e < WALK; e += 1 / 30) {
  const label = fmt.format(new Date((sync.t0 + e2m(e)) * 1000));
  if (label !== marks.at(-1)?.label) marks.push({ e, label });
}
const clock = marks.map((c, k) => `<span id="clk-${k}" class="clip clk" data-start="${f(c.e)}" data-duration="${f((marks[k + 1]?.e ?? WALK) - c.e)}">${c.label}</span>`);
const paneHtml = panes.map((p) => `<div class="plabel" style="left:${f(p.x)}px;top:${TOP - 34}px"><i class="dot" style="background:${p.color}"></i>${esc(p.label ?? p.name)}</div>
<div class="pane" style="left:${f(p.x)}px;top:${TOP}px;width:${f(p.w)}px;height:${f(p.h)}px;border-radius:${p.w < p.h ? 34 : 14}px"><div id="zoom-${p.name}" class="zoom">
<video id="vid-${p.name}" class="clip" src="assets/${p.name}.mp4" data-start="0" data-duration="${WALK}" muted playsinline></video>${inner[p.name].join("")}</div></div>`);

const css = `#root{position:absolute;inset:0;background:var(--ground);color:var(--ink);font-family:"${st.body}",sans-serif}`;
const walk = `<template><style>${css}
.pane{position:absolute;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.08)}
.zoom{position:absolute;inset:0}.zoom video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.plabel{position:absolute;font-size:16px;font-weight:700;display:flex;align-items:center;gap:9px;white-space:nowrap}.dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.hd{position:absolute;left:${M}px;top:34px}.hd-in{display:flex;align-items:baseline;gap:18px}
.beatno{font-size:18px;font-weight:700;color:#fff;background:var(--ink);padding:6px 13px;border-radius:999px;position:relative;top:-8px}
.beattitle{font-family:"${st.display}",serif;font-size:48px;font-weight:700}
.clockbox{position:absolute;right:${M}px;top:40px;width:300px;height:60px}.clk{position:absolute;right:0;top:0;font-size:30px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.clocknote{position:absolute;right:0;top:40px;font-size:14px;color:var(--muted);white-space:nowrap}
.spd{position:absolute;right:${M}px;top:112px}.spd span{font-size:14px;font-weight:700;color:${st.chipInk};background:${st.chip};padding:5px 11px;border-radius:999px}
.cap{position:absolute;top:${TOP + PH + 26}px}.cap-label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin-bottom:6px}.cap-text{font-size:22px;line-height:1.32}
.dip{position:absolute;left:40px;top:120px;width:1840px;height:${PH + 40}px}.dip-in{width:100%;height:100%;background:var(--ground);opacity:0}
.ring{position:absolute}.ring-in{position:absolute;inset:-6px;border:4px solid var(--accent);border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.14)}
.tap{position:absolute;width:0;height:0}.tap-ring{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:4px solid var(--accent)}
.tap-dot{position:absolute;left:-11px;top:-11px;width:22px;height:22px;border-radius:50%;background:var(--accent);opacity:.75}
.refresh{position:absolute;left:0;right:0;top:14px;text-align:center}.refresh span{display:inline-block;font-size:13px;font-weight:700;color:#fff;background:#2A2F36;padding:5px 11px;border-radius:999px}
.call{position:absolute;left:14px;right:14px;bottom:22px}.call-in{background:#E9E9EB;border-radius:18px;padding:12px 14px;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.call-label{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:5px}.call-body{font-size:14.5px;line-height:1.35;color:#111}
</style><div id="root" data-composition-id="walk" data-width="1920" data-height="1080" data-layout-allow-overlap>
${paneHtml.join("\n")}
<div class="clockbox">${clock.join("")}<div class="clocknote">${esc(config.clockNote ?? "same moment on every screen")}</div></div>
${els.join("\n")}</div>
<script>const tl=gsap.timeline({paused:true});
${tw.join("\n")}
tl.set({}, {}, ${WALK});window.__timelines["walk"]=tl;</script></template>`;

const ti = config.title ?? {};
const title = `<template><style>${css}
.t{position:absolute;left:160px;top:270px;width:1600px}.k{font-size:20px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.h{font-family:"${st.display}",serif;font-size:84px;font-weight:700;margin-top:18px}.s{font-size:28px;line-height:1.4;color:var(--muted);margin-top:22px;width:1250px}
.g{display:flex;gap:44px;margin-top:54px;font-size:20px;font-weight:700}.g span{display:flex;align-items:center;gap:10px}.g i{width:12px;height:12px;border-radius:50%}
.foot{position:absolute;left:160px;bottom:80px;font-size:18px;color:var(--muted)}</style>
<div id="root" data-composition-id="title" data-width="1920" data-height="1080"><div class="t">
<div class="k">${esc(ti.kicker ?? "Walkthrough")}</div><div class="h">${esc(ti.heading ?? name)}</div><div id="t-sub" class="s">${esc(ti.subtitle ?? "")}</div>
<div id="t-legend" class="g">${panes.map((p) => `<span><i style="background:${p.color}"></i>${esc(p.label ?? p.name)}</span>`).join("")}</div></div>
<div id="t-foot" class="foot">${esc(ti.footer ?? "")}</div></div>
<script>const tl=gsap.timeline({paused:true});tl.fromTo("#t-sub",{opacity:0.001,y:8},{opacity:1,y:0,duration:0.5},0);
tl.fromTo("#t-legend",{opacity:0},{opacity:1,duration:0.5},0.8);tl.fromTo("#t-foot",{opacity:0},{opacity:1,duration:0.5},1);
tl.to("#root",{opacity:0,duration:0.4},${TITLE - 0.45});window.__timelines["title"]=tl;</script></template>`;

const ec = config.endCard ?? {};
const colW = (1920 - 240 - 90 * ((ec.columns?.length ?? 1) - 1)) / (ec.columns?.length || 1);
const end = `<template><style>${css}
.eh{position:absolute;left:120px;top:90px;font-family:"${st.display}",serif;font-size:56px;font-weight:700}.col{position:absolute;top:200px}
.sub{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--accent);margin-bottom:18px}
.row{padding:13px 0;border-top:1px solid rgba(0,0,0,.14)}.rk{font-size:22px;font-weight:700}.rv{font-size:21px;color:var(--muted);margin-top:4px;line-height:1.35}.rn{font-size:21px;line-height:1.4}
.ef{position:absolute;left:120px;right:120px;bottom:56px;font-size:16px;line-height:1.5;color:var(--muted)}</style>
<div id="root" data-composition-id="end" data-width="1920" data-height="1080" data-layout-allow-overlap data-hold><div class="eh">${esc(ec.heading ?? "Recap")}</div>
${(ec.columns ?? []).map((c, i) => `<div id="col-${i}" class="col" style="left:${f(120 + i * (colW + 90))}px;width:${f(colW)}px"><div class="sub">${esc(c.heading)}</div>${(c.rows ?? []).map((r) => `<div class="row">${r.k ? `<div class="rk">${esc(r.k)}</div><div class="rv">${esc(r.v ?? "")}</div>` : `<div class="rn">${esc(r.v ?? r)}</div>`}</div>`).join("")}</div>`).join("")}
<div id="e-foot" class="ef">${esc(ec.footer ?? "")}</div></div>
<script>const tl=gsap.timeline({paused:true});tl.fromTo("#root",{opacity:0},{opacity:1,duration:0.5},0);
${(ec.columns ?? []).map((_, i) => `tl.fromTo("#col-${i}",{opacity:0,y:12},{opacity:1,y:0,duration:0.6},${0.3 + 0.6 * i});`).join("")}
tl.fromTo("#e-foot",{opacity:0},{opacity:1,duration:0.5},1.5);tl.set({}, {}, ${END});window.__timelines["end"]=tl;</script></template>`;

const host = (id, start, dur, i) => `<div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${f(start)}" data-duration="${f(dur)}" data-track-index="${i}" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`;
writeFileSync(join(proj, "index.html"), `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>:root{--ground:${st.ground};--ink:${st.ink};--muted:${st.muted};--accent:${st.accent}}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:var(--ground)}#bg{position:absolute;inset:0;background:var(--ground)}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080"><div id="bg"></div>
${host("title", 0, TITLE, 1)}${host("walk", TITLE, WALK, 2)}${host("end", TITLE + WALK, END, 3)}</div>
<script>window.__timelines=window.__timelines||{};window.__timelines["main"]=gsap.timeline({paused:true});</script></body></html>`);
writeFileSync(join(proj, "compositions/title.html"), title);
writeFileSync(join(proj, "compositions/walk.html"), walk);
writeFileSync(join(proj, "compositions/end.html"), end);
writeFileSync(join(proj, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", assets: "assets" } }, null, 2));
writeFileSync(join(proj, "meta.json"), JSON.stringify({ id: tag, name: tag }, null, 2));

// ---- Check, render, deliver.
const hf = (args) => execFileSync("npx", ["--yes", "hyperframes", ...args], { cwd: proj, stdio: "inherit" });
hf(["lint"]);
const film = join(config.out, `${tag}-1080p.mp4`);
hf(["render", "--quality", quality, "-o", join(proj, "render.mp4")]);
ffmpeg(["-i", join(proj, "render.mp4"), "-c", "copy", "-movflags", "+faststart", film]);
ffmpeg(["-i", film, "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(config.out, `${tag}-720p.mp4`)]);

// Contact sheet: one rendered frame per beat (its emphasis, else its midpoint), two per row.
const shots = beatSpans.map((b, i) => {
  const at = TITLE + (b.emphasis ? (m2e(b.emphasis.from) + m2e(b.emphasis.to - 0.01)) / 2 : (b.start + b.end) / 2);
  const out = join(proj, `sheet-${i}.png`);
  ffmpeg(["-ss", at.toFixed(2), "-i", film, "-frames:v", "1", "-vf", "scale=960:540", out]);
  return out;
});
if (shots.length % 2) shots.push(shots.at(-1).replace(/\.png$/, "-blank.png")), ffmpeg(["-f", "lavfi", "-i", `color=c=${st.ground.replace("#", "0x")}:s=960x540`, "-frames:v", "1", shots.at(-1)]);
const layout = shots.map((_, i) => `${(i % 2) * 960}_${Math.floor(i / 2) * 540}`).join("|");
ffmpeg([...shots.flatMap((s) => ["-i", s]), "-filter_complex", `xstack=inputs=${shots.length}:layout=${layout}`, join(config.out, `${tag}-contact-sheet.png`)]);

const beatTimes = beatSpans.map((b) => ({ id: b.id, title: b.title, film_start: +(TITLE + b.start).toFixed(2), film_end: +(TITLE + b.end).toFixed(2) }));
writeFileSync(join(config.out, `${tag}-beats.json`), JSON.stringify({ total: TOTAL, title: TITLE, end_card: END, beats: beatTimes }, null, 2));
console.log(`film ${film} (${probe(film).duration.toFixed(1)}s)`);
for (const b of beatTimes) console.log(`${String(b.film_start).padStart(7)}  ${b.title}`);
