---
name: decide-via-cloudflare
description: Call a decision model via an existing Executor Cloudflare MCP account in Code Mode for bounded classification and prioritization. Use when asked to run Clef-flash, Jev, or typed decision questions through cloudflare-mcp.
---

# Decide via Cloudflare MCP

1. Through Executor, discover `tools["cloudflare-mcp"].ai_run` and verify the intended saved account. It needs Workers AI write (`ai.write`). On reconnect or permission failure, return **uncertain**; do not switch accounts or repeat a pending approval.
2. Read [`decide.js`](scripts/decide.js) and paste its function into OpenCode Code Mode. Pass the saved Executor account ID, authorized input, and typed question map. Use Clef-flash by default or set `model: "jev"` for the fallback. Use a text-free budget before batch calls; an absent or malformed result is not a decision.
3. Keep only the necessary scores or aggregate counts. The model can rank evidence, not authorize sensitive actions, taps, approvals, command gating, or writes. Do not send private inputs without authority for that account and service.

See the Cloudflare model contracts for [Clef-flash](https://developers.cloudflare.com/workers-ai/models/clef-flash/) and [Jev](https://developers.cloudflare.com/ai/models/typesafe/jev/).

The `ai_run` body uses outer `model: "@cf/cloudflare/clef-flash"` and inner `input: { model: "clef-flash", state, questions }`. For Jev, use `model: "typesafe/jev"` and `input: { state, questions }`, as in its REST example. Each question uses `instructions`, for example `{ ask: { type: "noul", instructions: "Is there a request?" } }`.
