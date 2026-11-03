// Mixes assets/audio/mix.wav from assets/cues.js: the same cue sheet the
// picture reads. Music is a small synthesized 120 BPM bed; effects are the
// bundled HyperFrames SFX, panned and pitched per cue. Usage: node build-audio.mjs
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const SR = 48000;
const ctx = { window: {} };
vm.runInNewContext(readFileSync("assets/cues.js", "utf8"), ctx);
const C = ctx.window.CUES;
const N = Math.round(C.T.duration * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

const music = mixMusic();
const effects = mixEffects();
master();

function mixEffects() {
  const cache = new Map();
  const load = (name) => {
    if (cache.has(name)) return cache.get(name);
    const raw = execFileSync("ffmpeg", ["-v", "error", "-i", `assets/sfx/${name}.mp3`, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
    const all = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
    const clip = { l: new Float32Array(all.length / 2), r: new Float32Array(all.length / 2) };
    for (let i = 0; i < clip.l.length; i++) {
      clip.l[i] = all[2 * i];
      clip.r[i] = all[2 * i + 1];
    }
    cache.set(name, clip);
    return clip;
  };
  let seed = 9;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const cue of C.sfx) {
    const clip = cue.file.startsWith("synth:") ? synth(cue.file.slice(6)) : load(cue.file);
    // Rotate takes a little: every repeat gets its own pitch (Hex: rate 0.92–1.08).
    const rate = (cue.rate ?? 1) * (cue.file.startsWith("synth:") ? 1 : 0.96 + 0.08 * rand());
    const from = Math.round((cue.from ?? 0) * SR);
    const avail = clip.l.length - from;
    const len = Math.min(avail / rate, cue.length ? cue.length * SR : Infinity);
    const start = Math.round(cue.t * SR);
    const pan = cue.pan ?? 0;
    const gl = Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    const gr = Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    const fadeTail = Math.min(len, 0.02 * SR);
    for (let i = 0; i < len; i++) {
      const o = start + i;
      if (o >= N) break;
      let p = i * rate;
      if (cue.reverse) p = Math.max(0, len * rate - 1 - p);
      const k = Math.floor(p);
      const f = p - k;
      const s0 = from + k;
      const s1 = Math.min(from + k + 1, clip.l.length - 1);
      const env = i > len - fadeTail ? (len - i) / fadeTail : 1;
      const g = cue.gain * env;
      L[o] += (clip.l[s0] * (1 - f) + clip.l[s1] * f) * g * gl;
      R[o] += (clip.r[s0] * (1 - f) + clip.r[s1] * f) * g * gr;
    }
  }
  return C.sfx.length;
}

// Glass crack: a bright noise snap plus a spray of decaying high partials.
function synth(name) {
  if (name !== "glass") throw new Error(`unknown synth ${name}`);
  const n = Math.round(1.4 * SR);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  let s = 3;
  const noise = () => ((s = (s * 48271) % 2147483647) / 2147483647) * 2 - 1;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const w = noise();
    const hp = w - prev;
    prev = w;
    const snap = hp * Math.exp(-t * 38) * 0.9;
    l[i] = snap;
    r[i] = snap;
  }
  for (let k = 0; k < 14; k++) {
    const f = 2800 + ((k * 1931) % 4600);
    const at = 0.01 + ((k * 97) % 23) * 0.018;
    const d = 6 + (k % 5) * 3;
    const pan = ((k * 37) % 11) / 10 - 0.5;
    for (let i = Math.round(at * SR); i < n; i++) {
      const t = i / SR - at;
      const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * d) * 0.12;
      l[i] += v * (1 - pan);
      r[i] += v * (1 + pan);
    }
  }
  return { l, r };
}

