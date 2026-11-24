// Records every surface against one wall clock.
// Usage: node capture.mjs <walkthrough.config.json>
// Writes <out>/take-<stamp>/: events.jsonl (epoch seconds), <surface>/frames/ + frames.json
// (browser) or <surface>/recording.mp4 (ios-sim).
import { spawn, execSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { lineParser, loadConfig, playwright, requireDeps, sleep } from "./lib.mjs";

const config = loadConfig(process.argv[2]);
requireDeps(config, { capture: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
const take = join(config.out, `take-${stamp}`);
mkdirSync(take, { recursive: true });
const eventsFile = join(take, "events.jsonl");

const now = () => Date.now() / 1000;
function event(surface, kind, note, extra = {}) {
  const e = { t: now(), surface, kind, note, ...extra };
  appendFileSync(eventsFile, `${JSON.stringify(e)}\n`);
  console.log(`[${new Date(e.t * 1000).toISOString()}] ${surface ?? "*"} ${kind}: ${note}`);
}
const cueWaiters = new Map();
const cuesSeen = new Set();
function cue(id) {
  cuesSeen.add(id);
  event(null, "cue", id);
  for (const resolve of cueWaiters.get(id) ?? []) resolve();
}
const waitCue = (id) => (cuesSeen.has(id) ? Promise.resolve() : new Promise((r) => cueWaiters.set(id, [...(cueWaiters.get(id) ?? []), r])));

if (config.reset) {
  console.log(`reset: ${config.reset}`);
  execSync(config.reset, { cwd: config.base, stdio: "inherit", shell: "/bin/sh" });
}

// ---- Browser surfaces: CDP screencast frames stamped with wall time at receipt.
const browsers = [];
const drivers = [];
const stoppers = [];
const pw = config.surfaces.some((s) => s.kind === "browser") ? playwright(config) : null;
for (const s of config.surfaces.filter((x) => x.kind === "browser")) {
  const browser = await pw.chromium.launch();
  browsers.push(browser);
  const { url, viewport = { width: 1280, height: 800 }, deviceScaleFactor, hasTouch, userAgent, storageState } = s;
  const context = await browser.newContext({
    viewport, deviceScaleFactor, hasTouch, userAgent,
    storageState: storageState ? config.at(storageState) : undefined,
  });
  if (s.blur?.length) {
    // Blur matching leaf text on every frame (emails, phone numbers, tokens).
    await context.addInitScript((sources) => {
      const patterns = sources.map((p) => new RegExp(p, "i"));
      setInterval(() => {
        for (const el of document.querySelectorAll("body *")) {
          const text = el.textContent ?? "";
          if (el.children.length === 0 && patterns.some((p) => p.test(text))) el.style.filter = "blur(6px)";
        }
      }, 100);
    }, s.blur);
  }
  const page = await context.newPage();
  const mark = (kind, note, extra) => event(s.name, kind, note, extra);
  const api = {
    page, context, mark, waitCue, sleep,
    async click(locator, note) {
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      mark("tap", note, box ? { x: (box.x + box.width / 2) / viewport.width, y: (box.y + box.height / 2) / viewport.height } : {});
      await locator.click();
    },
    async reload(note = "Reload") { mark("reload", note); await page.reload(); },
    async goto(target, note = "Open page") { mark("nav", note); await page.goto(target); },
    async waitFor(check, intervalMs = 500) { while (!(await check())) await sleep(intervalMs); },
  };
  if (s.setup) await (await import(pathToFileURL(config.at(s.setup)))).default(api);
  if (url) { await page.goto(url); await page.waitForLoadState("networkidle"); }

  const dir = join(take, s.name, "frames");
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const cdp = await context.newCDPSession(page);
  cdp.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = `f${String(frames.length).padStart(6, "0")}.jpg`;
    writeFileSync(join(dir, file), Buffer.from(data, "base64"));
    frames.push({ file, t: now() });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1,
    maxWidth: viewport.width * (deviceScaleFactor ?? 1), maxHeight: viewport.height * (deviceScaleFactor ?? 1) });
  stoppers.push(async () => {
    await cdp.send("Page.stopScreencast").catch(() => {});
    frames.push({ file: null, t: now() });
    writeFileSync(join(dir, "frames.json"), JSON.stringify(frames));
  });
  mark("ready", "recording");
  if (s.driver) {
    const run = (await import(pathToFileURL(config.at(s.driver)))).default;
    drivers.push(run(api).catch((error) => mark("error", String(error).slice(0, 300))));
  }
}

// ---- iOS Simulator surfaces: simctl recording; its media clock is anchored in sync.mjs.
for (const s of config.surfaces.filter((x) => x.kind === "ios-sim")) {
  mkdirSync(join(take, s.name), { recursive: true });
  const rec = spawn("xcrun", ["simctl", "io", s.udid, "recordVideo", "--codec", "h264", "--force", join(take, s.name, "recording.mp4")]);
  await new Promise((resolve, reject) => {
    const onData = (d) => { if (/Recording started/.test(String(d))) { event(s.name, "record-start", "recording"); resolve(); } };
    rec.stdout.on("data", onData);
    rec.stderr.on("data", onData);
    rec.on("exit", (code) => reject(new Error(`simctl recordVideo exited ${code}`)));
  });
  stoppers.push(async () => {
    rec.kill("SIGINT");
    await new Promise((r) => rec.on("exit", r));
  });
}

// ---- Beats: the acting surface runs a shell command; its stdout lines become events.
const parse = lineParser(config);
function lineEvent(line) {
  const e = parse(line);
  if (e) event(e.surface, e.kind, e.note, e);
}
function runBeat(command) {
  return new Promise((resolve) => {
    const child = spawn("/bin/sh", ["-c", command], { cwd: config.base });
    let buf = "";
    const feed = (d) => {
      buf += d;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const l of lines) { process.stdout.write(`  | ${l}\n`); lineEvent(l); }
    };
    child.stdout.on("data", feed);
    child.stderr.on("data", feed);
    child.on("exit", (code) => { if (buf) lineEvent(buf); if (code) event(null, "error", `beat command exited ${code}`); resolve(); });
  });
}

await sleep((config.capture?.preRoll ?? 4) * 1000);
for (const beat of config.beats) {
  cue(beat.id);
  if (beat.run) await runBeat(beat.run);
  await sleep((beat.settle ?? config.capture?.settle ?? 20) * 1000);
}
cue("end");
await Promise.race([Promise.all(drivers), sleep((config.capture?.driverGrace ?? 60) * 1000)]);
await sleep(2000);
for (const stop of stoppers) await stop();
for (const b of browsers) await b.close();
console.log(`take written to ${take}`);
