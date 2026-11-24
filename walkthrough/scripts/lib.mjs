// Shared helpers: config loading, dependency checks, ffmpeg/ffprobe wrappers.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

export function loadConfig(path) {
  if (!path) throw new Error("usage: node <script> <walkthrough.config.json> [options]");
  const file = resolve(path);
  const config = JSON.parse(readFileSync(file, "utf8"));
  const base = dirname(file);
  config.base = base;
  config.out = resolve(base, config.out ?? "walkthrough-out");
  config.at = (p) => resolve(base, p);
  for (const key of ["surfaces", "beats"]) {
    if (!Array.isArray(config[key]) || config[key].length === 0) throw new Error(`config.${key} must be a non-empty array`);
  }
  for (const s of config.surfaces) {
    if (!["ios-sim", "browser"].includes(s.kind)) throw new Error(`surface ${s.name}: kind must be ios-sim or browser`);
    if (s.kind === "ios-sim" && (!s.udid || s.udid === "booted")) throw new Error(`surface ${s.name}: set an explicit Simulator udid`);
  }
  return config;
}

export function has(cmd, args = ["-version"]) {
  return spawnSync(cmd, args, { stdio: "ignore" }).status === 0;
}

/** Fails fast with every missing dependency for the steps being run. */
export function requireDeps(config, { capture = false, compose = false } = {}) {
  const missing = [];
  if (Number(process.versions.node.split(".")[0]) < 22) missing.push("Node.js 22+");
  if (!has("ffmpeg") || !has("ffprobe")) missing.push("ffmpeg and ffprobe on PATH");
  if (capture && config.surfaces.some((s) => s.kind === "ios-sim") && !has("xcrun", ["simctl", "help"])) {
    missing.push("Xcode simctl (xcrun simctl); set DEVELOPER_DIR if xcode-select points at the Command Line Tools");
  }
  if (capture && config.surfaces.some((s) => s.kind === "browser") && !playwright(config)) {
    missing.push("playwright (npm i -D playwright && npx playwright install chromium), resolvable from the config's folder or config.playwrightFrom");
  }
  if (compose && !has("npx", ["--yes", "hyperframes", "--version"])) missing.push("HyperFrames CLI (npx hyperframes)");
  if (missing.length) throw new Error(`missing dependencies:\n- ${missing.join("\n- ")}`);
}

export function playwright(config) {
  const from = resolve(config.base, config.playwrightFrom ?? ".", "package.json");
  try {
    return createRequire(from)("playwright");
  } catch {
    return null;
  }
}

export function ffmpeg(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
}

export function probe(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height:format=duration", "-of", "json", file]).toString();
  const j = JSON.parse(out);
  return { width: j.streams[0].width, height: j.streams[0].height, duration: Number(j.format.duration) };
}

export function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

/**
 * Turns a beat command's output line into an event: `WT-MARK {json}` lines verbatim, and
 * lines matching a surface's taps.pattern as taps. Points are fractions of the screen; a
 * label tapped in several places lists its points in order of use.
 */
export function lineParser(config) {
  const rules = config.surfaces.filter((s) => s.taps?.pattern).map((s) => ({ s, re: new RegExp(s.taps.pattern) }));
  const used = {};
  return (line) => {
    const m = line.match(/WT-MARK (\{.*\})/);
    if (m) return { kind: "mark", note: "", ...JSON.parse(m[1]) };
    for (const { s, re } of rules) {
      const hit = line.match(re);
      if (!hit) continue;
      const label = hit.slice(1).find(Boolean) ?? hit[0];
      const pct = label.match(/^point \((\d+)%,\s*(\d+)%\)$/);
      let point = pct ? [pct[1] / 100, pct[2] / 100] : s.taps.points?.[label];
      if (Array.isArray(point?.[0])) point = point[Math.min((used[label] = (used[label] ?? -1) + 1), point.length - 1)];
      return { surface: s.name, kind: "tap", note: label, ...(point ? { x: point[0], y: point[1] } : {}) };
    }
    return null;
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
