# Channels

A channel is how the learner's answer reaches you. The learner's preference picks it, and any channel can carry any build. The learner can save files anywhere and give you the path; copy each one into `builds/` yourself, since the notebook sits in a hidden folder.

## Chat

The default. Chat works for explanations, predictions, and traces written as markdown tables.

## Question tool

Use the question tool for confidence ratings, choosing a path, and quick discrimination checks. Multiple choice tests recognition, so make every distractor a known misconception (as a concept inventory does) and ask for the reason behind the pick. Open answers come back through the tool's free-text option or through chat. In placement, give no option a "(Recommended)" label.

## Worksheet

The worksheet is a local page for a batch of probes, such as a placement round, an exit ticket or a final.

1. In the course folder, write a spec to `worksheets/<id>.json`. The schema is at the top of `scripts/worksheet.mjs`; `course` must be the course slug.
2. Run `node <skill-dir>/scripts/worksheet.mjs worksheets/<id>.json worksheets/<id>.html` from the course folder, then `open` the page.
3. The page autosaves as the learner works. When they finish, they either click **Copy answers** and paste into chat, or click **Download .md**. The download usually lands in `~/Downloads/<slug>-<id>.md` (a repeat download gets a numbered suffix); move it into `builds/`.

A worksheet's autosave is keyed by its id, so give an edited worksheet a new id.

Item kinds:

- `text`: a free answer.
- `choice`: a pick, with a "why" box.
- `scale`: a self-rating, 1–7.
- `diagram`: the path to a drawing, plus notes.

Every item except `scale` has a 1–5 confidence row and an "I don't know" box. An honest blank tells you more than a guess. Put scenarios, logs and code in an item's `code` field, which renders as monospace and is carried into the export.

## Drawing

The learner can draw on any canvas: Excalidraw, tldraw, Paper, Figma or FigJam, an iPad, or paper. They save the drawing or take a screenshot, then give you the path or paste the image. The grading procedure is in [builds.md](builds.md). With Excalidraw, a saved `.excalidraw` file, or a PNG/SVG exported with **Embed scene** on, lets the script read every arrow and label exactly. Any other format is read as an image.

## Spreadsheet

Spreadsheets suit models, cohorts and estimates. The learner builds in Sheets, Numbers or Excel, then exports CSV or shares a screenshot that shows the formulas. Check it by recomputing in a lab, and grade the learner's choices (what goes where, which formula expresses which relationship) apart from their arithmetic.

## Photo

For a photo of paper or a whiteboard, read the image and say back the propositions it states before you grade.

## Scrawl

A Scrawl capture is a screen recording in which the learner talks while drawing. It is the richest channel for teach-backs. Load the `scrawl` skill to read one.

## Terminal

For a lab, the learner runs the commands themselves and pastes the output. Alternatively, you run them once the learner's prediction is written down.
