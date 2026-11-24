// Builds constant-30fps masters on one timeline: master t = wall t - t0 on every surface.
// Usage: node sync.mjs <walkthrough.config.json> [--take <take-dir>]
// Writes <take>/masters/<surface>.mp4, sync.json and events.json (with master times),
// and prints the event table you pick beat windows from.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpeg, loadConfig, probe, readJsonl, requireDeps } from "./lib.mjs";

const config = loadConfig(process.argv[2]);
requireDeps(config);
const takeArg = process.argv.indexOf("--take");
const take = takeArg > 0 ? resolve(process.argv[takeArg + 1])
  : join(config.out, readdirSync(config.out).filter((d) => d.startsWith("take-")).sort().at(-1));
const events = readJsonl(join(take, "events.jsonl")).sort((a, b) => a.t - b.t);
const cues = events.filter((e) => e.kind === "cue");
const t0 = config.sync?.t0 ?? cues[0].t - (config.sync?.lead ?? 3);
const end = cues.find((e) => e.note === "end")?.t ?? events.at(-1).t;
const duration = Math.round((end + (config.sync?.tail ?? 2) - t0) * 1000) / 1000;
const outDir = join(take, "masters");
mkdirSync(outDir, { recursive: true });
// H.264 needs even dimensions (a 393 px phone viewport is odd).
const evenScale = (s) => (s.masterWidth ? `,scale=${2 * Math.round(s.masterWidth / 2)}:-2:flags=lanczos` : ",scale=trunc(iw/2)*2:trunc(ih/2)*2");
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

function browserMaster(s) {
  const dir = join(take, s.name, "frames");
  const frames = JSON.parse(readFileSync(join(dir, "frames.json"), "utf8"));
  const lines = [];
  for (let i = 0; i < frames.length - 1; i++) {
    if (!frames[i].file) continue;
    const a = Math.max(frames[i].t, t0);
    const b = Math.min(frames[i + 1].t, t0 + duration);
    if (b > a) lines.push(`file '${join(dir, frames[i].file)}'\nduration ${(b - a).toFixed(4)}\n`);
  }
  lines.push(lines.at(-1).split("\n")[0] + "\n"); // concat demuxer repeats the last file
  writeFileSync(join(outDir, `${s.name}.concat.txt`), lines.join(""));
  const scale = evenScale(s);
  ffmpeg(["-f", "concat", "-safe", "0", "-i", join(outDir, `${s.name}.concat.txt`), "-vf", `fps=30${scale},format=yuv420p`,
    "-t", String(duration), "-c:v", "libx264", "-preset", "slow", "-crf", "16", join(outDir, `${s.name}.mp4`)]);
  return {};
}

// simctl writes variable-frame-rate video from the first changed frame. Anchor its media
// clock to the wall clock: match each logged tap to the first big screen change near it.
function iosMaster(s) {
  const rec = join(take, s.name, "recording.mp4");
  const start = events.find((e) => e.surface === s.name && e.kind === "record-start");
  let origin = start.t + (config.sync?.iosLag ?? 0.35);
  const taps = events.filter((e) => e.surface === s.name && e.kind === "tap");
  const diffFile = join(outDir, `${s.name}.diff.txt`);
  execFileSync("ffmpeg", ["-v", "quiet", "-i", rec, "-vf",
    `scale=120:-2,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=${diffFile}`, "-f", "null", "-"]);
  const changes = [];
  let pts = 0;
  for (const line of readFileSync(diffFile, "utf8").split("\n")) {
    const p = line.match(/pts_time:([\d.]+)/);
    if (p) pts = Number(p[1]);
    const y = line.match(/YAVG=([\d.]+)/);
    if (y && Number(y[1]) > 1.5) changes.push(pts);
  }
  const firstChangeNear = (rel) => {
    const near = changes.filter((c) => c >= rel - 2.5 && c <= rel + 0.5);
    let first = near[0];
    for (let i = 1; i < near.length; i++) if (near[i] - near[i - 1] > 0.5) first = near[i];
    return first;
  };
  const offsets = taps.map((tap) => firstChangeNear(tap.t - origin)).map((c, i) => (c === undefined ? null : taps[i].t - c)).filter((x) => x !== null);
  if (offsets.length >= 3) origin = median(offsets);
  for (const tap of taps) {
    const c = firstChangeNear(tap.t - origin);
    if (c !== undefined) tap.shown = origin + c - 0.12; // ripple lands just before the response
  }
  const skip = t0 - origin;
  const pad = skip < 0 ? `tpad=start_mode=clone:start_duration=${-skip},` : "";
  const scale = evenScale(s);
  ffmpeg([...(skip > 0 ? ["-ss", skip.toFixed(3)] : []), "-i", rec, "-vf",
    `${pad}fps=30,tpad=stop_mode=clone:stop_duration=${duration}${scale},format=yuv420p`,
    "-t", String(duration), "-c:v", "libx264", "-preset", "slow", "-crf", "16", join(outDir, `${s.name}.mp4`)]);
  return { origin, anchoredTaps: offsets.length };
}

const surfaces = {};
for (const s of config.surfaces) {
  const extra = s.kind === "ios-sim" ? iosMaster(s) : browserMaster(s);
  const { width, height } = probe(join(outDir, `${s.name}.mp4`));
  surfaces[s.name] = { file: join(outDir, `${s.name}.mp4`), width, height, ...extra };
}
const master = events.map((e) => ({ ...e, m: Math.round(((e.shown ?? e.t) - t0) * 100) / 100 }));
writeFileSync(join(outDir, "events.json"), JSON.stringify(master, null, 1));
writeFileSync(join(outDir, "sync.json"), JSON.stringify({ take, t0, duration, timezone: config.timezone, surfaces }, null, 2));
for (const e of master.filter((x) => x.m >= 0)) {
  console.log(`${e.m.toFixed(2).padStart(8)}  ${(e.surface ?? "*").padEnd(10)} ${e.kind.padEnd(12)} ${e.note}`);
}
console.log(`\nmasters: ${outDir} (${duration}s, t0=${t0})`);
