# walkthrough.config.json

Reached from `SKILL.md`. Paths are relative to the config file. Times in `cut`, `emphasis` and `callouts` are **master seconds** from `sync.mjs`'s event table. Full example: [example.config.json](example.config.json), a courier delivery shown on a courier app (iOS Simulator), a customer web app and an ops dashboard.

## Top level

| Key | Meaning |
| --- | --- |
| `name` | Output file prefix |
| `out` | Output folder (default `walkthrough-out`); takes go in `take-<stamp>/` |
| `timezone` | IANA zone for the on-screen wall clock |
| `reset` | Optional shell command run before capture (reseed, reset fixtures) |
| `playwrightFrom` | Folder whose `node_modules` provides `playwright` (default: the config's folder) |
| `capture` | `{ preRoll: 4, settle: 20, driverGrace: 60 }` seconds |
| `sync` | `{ lead: 3, tail: 2, iosLag: 0.35, t0 }`: master t=0 is the first cue minus `lead` unless `t0` (epoch s) is set |
| `title` | `{ kicker, heading, subtitle, footer }`; `titleSeconds` (5.5) |
| `endCard` | `{ heading, columns: [{ heading, rows: [{k, v}] or [{v}] }], footer }`; `endSeconds` (13) |
| `clockNote` | Text under the clock (default "same moment on every screen") |
| `style` | `{ ground, ink, muted, accent, chip, chipInk, display, body, colors[] }` overrides |

## Surfaces

Common: `name`, `kind` (`ios-sim` or `browser`), `label` (above the pane), `captionLabel` (e.g. "Customer sees"), `color`, `masterWidth` (upscale small captures for zooms).

- **browser:** `url`, `viewport`, `deviceScaleFactor`, `hasTouch`, `userAgent`, `storageState` (signed-in state file), `setup` (module run before recording, e.g. sign-in), `driver` (module run during the take), `blur` (regex strings; matching text is blurred on every frame).
- **ios-sim:** `udid` (explicit; `booted` is refused). `taps: { pattern, points }`: a regex matched against beat-command output lines; its first capture group is the tap label. `points` maps label → `[x, y]` fractions of the screen, or a list used in order when one label is tapped in several places. Labels of the form `point (50%,87%)` (Maestro's point taps) need no entry.

Phone-shaped screen recordings of a browser: give the device's viewport, DPR, touch and user agent, and leave mobile emulation off (CDP screencast stalls under it).

### Driver API

A driver module's default export receives `{ page, context, mark, click, reload, goto, waitCue, waitFor, sleep }`:

- `click(locator, note)` logs a tap at the element centre, then clicks.
- `reload(note)` and `goto(url, note)` log a refresh pill, then navigate.
- `waitCue(beatId)` resolves when that beat starts; `"end"` after the last beat.
- `waitFor(async () => boolean)` polls (500 ms) for the real event.
- `mark(kind, note, extra)` logs any event.

Any beat command can log too: print `WT-MARK {"surface":"courier","kind":"tap","note":"Start delivery","x":0.5,"y":0.8}`.

## Beats

| Key | Meaning |
| --- | --- |
| `id`, `title` | Stable id and on-screen title |
| `run` | Shell command that performs the beat on the acting surface (e.g. a Maestro flow); its output is stamped |
| `settle` | Seconds to wait after `run` so every surface can show the result |
| `captions` | `{ surfaceName: text }` |
| `cut` | `[[start, end, speed?], …]` master seconds, filled in after sync |
| `emphasis` | `{ surface, from, to, box: [x0, y0, x1, y1] fractions, zoom?, origin? }` |
| `callouts` | `[{ surface, from, to, label, body }]` e.g. the exact text message sent |
