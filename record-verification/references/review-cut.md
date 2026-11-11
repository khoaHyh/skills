# Review cut

A review cut makes each change readable at the size a PR shows it (about 900 px wide). It tells the reviewer what to look at, and lets them map every frame back to the original take. It is edited for legibility and continuity only: there is no music, shake, flash or decorative transition.

## Anatomy

Nothing covers the footage. From top to bottom, through time:

| Part | What it carries |
|---|---|
| Title card (poster frame, ≤ 4.5 s) | The PR, what changed, and **Watch for:** the one sentence the reviewer judges |
| Section card per take | `Before · main @<sha>` or `After · <branch> @<sha>` |
| Top bar, always on | The section label; the take clock (the original take's timestamp); a chip for every retiming: `⏩ N× · real S s`, `✂ cut S s`, `⏸ freeze S s`; `static crop` during an explicit framing override |
| Footage | The full captured UI surface, statically framed, with orange marks on the evidence |
| Caption strip, under the footage | `n / N` and one line of what the beat shows |
| Results card | Each claim marked `✓ seen`, `✗ failed`, or `? your call` |

## Beats

Each beat is one action and its result, in one or more continuous stretches of a take.

- **Caption:** what the beat shows, in the words a user would use, present tense, about 12 words at most, with numbers copied from the screen. It stays up at least 0.5 s plus 0.3 s a word (1.5 s minimum).
- **Framing:** keep the full captured UI surface in the same framing throughout the cut. Marks and captions direct attention while the reviewer can judge layout, spacing, alignment, hierarchy, layout shifts, and side effects. Only when specific evidence text is unreadable at about 900 px wide, opt into a static `focus` crop that retains the surrounding layout. State what was unreadable and why the crop is needed on the section card and in the review packet; the builder labels it `static crop`. Camera position and scale stay fixed within each beat, including overrides.
- **Marks:** one box per piece of evidence, appearing at the source time the state changes. Orange to direct attention, red for a failure. Mark only what the caption names.
- **Before and After:** run the same beats, in the same order, with identical framing, including any exceptional crop, so the reviewer compares like with like.

## Retiming

| Stretch | Treatment |
|---|---|
| Waits the change doesn't own (loading, matching, navigation) | 2–4×, chip with the real duration |
| Nothing changes on screen | Cut; the chip shows the cut length |
| A result shorter than its read time | Freeze its last frame; the chip shows the freeze |
| The action, the frame where state changes, errors, flicker, layout shift, latency under review | 1× |

## Timing claims

Find each state change by probing the evidence region's pixels in the source, not by eyeballing a contact sheet. Freeze detection and low-resolution sheets both miss a 60 px status pill changing colour. Average the region's colour every 0.04 s and print where it changes:

```sh
for s in $(seq 15.4 0.04 18.5); do printf "%s " $s; ffmpeg -v error -ss $s -i take.webm -frames:v 1 \
  -vf "crop=60:18:1310:381,scale=1:1" -f rawvideo -pix_fmt rgb24 - | xxd -p; done | uniq -f1
```

Use the measured times for `markAt`, for each beat's `from`/`to`, and for any duration a caption or result states ("about 2.5 s after Book").

## The edit decision list

`scripts/build-cut.mjs` reads `edl.json`; paths resolve from its directory, and coordinates are source pixels. `source` is the takes' size in pixels, and every take in one cut shares it: record Before and After at the same viewport. The canvas is 1920×1080, so a portrait phone take plays pillarboxed with the whole phone surface visible.

```json
{
  "title": "What changed, as the reviewer would say it",
  "ref": "PR #123 · <branch>",
  "watch": "the one thing to judge",
  "source": [1440, 900],
  "sections": [
    { "label": "Before · main @abc1234", "src": "takes/before.webm", "beats": [
      { "from": 1.0, "to": 5.9, "caption": "…", "mark": [x, y, w, h], "markAt": 2.0 },
      { "from": 5.9, "to": 10.3, "rate": 2.5, "caption": "…" },
      { "from": 14.6, "to": 16.3, "caption": "…", "mark": [[x, y, w, h], [x, y, w, h]], "tone": "fail", "hold": 1.0 }
    ] }
  ],
  "results": [["claim the video shows", "pass"], ["what the reviewer decides", "judge"]]
}
```

- **Beat fields:** `rate` defaults to 1. Omit `focus` for full frame. For the readability exception above, `focus: [x, y, w, h]` is a static override for that beat only; a section's optional `focus` supplies the same static override to all its beats unless a beat overrides it. Framing changes take effect immediately, without camera motion. `mark` is one rect or a list of up to three. `markAt` defaults to 1.5 s before `to`. `hold` freezes the last frame for that many seconds. A gap between one beat's `to` and the next beat's `from` becomes a labelled cut.
- **Result verdicts:** `pass`, `fail` or `judge`.

The builder prints a pacing table, flagging beats shorter than their read time and long 1× beats with nothing marked. It writes `chapters.md`, the timestamped beat list for the PR body, from the same clock as the video.

## Build and render

```sh
npx hyperframes init <cut-dir> --non-interactive --skip-skills
node <skill-dir>/scripts/build-cut.mjs edl.json <cut-dir>
cd <cut-dir> && npx hyperframes check
npx hyperframes snapshot --at <each beat midpoint, each state change ±0.2 s>
npx hyperframes render --quality delivery --output renders/review.mp4
```

`check` reports `film_silent` and `audio_none` on every review cut, since review cuts carry no sound; fix any other finding. A one-minute cut renders in under a minute.
