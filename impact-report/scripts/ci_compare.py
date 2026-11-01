#!/usr/bin/env python3
"""Compare one CI job before and after a change, from a ci_fetch.py cache.

    ci_compare.py --data ci.json --job "Required tests" --cut 2026-10-31T19:45:50Z \
        --after-label blacksmith-4vcpu-ubuntu-2404 \
        --rate blacksmith-2vcpu-ubuntu-2404=0.004 --rate blacksmith-4vcpu-ubuntu-2404=0.008 \
        --step "Build=Build test prerequisites" --step "Tests=Run required tests" > numbers.json

Prints {"numbers": ..., "blocks": ...}. Blocks drop into report.json panels as-is.
Durations are seconds; spend is USD.
"""
import argparse
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, time
from pathlib import Path

PR_EVENT = 'pull_request'
CONTROL_ROWS = 6
MIN_SAMPLES = 3


def main():
    a = parse_args()
    data = json.loads(Path(a.data).read_text())
    cut = ts(a.cut)
    since = ts(a.baseline_since) if a.baseline_since else datetime.combine(cut.astimezone().date(), time.min).astimezone()
    rates = dict(r.split('=', 1) for r in a.rate)
    rates = {k: float(v) for k, v in rates.items()}

    jobs_by_run = defaultdict(list)
    for j in data['jobs']:
        jobs_by_run[j['run']].append(j)

    def target(run_id):
        return next((j for j in jobs_by_run[run_id] if j['name'] == a.job), None)

    def is_after(run):
        if a.after_label:
            t = target(run['id'])
            return bool(t and a.after_label in t['labels'])
        return ts(run['created']) >= cut

    eras = {'week': [], 'before': [], 'after': []}
    for run in data['runs']:
        if is_after(run):
            eras['after'].append(run)
        elif ts(run['created']) < cut:
            eras['week'].append(run)
            if ts(run['created']) >= since:
                eras['before'].append(run)

    def target_runs(runs):
        return [t for t in (target(r['id']) for r in runs) if t and t['conclusion'] == 'success']

    def green_prs(runs):
        return [r for r in runs if r['event'] == PR_EVENT and r['conclusion'] == 'success']

    def wall(run):
        js = [j for j in jobs_by_run[run['id']] if j['completed'] and j['conclusion'] != 'skipped']
        last = max(js, key=lambda j: ts(j['completed']))
        return (ts(last['completed']) - ts(run['created'])).total_seconds(), last['name']

    def spend(run):
        return sum(math.ceil(j['dur'] / 60) * rates[j['labels'][0]]
                   for j in jobs_by_run[run['id']] if j['dur'] and j['labels'] and j['labels'][0] in rates)

    def step_groups(t):
        named = {name: sum(t['steps'].get(s) or 0 for s in steps) for name, steps in a.steps}
        listed = {s for _, steps in a.steps for s in steps}
        return {'Setup': sum(v or 0 for k, v in t['steps'].items() if k not in listed), **named}

    tgt = {era: target_runs(runs) for era, runs in eras.items()}
    prs = {era: green_prs(runs) for era, runs in eras.items()}
    walls = {era: [wall(r) for r in runs] for era, runs in prs.items()}

    numbers = {
        'job': a.job,
        'cut': a.cut,
        'baseline_since': since.isoformat(timespec='seconds'),
        'target': {era: summary([t['dur'] for t in ts_]) for era, ts_ in tgt.items()},
        'pr_wall': {era: summary([w for w, _ in ws]) for era, ws in walls.items()},
        'spend_per_pr': {era: round(sum(map(spend, runs)) / len(runs), 4) if runs else None for era, runs in prs.items()},
        'steps': {era: {k: q([step_groups(t)[k] for t in tgt[era]], .5) for k in ['Setup', *(n for n, _ in a.steps)]}
                  for era in ('before', 'after')},
        'last_check': {era: shares([name for _, name in walls[era]]) for era in ('before', 'after')},
        'skipped_after': dict(Counter(j['name'] for r in green_prs(eras['after'])
                                      for j in jobs_by_run[r['id']] if j['conclusion'] == 'skipped')),
        'pr_runs_after': len(prs['after']),
    }

    print(json.dumps({'numbers': numbers, 'blocks': {
        'distribution': distribution(tgt),
        'segments': segments(numbers['steps']),
        'dumbbell': dumbbell(numbers),
        'share': share(a.job, numbers['last_check'], walls),
        'table': control_table(a.job, prs, jobs_by_run, numbers['spend_per_pr']),
    }}, indent=1, ensure_ascii=False))


