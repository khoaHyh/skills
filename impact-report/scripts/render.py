#!/usr/bin/env python3
"""Render report.json into a dark, screenshot-ready HTML page: one <section> per panel.

    render.py report.json out/index.html

Blocks and fields are documented in ../SKILL.md; ../examples/ holds a complete report.
"""
import json
import math
import re
import sys
import zlib
from html import escape
from pathlib import Path

W = 1072  # panel content width in px


def main():
    report = json.loads(Path(sys.argv[1]).read_text())
    r = Renderer(report)
    body = '\n'.join(r.panel(p, heading='h1' if i == 0 else 'h2') for i, p in enumerate(report['panels']))
    Path(sys.argv[2]).write_text(PAGE.format(title=escape(report['title']), css=CSS, body=body))
    print('wrote', sys.argv[2])


class Renderer:
    def __init__(self, report):
        self.labels = report.get('labels', {'before': 'Before', 'after': 'After'})
        self.better = report.get('better', 'lower')
        self.noise = report.get('noise', 10)

    def panel(self, p, heading):
        blocks = ''.join(getattr(self, b['type'])(b) for b in p.get('blocks', []))
        lede = f'<p class="lede">{escape(p["lede"])}</p>' if p.get('lede') else ''
        foot = f'<p class="foot">{escape(p["foot"])}</p>' if p.get('foot') else ''
        return (f'<section id="{p["id"]}" class="panel"><div class="eyebrow">{escape(p["eyebrow"])}</div>'
                f'<{heading}>{accent(p["title"])}</{heading}>{lede}{blocks}{foot}</section>')

    # ---- blocks ----

    def hero(self, b):
        d = pct(b['before'], b['after'])
        stats = ''.join(
            f'<div class="stat"><div class="stat-label">{escape(s["label"])}</div>'
            f'<div class="stat-value"><span class="from">{num(s["before"], s["unit"])}</span><span class="arrow">→</span>'
            f'<span class="to">{num(s["after"], s["unit"])}</span><span class="unit">{unit_word(s["unit"])}</span></div>'
            f'{self.chip(s["before"], s["after"], s.get("better"))}</div>' for s in b.get('stats', []))
        specs = b.get('specs', {})
        spec = ''.join(f'<div><span class="dot {k}"></span><b>{escape(self.labels[k])}</b> {escape(specs[k])}</div>'
                       for k in ('before', 'after') if k in specs)
        sample = f'<div class="n">{escape(b["sample"])}</div>' if b.get('sample') else ''
        tone = 'good' if self.is_good(d) else 'bad'
        return f'''<div class="hero-grid">
  <div class="big reveal"><div class="big-num {tone}">{signed(d)}</div>
    <div class="big-cap">{escape(b["caption"])}</div>
    <div class="big-sub"><span class="from">{num(b["before"], b["unit"])} {unit_word(b["unit"])}</span><span class="arrow">→</span><span class="to">{num(b["after"], b["unit"])} {unit_word(b["unit"])}</span></div></div>
  <div class="stats">{stats}</div></div>
<div class="spec">{spec}{sample}</div>'''

    def distribution(self, b):
        """Columns of jittered dots (one per sample) with a median tick; 'after' columns get a highlight band."""
        H, L, R, T, B = 330, 44, 8, 16, 46
        cols = b['columns']
        vmax = b.get('max') or nice_max(max(v for c in cols for v in c['values']), b['unit'])
        step = vmax / 4
        cw = (W - L - R) / len(cols)
        sy = lambda v: T + (H - T - B) * (1 - min(v, vmax) / vmax)
        p = []
        for i in range(5):
            y = sy(step * i)
            p.append(f'<line x1="{L}" x2="{W - R}" y1="{y:.1f}" y2="{y:.1f}" class="grid"/>'
                     f'<text x="{L - 10}" y="{y + 4:.1f}" class="axis" text-anchor="end">{num(step * i, b["unit"], axis=True)}</text>')
        for i, c in enumerate(cols):
            kind, vals = c.get('kind', 'before'), c['values']
            cx = L + cw * i + cw / 2
            if kind == 'after':
                p.append(f'<rect x="{L + cw * i:.1f}" y="{T - 6}" width="{cw:.1f}" height="{H - T - B + 6}" rx="10" class="after-band"/>')
            for j, v in enumerate(vals):
                jitter = zlib.crc32(f'{i}:{j}:{v}'.encode()) / 2**32 - .5
                p.append(f'<circle cx="{cx + jitter * cw * .62:.1f}" cy="{sy(v):.1f}" r="{4 if kind == "after" else 3}" class="pt {kind}"/>')
            if vals:
                med = median(vals)
                y = sy(med)
                p.append(f'<line x1="{cx - cw * .38:.1f}" x2="{cx + cw * .38:.1f}" y1="{y:.1f}" y2="{y:.1f}" class="med {kind}"/>')
                # A tight 'after' cluster hides its tick label, so lift it above the highest sample.
                ly, txt = (sy(max(vals)) - 16, f'{short(med, b["unit"])} median') if kind == 'after' else (y - 9, short(med, b['unit']))
                p.append(f'<text x="{cx:.1f}" y="{ly:.1f}" class="medlbl {kind}" text-anchor="middle">{txt}</text>')
            p.append(f'<text x="{cx:.1f}" y="{H - B + 22}" class="axis {"strong" if kind == "after" else ""}" text-anchor="middle">{escape(c["label"])}</text>'
                     f'<text x="{cx:.1f}" y="{H - B + 38}" class="axis" text-anchor="middle">n={len(vals)}</text>')
        return svg(H, p)

    def segments(self, b):
        """Stacked absolute bars, e.g. time per step. Widths share one scale across rows."""
        top = max(sum(x['value'] for x in r['parts']) for r in b['rows'])
        out = ''
        for r in b['rows']:
            total = sum(x['value'] for x in r['parts'])
            segs = ''.join(
                f'<div class="seg tone-{x["tone"]}" style="width:{x["value"] / top * 100:.2f}%">'
                f'{escape(x["label"]) + " " + num(x["value"], b["unit"]) + unit_suffix(b["unit"]) if x["value"] / top > .11 else ""}</div>'
                for x in r['parts'])
            out += self.row(r, f'<div class="segs reveal">{segs}</div>', num(total, b['unit']) + unit_suffix(b['unit']))
        return out

    def share(self, b):
        """100% bars: how a population splits, e.g. which check finishes last."""
        out = ''
        for r in b['rows']:
            segs = ''.join(f'<div class="seg tone-{x["tone"]}" style="flex:{x["share"]:.4f}">'
                           f'{escape(x["label"]) + f" · {x["share"] * 100:.0f}%" if x["share"] > .2 else ""}</div>'
                           for x in r['parts'] if x['share'] > 0)
            out += self.row(r, f'<div class="segs full reveal">{segs}</div>', f'n={r["n"]}' if 'n' in r else '')
        return out

    def dumbbell(self, b):
        """One row per metric: hollow before → solid after, change at the right edge."""
        rowh, L, R = 50, 250, 110
        rows = b['rows']
        vmax = b.get('max') or nice_max(max(max(r['before'], r['after']) for r in rows), b['unit'])
        ticks = 6
        sx = lambda v: L + (W - L - R) * v / vmax
        H = rowh * len(rows) + 34
        p = []
        for i in range(ticks + 1):
            x = sx(vmax / ticks * i)
            p.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="4" y2="{H - 26}" class="grid"/>'
                     f'<text x="{x:.1f}" y="{H - 8}" class="axis" text-anchor="middle">{num(vmax / ticks * i, b["unit"], axis=True)}</text>')
        for i, r in enumerate(rows):
            y, bv, av = 26 + i * rowh, r['before'], r['after']
            d = pct(bv, av)
            lo, hi = sorted([(sx(bv), 'b'), (sx(av), 'a')])
            label = {lo[1]: (lo[0] - 14, 'end'), hi[1]: (hi[0] + 14, 'start')}
            p.append(f'<text x="0" y="{y + 5}" class="rowlbl">{escape(r["label"])} <tspan class="faint">{escape(r.get("stat", ""))}</tspan></text>'
                     f'<line x1="{sx(av):.1f}" x2="{sx(bv):.1f}" y1="{y}" y2="{y}" class="link"/>'
                     f'<circle cx="{sx(bv):.1f}" cy="{y}" r="7" class="db before"/><circle cx="{sx(av):.1f}" cy="{y}" r="8" class="db after"/>'
                     f'<text x="{label["b"][0]:.1f}" y="{y + 5}" class="val" text-anchor="{label["b"][1]}">{num(bv, b["unit"])}</text>'
                     f'<text x="{label["a"][0]:.1f}" y="{y + 5}" class="val after" text-anchor="{label["a"][1]}">{num(av, b["unit"])}</text>'
                     f'<text x="{W}" y="{y + 5}" class="delta {self.tone(d, r.get("better"))}" text-anchor="end">{signed(d)}</text>')
        return svg(H, p)

    def table(self, b):
        head = ''.join(f'<th class="{"num" if i >= 2 else ""}">{escape(c)}</th>' for i, c in enumerate(b['columns']))
        body = ''
        for r in b['rows']:
            tag = {'changed': self.labels['after'], 'unchanged': self.labels['before']}.get(r['tag'], r['tag'])
            cls = ' '.join(c for c, on in [('hl', r.get('highlight')), ('muted', r.get('muted'))] if on)
            body += (f'<tr class="{cls}"><td>{escape(r["name"])}</td>'
                     f'<td><span class="tag {"after" if r.get("highlight") else ""}">{escape(tag)}</span></td>'
                     f'<td class="num">{num(r["before"], r["unit"])}{unit_suffix(r["unit"])}</td>'
                     f'<td class="num">{num(r["after"], r["unit"])}{unit_suffix(r["unit"])}</td>'
                     f'<td class="num">{self.chip(r["before"], r["after"], r.get("better"))}</td></tr>')
        return f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'

    def callout(self, b):
        return f'<div class="callout"><b>{escape(b["title"])}</b> {escape(b["text"])}</div>'

    def subhead(self, b):
        return f'<div class="subhead">{escape(b["text"])}</div>'

    def legend(self, b):
        keys = ''.join(f'<span class="key"><span class="dot {k}"></span>{escape(self.labels[k])}</span>' for k in ('before', 'after'))
        note = f'<span class="key-note">{escape(b["note"])}</span>' if b.get('note') else ''
        return f'<div class="legend">{keys}{note}</div>'

    # ---- helpers ----

    def row(self, r, bar, total):
        return (f'<div class="steprow"><div class="steplbl"><span class="dot {r.get("kind", "before")}"></span>{escape(r["label"])}</div>'
                f'{bar}<div class="steptotal">{total}</div></div>')

    def is_good(self, d, better=None):
        return (d < 0) == ((better or self.better) == 'lower')

    def tone(self, d, better=None):
        if abs(d) < self.noise:
            return 'flat'
        return 'good' if self.is_good(d, better) else 'bad'

    def chip(self, before, after, better=None):
        d = pct(before, after)
        tone = self.tone(d, better)
        if tone == 'flat':
            return f'<span class="chip flat">{signed(d) if round(d) else "0%"}</span>'
        return f'<span class="chip {tone}">{"↓" if d < 0 else "↑"} {signed(d)}</span>'


