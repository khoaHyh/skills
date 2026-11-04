---
name: work-ledger
description: Read and update the durable work ledger in ~/dev/ledger for work that spans sessions. Use when a task names a work item (a Linear key such as TASK-617, a PR such as platform#1369, or "work item <key>"), when picking up, handing off, or delegating multi-session work, or when a phase ends.
---

# Work ledger

The ledger is the single source of truth for a work item between sessions: its outcome, decisions, authority, live state, evidence, open questions, and next action. A session's transcript is scratch; the ledger is what the next session inherits. Items live in `~/dev/ledger/items/<primary-key>.md`, shaped like `~/dev/ledger/_template.md`.

## 1. Find the item

The `work-ledger` plugin attaches matching items to prompts that mention one of their `keys`. Otherwise search: `rg -il '<key>' ~/dev/ledger/items`.

Create an item from `_template.md` when the work is PR-bound, an incident, or likely to outlive this session, and none exists. List every identifier that should find it in `keys`. One-session questions need no item.

Done when you are holding the item, or have decided the task needs none.

## 2. Reconcile before acting

Treat the item's Decisions and Authority as accepted context: they are what Khoa already settled, with sources. Treat State as a dated claim. Before acting on it, re-check each fact you depend on against live sources (`git fetch` and `git log`, `gh pr view`, the deployed ref) and correct State in the file.

Done when every State fact your next step depends on is confirmed or corrected, with a new `Checked` time.

## 3. Write at phase boundaries

Phases are `research`, `plan`, `implement`, `verify`, and `rollout`. At the end of each phase, after a second compaction, and before ending any session that changed the item's picture, re-read the file and update it:

- **Decisions** and **Authority**: append dated lines with a source link. Supersede a line with a new one that says what it replaces; never delete one.
- **State**, **Evidence**, **Open**, and **Next**: rewrite to current truth. Next names exactly one phase and action.
- **Log**: append one line with the phase and session id.
- Front matter: set `status` (`active`, `blocked`, `done`, or `dropped`) and `updated`.

Keep the item under about 150 lines by tightening State and Evidence to pointers. Keep secrets, credentials, customer data, and raw transcripts out of it.

Commit and push only the item, so agents on other machines see it: `git -C ~/dev/ledger pull --rebase -q && git -C ~/dev/ledger add items/<file> && git -C ~/dev/ledger commit -m "<key>: <phase> <summary>" && git -C ~/dev/ledger push -q`.

Done when the file alone tells a fresh session what is settled, what is true now, and what to do next.

## 4. Hand off with a pointer

When a phase ends or the session has compacted twice, finish step 3 and recommend a fresh session with the pointer prompt below rather than continuing in the long thread.

Coordinators (Grok Bot, a primary delegating to a sibling session) write or update the item first, then start the session with a pointer instead of a re-brief:

```text
Work item <KEY>, phase: <phase>.
<Only what is new since the ledger was last written, if anything.>
```

Done when the receiving session needs nothing beyond the pointer and the item to start.
