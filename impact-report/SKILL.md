---
name: impact-report
description: Measure whether a shipped change moved a metric (CI duration, latency, cost) and present the before/after as chart PNGs for Slack. Use when asked if a change improved something, or for charts of a change's impact.
---

# Impact report

Answer "did it help?" with numbers a skeptic accepts, then show them as dark chart panels that read at Slack size. Scripts are in `scripts/`. `examples/blacksmith-4vcpu.json` is a complete report: the CI runner upgrade of Oct 2026, posted to #engineering.

## 1. Frame the comparison

Name the change, when it landed (merge or deploy time), the metric, and which direction is better. Then fix four things:

- **Baseline**: the closest comparable window before the change. A same-day baseline beats a whole week: CI medians drifted from 7.4 to 11.7 min across one week with no related change. Show the wider window only as context.
- **Classification**: decide before or after per sample by what actually ran (runner label, version), with the clock as fallback. Branches opened before the merge keep running the old setup.
- **Control**: something in the same windows the change cannot touch, such as jobs left on the old runner or an unchanged endpoint. A flat control is what rules out "it was just a quieter afternoon".
- **Outcome**: the number people feel (time until a PR is all green, end-to-end latency) next to the part you changed. When the part improves more than the outcome, name the new bottleneck.

For GitHub Actions timings, follow [references/github-actions.md](references/github-actions.md); its scripts fetch the data and compute all four.

Done when every headline number has a baseline, an after, n on both sides, and a control.

## 2. Compute

Use medians and p90; durations are skewed, so a mean misleads. Percent change is `(after − before) / before`. Changes inside the noise band (default ±10%) are reported as flat and drawn gray. When the after sample is small (one afternoon, n≈30), call it an early read and say when to re-check.

Done when every figure the report states comes from computed output, not retyped by hand.

## 3. Write report.json

One panel per finding, usually four: headline, distribution, outcome, control. Each panel title states the finding ("Only the job that changed got faster"), not the topic.

Top level: `title`, `labels {before, after}`, `better` (`lower`|`higher`), `noise` (percent), `panels[]`. A panel has `id`, `eyebrow`, `title` (wrap the key phrase in `==…==` for the accent color), optional `lede`, `blocks[]`, optional `foot`.

| Block | Fields | Shows |
| --- | --- | --- |
| `hero` | `caption, unit, before, after, stats[{label, unit, before, after}], specs{before, after}, sample` | Big % change plus up to three supporting stats; first panel only |
| `distribution` | `unit, columns[{label, kind, values[]}], max?` | Every sample as a dot per column with a median tick: the spread moved, not just the median |
| `segments` | `unit, rows[{label, kind, parts[{label, value, tone}]}]` | Where the time goes, stacked on one shared scale |
| `dumbbell` | `unit, rows[{label, stat, before, after, better?}], max?` | Several metrics before → after with their change |
| `share` | `rows[{label, kind, n, parts[{label, share, tone}]}]` | How a population splits, e.g. which check finishes last |
| `table` | `columns, rows[{name, tag, unit, before, after, highlight?, muted?, better?}]` | The control check; tag `changed`/`unchanged` prints the after/before label |
| `callout` | `title, text` | The new bottleneck or the main caveat |
| `subhead` · `legend` | `text` · `note?` | Section label · before/after key |

Values: `min` and `s` take seconds, `usd` takes dollars, `pct` takes fractions. `kind` is `before` or `after`; `tone` is one of `before`, `after`, `mid`, `neutral`, `warn`.

Done when every panel title states a finding and every chart shows n.

## 4. Render and inspect

```sh
python3 scripts/render.py report.json out/index.html
node scripts/shoot.mjs out/index.html out/
```

`shoot.mjs` writes one 2× PNG per panel plus `full.png`, and prints a one-time setup command when Playwright is missing. Read every PNG: look for labels that collide (dense columns, a tight after-cluster), text clipped inside short segments, and colors that disagree with the direction of change. Fix the data or wording and rerender. Show the user `out/index.html` in the preview pane.

The look (dark panels, green for after, gray for before, mono figures, labels on the marks rather than in legends) lives in `render.py`'s CSS. Change it there, so every report stays consistent.

Done when every PNG has been read at full size and nothing collides or clips.

## 5. Share

To post in Slack, follow [references/slack.md](references/slack.md). Otherwise hand over the `out/` paths.