def pct(before, after):
    return (after - before) / before * 100


def signed(v):
    return ('−' if v < 0 else '+') + f'{abs(v):.0f}%'


def median(xs):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(.5 * (len(xs) - 1) + 0.5))]


def num(v, unit, axis=False):
    if unit == 'min':
        return f'{v / 60:.0f}m' if axis else f'{v / 60:.1f}'
    if unit == 's':
        return f'{v:.0f}s' if axis else f'{v:.0f}'
    if unit == 'usd':
        return f'${v:.3f}'
    if unit == 'pct':
        return f'{v * 100:.0f}%'
    return f'{v:g}'


def short(v, unit):
    return num(v, unit) + {'min': 'm', 's': 's'}.get(unit, '')


def unit_word(unit):
    return {'min': 'min', 's': 's'}.get(unit, '')


def unit_suffix(unit):
    return 's' if unit == 's' else ''


def nice_max(v, unit):
    """Round an axis maximum up so ticks land on whole minutes / tens of seconds."""
    base = 60 * 4 if unit == 'min' else 40 if unit == 's' else 1
    return math.ceil(v * 1.05 / base) * base


def accent(title):
    return re.sub(r'==(.+?)==', r'<em>\1</em>', escape(title))


def svg(h, parts):
    return f'<svg viewBox="0 0 {W} {h}" width="{W}" height="{h}" class="chart">{"".join(parts)}</svg>'


