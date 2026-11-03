---
name: record-verification
description: Capture before/after proof of a changed UI flow and cut it into a review video a human can judge at PR size. Use before implementation when an engineering workflow requires UI evidence, or when the user requests a recording, video proof, or recorded verification; not for release or hype films.
---

# Record Verification

Make the changed user path inspectable by a human. The video is evidence of what happened in the running app, not a substitute for assertions and not a release film. The reviewer decides whether the behavior, appearance, and direction are right. The review cut exists so they can see the change at the size a PR plays it, know what to look at, and trace every frame back to the original take.

## 1. Define the proof

Identify the changed user-visible behavior, its entry point, expected result, and any persisted or cross-surface effect. Read the repository's applicable agent guides, verification skill, feature map, recipe, and test harness before driving the app. Discover local CLIs and their current help rather than assuming a universal launch or login command. If no user-visible path exists, explain that and offer the relevant non-video evidence instead of staging a fake walkthrough.

Plan the comparison before implementation. For a UI bug, reproduce and capture it in the unchanged running app before editing. For other UI changes, capture the existing experience when it provides a meaningful baseline. Use the capture steps below for the baseline, then repeat the same meaningful actions after the change with comparable fixtures, viewport, and environment; identify both revisions. If a safe baseline is unavailable or the bug cannot be reproduced, state that limit and provide after-only evidence without implying an observed before/after comparison.

Present a flow's before and after in one review video with clearly labeled **Before** and **After** sections. Separate takes can be joined; leave implementation time out of the recording. Static-only changes may use labeled screenshot pairs unless a video was requested.

Choose a small number of scenarios that cover the changed risk. Write the review plan:

- the **watch-for** sentence: the one thing the reviewer judges
- per beat, the action → result, its caption, and its **evidence region**, the part of the screen where the result appears

Estimate viewing time from those beats, not from the agent's execution time. Favor the shortest cut that remains understandable at 1×; a simple flow may be brief, while a complex or cross-surface flow may need longer or separate focused clips. Preserve essential evidence rather than forcing a fixed duration. Name what the selected path cannot prove. Use a task-owned or explicitly approved environment and non-sensitive fixture; respect shared instance, account, device, and data ownership rules. Do not reset, seed, or mutate a shared environment merely to make footage attractive.

Done when the watch-for sentence and every beat's caption and evidence region are written, and the Before and After sides run the same beats.

## 2. Prove and rehearse

For the candidate, run or reuse the owning readiness check and relevant automated verification. Exercise the real user controls and assert the resulting state, not just successful clicks or a loading shell. Inspect applicable console, network, logs, or persistence evidence when the behavior depends on them. A passing video cannot override a failed check, and a passing test cannot replace seeing the UI.

Rehearse navigation, authentication, test data, and state-based waits before the take. Plan how to drive the recorded path without leaving model reasoning or slow tool-call gaps on screen: use an existing deterministic UI drive when appropriate, or capture short continuous sections and assemble a review copy. Keep credentials, setup shortcuts, and test-only controls out of the visible user path; disclose any setup that affects interpretation. If the flow fails, diagnose or report the failure. A reproducible failure can be recorded as failure evidence; do not present a later take as if the failure never occurred.

## 3. Select capture

Use the repository's owning browser or native driver for interaction. Select the recorder that actually covers the review surface:

- For a contained web page, the existing Playwright/browser recorder may suffice. Check whether it captures the cursor, browser chrome, dialogs, and final state you need.
- For desktop, native dialogs, cross-app or cross-surface behavior, or when visible input materially improves review, prefer **Cap as the screen recorder** when available. Discover current commands with `cap guide --json`; target an exact, non-sensitive window or display and use intentional virtual input. Cap records the driver; it does not replace the repo's verification harness.
- For mobile, use the owning simulator/device capture helper where available. Check that it records the same device the agent drives.

Before recording, state the selected scenario, window/device, account or fixture, capture area, resolution/frame rate when configurable, cursor and audio choices, and any privacy risk. An explicit recording request or an engineering workflow selecting this skill authorizes bounded capture of that flow, not an unrelated desktop or sensitive account. If the available target would expose private or unrelated material, choose an isolated target or ask before capture.

