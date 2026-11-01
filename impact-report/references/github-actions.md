# GitHub Actions timings

Fetch once into a cache, then compare as often as needed. Both scripts are read-only and use your `gh` auth.

## 1. Fetch

```sh
python3 scripts/ci_fetch.py --repo OWNER/NAME --workflow ci.yml --since 2026-10-25 --out ci.json
```

Start `--since` about a week before the change so the distribution shows the normal day-to-day drift. The script skips runs that were skipped entirely and fetches every job with its step timings.

## 2. Compare

```sh
python3 scripts/ci_compare.py --data ci.json --job "Required tests" \
  --cut "$(git log -1 --format=%cI <merge-sha>)" \
  --after-label blacksmith-4vcpu-ubuntu-2404 \
  --rate blacksmith-2vcpu-ubuntu-2404=0.004 --rate blacksmith-4vcpu-ubuntu-2404=0.008 \
  --step "Build=Build test prerequisites" --step "Tests=Run required tests" > numbers.json
```

- `--job`: the changed job's check name.
- `--cut`: when the change merged. Runs created before it are "before".
- `--after-label`: for runner changes, classify a run as "after" by the job's runner label, since branches that haven't rebased keep the old runner. Leave it out to split by `--cut` alone.
- `--baseline-since`: start of the before window. Defaults to midnight on the cut day. Widen it when that gives fewer than about 30 before runs.
- `--rate`: per-minute price for each priced runner label. Jobs bill per started minute. Unpriced labels, such as GitHub-hosted runners on free minutes, count as $0.
- `--step`: named step groups, main step last. Unlisted steps fold into Setup.

## 3. Read the output

`numbers` holds the figures for the prose. `blocks` drops straight into `report.json` panels: retitle the after column, then write the panel titles from the numbers.

- `target`: the changed job's successful runs, as `{n, p50, p90}` for `week` (all before), `before` (baseline window) and `after`.
- `pr_wall`: successful `pull_request` runs, from run creation to the last job finishing. This is "time until a PR is all green", the outcome people feel.
- `last_check`: for those runs, the share where each job finished last, i.e. the bottleneck. When the changed job stops leading, name what replaced it.
- `spend_per_pr`: average priced spend per successful PR run.
- `skipped_after`: jobs skipped in after runs, so you can check path filters against what was expected.
- `blocks.table`: the control. It lists the changed job, the slowest other jobs with at least 3 runs in both windows, and a spend row. Unchanged jobs within the noise band are the evidence.

Wall time includes queue time. Blacksmith starts jobs immediately; GitHub-hosted runners can queue, which shows up as slower PRs with unchanged job durations.
