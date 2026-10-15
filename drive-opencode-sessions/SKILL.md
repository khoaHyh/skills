---
name: drive-opencode-sessions
description: >-
  Use when a Grok Bot needs OpenCode as compute (implementation, QA,
  verification) and runs on the user's Mac first (box as fallback), start visible titled
  sessions, steer them mid-flight, and run several in parallel.
---
# Drive OpenCode sessions

OpenCode is client/server. The Grok chat is the coordinator; OpenCode sessions are the workers. Never do lane work as bare Grok `Shell` when an OpenCode session should own it.

## 1. Pick where it runs (Mac first)

- **User's Mac (default, Khoa 2026-10-15):** every coding session runs on the Mac's local OpenCode server (`opencode serve`, 127.0.0.1:49374; never expose it), driven over Mac Shell with oc-worker (`--lane mac` when supported) or the same server-API pattern. It has the most tools: Simulator, Paper, Figma, Executor Desktop, aws SSO. Up to 6–8 live sessions, at most 2 heavy test/lint/build runs at once. Check free disk first; low disk counts as unavailable.
- **Box (fallback only):** use the box's OpenCode v2 server only when the Mac is unreachable, its server is down after one quick restart, or it is full. Always tell the user which lane and why. Driven with `/workspace/opencode-lane/bin/oc-worker` (see its `README.md`):
  - Start: `oc-worker start --slice <slice> --dir <worktree> --prompt-file <file> --agent computa --model openai/gpt-6.1-sol-ultrafast#xhigh`. Always pass `--model` explicitly.
  - Wake-up: run `oc-worker wait <ids…>` as a background shell. It exits on the first state that needs you: 0 idle/done, 2 error, 3 form pending, 4 permission pending, 5 died, 6 stalled.
  - Slots: at most 4 workers. Heavy lint, test, or typecheck runs go through `/workspace/opencode-lane/bin/heavy <cmd>`.
  - No `opencode2 run` clients for workers and no bash watchdog; the server owns resume.
- **Never queue silently.** If a lane's slots are full, send the work to the other lane right away instead of `--queue`, and say so. Before starting new work, close finished, idle, or stale sessions (e.g. stuck at "admitted, not yet started") to free slots.
- **Confirm the start.** Within about 3 minutes of starting a session, check that it is actually running (not admitted/queued). If it hasn't started, move it to the other lane and tell the user.
- Never use bare Grok `Shell` + `machineId` as a substitute for a Mac OpenCode session (only tiny diagnostics outside OpenCode).

## 2. Start visible sessions

- Open the session in the matching project directory/worktree so the user can see it in OpenCode `/sessions`.
- Title every session you start `<Bot name>: <short title>` (e.g. `kewl-aid: invite accept QA`, `OpenCode Sr: aws SSO handoff`). Set/rename at session start.
- Set the lane's locked primary agent and model explicitly on every session (e.g. `computa` + `openai/gpt-6.1-sol-ultrafast#xhigh`); never rely on the server default, and don't launch disabled agents (e.g. build/plan, general) or other models or variants.
- Always pin `--model` on every OpenCode launch, including `opencode run --agent <name>` and Mac sessions, using that agent's configured model (e.g. oracle → `openai/gpt-6-astra#high`). OpenCode 2.0.27 CLI/primary runs ignore the agent's model without it and fall back to the newest available model, which can be a training-enabled endpoint that the workspace privacy setting rejects. Never enable training permission to work around it.
- Never open URLs in Khoa's personal browser from his Mac (no `open <url>`, `gh ... --web`, `xdg-open`, or launching Zen/Chrome) in your own commands or worker prompts. Read GitHub with the `gh` CLI (`gh pr view`, `gh pr diff`, `gh api`) or connectors; other pages via fetch tools. Try the MCP/CLI path first; it's usually more useful. Browser on the Mac is allowed only when that can't do the job, for: QA of the web app (local or staging), sign-in/OAuth pages a CLI opens, and vendor dashboards Khoa must click in. Tell Khoa first which window/URL and why.
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
- Same task: prompt the existing session by id (`oc-worker steer <id>` mid-turn, `oc-worker queue <id>` after the turn) — supply inspected facts or the user's decision, redirect, and resume. Don't start a duplicate session for work already running.
- New independent accepted slice: start a sibling session + worktree. Never pause or back-burner an in-flight session to make room.
- A gate on one slice pauses only that slice: prep its work up to the gate and keep the others moving. Never end a turn on "waiting" while any slice can still move.
- "Server restarted" means the server auto-resumed the session, not that it died. Check the session's status before calling it dead; if it really died, resume or relaunch it in the same turn. Never do the worker's job yourself.
- Answer worker questions through each session's question form (`oc-worker answer <id> <formID> <answer>`; permissions via `oc-worker approve`); never cancel them.
- Inside a slice, the worker agent may fan out with its own background subagents.
- Track each live worker: title, session id, worktree/path, box vs Mac, linked PR/issue.
- Don't fire-and-forget: check output, chase stalls, push back on first drafts.

## 5. Keep publish and proof inside OpenCode

- PR create/update happens inside the OpenCode session with the repo's description workflow (`visual-pr` when the user explicitly selected it). Never hand `gh pr create --body` to a bare Grok Task/Shell.
- Proof is pasted commands/outputs, screenshots, or recordings from the session — never self-report alone. Green build alone is not proof.

## 6. Hand back

Report per session: title, id, where it ran, what ran, evidence, pass/fail/inconclusive, and what's next. When unsure of an idiomatic OpenCode path (sessions, serve, attach, continue), read OpenCode's own docs/skills (Context7 helps) instead of inventing ceremony.
