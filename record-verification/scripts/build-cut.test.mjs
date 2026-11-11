import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

const root = mkdtempSync(join(tmpdir(), "review-cut-test-"));
console.log(`Review-cut fixture projects: ${root}`);
const builder = join(dirname(fileURLToPath(import.meta.url)), "build-cut.mjs");
const take = join(root, "take.mp4");
execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=size=160x100:rate=10:duration=8", "-c:v", "libx264", "-pix_fmt", "yuv420p", take]);

function build(name, overrides = {}) {
  const edl = {
    title: "Compare layout", ref: "Local proof", watch: "Status changes", source: [160, 100],
    takes: { before: { label: "Before · main @abc1234", src: take }, after: { label: "After · task @def5678", src: take } },
    beats: [
      { caption: "Status changes", before: { from: 0, resultAt: 4, to: 6, mark: [10, 10, 20, 10] }, after: { from: 0, resultAt: 2, to: 2, mark: [10, 10, 20, 10] } },
      { caption: "Layout stays visible", before: { from: 6.5, to: 7.5 }, after: { from: 4, to: 5 } },
    ], results: [["Layout visible", "judge"]], ...overrides,
  };
  const edlPath = join(root, `${name}.json`);
  const out = join(root, name);
  writeFileSync(edlPath, JSON.stringify(edl));
  execFileSync(process.execPath, [builder, edlPath, out]);
  const html = readFileSync(join(out, "index.html"), "utf8");
  const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, { style: {}, textContent: "" });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element, querySelectorAll: (selector) => [0, 1, 2].map((i) => element(`${selector}-${i}`)) },
    window: {}, gsap: { timeline: () => ({ to() {}, seek() {} }) },
  });
  vm.runInContext(script, context);
  const data = JSON.parse(vm.runInContext("JSON.stringify(D)", context));
  const render = (time) => vm.runInContext(`render(${time})`, context);
  return { html, script, data, element, render, out };
}

test("paired panes synchronize action/result, disclose retiming, and freeze the first finisher", () => {
  const cut = build("paired");
  assert.deepEqual(cut.data.takes.map((t) => t.id), ["before", "after"]);
  assert.match(cut.html, /id="pane-before"/);
  assert.match(cut.html, /id="pane-after"/);
  assert.match(cut.html, /width: 960px/);
  const beat = cut.data.beats[0];
  assert.equal(beat.actionD, 4);
  assert.equal(beat.d, 6);
  assert.equal(beat.sides.before.stretches[0].rate, 1);
  assert.equal(beat.sides.after.stretches[0].rate, 0.5);
  assert.equal(beat.sides.after.hold, 2);
  assert.match(cut.html, /id="v-before-0-0"[^>]*data-start="[\d.]+" data-duration="4.000"/);
  assert.match(cut.html, /id="v-after-0-0"[^>]*data-start="[\d.]+" data-duration="4.000"/);
  assert.match(cut.html, /id="h-after-0"[^>]*data-duration="2.000"/);
  assert.ok(readFileSync(join(cut.out, "assets/stills/after-0.png")).length > 0);
  cut.render(beat.start + 1);
  const initialFrame = cut.element("cam-before").style.transform;
  assert.equal(cut.element("label-before").textContent, "Before · main @abc1234");
  assert.equal(cut.element("label-after").textContent, "After · task @def5678");
  assert.match(cut.element("speed-after").textContent, /0.5×/);
  assert.equal(cut.element("speed-after").style.display, "inline-block");
  cut.render(beat.start + beat.actionD);
  assert.match(cut.element("clock-before").textContent, /0:04.0/);
  assert.match(cut.element("clock-after").textContent, /0:02.0/);
  cut.render(beat.start + 5.5);
  assert.equal(cut.element("held-after").style.display, "inline-block");
  assert.equal(cut.element("held-before").style.display, "none");
  assert.match(cut.element("clock-after").textContent, /0:02.0/);
  assert.equal(cut.data.beats[1].start, beat.start + beat.d);
  cut.render(cut.data.beats[1].start + 0.1);
  assert.equal(cut.element("cam-before").style.transform, initialFrame);
  assert.equal(cut.element("cam-after").style.transform, initialFrame);
  assert.equal(cut.element("cut-before").style.display, "inline-block");
  assert.equal(cut.element("cut-after").style.display, "inline-block");
  assert.match(readFileSync(join(cut.out, "chapters.md"), "utf8"), /After.*0.5×.*2.0 s freeze/);
});

test("full frames stay static and matched; explicit crops are static, labelled and do not carry over", () => {
  const crop = [20, 10, 100, 70];
  const cut = build("crop", { beats: [
    { caption: "Tiny status changes", before: { from: 0, to: 2, focus: crop }, after: { from: 0, to: 2, focus: crop } },
    { caption: "Full layout remains", before: { from: 2, to: 4 }, after: { from: 2, to: 4 } },
  ] });
  for (const beat of cut.data.beats) {
    const frames = [0, 0.15, 0.6, 1.9].map((age) => {
      cut.render(beat.start + age);
      assert.equal(cut.element("cam-before").style.transform, cut.element("cam-after").style.transform);
      return cut.element("cam-before").style.transform;
    });
    assert.equal(new Set(frames).size, 1);
  }
  assert.deepEqual(cut.data.beats[1].sides.before.focus, [0, 0, 160, 100]);
  cut.render(cut.data.beats[0].start + 1);
  assert.equal(cut.element("framing-before").style.display, "inline-block");
  cut.render(cut.data.beats[1].start + 1);
  assert.equal(cut.element("framing-before").style.display, "none");
  assert.doesNotMatch(cut.script, /lerpRect|focusFrom|age \/ 0\.6/);
});

test("after-only cuts have one full-width pane and preserve declared speed and holds", () => {
  const cut = build("after-only", {
    takes: { after: { label: "After · task @def5678", src: take } },
    beats: [{ caption: "Result appears", after: { from: 0, to: 4, rate: 2 }, hold: 1 }],
  });
  assert.deepEqual(cut.data.takes.map((t) => t.id), ["after"]);
  assert.doesNotMatch(cut.html, /id="pane-before"/);
  assert.match(cut.html, /width: 1920px/);
  const beat = cut.data.beats[0];
  assert.equal(beat.d, 3);
  assert.equal(beat.sides.after.hold, 1);
  cut.render(beat.start + 0.5);
  assert.match(cut.element("speed-after").textContent, /2×/);
  cut.render(beat.start + 2.5);
  assert.equal(cut.element("held-after").style.display, "inline-block");
  assert.deepEqual(beat.sides.after.focus, [0, 0, 160, 100]);
});
