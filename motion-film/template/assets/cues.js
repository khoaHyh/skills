// One clock for picture and sound. assets/film.js draws from it and
// build-audio.mjs mixes from it, so moving a cue here moves both.
// This is the 6 s demo; replace it with the film's own beats.
(function (root) {
  const BEAT = 0.5; // 120 BPM: one beat is 15 frames at 30 fps

  const T = {
    duration: 6.0, // keep equal to the root data-duration in index.html
    ping: 1.0,
    hit: 3.5,
    calm: 4.2,
    sweet: 4.5,
  };
  const build = [
    { t: 2.0, text: "READY?", quake: 0.45 },
    { t: 2.5, text: "SET?", quake: 1.0 },
    { t: 3.0, text: "GO?!", quake: 1.5 },
  ];

  // Sound sits on the visible action that causes it. `lead` is the file's own
  // attack (see references/sound.md), so the peak lands one frame after the
  // picture. Pan by screen x and rise in pitch as the film escalates.
  const F = 1 / 30;
  const sfx = [];
  const panAt = (x) => (x / 1920) * 1.4 - 0.7;
  const at = (t, file, gain = 1, lead = 0, from = 0, length, opts = {}) =>
    sfx.push({ t: Math.max(0, t + F - lead), file, gain, from, length, ...opts });

  at(T.ping - 0.12, "whoosh-short", 0.6, 0.065, 0, undefined, { pan: panAt(1500) });
  at(T.ping, "pop", 0.7, 0.11, 0, undefined, { pan: panAt(1300) });
  build.forEach((b, i) => at(b.t, i % 2 ? "impact-bass-2" : "impact-bass-1", 0.45 + i * 0.1, i % 2 ? 0.015 : 0.045, 0, 0.45, { rate: 1 + 0.05 * i }));
  at(T.hit - 1.5, "riser", 0.5, 0, 3.472 - 1.5, 1.42);
  at(T.hit, "impact-bass-2", 1.0, 0.015);
  at(T.hit, "impact-bass-1", 0.8, 0.045);
  at(T.hit, "synth:glass", 0.6);
  at(T.calm, "impact-bass-2", 0.5, 0.015, 0, 0.6);
  at(T.calm + 0.15, "sparkle", 0.3, 0, 0, 0.42, { reverse: true }); // the glass heals
  at(T.sweet, "chime", 0.2, 0.41);

  // Music sections; build-audio.mjs knows: room, groove, roll, whistle, pad, silence.
  const music = [
    { from: 0.0, to: 2.0, kind: "groove", energy: 0.8 },
    { from: 2.0, to: 3.5, kind: "roll" },
    { from: 3.5, to: 4.2, kind: "groove", energy: 1.15 },
    { from: 4.2, to: 6.0, kind: "pad" },
  ];

  root.CUES = { BEAT, T, build, sfx, music };
})(typeof window !== "undefined" ? window : globalThis);
