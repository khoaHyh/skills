---
name: work-ledger
description: Read and update the durable work ledger in ~/dev/ledger for work that spans sessions. Use when a task names a work item (a tracker key such as TASK-123, a PR such as owner/repo#123, or "work item <key>"), when picking up, handing off, or delegating multi-session work, or when a phase ends.
---

# Work ledger

The ledger is the single source of truth for a work item between sessions: its outcome, decisions, authority, live state, evidence, open questions, and next action. A session's transcript is scratch; the ledger is what the next session inherits. Items live in `~/dev/ledger/items/<primary-key>.md`, shaped like `~/dev/ledger/_template.md`.

## 1. Find the item

The `work-ledger` plugin attaches matching items to prompts that mention one of their `keys`. Otherwise search: `rg -il '<key>' ~/dev/ledger/items`.

Create an item from `_template.md` when the work is PR-bound, an incident, or likely to outlive this session, and none exists. List every identifier that should find it in `keys`. One-session questions need no item.

Done when you are holding the item, or have decided the task needs none.

## 2. Reconcile before acting

Treat the item's Decisions and Authority as accepted context: they are what Khoa already settled, with sources. Treat State as a dated claim. Before acting on it, re-check each fact you depend on against live sources (`git fetch` and `git log`, `gh pr view`, the deployed ref); carry corrections into the next step 3 checkpoint.

Done when every State fact your next step depends on is confirmed or corrected; date the checkpoint with a new `Checked` time.

## 3. Write at phase boundaries

Phases are `research`, `plan`, `implement`, `verify`, and `rollout`. Write Decisions and Authority before acting on them; write State, Evidence and Next at phase ends, handoffs, and worker loss—not per step or poll. Re-read the file at each write:

- **Decisions** and **Authority**: append dated lines, in neutral wording, that state what was decided and cite the session id or link as the source. Quote only the operative words of an approval, limit, or scope, where the exact wording defines what is allowed; paraphrase the rest. Supersede a line with a new one that says what it replaces; never delete one.
- **State**, **Evidence**, **Open**, and **Next**: rewrite to current truth. Next names exactly one phase and action.
- **Log**: append one line with the phase and session id.
- Front matter: set `status` (`active`, `blocked`, `done`, or `dropped`) and `updated`.

Keep the item under about 150 lines by tightening State and Evidence to pointers. Keep secrets, credentials, customer data, and raw transcripts out of it.

Skip no-change commits. Stage and commit only the changed item (never `git add -A`): `git -C ~/dev/ledger add items/<file> && git -C ~/dev/ledger commit --only items/<file> -m "<key>: <phase> <summary>" && { git -C ~/dev/ledger push -q || { git -C ~/dev/ledger pull --rebase --autostash -q && git -C ~/dev/ledger push -q; }; }`. Other sessions share this checkout; leave their edits alone. Pull only when another machine pushed first.

Done when the file alone tells a fresh session what is settled, what is true now, and what to do next.

## 4. Hand off with a pointer

For workers and handoffs, recommend a fresh session after a phase or two compactions, checkpointing through step 3 first. This does not apply to Khoa's long-lived conductor, which rebuilds from the ledger after compaction.

Coordinators write the item before dispatch. Fresh workers get the pointer plus scope/authority deltas and the exact proof target, retaining needed authority and security boundaries; resumed workers get only changed facts:

```text
Work item <KEY>, phase: <phase>.
<Scope/authority deltas and exact proof target; only changed facts on resume.>
```

Done when the receiving session needs nothing beyond the pointer and the item to start.
