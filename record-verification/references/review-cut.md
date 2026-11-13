# Review cut

A review cut makes each change readable at the size a PR shows it (about 900 px wide). It tells the reviewer what to look at, and lets them map every frame back to the original take. It is edited for legibility and continuity only: there is no music, shake, flash or decorative transition.

## Anatomy

Nothing covers the footage. From top to bottom, through time:

| Part | What it carries |
|---|---|
| Title card (poster frame, ≤ 4.5 s) | The PR, what changed, and **Watch for:** the one sentence the reviewer judges |
| Per-pane top bar, always on | `Before · main @<sha>` / `After · <branch> @<sha>`; that pane's original take clock; chips for each retiming (`N× · real S s`), `✂ cut S s`, `⏸ freeze S s`, and any `static crop` |
| Footage | Before on the left and After on the right, playing simultaneously; each full captured UI surface is statically framed, with orange evidence marks. After-only evidence uses one full-width pane |
| Shared caption strip, under both panes | `n / N` and one line of what the beat shows |
| Results card | Each claim marked `✓ seen`, `✗ failed`, or `? your call` |

## Beats

Each beat pairs the same action and result from both takes. Both panes enter and leave the beat together.

- **Caption:** what the beat shows, in the words a user would use, present tense, about 12 words at most, with numbers copied from the screen. It stays up at least 0.5 s plus 0.3 s a word (1.5 s minimum).
- **Framing:** keep the full captured UI surface in matching static framing in each pane throughout the cut. Marks and captions direct attention to the changed result while preserving page context. Check readability before capture at about 900 px for the whole player, including bars and captions, not 900 px per pane. Desktop takes also stay side by side at reduced width. Reserve a static `focus` crop for an isolated result that remains unreadable after capture planning; retain surrounding layout and match it across Before/After. State the specific unreadable result and why the crop is needed on the title card and in the review packet; the builder labels it `static crop`. In multi-beat cuts the builder rejects a cropped majority per take, and it rejects consecutive cropped beats with different rectangles. Recapture with a readable viewport/scale instead of zooming between regions. A single-result detail clip may use one justified crop. Camera position and scale stay fixed within each beat.
- **Marks:** one box per piece of evidence, appearing at the source time the state changes. Orange to direct attention, red for a failure. Mark only what the caption names.
- **Synchronization:** set each side's `from` at the same meaningful action and probe its `resultAt` in the source. The builder aligns both starts and both result frames by retiming each action→result span to the longer span's declared playback duration. Each pane shows its actual rate and source duration. Post-result footage (`resultAt`→`to`) plays at that side's declared `rate`; the side that finishes first freezes until the shared beat ends. `hold` adds a shared result hold. The next beat starts both sides together.
- **Before and After:** pair the same beats, in the same order, with identical framing, including any exceptional crop. Judge latency using source-clock differences and the unchanged takes, not the synchronized cut's display duration; synchronization can slow one side down. If a baseline is unavailable, omit Before rather than fabricating a comparison.

## Retiming

| Stretch | Treatment |
|---|---|
| Waits the change doesn't own (loading, matching, navigation) | 2–4×, chip with the real duration |
| Nothing changes on screen | Cut; the chip shows the cut length |
| A result shorter than its read time, or one side finishing first | Freeze its endpoint; that pane's chip shows the freeze |
| Paired action→result spans | Align starts/results; each pane's chip shows any synchronization retiming |
| Errors, flicker, layout shift, latency under review | Preserve the source evidence; inspect the unchanged 1× take for timing judgments |

## Timing claims

Find each state change by probing the evidence region's pixels in the source, not by eyeballing a contact sheet. Freeze detection and low-resolution sheets both miss a 60 px status pill changing colour. Average the region's colour every 0.04 s and print where it changes:

