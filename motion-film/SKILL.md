---
name: motion-film
description: Direct a high-energy animated short from real material (a script, a chat channel, a repo, a launch) and render it as code. A ten-question director's grill, a story mined from the sources, game-feel motion, a beat-synced mix, shutter blur. Use when asked for a crazy, funny, hype, recap or launch video.
---

# Motion film

You are the director. The person brings the intent and the material; you make the creative calls (story, metaphor, look, pacing, sound) and they approve at the gates they chose.

Everything on screen is a pure function of time. `render(t)` in `assets/film.js` recomputes every element from one clock, so any frame renders on its own; snapshots, parallel renders and shutter blur all depend on that. The starter project is `template/`, and `/hyperframes` holds the render contract it runs on.

## 1. Read the material

Read what the person gave (script, links, channel, repo, docs) and skim the sources it points to. Collect the real quotes, numbers, running jokes, the question that keeps coming back, and any tip or object that could become a prop.

Done when you can name the subject, the audience you assume, and one candidate metaphor, and have a recommended answer for every brief question below.

## 2. Grill for the brief

Ask, in one batch, the questions the material has not already answered: ten at most. Put your recommended answer first on each, drawn from the material, so accepting it is one tap.

1. **Where it plays:** an internal team channel, public social, or a product page? This decides privacy, aspect ratio and whether it must read with the sound off.
2. **The last frame:** what should a viewer feel or know when it ends?
3. **Material in bounds:** which sources may appear on screen, and what stays out?
4. **Tone:** chaotic hype, deadpan comedy, warm, or epic trailer?
5. **Cast:** real people as characters (named or not), a mascot, or no characters?
6. **Must-haves:** the lines, numbers, gags or moments that have to appear.
7. **Look:** the subject's own brand, or a direction (paper and ink cartoon, bold poster, dark editorial), plus colours to use or avoid.
8. **Sound:** the generated beat, the person's own track, a catalogue track (HeyGen sign-in), and whether there's a voiceover.
9. **Length and shape:** 15, 30 or 60 s; 16:9, 9:16 or 1:1.
10. **Gates:** approve the treatment before the build (recommended), also approve a storyboard sheet before the render, or the director's cut straight through.

Craft is yours, not a question: pacing, easing, palette values, type, framing, transitions and the mix.

Done when `BRIEF.md` records an answer to every question, or marks it as the director's call.

## 3. Write the treatment

`TREATMENT.md` holds:

- a logline and the metaphor
- the beat table on a 120 BPM grid: time, picture, sound
- the look: palette hexes and faces
- the sound plan
- the facts list, with each number's source

Follow [references/story.md](references/story.md). When the brief names a reference (a creator, a site, a video), study it first with [references/research.md](references/research.md) and list the techniques you're taking. Present the treatment at the gate the brief chose.

Done when every beat is an action inside the metaphor, every on-screen claim traces to a source, and the person has approved where the brief gates it.

## 4. Scaffold

```sh
npx hyperframes init <dir> --non-interactive --skip-skills
cp -R <skill-dir>/template/. <dir>/
mkdir -p <dir>/assets/sfx && cp ~/.agents/skills/media-use/audio/assets/sfx/*.mp3 <dir>/assets/sfx/
cd <dir> && chmod +x finish.sh && node build-audio.mjs
npx hyperframes snapshot --at 0,3.6,5.8
```

`--skip-skills` stops `init` from writing HyperFrames skills into the global skills folder. When `/hyperframes` is missing, install it deliberately with `npx hyperframes skills update`. This skill's brief and treatment replace its storyline step.

Done when the demo snapshots show the opener, the cracked GO slam and the sweet line.

## 5. Build

1. Put every time in `assets/cues.js`.
2. Replace the demo scenes in `assets/film.js`, using `assets/engine.js` (springs, trauma camera, hit-stop, flashes, rings, slams, glass).
3. Set the palette and faces in `index.html`. Fonts outside the bundled set need `@font-face` to a file in `assets/fonts`.
4. Keep `T.duration` and the root `data-duration` equal.
5. For 9:16 or 1:1, change the canvas size in `index.html` and pass `w`/`h` to `slam` and `glass`.

Apply [references/motion.md](references/motion.md) to every beat.

Done when a snapshot at each beat's midpoint shows the intended frame and frame 0 shows a real artifact.

## 6. Mix

`node build-audio.mjs` mixes `assets/audio/mix.wav` from the same cues. Follow [references/sound.md](references/sound.md).

Done when the mix measures −14 ± 1 LUFS with a true peak at or below −1.5 dBTP, and every hit's onset lands within ±40 ms of its frame.

## 7. Review

Snapshot every beat's midpoint, plus 0.1 s before and 0.2 s after each cut (`npx hyperframes snapshot --at …`). Read each contact sheet, then open the frames full size. Look for:

- text that clips or collides
- things re-entering the frame
- props covering a name
- a dead first frame

Fix, then re-snapshot what changed.

`npx hyperframes check` reports `first_frame_empty` and `dead_stretch` on every single-clock film, whatever it shows. Trust the snapshots for those two and fix every other finding.

Done when every beat has been read at full size since its last change.

## 8. Render and deliver

```sh
npx hyperframes render --fps 120 --quality delivery --output renders/film-120.mp4
./finish.sh
```

`finish.sh` blends each pair of 120 fps frames into 60 fps with shutter blur and muxes the current mix into `renders/film.mp4`. HyperFrames turns its own motion blur off for its parallel and range renders, so the blur comes from here. A sound-only change needs just `node build-audio.mjs && ./finish.sh`.

Verify the delivered file itself:

- `ffprobe` shows the planned size, 60 fps, AAC, and the planned duration.
- Frames extracted with ffmpeg at the key beats look right.
- `npx hyperframes audio renders/film.mp4 --json` gives the loudness.

Show it with the preview tool. Name `renders/film.mp4` as the file to post (the 120 fps master is the source for re-encoding). List anything internal on screen when the brief says public.

Done when the delivered file itself has been measured and looked at.
