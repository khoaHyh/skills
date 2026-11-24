---
name: walkthrough
description: Film one real user flow across several screens in sync (mobile simulators, web apps, admin tools), with per-beat captions, one emphasis per beat and honest disclosure; ships the film, a short copy, a contact sheet and synced masters. Use for demo, walkthrough or training videos that teach a flow.
---

# Walkthrough

A walkthrough teaches one flow: what one person did, what every other party sees, and where staff look, shown on the real apps at the **same wall-clock moment**, at a calm pace a newcomer can follow with the sound off.

It is not proof of a code change (a before/after review cut that a reviewer judges), and not a hype or launch film (music, beat-synced motion, persuasion).

Bundled scripts run the pipeline from one project file, `walkthrough.config.json` ([references/config.md](references/config.md)): `capture.mjs` records, `sync.mjs` builds masters on one clock, `compose.mjs` cuts, renders and builds the contact sheet. Each checks its dependencies first: Node 22+, ffmpeg/ffprobe, Playwright (browser surfaces), Xcode `simctl` (iOS Simulator surfaces), the HyperFrames CLI (`npx hyperframes`; load `hyperframes` before changing the generated project).

## 1. Frame the beats

Write the **beat table** first: per beat, the action, what each surface shows after it, and where to look (exact page › section). Take labels, routes and copy from the product, not the brief; correct the brief where they differ. Choose beats by the change a viewer must notice: one action and its visible result per beat, five to eight beats for a flow. Pick **one emphasis** per beat: the region that changed.

Done when every beat names an action, a visible result on every surface and one emphasis region, each a claim you can check against a frame.

## 2. Rig and rehearse

Use an environment you own and synthetic data. Write the config: surfaces, beat commands, optional `reset`. Write a **driver** per reacting surface that waits for the real event (an API state, a DB row) and then reloads, rather than sleeping. Gotchas: [references/rig.md](references/rig.md).

Rehearse the whole flow once on a disposable reset, screenshot each step, and record exact labels, tap points, permission prompts, picker order and wait-for text. Then reset.

Done when one rehearsal ran end to end and every selector, tap point and wait-for text is confirmed on screen.

## 3. Capture

Prepare (sign-ins, opt-ins, clean start screen), then `node scripts/capture.mjs walkthrough.config.json`. One take covers every beat on every surface.

Done when each beat's after-state is in the take on every surface. If one is missing or wrong, **re-film** the whole take; a separate pickup only with an on-screen disclosure.

## 4. Sync and choose the cut

`node scripts/sync.mjs walkthrough.config.json` writes masters and prints every event in master seconds. From that table write each beat's `cut`: `[start, end, speed]` segments in master seconds. Pacing:

- Key taps and state changes play at **1×**. Speed only waits (pickers opening, review screens, idle sheets, pending reloads): 2–3× for short waits, up to 10× for long dead air, under 2.5× for steps the viewer already saw. Every speed-up applies to all panes and shows a chip.
- Start a beat 1–2 s before its first action; end it once the slowest surface has held its result **≥3 s**.
- Target about 15–20 s per beat plus a 5–6 s title and a 12–15 s end card: 2–3 minutes for six beats. If shortening needs faster taps or dropped surfaces, stop: the film is at its length.

**Re-edit vs re-film:** re-edit from the masters when the problem is time (holds, waits, order, captions). Re-film when a surface lacks the state the caption claims, a recorder failed, or the wrong data or media is on screen.

Done when every beat has a cut and the timing rules hold for each.

## 5. Captions, emphasis, cards

Per beat, one caption per surface in the form **actor did / X sees / where Y looks**, under ~90 characters for a phone-width column. Name the control as labelled on screen, say what changed, and point to the place to look (page › section). Write what a viewer can verify in the frame; anything seen only elsewhere goes on the end card with its source. Add an `emphasis` box (optional zoom) and `callouts` for messages sent (exact copy). The end card recaps where to look, the surprises seen in the take, and every disclosure (environment, synthetic data, one clock, cuts, speed-ups, reloads, test senders, media credits). Layout and craft: [references/edit.md](references/edit.md).

## 6. Compose and review

Run `node scripts/compose.mjs walkthrough.config.json` (`--beats id,id` for an excerpt). Then read rendered frames at every state change, every sped-up segment, the title, the end card and each beat's last frame. Every caption claim must map to a visible frame, every chip to its segment, and nothing private or real may be on screen.

Done when that check passes on the rendered file and the deliverables exist: `<name>-1080p.mp4`, `<name>-720p.mp4`, `<name>-contact-sheet.png`, `<name>-beats.json` and the take's `masters/`. Stop the stack, recorders and simulators you started.
