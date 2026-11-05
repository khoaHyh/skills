#!/usr/bin/env python3
"""Digest recent OpenCode work into one file per task tree for /mine.

A task tree is a root session plus every session it delegated to. The digest
records what happened (Khoa's turns, what the agent said just before each,
question answers, dispatches, child reports, tool failures, attached skills);
deciding what counts as a correction is left to the reader.

Read-only: every request is `opencode api get`. Digests hold raw session text,
so they stay in --out on this machine.

  digest.py --days 14 [--directory ~/dev/platform ...] [--out DIR]
  digest.py --root ses_...            # one task tree, any age (used by /adapt)
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

PAGE = 200  # the API's maximum page size
SECRET = re.compile(
    r"(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,}"
    r"|Bearer\s+[A-Za-z0-9._-]{16,}|(?i:(?:password|secret|token)\s*[=:]\s*)\S{6,})"
)


def api(path):
    # Write to a file: piped output of large responses has been truncated.
    with tempfile.TemporaryFile() as out:
        run = subprocess.run(["opencode", "api", "get", path], stdout=out, stderr=subprocess.PIPE)
        out.seek(0)
        body = out.read()
    if run.returncode:
        raise RuntimeError(f"GET {path} failed: {(run.stderr or body).decode(errors='replace')[:300]}")
    return json.loads(body)


def session(sid):
    return api(f"/api/session/{sid}")["data"]


def paged(path, stop=None):
    base, _, query = path.partition("?")
    # A cursor carries its own order; the API rejects both together.
    later = "&".join(p for p in query.split("&") if p and not p.startswith("order="))
    cursor = None
    while True:
        params = f"{later}&cursor={cursor}" if cursor else query
        page = api(f"{base}?{params}{'&' if params else ''}limit={PAGE}".replace("?&", "?"))
        for item in page["data"]:
            if stop and stop(item):
                return
            yield item
        cursor = (page.get("cursor") or {}).get("next")
        if not cursor or len(page["data"]) < PAGE:
            return


def clip(text, limit):
    text = SECRET.sub("[redacted]", re.sub(r"\s+", " ", text or "").strip())
    return text if len(text) <= limit else text[:limit] + " …"


def stamp(ms):
    return datetime.fromtimestamp(ms / 1000).strftime("%m-%d %H:%M")


def home(path):
    return (path or "?").replace(os.path.expanduser("~"), "~", 1)


def tool_text(state):
    return " ".join(c.get("text", "") for c in state.get("content") or [] if c.get("type") == "text")


def skills_of(message):
    return [f"{s.get('name')}@{hashlib.sha256((s.get('text') or '').encode()).hexdigest()[:8]}"
            for s in message.get("skills") or []]


def summarize(messages, since=0, brief=False):
    room = 160 if brief else 700  # agent-side text; Khoa's words keep their full allowance
    """Reduce one session's messages to digest lines and counts."""
    lines, users, answers, failures, tools = [], 0, 0, 0, 0
    last_said, skills, final = "", [], ""
    for m in messages:
        kind, mid = m.get("type"), m.get("id")
        created = (m.get("time") or {}).get("created", 0)
        when = stamp(created)
        if created < since:
            # Earlier turns only supply what the agent last said.
            for part in m.get("content") or [] if kind == "assistant" else []:
                if part.get("type") == "text" and part.get("text"):
                    last_said = part["text"]
            continue
        if kind == "user":
            users += 1
            skills += skills_of(m)
            if users > 1 and last_said:
                lines.append(f"- [{mid} {when}] agent said before: {clip(last_said, 300 if brief else 500)}")
            attached = f" (skills: {', '.join(skills_of(m))})" if m.get("skills") else ""
            lines.append(f"- [{mid} {when}] **Khoa{attached}:** {clip(m.get('text'), 1500)}")
        elif kind == "skill":
            skills.append(f"{m.get('name')}@{hashlib.sha256((m.get('text') or '').encode()).hexdigest()[:8]}")
        elif kind == "synthetic":
            text = m.get("text") or ""
            child = re.search(r'<subagent sessionID="(ses_[A-Za-z0-9]+)" state="([a-z]+)"', text)
            if child:
                lines.append(f"- [{mid} {when}] report ← {child[1]} ({child[2]}): {clip(re.sub(r'<[^>]+>', ' ', text), room)}")
            else:
                lines.append(f"- [{mid} {when}] synthetic ({m.get('description') or 'note'}): {clip(text, room)}")
        elif kind == "compaction" and m.get("status") == "completed":
            lines.append(f"- [{mid} {when}] compaction")
        elif kind == "assistant":
            for part in m.get("content") or []:
                if part.get("type") == "text" and part.get("text"):
                    last_said = final = part["text"]
                if part.get("type") != "tool":
                    continue
                tools += 1
                name, state = part.get("name"), part.get("state") or {}
                if state.get("status") == "error":
                    failures += 1
                    error = state.get("error") or {}
                    detail = error.get("message") if isinstance(error, dict) else error
                    lines.append(f"- [{mid} {when}] tool error {name}: {clip(str(detail or tool_text(state)), 300)}")
                elif name == "skill":
                    skills.append(str((state.get("input") or {}).get("id") or (state.get("input") or {}).get("name")))
                elif name == "question":
                    answers += 1
                    lines.append(f"- [{mid} {when}] **Khoa answered:** {clip(tool_text(state), 1000)}")
                elif name == "subagent":
                    spec = state.get("input") or {}
                    child = (state.get("metadata") or {}).get("sessionID", "?")
                    lines.append(f"- [{mid} {when}] dispatch → {spec.get('agent')} {child} "
                                 f"\"{spec.get('description', '')}\": {clip(spec.get('prompt'), room)}")
    return {"lines": lines, "users": users, "answers": answers, "failures": failures,
            "tools": tools, "skills": list(dict.fromkeys(skills)), "final": final}


