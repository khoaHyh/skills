#!/usr/bin/env python3
"""Fetch GitHub Actions run and job timings for one workflow into a JSON cache.

    ci_fetch.py --repo OWNER/NAME --workflow ci.yml --since 2026-10-25 --out ci.json

Read-only: uses `gh` with the caller's auth. Re-run with the same --out to refresh.
"""
import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

RUN_LIMIT = 5000


def gh(*args):
    return subprocess.run(['gh', *args], check=True, capture_output=True, text=True).stdout


def ts(s):
    return datetime.fromisoformat(s) if s else None


def seconds(start, end):
    a, b = ts(start), ts(end)
    return (b - a).total_seconds() if a and b else None


def fetch_jobs(repo, run_id):
    lines = gh('api', '--paginate', '--jq', '.jobs[]', f'repos/{repo}/actions/runs/{run_id}/jobs?per_page=100')
    jobs = []
    for line in lines.splitlines():
        j = json.loads(line)
        jobs.append({
            'run': run_id,
            'name': j['name'],
            'conclusion': j['conclusion'],
            'labels': j['labels'],
            'started': j['started_at'],
            'completed': j['completed_at'],
            'dur': seconds(j['started_at'], j['completed_at']),
            'steps': {s['name']: seconds(s.get('started_at'), s.get('completed_at')) for s in j.get('steps') or []},
        })
    return jobs


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--repo', required=True)
    p.add_argument('--workflow', required=True)
    p.add_argument('--since', required=True, help='YYYY-MM-DD, compared against run creation')
    p.add_argument('--out', required=True)
    a = p.parse_args()

    raw = json.loads(gh('run', 'list', '-R', a.repo, '--workflow', a.workflow, '--limit', str(RUN_LIMIT),
                        '--created', f'>={a.since}', '--json', 'databaseId,event,headBranch,createdAt,conclusion,status'))
    if len(raw) == RUN_LIMIT:
        print(f'warning: hit the {RUN_LIMIT}-run limit; the oldest runs after --since are missing', file=sys.stderr)
    runs = [{'id': r['databaseId'], 'event': r['event'], 'branch': r['headBranch'],
             'created': r['createdAt'], 'conclusion': r['conclusion']}
            for r in raw if r['status'] == 'completed' and r['conclusion'] != 'skipped']

    with ThreadPoolExecutor(12) as pool:
        jobs = [j for batch in pool.map(lambda r: fetch_jobs(a.repo, r['id']), runs) for j in batch]

    Path(a.out).write_text(json.dumps({'repo': a.repo, 'workflow': a.workflow, 'since': a.since,
                                       'fetched_at': datetime.now().astimezone().isoformat(timespec='seconds'),
                                       'runs': runs, 'jobs': jobs}))
    print(f'{len(runs)} runs, {len(jobs)} jobs -> {a.out}', file=sys.stderr)


if __name__ == '__main__':
    main()
