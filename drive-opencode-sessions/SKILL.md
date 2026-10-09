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

- **Box (default):** pure repo, `gh`, CI/CD, web flows, headless checks. Start each worker as a session on the box's OpenCode v2 server (`session.create` + `session.prompt`) and steer it by session id. Don't use `opencode2 run` clients for workers or wrap them in a bash watchdog; the server owns resume. Run at most about 4 coding sessions on the box at once, and only one heavy lint or test run at a time.
- **User's Mac (capability-signaled only):** work needing Mac-only tools — Simulator, Paper MCP, Figma desktop MCP, aws CLI + SSO, Desktop-only Executor tools, local signed-in apps. Drive OpenCode **on the Mac** (headless sessions on the Mac's `opencode serve`, same server-API pattern; TUI not required). Scope that session to the Mac-only slice, collect proof, then continue remaining work on the box.
- **Never** burn the Mac for box-capable work, and never use bare Grok `Shell` + `machineId` as a substitute for a Mac OpenCode session (only tiny diagnostics the user explicitly asked for outside OpenCode).

## 2. Start visible sessions

- Open the session in the matching project directory/worktree so the user can see it in OpenCode `/sessions`.
- Title every session you start `<Bot name>: <short title>` (e.g. `kewl-aid: invite accept QA`, `OpenCode Sr: aws SSO handoff`). Set/rename at session start.
- Set the lane's locked primary agent and model explicitly on every session (e.g. `computa` + `openai/gpt-6.1-sol#high`); never rely on the server default, and don't launch disabled agents (e.g. build/plan, general) or other models or variants.
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

- Split each ask into independent slices and launch them all right away.
- Same task: prompt the existing session by id — supply inspected facts or the user's decision, redirect, and resume. Don't start a duplicate session for work already running.
- New independent accepted slice: start a sibling session + worktree. Never pause or back-burner an in-flight session to make room.
- A gate on one slice pauses only that slice: prep its work up to the gate and keep the others moving. Never end a turn on "waiting" while any slice can still move.
- "Server restarted" means the server auto-resumed the session, not that it died. Check the session's status before calling it dead; if it really died, resume or relaunch it in the same turn. Never do the worker's job yourself.
- Answer worker questions through each session's question form; never cancel them.
- Inside a slice, the worker agent may fan out with its own background subagents.
- Track each live worker: title, session id, worktree/path, box vs Mac, linked PR/issue.
- Don't fire-and-forget: check output, chase stalls, push back on first drafts.

## 5. Keep publish and proof inside OpenCode

- PR create/update happens inside the OpenCode session with the repo's description workflow (`visual-pr` when the user explicitly selected it). Never hand `gh pr create --body` to a bare Grok Task/Shell.
- Proof is pasted commands/outputs, screenshots, or recordings from the session — never self-report alone. Green build alone is not proof.

## 6. Hand back

Report per session: title, id, where it ran, what ran, evidence, pass/fail/inconclusive, and what's next. When unsure of an idiomatic OpenCode path (sessions, serve, attach, continue), read OpenCode's own docs/skills (Context7 helps) instead of inventing ceremony.