def tree_of(root_id, sessions, since=0):
    """Root plus descendants, fetching children the window missed."""
    order, queue = [], [(root_id, 0)]
    while queue:
        sid, depth = queue.pop(0)
        order.append((sid, depth))
        kids = [s for s in paged(f"/api/session?parentID={sid}&order=asc") if s["time"]["updated"] >= since]
        for kid in kids:
            sessions.setdefault(kid["id"], kid)
        queue[:0] = [(k["id"], depth + 1) for k in kids]
    return order


def is_mine_run(messages):
    for m in messages:
        if m.get("type") == "user":
            text = (m.get("text") or "").lstrip()
            names = [s.get("name") for s in m.get("skills") or []]
            return text.startswith("/mine") or "mine" in names
    return False


def write_tree(root, sessions, out, since=0, brief=False):
    order = tree_of(root["id"], sessions, since)
    with ThreadPoolExecutor(8) as pool:
        histories = dict(zip([sid for sid, _ in order], pool.map(lambda sid: list(paged(f"/api/session/{sid}/message?order=asc")), [sid for sid, _ in order])))
    head = summarize(histories[root["id"]], since, brief)
    t = root["time"]
    body = [f"# {root.get('title') or root['id']}",
            f"root {root['id']} · {root.get('agent')} · {home((root.get('location') or {}).get('directory'))} · "
            f"{stamp(t['created'])} → {stamp(t['updated'])}" + (f" (digest from {stamp(since)})" if since > t["created"] else "")
            + f" · Khoa turns {head['users']} · answers {head['answers']} · "
            f"sessions {len(order)} · tool errors {head['failures']}",
            f"skills attached: {', '.join(head['skills']) or 'none recorded'}", "", "## Root timeline", *head["lines"]]
    if head["final"]:
        body += [f"- final: {clip(head['final'], 250 if brief else 600)}"]
    totals = {"users": head["users"], "answers": head["answers"], "failures": head["failures"]}
    if len(order) > 1:
        body += ["", "## Delegated sessions"] + ([f"_Headers only; full record: digest.py --root {root['id']}_"] if brief else [])
    for sid, depth in order[1:]:
        s, info = sessions.get(sid, {"id": sid}), summarize(histories[sid], since, brief)
        totals["failures"] += info["failures"]
        body += ["", f"{'#' * min(3 + depth - 1, 6)} {s.get('agent')} {sid} — {s.get('title', '')}",
                 f"parent {s.get('parentID')} · outcome {s.get('outcome', '?')} · tool calls {info['tools']} · "
                 f"errors {info['failures']} · skills {', '.join(info['skills']) or 'none recorded'}"]
        if brief:
            continue  # /adapt digests one tree with --root for the full child record
        body += [line for line in info["lines"] if "tool error" in line or "Khoa" in line or "dispatch" in line]
        if info["final"]:
            body.append(f"- returned: {clip(info['final'], 800)}")
    path = os.path.join(out, f"{stamp(t['created']).replace(' ', '_').replace(':', '')}_{root['id']}.md")
    with open(path, "w") as f:
        f.write("\n".join(body) + "\n")
    return path, len(order), totals


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", type=float, default=14)
    ap.add_argument("--directory", action="append", default=[], help="keep roots under this path (repeatable)")
    ap.add_argument("--exclude-directory", action="append", default=[])
    ap.add_argument("--root", help="digest this one task tree and ignore the window")
    ap.add_argument("--all", action="store_true", help="include one-prompt roots (bots, schedules, fire-and-forget)")
    ap.add_argument("--out", help="output directory (default: a new temp directory)")
    args = ap.parse_args()
    out = args.out or tempfile.mkdtemp(prefix="mine-")
    os.makedirs(out, exist_ok=True)

    if args.root:
        root = session(args.root)
        path, *_ = write_tree(root, {root["id"]: root}, out)
        print(path)
        return

    cutoff = (time.time() - args.days * 86400) * 1000
    sessions = {s["id"]: s for s in paged("/api/session?order=desc", stop=lambda s: s["time"]["updated"] < cutoff)}
    in_window = len(sessions)
    keep = [os.path.realpath(os.path.expanduser(d)) for d in args.directory]
    drop = [os.path.realpath(os.path.expanduser(d)) for d in args.exclude_directory]

    def root_of(s):
        seen = set()
        while s.get("parentID") and s["id"] not in seen:
            seen.add(s["id"])
            pid = s["parentID"]
            if pid not in sessions:
                try:
                    sessions[pid] = session(pid)
                except RuntimeError:
                    break
            s = sessions[pid]
        return s

    roots = {r["id"]: r for r in map(root_of, list(sessions.values()))}
    skipped = {"outside directories": 0, "one prompt, no answers": 0, "/mine runs": 0}
    rows = []
    for root in sorted(roots.values(), key=lambda r: r["time"]["created"]):
        directory = os.path.realpath((root.get("location") or {}).get("directory") or "/")
        under = lambda bases: any(directory == b or directory.startswith(b + os.sep) for b in bases)
        if (keep and not under(keep)) or under(drop):
            skipped["outside directories"] += 1
            continue
        messages = list(paged(f"/api/session/{root['id']}/message?order=asc"))
        if is_mine_run(messages):
            skipped["/mine runs"] += 1
            continue
        users = sum(m.get("type") == "user" and m["time"]["created"] >= cutoff for m in messages)
        answered = any(p.get("type") == "tool" and p.get("name") == "question"
                       for m in messages if m.get("type") == "assistant" and m["time"]["created"] >= cutoff
                       for p in m.get("content") or [])
        if users < 2 and not answered and not args.all:
            skipped["one prompt, no answers"] += 1
            continue
        path, count, totals = write_tree(root, sessions, out, cutoff, brief=True)
        rows.append(f"| {stamp(root['time']['created'])} | {os.path.basename(path)} | {root.get('agent')} | "
                    f"{home((root.get('location') or {}).get('directory'))} | {clip(root.get('title'), 60)} | "
                    f"{totals['users']} | {totals['answers']} | {count} | {totals['failures']} |")

    index = [f"# /mine digests: last {args.days:g} days",
             f"sessions in window {in_window} · task trees {len(roots)} · digested {len(rows)} · "
             + " · ".join(f"skipped {k} {v}" for k, v in skipped.items()), "",
             "| started | digest | agent | directory | title | Khoa turns | answers | sessions | tool errors |",
             "|---|---|---|---|---|---:|---:|---:|---:|", *rows]
    with open(os.path.join(out, "index.md"), "w") as f:
        f.write("\n".join(index) + "\n")
    print(os.path.join(out, "index.md"))
    print(index[1])


if __name__ == "__main__":
    main()
