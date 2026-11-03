// The film: build the DOM once, then render(t) recomputes every element from
// the clock. This 6 s demo runs the hype register end to end (frame-0 artifact,
// whip-in, shouted build with a quake ramp, slam with hit-stop, cut to
// silence, sweet line). Replace its scenes; keep the shape.
(function () {
  "use strict";
  const E = window.engine;
  const C = window.CUES;
  const T = C.T;
  const { $, add, place, fade, spring, lerp, clamp, inv } = E;

  // ---------------------------------------------------------------- build
  const stage = $("stage");
  const opener = add(
    stage,
    `<div class="panel abs" style="width:1000px;padding:40px 48px"><div style="font:600 22px/1 var(--font-mono);opacity:.6">#channel · day 1</div><div style="margin-top:18px;font:800 52px/1.1 var(--font-ui);letter-spacing:-0.02em">Your real artifact goes here.</div></div>`,
  );
  const ping = add(
    stage,
    `<div class="panel abs" style="width:560px;padding:24px 28px;visibility:hidden"><div style="font:600 18px/1 var(--font-mono);opacity:.6">#channel · now</div><div style="margin-top:12px;font:800 32px/1.2 var(--font-ui)">the first thing that broke</div></div>`,
  );
  const sweet = add($("sweetLayer"), `<div class="abs" style="font:italic 500 96px/1 'EB Garamond',serif;color:var(--ground);white-space:nowrap"></div>`);
  const words = "and breathe.".split(" ").map((w, i) => ({ el: add(sweet, `<span style="display:inline-block;margin-right:.24em">${w}</span>`), t: T.sweet + i * 0.067 }));
  place(sweet, 960, 540);
  const calmBg = add($("calmLayer"), `<div class="layer" style="background:var(--ink);visibility:hidden"></div>`);

  // ---------------------------------------------------------------- time
  const motionTime = E.hitStop([[T.hit, 0.09]]);
  const kicks = [
    { t: T.ping, trauma: 0.2, kx: -300 },
    ...C.build.map((b) => ({ t: b.t, trauma: 0.3, ky: 280 })),
    { t: T.hit, trauma: 1, ky: 1000 },
  ];
  const camera = E.camera({
    kicks,
    floor: (t) => E.ramp(t, C.build, T.hit),
    intensity: (t) => (t < T.calm ? lerp(0.3, 1, inv(0, T.hit, t)) : 0),
    stills: [T.calm],
  });
  const flashes = [...C.build.map((b) => [b.t, 0.42, 0.4]), [T.hit, 1, 0.35], [T.calm, 1, 0.5]];
  const drawRings = E.rings($("ringLayer"), [
    { t: T.ping, x: 1300, y: 430, r0: 20, r1: 300, life: 0.36 },
    ...C.build.map((b) => ({ t: b.t, x: 960, y: 470, r0: 120, r1: 760, life: 0.36 })),
    { t: T.hit, x: 960, y: 470, r0: 80, r1: 1100, life: 0.45 },
  ]);
  const drawSlam = E.slam($("slamLayer"));
  const drawGlass = E.glass($("slamLayer"), { x: 980, y: 500 });

  // ---------------------------------------------------------------- render
  function render(t) {
    const tm = motionTime(t);
    const cam = camera(t);
    $("world").style.transform = `translate3d(${E.f2(cam.x)}px,${E.f2(cam.y)}px,0) rotate(${cam.rot.toFixed(3)}deg)`;
    $("flash").style.opacity = E.f2(E.flash(t, flashes));
    E.boil(t);

    // Frame 0 is the thumbnail: the opener is fully on screen at t = 0.
    const out = inv(1.9, 2.1, tm);
    fade(opener, 1 - out, 8 * out);
    place(opener, 960, 470, 0, lerp(1.035, 1, spring(tm, 0.6, 0.12)));

    const a = tm - (T.ping - 0.15);
    fade(ping, a < 0 ? 0 : 1 - out);
    if (a >= 0) {
      const u = spring(a, 0.42, 0.28);
      place(ping, lerp(2340, 1300, u), 430, lerp(40, -4, u));
    }

    let s = null;
    for (const b of C.build) if (tm >= b.t && tm < T.hit) s = b;
    if (tm >= T.hit && tm < T.calm) s = { t: T.hit, text: "GO.", alert: true };
    drawSlam(t, s);
    drawRings(t);
    drawGlass(tm, { at: T.hit, heal: T.calm + 0.15 });

    const calm = tm >= T.calm;
    E.show(calmBg, calm);
    for (const w of words) {
      const wa = tm - w.t;
      fade(w.el, wa < 0 ? 0 : clamp(wa / 0.13), 6 * (1 - clamp(wa / 0.13)));
    }
  }

  window.film = { render };
})();