PAGE = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=1280">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>{css}</style>
<body>
{body}
</body></html>'''

CSS = '''
:root{
  --bg:#0c0c0c; --panel:#161616; --raised:#1e1e1e; --line:#2a2a2a; --line-2:#303030;
  --ink:#ededed; --ink-2:#a1a1a1; --ink-3:#6e6e6e;
  --before:#7a7a7a; --after:#00bc7d; --after-ink:#3ee0a5; --warn:#ffb900; --bad:#ff6467;
  --ease-out:cubic-bezier(0.23,1,0.32,1);
  --sans:"Inter",-apple-system,BlinkMacSystemFont,sans-serif; --mono:"IBM Plex Mono",ui-monospace,monospace;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 var(--sans);-webkit-font-smoothing:antialiased;
  display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 0}
.panel{width:1200px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:56px 64px}
.eyebrow,.subhead,th{font:500 13px/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3)}
.eyebrow{margin-bottom:20px} .subhead{margin:40px 0 16px}
h1{font:600 44px/1.12 var(--sans);letter-spacing:-.025em;margin:0 0 14px;max-width:960px;text-wrap:balance}
h2{font:600 32px/1.18 var(--sans);letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
h1 em,h2 em{font-style:normal;color:var(--after-ink)}
.lede{font-size:18px;color:var(--ink-2);margin:0 0 36px;max-width:880px;text-wrap:pretty}
.foot{font-size:14px;color:var(--ink-3);margin:24px 0 0}
.from{color:var(--ink-3)} .to{color:var(--ink)} .arrow{color:var(--ink-3);margin:0 .35em}
.num,.big-num,.stat-value,.big-sub,.steptotal,.chip,.chart text,.seg,.tag,.spec .n{font-family:var(--mono);font-variant-numeric:tabular-nums}

.hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center;padding:36px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.big-num{font-size:132px;line-height:.9;font-weight:500;letter-spacing:-.05em;color:var(--after-ink)}
.big-num.bad{color:var(--bad)}
.big-cap{font-size:18px;color:var(--ink);margin-top:18px;font-weight:500}
.big-sub{font-size:20px;margin-top:4px}
.stat{display:grid;grid-template-columns:1fr auto;column-gap:16px;padding:18px 0;border-bottom:1px solid var(--line)}
.stat:last-child{border-bottom:0}
.stat-label{font-size:15px;color:var(--ink-2)} .stat-value{font-size:26px}
.stat .chip{grid-column:2;grid-row:1/3;align-self:center}
.unit{font-size:15px;color:var(--ink-3);margin-left:6px}
.spec{display:flex;gap:32px;align-items:center;margin-top:24px;font-size:15px;color:var(--ink-2)}
.spec b{color:var(--ink);font-weight:600;margin-right:6px}
.spec .n{margin-left:auto;font-size:13px;color:var(--ink-3)}

.chip{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:500;padding:5px 10px;border-radius:999px;white-space:nowrap}
.chip.good{color:var(--after-ink);background:rgba(0,188,125,.12)}
.chip.bad{color:var(--bad);background:rgba(255,100,103,.12)}
.chip.flat{color:var(--ink-2);background:var(--raised)}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px}
.dot.before{background:var(--before)} .dot.after{background:var(--after)}
.legend{display:flex;gap:24px;font-size:16px;color:var(--ink-2);margin:4px 0 28px}
.key-note{color:var(--ink-3)}

