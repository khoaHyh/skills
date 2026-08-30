# mine-history

Read-only Phase 0 miner for ENG-360. Builds a ranked failure-mode log from OpenCode sessions.

```bash
node computa-please/scripts/mine-history/mine.mjs \
  --db ~/.local/share/opencode/opencode.db \
  --out computa-please/scripts/mine-history/out \
  --limit-sessions 1500
```

Does not edit `computa-please/SKILL.md`. See `SPEC.md`.