function mixMusic() {
  const BEAT = C.BEAT;
  const roots = [55, 43.65, 65.41, 49.0]; // A1 F1 C2 G1, one per bar
  const chord = [
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [261.63, 329.63, 392],
    [196, 246.94, 293.66],
  ];
  const add = (i, v, pan = 0) => {
    if (i < 0 || i >= N) return;
    L[i] += v * (1 - pan * 0.5);
    R[i] += v * (1 + pan * 0.5);
  };
  let s = 17;
  const noise = () => ((s = (s * 48271) % 2147483647) / 2147483647) * 2 - 1;

  const kick = (t0, g) => {
    const a = Math.round(t0 * SR);
    let ph = 0;
    for (let i = 0; i < 0.45 * SR; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (44 + 120 * Math.exp(-t * 30))) / SR;
      add(a + i, (Math.sin(ph) * Math.exp(-t * 7) + (t < 0.004 ? noise() * 0.4 : 0)) * g);
    }
  };
  const hat = (t0, g, d = 60) => {
    const a = Math.round(t0 * SR);
    let prev = 0;
    for (let i = 0; i < 0.08 * SR; i++) {
      const w = noise();
      add(a + i, (w - prev) * Math.exp((-i / SR) * d) * g, 0.3);
      prev = w;
    }
  };
  const clap = (t0, g) => {
    const a = Math.round(t0 * SR);
    let lp = 0;
    for (let i = 0; i < 0.25 * SR; i++) {
      const t = i / SR;
      const w = noise();
      lp += (w - lp) * 0.25;
      const bursts = t < 0.03 ? (Math.floor(t / 0.01) % 2 === 0 ? 1 : 0.3) : 1;
      add(a + i, (w - lp) * Math.exp(-t * 16) * bursts * g, -0.15);
    }
  };
  const bassNote = (t0, dur, f, g) => {
    const a = Math.round(t0 * SR);
    let lp = 0;
    for (let i = 0; i < dur * SR; i++) {
      const t = i / SR;
      const ph = 2 * Math.PI * f * t;
      const saw = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph);
      lp += (saw - lp) * 0.08;
      const env = Math.min(1, t / 0.005) * Math.exp(-t * 3) * Math.min(1, (dur - t) / 0.01);
      add(a + i, lp * env * g);
    }
  };
  const stab = (t0, freqs, g) => {
    const a = Math.round(t0 * SR);
    for (let i = 0; i < 0.18 * SR; i++) {
      const t = i / SR;
      let v = 0;
      for (const f of freqs) for (const det of [0.996, 1.004]) v += ((((f * det * t) % 1) * 2 - 1) * 0.5);
      add(a + i, v * Math.exp(-t * 14) * g, 0.2);
    }
  };
  const pad = (from, to, freqs, g) => {
    const a = Math.round(from * SR);
    const n = Math.round((to - from) * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.6) * Math.min(1, (n - i) / (0.5 * SR));
      let v = 0;
      for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(4 * Math.PI * f * t + 0.7);
      add(a + i, v * env * g);
    }
  };

  for (const sec of C.music) {
    const beats = Math.round((sec.to - sec.from) / BEAT);
    if (sec.kind === "groove") {
      const e = sec.energy;
      for (let b = 0; b < beats; b++) {
        const t = sec.from + b * BEAT;
        const bar = Math.floor(t / (4 * BEAT)) % 4;
        const fade = sec.fadeOut ? Math.min(1, (sec.to - t) / sec.fadeOut) : 1;
        kick(t, 0.9 * fade);
        hat(t + BEAT / 2, 0.16 * e * fade);
        if (e >= 1) {
          hat(t + BEAT / 4, 0.07 * fade, 90);
          hat(t + (3 * BEAT) / 4, 0.07 * fade, 90);
        }
        if (b % 2 === 1 && e >= 0.9) clap(t, 0.38 * fade);
        // Bass on the 8ths after the kick, so it ducks under it.
        bassNote(t + BEAT / 2, BEAT / 2 - 0.01, roots[bar], 0.32 * e * fade);
        bassNote(t + 0.02, BEAT / 2 - 0.03, roots[bar], 0.12 * e * fade);
        if (e > 1.1) stab(t + BEAT / 2, chord[bar], 0.05 * fade);
      }
    } else if (sec.kind === "roll") {
      // The roll stops a breath before the downbeat so the impact lands in a gap.
      const gap = 0.08;
      let t = sec.from;
      while (t < sec.to - gap) {
        const u = (t - sec.from) / (sec.to - sec.from);
        clap(t, 0.12 + 0.3 * u);
        t += 0.125 * Math.pow(0.25, u);
      }
      for (let b = 0; b < beats; b++) kick(sec.from + b * BEAT, 0.85);
      const a = Math.round(sec.from * SR);
      const n = Math.round((sec.to - sec.from - gap) * SR);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        ph += (2 * Math.PI * 55 * Math.pow(2, u)) / SR;
        add(a + i, Math.sin(ph) * 0.18 * u);
      }
    } else if (sec.kind === "whistle") {
      const a = Math.round(sec.from * SR);
      const n = Math.round((sec.to - sec.from - 0.05) * SR);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const f = 1700 * Math.pow(300 / 1700, u) * (1 + 0.02 * Math.sin(2 * Math.PI * 6 * (i / SR)));
        ph += (2 * Math.PI * f) / SR;
        add(a + i, Math.sin(ph) * 0.12 * Math.min(1, u * 20) * Math.min(1, (1 - u) * 30));
      }
    } else if (sec.kind === "room") {
      pad(sec.from, sec.to + 0.3, chord[0], 0.016);
    } else if (sec.kind === "pad") {
      pad(sec.from + 0.1, sec.to, [174.61, 220, 261.63, 329.63], 0.022);
    }
  }
  return C.music.length;
}

function master() {
  // Pre-gain keeps the bus under the ceiling so the loudness pass stays linear.
  let peak = 0;
  for (let i = 0; i < N; i++) {
    L[i] = Math.tanh(L[i] * 0.42);
    R[i] = Math.tanh(R[i] * 0.42);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  mkdirSync("assets/audio", { recursive: true });
  const raw = "assets/audio/.mix-raw.wav";
  writeFileSync(raw, wav());
  // Two-pass loudness to −14 LUFS with a −1.5 dBTP ceiling.
  const stats = measured(raw);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", raw,
    "-af", `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true,aresample=${SR}`,
    "-c:a", "pcm_s16le", "assets/audio/mix.wav",
  ]);
  unlinkSync(raw);
  console.log(JSON.stringify({ effects, music, prePeak: +peak.toFixed(3), measured: stats }));
}

function measured(file) {
  const res = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${file}" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1`], { encoding: "utf8" });
  return JSON.parse(res.slice(res.lastIndexOf("{"), res.lastIndexOf("}") + 1));
}

function wav() {
  const buf = Buffer.alloc(44 + N * 8);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + N * 8, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(3, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 8, 28);
  buf.writeUInt16LE(8, 32);
  buf.writeUInt16LE(32, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(N * 8, 40);
  for (let i = 0; i < N; i++) {
    buf.writeFloatLE(L[i], 44 + i * 8);
    buf.writeFloatLE(R[i], 48 + i * 8);
  }
  return buf;
}
