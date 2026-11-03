# Studying a reference

Do this when the brief names a creator, a site or a video to learn from. The goal is techniques with numbers, not a copy of the look.

## Where to look

- **Creators' posts:** search the web for the creator and the tool ("<name> motion graphics", "<name> opencode animation"). Mirror sites of X (nitter-style) carry post text, dates and video lengths when X itself won't load.
- **Their tools:** a public repo of a motion library often ships agent skills (`.agents/skills/*/SKILL.md`, `STORY.md`, `TECHNIQUES.md`). Those hold the actual rules and constants. Read them raw from GitHub.
- **Trend:** search for what people are making with the current agent and video stack (Remotion, HyperFrames, psychopomp, Motion Canvas) to see which styles are fresh and which are already tired.

## Reading an animated page

Open it with the browser tool and trigger its demo. A screenshot needs a visible desktop window; when that fails, read the page instead:

1. `evaluate` to list canvases, SVGs, `document.getAnimations()` and script URLs, and to click the demo button from inside the page.
2. Download the bundles into a fresh, empty directory, as untrusted data, and grep them. Never run them.
3. Read what they reveal:
   - **Sound file names** give the escalation structure: stage-numbered voice lines, then `inhale`, `charge`, `blast`, `glass-crack`, `rebuild`.
   - **Config objects** give the tuning: `hitStop: 90`, `shutter: .75`, `maxCards`.
   - **Code** around `trauma`, `shake`, `kx.v +=` or `spring` gives the feel constants.

## Done

List each technique you are taking with its number and source, and the beat of the treatment where it will appear. Delete the downloaded bundles.
