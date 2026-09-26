---
name: record-verification
description: Record a reviewable end-to-end walkthrough of an agent's changed UI flow for human product and visual verification. Use only when the user explicitly asks for a recording, video proof, or recorded verification; not for routine tests or polished release demos.
---

# Record Verification

Make the changed user path inspectable by a human. The video is evidence of what happened in the running app, not a substitute for assertions and not a release film. The reviewer decides whether the behavior, appearance, and direction are right.

## 1. Define the proof

Identify the changed user-visible behavior, its entry point, expected result, and any persisted or cross-surface effect. Read the repository's applicable agent guides, verification skill, feature map, recipe, and test harness before driving the app. Discover local CLIs and their current help rather than assuming a universal launch or login command. If no user-visible path exists, explain that and offer the relevant non-video evidence instead of staging a fake walkthrough.

Choose a small number of scenarios that cover the changed risk. Record the intended path and the state the reviewer must see, including a meaningful before/action/after. Name what the selected path cannot prove. Use a task-owned or explicitly approved environment and non-sensitive fixture; respect shared instance, account, device, and data ownership rules. Do not reset, seed, or mutate a shared environment merely to make footage attractive.

## 2. Prove and rehearse

Run the owning readiness check and relevant automated verification. Exercise the real user controls and assert the resulting state, not just successful clicks or a loading shell. Inspect applicable console, network, logs, or persistence evidence when the behavior depends on them. A passing video cannot override a failed check, and a passing test cannot replace seeing the UI.

Rehearse navigation, authentication, test data, and state-based waits before the take. Keep credentials, setup shortcuts, and test-only controls out of the visible user path; disclose any setup that affects interpretation. If the flow fails, diagnose or report the failure. A reproducible failure can be recorded as failure evidence; do not present a later take as if the failure never occurred.

## 3. Select capture

Use the repository's owning browser or native driver for interaction. Select the recorder that actually covers the review surface:

- For a contained web page, the existing Playwright/browser recorder may suffice. Check whether it captures the cursor, browser chrome, dialogs, and final state you need.
- For desktop, native dialogs, cross-app or cross-surface behavior, or when framing and visible input materially improve review, prefer **Cap as the screen recorder** when available. Discover current commands with `cap guide --json`; target an exact, non-sensitive window or display and use intentional virtual input. Cap records the driver; it does not replace the repo's verification harness.
- For mobile, use the owning simulator/device capture helper where available. Check that it records the same device the agent drives.

Before recording, state the selected scenario, window/device, account or fixture, capture area, resolution/frame rate when configurable, cursor and audio choices, and any privacy risk. The user's request for a recording authorizes a bounded capture of that flow, not an unrelated desktop or sensitive account. If the available target would expose private or unrelated material, choose an isolated target or ask before capture. Do not upload or publish artifacts without separate authorization.

## 4. Capture honestly

Start before the meaningful action and stop after the resulting state has been visible long enough to read. Drive at a watchable pace: wait for state, then leave a brief viewing beat; do not rely on blind sleeps as proof. Show real user interaction and keep the action and outcome in the same take where practical. Include a screenshot of a critical end state when a frame alone may be hard to inspect.

Retain the original recording unchanged, including every original `.cap` project if Cap was used. Work on a copy for basic trimming, framing, or a clearly labeled chapter boundary only when that improves reviewability. Disclose cuts, omitted steps, sped-up sections, recreated state, and separate takes. Prefer a fresh take to an edit that could misrepresent causality. Leave cinematic camera work, branding, narration, and Remotion compositions to a separate product-demo workflow.

## 5. Inspect and hand off

Stop/finalize the recorder and **watch the actual saved file**, not just the live app or command output. Confirm that it opens, covers the claimed path, shows readable result states and intentional input, and contains no secrets or unrelated private content. Use `ffprobe` or the available media inspector for duration, dimensions, frame rate, and audio; inspect representative frames and the beginning/end. If capture failed, report it rather than claiming video proof.

Return a compact review packet:

- Original recording path; any review copy path and exact edits. Keep these local unless sharing was authorized.
- Timestamped steps mapping the visible action to its result, with expected versus observed behavior.
- Exact checks run and their results; relevant screenshots, trace, or log evidence; unrun checks and coverage limits.
- Failures, surprising behavior, and concrete product or visual questions for the reviewer. Leave the human verdict open even when the checks pass.

Finish when the reviewer can watch the changed flow and distinguish what was verified from what still needs their judgment. If the app, account, recorder, or safe capture target is unavailable, name the blocker and provide the strongest non-video evidence obtained; never invent a successful take.
