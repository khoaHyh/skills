// Motion engine: math, springs, seeded randomness, trauma camera, hit-stop,
// flashes, rings, slams and DOM helpers. Every function is a pure function of
// the time it is given, so any frame renders on its own and in any order.
(function () {
  "use strict";

  // ---------------------------------------------------------------- math
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const inv = (a, b, x) => clamp((x - a) / (b - a));
  const smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
  const outCubic = (u) => 1 - Math.pow(1 - u, 3);
  const outExpo = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const inQuad = (u) => u * u;
  const inCubic = (u) => u * u * u;
  const inOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  // Flash and impact curve: instant attack, convex decay.
  const decay = (age, d) => (age < 0 || age >= d ? 0 : Math.pow(1 - age / d, 2));

  // Closed-form spring with SwiftUI duration/bounce: 0 at age 0, settles at 1.
  // Use it for position and scale; opacity and colour never bounce.
  function spring(age, duration = 0.5, bounce = 0) {
    if (age <= 0) return 0;
    const w = (2 * Math.PI) / duration;
    const z = 1 - bounce;
    if (z >= 1) return 1 - Math.exp(-w * age) * (1 + w * age);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * age) * (Math.cos(wd * age) + ((z * w) / wd) * Math.sin(wd * age));
  }

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const range = (r, a, b) => a + (b - a) * r();
  const mix = (c1, c2, u) => {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1);
    const b = p(c2);
    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(",")})`;
  };

  // ---------------------------------------------------------------- time
  // Hit-stop: motion freezes for a few frames on the biggest impacts while
  // the camera keeps shaking. stops: [[t, seconds]], 0.02–0.09 s.
  const hitStop = (stops) => (t) => {
    for (const [s, d] of stops) if (t >= s && t < s + d) return s;
    return t;
  };

  // Sustained quake between shouted words: [{t, quake}] ramps linearly to the
  // next word and holds the last value until `end`.
  function ramp(t, words, end) {
    if (!words.length || t < words[0].t || t >= end) return 0;
    for (let i = words.length - 1; i >= 0; i--) {
      if (t >= words[i].t) {
        const next = words[i + 1];
        return next ? lerp(words[i].quake, next.quake, inv(words[i].t, next.t, t)) : words[i].quake;
      }
    }
    return 0;
  }

  // flashes: [[t, amount, seconds]]
  const flash = (t, flashes) => flashes.reduce((m, [s, a, d]) => Math.max(m, a * decay(t - s, d)), 0);

  // Trauma camera: each kick adds trauma (shake = trauma^1.85) and a velocity
  // impulse into a damped spring (recoil in the hit's direction). The state is
  // re-simulated from 0 at a fixed step, so camera(t) needs no previous frame.
  // kicks: [{t, trauma, kx, ky}]; floor(t) adds a sustained quake in units of
  // 14 px; intensity(t) 0..1 scales shake amplitude; stills: times that reset
  // everything (a cut to silence).
  function camera({ kicks, floor = () => 0, intensity = () => 0.5, stills = [] }) {
    const sorted = [...kicks].sort((a, b) => a.t - b.t);
    const dt = 1 / 240;
    const w = 15;
    const z = 0.45;
    return (t) => {
      let trauma = 0;
      let kx = 0;
      let kvx = 0;
      let ky = 0;
      let kvy = 0;
      let i = 0;
      let j = 0;
      for (let s = 0; s < t; s += dt) {
        while (i < sorted.length && sorted[i].t <= s) {
          trauma = Math.min(1, trauma + sorted[i].trauma);
          kvx += sorted[i].kx || 0;
          kvy += sorted[i].ky || 0;
          i++;
        }
        while (j < stills.length && stills[j] <= s) {
          trauma = kx = kvx = ky = kvy = 0;
          j++;
        }
        trauma = Math.max(0, trauma - dt * 1.18) * Math.exp(-dt * 2);
        kvx += (-w * w * kx - 2 * z * w * kvx) * dt;
        kx += kvx * dt;
        kvy += (-w * w * ky - 2 * z * w * kvy) * dt;
        ky += kvy * dt;
      }
      const r = Math.pow(trauma, 1.85);
      const fl = floor(t);
      const amp = lerp(8, 22, intensity(t)) * r + fl * 14;
      const n = (f, p) => Math.sin(t * f + p) * 0.6 + Math.sin(t * f * 1.7 + p * 3) * 0.4;
      return { x: n(38, 1) * amp + kx * 0.06, y: n(43, 7) * amp + ky * 0.06, rot: n(21, 3) * (r * 1.1 + fl * 0.55) };
    };
  }

  // ---------------------------------------------------------------- DOM
  const $ = (id) => document.getElementById(id);
  const add = (parent, markup) => {
    parent.insertAdjacentHTML("beforeend", markup);
    return parent.lastElementChild;
  };
  const f2 = (n) => n.toFixed(2);
  // Centre an element on (x, y). Elements placed this way need class "abs".
  function place(el, x, y, r = 0, sx = 1, sy = sx) {
    el.style.transform = `translate3d(${f2(x)}px,${f2(y)}px,0) translate(-50%,-50%) rotate(${f2(r)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
  }
  // A child set to visible still shows inside a hidden parent: when a parent
  // goes off, turn off any child you ever showed with show() or fade().
  function show(el, on) {
    const v = on ? "visible" : "hidden";
    if (el.style.visibility !== v) el.style.visibility = v;
  }
  function fade(el, o, blur = 0) {
    el.style.opacity = o.toFixed(3);
    el.style.filter = blur > 0.05 ? `blur(${f2(blur)}px)` : "none";
    show(el, o > 0.002);
  }
  const setText = (el, s) => {
    if (el.textContent !== s) el.textContent = s;
  };
  const attr = (el, k, v) => el.setAttribute(k, typeof v === "number" ? f2(v) : v);

  // Hand-drawn line boil: index.html's #boilNoise reseeds 12 times a second.
  function boil(t) {
    const noise = $("boilNoise");
    if (noise) noise.setAttribute("seed", String(1 + (Math.floor(t * 12) % 9)));
  }

  // ---------------------------------------------------------------- components
  // Shockwave rings: [{t, x, y, r0, r1, life}], a pressure wave per impact.
  function rings(layer, list, ink = "#1f1b19") {
    const els = list.map(() => add(layer, `<div class="abs" style="border-radius:50%;border:10px solid ${ink};visibility:hidden"></div>`));
    return (t) =>
      list.forEach((rg, i) => {
        const el = els[i];
        const a = (t - rg.t) / rg.life;
        const on = a >= 0 && a < 1;
        show(el, on);
        if (!on) return;
        const r = lerp(rg.r0, rg.r1, outCubic(a));
        el.style.width = el.style.height = `${f2(r * 2)}px`;
        el.style.borderWidth = `${f2(lerp(12, 1.5, a))}px`;
        el.style.opacity = f2(Math.pow(1 - a, 2.2) * 0.8);
        place(el, rg.x, rg.y);
      });
  }

  // Slam text (hype register): scale 1.7→1 on a 0.3 s / 0.3-bounce spring,
  // red/cyan chroma decaying over 0.25 s, three ghosts zooming out, rotating
  // speed lines behind. render(t, {t, text, alert}) or render(t, null).
  function slam(layer, { ink = "#1f1b19", alert = "#e5484d", w = 1920, h = 1080, cx = w / 2, cy = h * 0.435 } = {}) {
    const speed = add(layer, `<svg class="layer" viewBox="0 0 ${w} ${h}" style="visibility:hidden"></svg>`);
    let wedges = "";
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const w = k % 3 === 0 ? 0.03 : 0.012;
      const p = (ang, rad) => `${f2(cx + Math.cos(ang) * rad)},${f2(cy + Math.sin(ang) * rad)}`;
      wedges += `<polygon points="${p(a - w, 1500)} ${p(a + w, 1500)} ${p(a, 330 + (k % 5) * 40)}"/>`;
    }
    speed.innerHTML = `<g fill="${ink}">${wedges}</g>`;
    const rot = speed.firstElementChild;
    const ghosts = [0, 1, 2].map(() => add(layer, `<div class="slam abs" style="color:${ink};visibility:hidden"></div>`));
    const text = add(layer, `<div class="slam abs" style="visibility:hidden"></div>`);
    return (t, s) => {
      show(text, !!s);
      show(speed, !!s);
      ghosts.forEach((g) => show(g, false));
      if (!s) return;
      const age = t - s.t;
      setText(text, s.text);
      text.style.color = s.alert ? alert : ink;
      const scale = lerp(1.7, 1, spring(age, 0.3, 0.3));
      const chroma = 16 * decay(age, 0.25);
      text.style.textShadow = chroma > 0.2 ? `${f2(chroma)}px 0 0 rgba(229,72,77,.9), ${f2(-chroma)}px 0 0 rgba(59,163,199,.9)` : "none";
      place(text, s.x ?? cx, s.y ?? cy, 0, scale);
      ghosts.forEach((g, i) => {
        const p = clamp(age / 0.3);
        if (p >= 1) return;
        show(g, true);
        setText(g, s.text);
        g.style.opacity = f2(0.28 * (1 - p) * (1 - i * 0.25));
        place(g, s.x ?? cx, s.y ?? cy, 0, scale * (1 + (0.12 + i * 0.12) * outCubic(p)));
      });
      speed.style.opacity = f2(0.1 + 0.32 * decay(age, 0.4));
      attr(rot, "transform", `rotate(${f2(t * 6)} ${cx} ${cy})`);
    };
  }

  // The screen breaks once, at the peak: cracks radiate from (x, y), draw on in
  // 70 ms at `at`, and heal (a visible rewind) from `heal` over 0.42 s.
  // Returns render(t, {at, heal}) or render(t, null).
  function glass(layer, { x = 1010, y = 520, seed = 61, w = 1920, h = 1080, ink = "#1f1b19" } = {}) {
    const svg = add(layer, `<svg class="layer" viewBox="0 0 ${w} ${h}" style="visibility:hidden"></svg>`);
    const r = rng(seed);
    const rays = [];
    let paths = "";
    const line = (pts) => `<polyline class="ck" points="${pts.map((p) => p.map(f2).join(",")).join(" ")}"/>`;
    for (let k = 0; k < 15; k++) {
      const a = (k / 15) * Math.PI * 2 + range(r, -0.15, 0.15);
      const L = range(r, 420, 1250);
      const pts = [[x, y]];
      for (let s = 1; s <= 6; s++) {
        const j = range(r, -0.09, 0.09);
        pts.push([x + Math.cos(a + j) * ((L * s) / 6), y + Math.sin(a + j) * ((L * s) / 6)]);
      }
      rays.push(pts);
      paths += line(pts);
    }
    for (const ring of [1, 2, 3]) {
      for (let k = 0; k < rays.length; k++) {
        if (r() < 0.25) continue;
        const p = rays[k][ring];
        const q = rays[(k + 1) % rays.length][ring];
        paths += line([p, [(p[0] + q[0]) / 2 + range(r, -14, 14), (p[1] + q[1]) / 2 + range(r, -14, 14)], q]);
      }
    }
    svg.innerHTML = `<g fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="${ink}" stroke-width="7" opacity=".85">${paths}</g><g stroke="#fffdf8" stroke-width="2.5">${paths}</g></g>`;
    const cracks = [...svg.querySelectorAll(".ck")].map((el) => {
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      return { el, len };
    });
    return (t, s) => {
      const on = !!s && t >= s.at && (s.heal == null || t < s.heal + 0.42);
      show(svg, on);
      if (!on) return;
      const grow = clamp((t - s.at) / 0.07);
      const healed = s.heal == null ? 0 : inOutCubic(inv(s.heal, s.heal + 0.42, t));
      for (const c of cracks) c.el.style.strokeDashoffset = f2(c.len * (1 - grow * (1 - healed)));
    };
  }

  window.engine = {
    clamp, lerp, inv, smoother, outCubic, outExpo, inQuad, inCubic, inOutCubic, decay, spring, rng, range, mix,
    hitStop, ramp, flash, camera,
    $, add, f2, place, show, fade, setText, attr, boil,
    rings, slam, glass,
  };
})();
