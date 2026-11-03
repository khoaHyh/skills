# Motion

Sources: motion rules from psychopomp's `explainer-motion` skill (github.com/kitlangton/psychopomp, MIT), game-feel constants read from the Hex landing page stage (hex.kitlangton.com), and HyperFrames' `references/motion.md`. The helpers named here are in `template/assets/engine.js`.

## Pure function of time

`render(t)` sets every element from `t` alone, so any frame renders on its own and in any order.

- Randomness comes from `rng(seed)`, drawn once at build time.
- Motion comes from closed forms: `spring`, eases, and ballistics `p0 + v·t + ½·g·t²`.
- Stateful effects (trauma, recoil) re-simulate from 0 at a fixed step each frame, as `camera()` does.
- Hit-stop is a time remap (`hitStop`): motion reads the frozen time while the camera reads the real one.
- `render` writes absolute values every frame and computes each position from `t`, so seeking backwards lands exactly.

## Feel tokens

| Feel | Spring (duration s / bounce) | Use |
|---|---|---|
| Panel settle | 0.6 / 0.12, scale 1.035→1, y 16→0 px; content 65 ms behind | Cards, terminals, panels arriving |
| Pop | 0.32 / 0.18, scale 0.6→1 | Chips, badges, reactions |
| Whip-in | 0.42 / 0.28 from off-frame, rotation settling with it | Items flying in on a beat |
| Slam | 0.3 / 0.3, scale 1.7→1 | Shouted words, the title |
| Hero | 0.85 / 0.2, scale 0.58→1, blur 11→0 | The one object the film is about |

Position and scale spring; opacity and colour ease. Exits run 40–50% shorter than entrances. Stagger words 60–120 ms, letters about 35 ms, list items 40–80 ms. Title entrances vary across the film: a per-word blur (6→0 px in 0.13 s, 0.067 s apart), a letter slam, a mask wipe.

## Game feel

- **Trauma shake.** Each impact adds trauma (0.05 small hit … 1 the collapse), capped at 1. Per step `trauma = max(0, trauma − 1.18·dt)·e^(−2·dt)`. Shake = trauma^1.85 × lerp(8, 22, intensity) px on a two-sine noise at 38 and 43 rad/s, plus a little rotation.
- **Kicks.** Each impact also pushes a velocity impulse (±250–1000) into a damped spring (ω 15, ζ 0.45) in the hit's direction: the camera recoils away from what hit it.
- **Hit-stop.** Freeze motion 20–90 ms on the three to six biggest hits, longer as intensity rises.
- **Rings.** A pressure ring per impact: radius r0→r1 on outCubic over 0.36–0.5 s, stroke 12→1.5 px, opacity (1 − a)^2.2.
- **Flash.** Instant attack, (1 − age/d)² decay, d 0.25–0.5 s. Full-frame flashes hide hard changes (scene swaps, the cut to silence).
- **Escalation.** Arrivals sit on the beat, then on half-beats, then a blizzard spread on a power curve (`t0 + span·u^0.72`). Sound pitch climbs with it (`references/sound.md`).

## Hype register

- **Build.** The quake floor (`ramp`) climbs linearly between shouted words, 0.45 → 1.0 → 1.5 → 2.0 units of 14 px, under a riser that ends on the peak word.
- **Slam.** `slam()` lands each word with the slam spring, red/cyan chroma ±16 px decaying over 0.25 s, three ghosts zooming out over 0.3 s, and rotating speed lines behind. The next word cuts in on its beat.
- **Break the screen** once, at the peak, with `glass()`: cracks radiate from the impact point and draw on in 70 ms.
- **Cut to silence.** A full flash hides zeroing the camera (`stills`) and swapping to the calm scene. The sweet line lands in stillness. Then rewind visibly: heal the cracks (`glass`'s `heal`, 0.42 s) once the flash has cleared.

## Characters

A character is a rig of parameters over time, built as an SVG with named groups:

- **Body:** position and squash about the feet (`scale(sx sy)` with the origin at the feet).
- **Gaze:** pupils move up to 10 px toward a target and the face follows by half.
- **Blink:** eye scaleY follows |cos| over 0.14 s.
- **Brows:** rotate ±14° (worried / determined), lift 12 px for surprise.
- **Mouth:** a set of shapes (smile, flat, O, wobble, grin) swapped per beat.
- **Props:** a laptop, a shovel, a mug, with the hands placed on the prop's grip points.

Acting goes anticipation → action → settle, with the head leading and the arms following. Offset two characters' timing and amplitude from each other. Hand-drawn life comes from `#boil` (feTurbulence reseeded 12 times a second, displacement 5) on ink groups.

## Transitions with a cause

Use three to five kinds, each caused by something on screen:

- **Object becomes the world:** a reaction pill grows into the rocket.
- **Carry across:** a card flung in one scene lands in the next.
- **Iris from the hit:** `clip-path: circle()` opens from the impact point, 0→2300 px in 0.32 s outCubic.
- **Whip:** a 0.13–0.3 s smear.
- **Flash cut:** covers a world change.

Cut on a move's fastest frame.

## Layout

- Give every layer an explicit `z-index`, and move one only for a beat that needs it (buried under a pile, then standing in front of it).
- When a parent turns off, turn off any child you showed with `show`/`fade`: a child set to visible still shows inside a hidden parent.
- Text over chaos reads through a ground-coloured stroke painted under the fill (`-webkit-text-stroke` with `paint-order: stroke fill`, as in `.slam`).
- Anything thrown off-frame must clear it before gravity returns it: from mid-frame with g = 3600 px/s², launch at vy ≤ −2500 px/s, and hide it at the end of its life.
- Keep readable items inside the 90% action-safe box (96 px margins on 1920×1080), and check the props in front of a character for anything covering its name tag.