```sh
for s in $(seq 15.4 0.04 18.5); do printf "%s " $s; ffmpeg -v error -ss $s -i take.webm -frames:v 1 \
  -vf "crop=60:18:1310:381,scale=1:1" -f rawvideo -pix_fmt rgb24 - | xxd -p; done | uniq -f1
```

Probe both takes. Use the measured times for each side's `resultAt`, `markAt`, `from`/`to`, and for any duration a caption or result states ("about 2.5 s after Book").

## The edit decision list

`scripts/build-cut.mjs` reads `edl.json`; paths resolve from its directory, and coordinates are source pixels. `source` is the takes' shared size in pixels: capture Before and After at the same viewport. The canvas is 1920×1080; each source fits fully inside its pane, including portrait phone takes. This schema replaces sequential `sections`: pair corresponding source ranges in shared `beats`.

```json
{
  "title": "What changed, as the reviewer would say it",
  "ref": "PR #123 · <branch>",
  "watch": "the one thing to judge",
  "source": [1440, 900],
  "takes": {
    "before": { "label": "Before · main @abc1234", "src": "takes/before.webm" },
    "after": { "label": "After · task @def5678", "src": "takes/after.webm" }
  },
  "beats": [
    {
      "caption": "Status changes",
      "before": { "from": 1, "resultAt": 5, "to": 7, "mark": [1310, 381, 60, 18] },
      "after": { "from": 2, "resultAt": 4, "to": 4, "mark": [1310, 381, 60, 18] }
    },
    {
      "caption": "Result remains visible",
      "before": { "from": 8, "to": 10 },
      "after": { "from": 6, "to": 8 },
      "hold": 1
    }
  ],
  "results": [["claim the video shows", "pass"], ["what the reviewer decides", "judge"]]
}
```

- **Takes:** `after` is required. Omit `takes.before` and every beat's `before` for an after-only single-pane cut. Each present take needs a label and source file; each beat needs a range for each present take.
- **Source ranges:** `from` starts the action; `resultAt` is the measured result frame, defaulting to `to` when no post-result footage is needed. Use `0 <= from < resultAt <= to`, with `to` a valid frame inside the take (also used for freezes). Each side's `rate` defaults to 1; its action span may play more slowly to align with its partner. In the example, Before's action plays at 1×, After's at 0.5×; both results land after four output seconds, then After freezes for two seconds while Before finishes its post-result footage.
- **Shared beat fields:** `caption` is below both panes. `hold` adds that many seconds of freeze to both sides after the longer side finishes; it defaults to 0.
- **Per-side evidence:** omit `focus` for full frame. For the readability exception above, `focus: [x, y, w, h]` is static for that side of that beat only; a take's optional `focus` supplies its default override. Match crop rects across paired takes. Framing changes take effect immediately, without camera motion. `mark` is one rect or a list of up to three; `markAt` defaults to `resultAt`. `tone: "fail"` makes marks red. A gap between that side's previous `to` and next `from` becomes its own labelled cut.
- **Result verdicts:** `pass`, `fail` or `judge`.

The builder prints a pacing table, flagging beats shorter than their read time and long 1× beats with nothing marked. It writes `chapters.md` from the shared output clock, with per-side source ranges, result anchors, rates, crops, cuts, and freezes.

## Build and render

```sh
npx hyperframes init <cut-dir> --non-interactive --skip-skills
node <skill-dir>/scripts/build-cut.mjs edl.json <cut-dir>
cd <cut-dir> && npx hyperframes check
npx hyperframes snapshot --at <each beat midpoint, each state change ±0.2 s>
npx hyperframes render --quality delivery --output renders/review.mp4
```

`check` reports `film_silent` and `audio_none` on every review cut, since review cuts carry no sound; fix any other finding. A one-minute cut renders in under a minute.

For builder maintenance, run `node --test <skill-dir>/scripts/build-cut.test.mjs` (requires `ffmpeg`); it builds paired and after-only cuts from a generated fixture and checks synchronization, freeze extraction, pane labels/clocks/chips, and static framing.