.chart{display:block;overflow:visible}
.chart .grid{stroke:var(--line)}
.chart .axis{font-size:13.5px;fill:var(--ink-3)}
.chart .axis.strong{fill:var(--after-ink);font-weight:600}
.chart .faint{fill:var(--ink-3);font-family:var(--mono)}
.after-band{fill:rgba(0,188,125,.06);stroke:rgba(0,188,125,.25)}
.pt.before{fill:var(--before);opacity:.42}
.pt.after{fill:var(--after);stroke:#0c3b2b}
.med{stroke-width:3;stroke-linecap:round} .med.before{stroke:var(--ink)} .med.after{stroke:var(--after-ink)}
.medlbl{font-size:14px;font-weight:600;paint-order:stroke;stroke:var(--panel);stroke-width:4px}
.medlbl.before{fill:var(--ink)} .medlbl.after{fill:var(--after-ink)}
.chart .rowlbl{font:500 15px var(--sans);fill:var(--ink)}
.link{stroke:var(--after);stroke-width:3;opacity:.45}
.db.before{fill:var(--panel);stroke:var(--before);stroke-width:3} .db.after{fill:var(--after)}
.val{font-size:14px;fill:var(--ink-3)} .val.after{fill:var(--after-ink);font-weight:600}
.delta{font-size:16px;font-weight:600} .delta.good{fill:var(--after-ink)} .delta.bad{fill:var(--bad)} .delta.flat{fill:var(--ink-2)}

.steprow{display:grid;grid-template-columns:120px 1fr 80px;align-items:center;gap:16px;margin-bottom:10px}
.steplbl{font-size:15px} .steptotal{font-size:14px;color:var(--ink-3);text-align:right}
.segs{display:flex;height:36px;border-radius:8px;overflow:hidden;gap:2px}
.seg{display:flex;align-items:center;padding:0 12px;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden}
.tone-neutral{background:#3a3a3a;color:var(--ink-2)} .tone-mid{background:#5a5a5a;color:var(--ink)}
.tone-before{background:var(--before);color:#0c0c0c} .tone-after{background:var(--after);color:#04140e}
.tone-warn{background:var(--warn);color:#1a1300}
.segs.full .tone-mid{background:#6e6e6e;color:#0c0c0c}
.callout{margin-top:24px;padding:16px 20px;border-radius:12px;background:rgba(255,185,0,.08);border:1px solid rgba(255,185,0,.25);color:var(--ink-2);font-size:15px}
.callout b{color:var(--warn)}

table{width:100%;border-collapse:collapse;font-size:16px}
th{text-align:left;padding:0 12px 14px;border-bottom:1px solid var(--line-2);font-size:12px}
td{padding:15px 12px;border-bottom:1px solid var(--line)}
.num{text-align:right}
tr.hl td{background:rgba(0,188,125,.06)} tr.hl td:first-child{box-shadow:inset 3px 0 0 var(--after)}
tr.muted td{border-top:1px solid var(--line-2);color:var(--ink-2)}
.tag{font-size:12px;font-weight:500;color:var(--ink-2);background:var(--raised);border:1px solid var(--line-2);padding:3px 8px;border-radius:6px}
.tag.after{color:var(--after-ink);background:rgba(0,188,125,.1);border-color:rgba(0,188,125,.3)}

/* One-time reveal for the live page; screenshots run with reduced motion. */
@media (prefers-reduced-motion: no-preference){
  .reveal{animation:reveal 700ms var(--ease-out) both}
  .panel{animation:rise 500ms var(--ease-out) both}
}
@keyframes reveal{from{clip-path:inset(0 100% 0 0)}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}}
'''

if __name__ == '__main__':
    main()
