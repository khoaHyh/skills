---
name: work-ledger
description: Read and update the explicitly selected personal or work ledger for work that spans sessions. Use when a task names a work item (a tracker key such as TASK-123, a PR such as owner/repo#123, or "work item <key>"), when picking up, handing off, or delegating multi-session work, or when a phase ends.
---

# Work ledger

The ledger is the single source of truth for a work item between sessions: its outcome, decisions, authority, live state, evidence, open questions, and next action. A session's transcript is scratch; the ledger is what the next session inherits.

## 0. Resolve the destination

Before reading, searching, editing, or committing, run:

```sh
LEDGER=$(node ~/.config/opencode/scripts/ledger.js path) || exit
```

The shared resolver also owns prompt attachments. It requires the machine-local
`~/.local/state/opencode/ledger.json` to contain `{"context":"personal"}` or
`{"context":"work"}`. The resolver owns the private context-to-path and
expected-origin mappings; neither is a public default. Both fetch and push
destinations must match the selected context's expected origin. Stop on any
error; configuration repair or context switching needs the task's authority.
Resolve again after a context change and before each write. An attachment alone
does not establish the current context. Match the task's personal/work scope to
the selection; ask when ambiguous. A work selection never authorizes personal
records there. `WORK_LEDGER_ITEMS` is no longer an independent routing override.

Items live in `$LEDGER/items/<primary-key>.md`, shaped like `$LEDGER/_template.md`.
For initial setup/migration, see `~/.config/opencode/scripts/ledger.README.md`.

## 1. Find the item

The `work-ledger` plugin attaches matching items from the verified selection to prompts that mention one of their `keys`. Otherwise search: `rg -il '<key>' "$LEDGER/items"`.

Create an item from `_template.md` when the work is PR-bound, an incident, or likely to outlive this session, and none exists. List every identifier that should find it in `keys`. One-session questions need no item.

Done when you are holding the item, or have decided the task needs none.

## 2. Reconcile before acting

Treat the item's Decisions and Authority as accepted context: they are what Khoa already settled, with sources. Treat State as a dated claim. Before acting on it, re-check each fact you depend on against live sources (`git fetch` and `git log`, `gh pr view`, the deployed ref); carry corrections into the next step 3 checkpoint. When an item copies a shared time-sensitive restriction or grant from another item, check that source item's latest Decisions and Authority before relying on the copy; reconcile a superseding decision without widening unrelated authority.

Done when every State fact your next step depends on is confirmed or corrected; date the checkpoint with a new `Checked` time.

## 3. Write at phase boundaries

Phases are `research`, `plan`, `implement`, `verify`, and `rollout`. Write Decisions and Authority before acting on them; write State, Evidence and Next at phase ends, handoffs, and worker loss—not per step or poll. Re-read the file at each write:

- **Decisions** and **Authority**: append dated lines, in neutral wording, that state what was decided and cite the session id or link as the source. Quote only the operative words of an approval, limit, or scope, where the exact wording defines what is allowed; paraphrase the rest. Supersede a line with a new one that says what it replaces; never delete one.
- **State**, **Evidence**, **Open**, and **Next**: rewrite to current truth. Next names exactly one phase and action.
- **Log**: append one line with the phase and session id.
- Front matter: set `status` (`active`, `blocked`, `done`, or `dropped`) and `updated`.
- Optional front matter: `ask: "<Verb>: <what the owner must do> — <url>"`. Workers and coordinators set it immediately when blocked on a concrete human-owner action. Use Review, Decide, Approve, Run, Schedule or Share; the URL and its separator are optional. Dashboards show only ledger items with an `ask:` line as "Needs you".
  At every phase-boundary write, check `ask:` against the latest decision and linked live state; remove it when answered or overtaken.
  One item owns a cross-item ask; the others link to it. Each item has at most one `ask:`.
  Parked or background work has no `ask:`; put a revisit trigger in **Next** instead.

Keep the item under about 150 lines by tightening State and Evidence to pointers. Keep secrets, credentials, customer data, and raw transcripts out of it.

Use the guarded item-only commands (each revalidates the selection and origin):

```sh
node ~/.config/opencode/scripts/ledger.js commit <file.md> "<key>: <phase> <summary>"
node ~/.config/opencode/scripts/ledger.js push
```

Skip no-change commits. Other sessions share this checkout; leave their edits
alone. On a rejected push, reconcile first: resolve the ledger again, fetch only
its verified origin, and inspect the divergence. Pull/rebase only when another
machine pushed first and local edits are accounted for; then retry the guarded
push. An uncertain network result requires checking receipt before retrying.

Done when the file alone tells a fresh session what is settled, what is true now, and what to do next.

## 4. Hand off with a pointer

For workers and handoffs, recommend a fresh session after a phase or two compactions, checkpointing through step 3 first. This does not apply to Khoa's long-lived conductor, which rebuilds from the ledger after compaction.

Coordinators write the item before dispatch. Fresh workers get the pointer plus scope/authority deltas and the exact proof target, retaining needed authority and security boundaries; resumed workers get only changed facts:

```text
Work item <KEY>, phase: <phase>.
<Scope/authority deltas and exact proof target; only changed facts on resume.>
```

Done when the receiving session needs nothing beyond the pointer and the item to start.
