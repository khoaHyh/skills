---
name: drive-opencode-sessions
description: >-
  Use when a Grok Bot needs OpenCode as compute (implementation, QA,
  verification) and must pick box vs the user's Mac, start visible titled
  sessions, steer them mid-flight, and run several in parallel.
---
# Drive OpenCode sessions

OpenCode is client/server. The Grok chat is the coordinator; OpenCode sessions are the workers. Never do lane work as bare Grok `Shell` when an OpenCode session should own it.

## 1. Pick where it runs (by capability, not habit)

- **Box (default):** pure repo, `gh`, CI/CD, web flows, headless checks. Run `opencode2 run --agent computa …` (or the lane's configured primary agent) on the shared box. Wrap standalone runs in the lane's watchdog script when one exists (e.g. `/workspace/opencode-lane/bin/opencode-run-watchdog.sh`).
- **User's Mac (capability-signaled only):** work needing Mac-only tools — Simulator, Paper MCP, Figma desktop MCP, aws CLI + SSO, Desktop-only Executor tools, local signed-in apps. Drive OpenCode **on the Mac** (headless against the Mac `opencode serve` is fine; TUI not required). Scope that session to the Mac-only slice, collect proof, then continue remaining work on the box.
- **Never** burn the Mac for box-capable work, and never use bare Grok `Shell` + `machineId` as a substitute for a Mac OpenCode session (only tiny diagnostics the user explicitly asked for outside OpenCode).

## 2. Start visible sessions

- Open the session in the matching project directory/worktree so the user can see it in OpenCode `/sessions`.
- Title every session you start `<Bot name>: <short title>` (e.g. `kewl-aid: invite accept QA`, `OpenCode Sr: aws SSO handoff`). Set/rename at session start.
- Use the lane's locked model and primary agent from the bot's persona/config; don't launch disabled agents (e.g. build/plan) or other models.
- One task-owned worktree per independent accepted slice; workers on the same task share its checkout and ownership rules.

## 3. Prompt like an owner

Preserve the user's outcome and explicit decisions, not every mechanism suggested during discussion. Use links to authoritative context rather than copying whole procedures:

```text
Use computa-please in <repo/worktree>.
Outcome: <accepted user result>.
Context: <issue, accepted decisions, relevant links>.
Scope: <complete delivery and important exclusions>.
Proof: <observable result and owning verification recipe>.
Authority: <standing repository grant, task-specific grant, or local-only>.
Stop: <authorized delivery boundary; no implied merge/deploy>.
```

Resolve authority from the user and [computa-please's policy](../computa-please/references/vcs.md#authority). Carry same-task grants across resumes; preserve explicit local-only constraints. Do not add an ask-before-publication pause where standing task-branch commit/push/draft permission applies. The coordinator cannot grant a new policy exception, operational action, or broader scope on the user's behalf.

Have workers retrieve missing facts and choose routine engineering details. Return consequential product, risk, or authority decisions to the user; neither coordinator nor worker guesses them. Name a user-selected `visual-pr` workflow or an explicitly requested `record-verification` recording in the prompt; calibrate proof to the affected risk. Spare worker capacity is not scope.

## 4. Steer mid-flight, in parallel

- Same task: `--continue` / `--session <id>` — supply inspected facts or the user's decision, redirect, and resume. Don't start a duplicate session for work already running.
- New independent accepted slice: start a sibling session + worktree. Never pause or back-burner an in-flight session to make room.
- Track each live worker: title, session id, worktree/path, box vs Mac, linked PR/issue.
- Don't fire-and-forget: check output, chase stalls, push back on first drafts.

## 5. Keep publish and proof inside OpenCode

- PR create/update happens inside the OpenCode session with the repo's description workflow (`visual-pr` when the user explicitly selected it). Never hand `gh pr create --body` to a bare Grok Task/Shell.
- Proof is pasted commands/outputs, screenshots, or recordings from the session — never self-report alone. Green build alone is not proof.

## 6. Hand back

Report per session: title, id, where it ran, what ran, evidence, pass/fail/inconclusive, and what's next. When unsure of an idiomatic OpenCode path (sessions, serve, attach, continue), read OpenCode's own docs/skills (Context7 helps) instead of inventing ceremony.