def distribution(tgt):
    days = defaultdict(list)
    for t in tgt['week']:
        days[ts(t['started']).astimezone().date()].append(t['dur'])
    columns = [{'label': d.strftime('%a %d'), 'kind': 'before', 'values': v} for d, v in sorted(days.items())]
    columns.append({'label': 'After', 'kind': 'after', 'values': [t['dur'] for t in tgt['after']]})
    return {'type': 'distribution', 'unit': 'min', 'columns': columns}


def segments(steps):
    # Setup is neutral, the last (main) step carries the era colour, anything between is mid.
    rows = []
    for era in ('before', 'after'):
        names = list(steps[era])
        parts = [{'label': name, 'value': steps[era][name],
                  'tone': 'neutral' if name == 'Setup' else era if name == names[-1] else 'mid'} for name in names]
        rows.append({'label': era.title(), 'kind': era, 'parts': parts})
    return {'type': 'segments', 'unit': 's', 'rows': rows}


def dumbbell(n):
    return {'type': 'dumbbell', 'unit': 'min', 'rows': [
        {'label': label, 'stat': 'median' if stat == 'p50' else 'p90',
         'before': n[key]['before'][stat], 'after': n[key]['after'][stat]}
        for label, key in [(n['job'], 'target'), ('PR to all-green', 'pr_wall')] for stat in ('p50', 'p90')]}


def share(job, last_check, walls):
    # Tone follows the name so a check keeps its colour across rows: the changed job stays mid, a rival is warn.
    rows = []
    for era in ('before', 'after'):
        top = sorted(last_check[era].items(), key=lambda kv: -kv[1])[:2]
        parts = [{'label': name, 'share': s, 'tone': 'mid' if name == job else 'warn'} for name, s in top]
        rest = 1 - sum(s for _, s in top)
        if rest > 0.001:
            parts.append({'label': 'Other', 'share': rest, 'tone': 'neutral'})
        rows.append({'label': era.title(), 'kind': era, 'n': len(walls[era]), 'parts': parts})
    return {'type': 'share', 'rows': rows}


def control_table(job, prs, jobs_by_run, spend_per_pr):
    durs = defaultdict(lambda: defaultdict(list))
    for era in ('before', 'after'):
        for r in prs[era]:
            for j in jobs_by_run[r['id']]:
                if j['conclusion'] == 'success' and j['dur']:
                    durs[j['name']][era].append(j['dur'])
    names = [n for n, d in durs.items() if n != job and len(d['before']) >= MIN_SAMPLES and len(d['after']) >= MIN_SAMPLES]
    names = [job] + sorted(names, key=lambda n: -q(durs[n]['before'], .5))[:CONTROL_ROWS - 1]
    rows = [{'name': n, 'tag': 'changed' if n == job else 'unchanged', 'highlight': n == job, 'unit': 's',
             'before': q(durs[n]['before'], .5), 'after': q(durs[n]['after'], .5)} for n in names]
    rows.append({'name': 'Spend per PR run', 'tag': 'all jobs', 'unit': 'usd', 'muted': True,
                 'before': spend_per_pr['before'], 'after': spend_per_pr['after']})
    return {'type': 'table', 'columns': ['Job', 'Runner', 'Before', 'After', 'Change'], 'rows': rows}


def summary(xs):
    return {'n': len(xs), 'p50': q(xs, .5), 'p90': q(xs, .9)}


def shares(names):
    c = Counter(names)
    return {k: round(v / len(names), 4) for k, v in c.most_common()} if names else {}


def q(xs, p):
    """Nearest-rank percentile; None when empty."""
    xs = sorted(x for x in xs if x is not None)
    return xs[min(len(xs) - 1, int(p * (len(xs) - 1) + 0.5))] if xs else None


def ts(s):
    return datetime.fromisoformat(s).astimezone()


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data', required=True)
    p.add_argument('--job', required=True, help='the changed job, by its check name')
    p.add_argument('--cut', required=True, help='merge time of the change, ISO 8601')
    p.add_argument('--baseline-since', help='start of the before window; default midnight local on the cut day')
    p.add_argument('--after-label', help='classify runs by the target job’s runner label instead of the cut time')
    p.add_argument('--rate', action='append', default=[], metavar='LABEL=USD_PER_MIN')
    p.add_argument('--step', action='append', default=[], metavar='NAME=STEP[,STEP]',
                   help='named step group; unlisted steps fold into Setup. List the main step last.')
    a = p.parse_args()
    a.steps = [(n, s.split(',')) for n, s in (x.split('=', 1) for x in a.step)]
    return a


if __name__ == '__main__':
    main()
