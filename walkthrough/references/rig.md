# Rig and capture gotchas

Reached from `SKILL.md` steps 2–3. What `capture.mjs` and `sync.mjs` already handle is noted; the rest is yours to set up.

## One clock

- Every recorder stamps with wall time: browser frames at receipt (`Date.now()`; CDP `metadata.timestamp` drifted by minutes under mobile emulation), Simulator recordings by their start line plus tap anchoring in `sync.mjs`.
- Reacting surfaces wait on the real event, then wait 2.5–3.5 s and reload, then wait for text only the new state shows. Each reload is shown as a pill and disclosed: an app that refreshes itself every 30 s would otherwise leave the viewer staring at stale screens.
- The acting surface's beat command runs the beat at human pace and the capture waits `settle` seconds after it, so every surface shows the result before the next beat.

## Browser surfaces

- CDP screencast frames arrive only on paint, at CSS-pixel size in headless Chromium. At 1080p a phone pane is ~320–400 px wide, so 1× is enough; set `masterWidth` to upscale for zooms above ~1.2×.
- Screencast stalls with `isMobile` emulation; use the device's viewport, DPR, touch and user agent without it, and a full-screen viewport so the pane has the phone's shape.
- Sign-in tokens or tickets are often single use: mint them right before each run in the surface's `setup`, read them from a private file, never print them.
- Blur emails and phone numbers with `blur` even on synthetic data.

## iOS Simulator surfaces

- `simctl recordVideo` writes variable frame rate from the first changed frame, so its duration is shorter than wall time. `sync.mjs` anchors it by matching each logged tap to the first large screen change near it (median offset, typically ±0.3 s) and pads the static tail.
- It doesn't record touches; ripples are drawn from the logged taps. Give each tap label a point, or the tap logs without a ripple.
- Driving with Maestro: one flow per beat (startup 5–10 s falls in the cut between beats). Hold with `- evalScript: ${var t=Date.now(); while(Date.now()-t<2000){}; 1}`. Point taps take integer percentages. A sheet's button can share its label with a control behind it; tap it by point.
- The status bar override pins a fake clock; keep the real time when apps print real times.
- Dismiss development overlays (error toasts, dev menus) before recording. A stale development build can crash on newly added native modules: rebuild it for the commit you record.
- Media pickers don't list in import order. Read the picker in a rehearsal frame and choose the tile by what it shows. Use openly licensed or generated images with no plates, house numbers or people; strip metadata; credit licences on the end card.
- Pre-grant or rehearse permission prompts (photos, notifications); they persist on the device.

## Data and pages

- Reset before every take so relative times ("today", "in 2 hours") land now.
- Wait on body copy, not headings: headings carry line breaks that defeat a text match.
- A route can redirect when state changes (a "today" page that sends a finished item home): open the canonical page for the after-state.
