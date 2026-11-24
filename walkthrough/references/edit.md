# Edit and compose

Reached from `SKILL.md` steps 4–6. `compose.mjs` implements the layout below; change the config, not the generated project, and rerun.

## Pacing (practitioner advice, X, 2026)

- Keep clicks and typing near 1×; speed loading and waiting 3–5× (or more for long dead air), with a visible chip.
- Hold each result long enough to read it; never cut on the frame a state appears.
- One emphasis per beat, held at least 1.5 s; zooming on every tap feels jumpy.
- Captions must work muted, show the result as well as the action, and never cover the control being taught.

## Tightening a long cut

Read the event table beat by beat and take time from, in order: idle lead-ins that repeat the previous beat's last frame, holds past 3–4 s after the last result, waits for a driver or reload (speed 2×), repeated sequences the viewer just saw (≤2.5×), long dead screens (6–10×), then title and end card length (shorten the text, not the reading time). Keep every surface each beat shows. Report each change with its timestamp, seconds saved and reason.

## Layout (1920×1080)

- Header: beat chip ("2 / 6") and title left; wall clock right with a note that all screens show the same moment; speed chip under the clock.
- Panes in one row at one height, each keeping its aspect, labelled above; caption columns under each pane with its `captionLabel`.
- Emphasis: an accent box with a light dim of the rest of the pane; an optional zoom of 1.1–1.25× anchored at the box's left edge so the box stays inside the pane.
- Tap ripples at the logged point, refresh pills at reloads, callouts with exact message copy on the recipient's pane.
- A short cross-dip at beat boundaries; title and end card as separate scenes.
- `hyperframes check` warns on the per-second clock clips, on silence and on the phone-size type floor; those are expected for a muted 1080p walkthrough. Fix the others.

## Contact sheet and short copy

The contact sheet is one rendered frame per beat (at its emphasis, else its midpoint), two per row, so it carries the same captions as the film. The short copy is 720p at CRF 25 with faststart, a few MB for chat tools.