## 4. Capture honestly

Start before the meaningful action and stop after the resulting state has been visible long enough to read. For each beat, show where the action will happen, move the pointer purposefully when it helps, perform the action at normal speed, wait for the asserted state, and hold the result long enough to recognize or read it before advancing. Spend viewing time on the changed behavior and its outcome, not a pause after every tool call. A hold makes evidence legible; it does not prove the state. Show the action and outcome in the same take where practical. Include a screenshot of a critical end state when a frame alone may be hard to inspect.

Retain the original recording unchanged, including every original `.cap` project if Cap was used.

## 5. Cut for review

Build the review cut from the original takes, following [references/review-cut.md](references/review-cut.md):

1. Write an edit decision list of beats.
2. Run `scripts/build-cut.mjs`.
3. Render with HyperFrames.

The cut frames each beat on its evidence region, puts the caption in a strip under the footage, and marks the evidence. It labels every speed change, cut and freeze on screen beside the original take's clock.

Trim setup, searching, agent/tool latency, and uneventful dead air. Speed up ordinary waits, and return to 1× for meaningful actions and results. Keep product latency, failures, and causal transitions visible or explicitly called out; never edit them into an apparent pass. Disclose omitted steps, recreated state, and separate takes on the section cards and in the packet. Prefer a fresh take to an edit that could misrepresent causality.

Time every caption, mark, and stated duration from the source itself. Probe the evidence region's pixels for the frame where the state changes, because contact sheets and freeze detection miss small changes.

A take that already reads at PR size and needs no retiming may ship as-is, with its beats in the PR body.

Done when the builder's pacing table shows no warnings, every timing claim matches a source probe, and `npx hyperframes check` reports nothing beyond the expected silence findings.

## 6. Inspect and hand off

Inspect the finished artifacts, not just the live app or command output. For screenshot pairs, inspect both images at their expected viewing size for legibility, comparable framing, accurate labels, and private content.

For video, stop and finalize the recorder, then **watch the final review file at 1× at about 900 px wide**, the size a PR plays it. At every planned beat, confirm that the target, action, and result can be identified without pausing or rewinding, and that marks and framing direct attention without hiding context.

At each sped-up beat and each state change, extract a frame from the rendered file. Confirm the picture shows the state the caption claims, at the take time the clock shows. Inspect the beginning and end, and scan the whole video for secrets or unrelated private content. Use `ffprobe` or the available media inspector for duration, dimensions, and frame rate. If capture failed, report it rather than claiming video proof.

For an authorized PR create/update, attach sanitized, task-owned review evidence to that PR with `gh pr create|edit|comment --attach <file>` (`gh` 2.99+; `gh pr edit --help` has the details); use `pr-body` for placement. Reference each file by its local path in the `--body-file` Markdown (paths resolve from that file's directory) and pass the same files to `--attach`: `gh` rewrites each reference to the uploaded URL. A video renders as a player only when its `![](clip.mp4)` reference is the whole paragraph, so attach the MP4 review cut rather than a raw `.webm` link. Uploads accept OAuth and personal access tokens, not GitHub App tokens, and cap video at 100 MB on paid plans. Read the PR body back and confirm every reference became a `user-attachments` URL. Other uploads or sharing require separate authorization. If publication is unauthorized or `--attach` fails, return local artifact paths and the exact error.

Return a compact review packet:

- Original capture paths, the review cut path, and its `edl.json` (the exact edits). Keep these local unless sharing was authorized.
- The builder's `chapters.md`: timestamped beats mapping each visible action to its result, with expected versus observed behavior.
- Exact checks run and their results; relevant screenshots, trace, or log evidence; unrun checks and coverage limits.
- Failures, surprising behavior, and concrete product or visual questions for the reviewer. Leave the human verdict open even when the checks pass.

Finish when the reviewer can inspect the changed flow and distinguish what was verified from what still needs their judgment. If the app, account, recorder, or safe capture target is unavailable, name the blocker and provide the strongest alternative evidence obtained; never invent a successful take.
