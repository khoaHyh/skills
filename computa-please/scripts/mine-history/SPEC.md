# ENG-360 history miner — Spec

Read-only Phase 0 for [ENG-360](https://linear.app/custodia/issue/ENG-360/climb-the-computa-please-trust-curve).
Does not edit `computa-please/SKILL.md`.

## Intent

Bootstrap a ranked failure-mode log from OpenCode session history correlated with GitHub PRs and Greptile/Bugbot remediations.

## Non-goals

- Blinded skill evals
- `verify-platform` generation
- Hands-off rule
- Editing `computa-please` skill prose
- Reading OpenCode `credential`, `account`, `auth.json`, or any secret store

## Data shape

```text
MissClass =
  | guessed_root_cause
  | skipped_proof
  | mutated_before_design_gate
  | pr_body_without_gate
  | typecheck_as_proof
  | never_drove_app
  | other_process

Source = user_correction | bot_confirmed_fix | bot_dismissed

MissEvent {
  class: MissClass
  source: Source
  sessionId?: string
  issueId?: string          // ENG-123
  prNumber?: number
  repo?: string             // owner/name
  quote: string             // short, redacted
  at: number                // ms epoch
}

MissClassRollup {
  class: MissClass
  count: number
  bySource: Record<Source, number>
  exemplars: MissEvent[]    // max 3
  candidateFix: hard_check | skill_patch | verify_gap | ignore
}
```

## Sources

1. **OpenCode DB** `~/.local/share/opencode/opencode.db` (read-only URI `file:...?mode=ro`)
   - `session` — title, directory, project_id, times
   - `message` + `part` — user text via `part.type = text` joined to `message.role = user`
   - `session_input.prompt` — alternate user prompt stream when present
   - Join keys from title/directory: `ENG-\d+`, `pr[- ]?\d+`, worktree slug, branch-ish path segments
2. **GitHub** (gh / GitHub MCP) — PRs matching issue ids; review comments from bugbot / greptile authors; commits after review that reference the thread
3. **Greptile MCP** — optional enrichment; confirmed only when a later fix commit or remediation session exists

## Privacy

- Never open credential tables or auth files
- Redact strings matching token/key patterns in quotes
- Output under `~/.computa-please/devx__eng-360-trust-curve/` plus optional copy under this script dir `out/` (gitignored)
- No customer data, secrets, or full transcript dumps in the ranked table

## Output artifacts

| File | Contents |
|---|---|
| `sessions-index.jsonl` | Correlatable sessions (id, title, directory, issueId, prHints) |
| `corrections.jsonl` | Classified user corrections |
| `remediations.jsonl` | Bot findings with disposition |
| `failure-mode-log.md` | Ranked MissClassRollup table + top 3 Reflect candidates |
| `handoff.md` | Dated section: commands run, counts, residual risk |

## Classification (v1 heuristics)

User correction heuristics (case-insensitive), mapped to MissClass:

- reproduce / root cause / don't guess → `guessed_root_cause`
- proof / verify / typecheck is not / e2e / drive the app → `skipped_proof` or `typecheck_as_proof` / `never_drove_app`
- don't change yet / design first / spec first → `mutated_before_design_gate`
- pr body / call stacks / personal-drafting → `pr_body_without_gate`
- Unmatched corrective tone (no / don't / instead / redo / wrong) → `other_process`

Bot remediation: finding present + subsequent fix commit or explicit remediation → `bot_confirmed_fix`. Explicit dismiss → `bot_dismissed` (excluded from skill-patch candidates).

## Success criteria

1. Miner runs read-only against the live DB without writing it
2. `failure-mode-log.md` lists classes with counts ≥ 1 where evidence exists
3. Top 3 process-shaped misses named with exemplars and candidateFix
4. Privacy bounds hold under review of the script

## Verification

```bash
node computa-please/scripts/mine-history/mine.mjs --db ~/.local/share/opencode/opencode.db --out ~/.computa-please/devx__eng-360-trust-curve --limit-sessions 500
```

Inspect `failure-mode-log.md`. Spot-check 5 exemplars against `sqlite3` / session titles.
