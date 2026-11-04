# Builds

A build is anything the learner generates that could turn out wrong. Choose one by the chunk's shape, vary the kind across sessions, and grade every build against an oracle.

## Oracles, strongest first

1. **Reality**: the system running, the experiment, the simulation, real data.
2. **Canonical source**: the spec, paper, textbook or filing, cited down to the section.
3. **Reference answer**: written into `reference/` from 1 or 2 before you look at the learner's build, so their answer can't anchor yours.
4. **Rubric judgement**: SOLO levels plus the field's named principles. Tell the learner when this is the only oracle you have.

## Any field

| Build | The learner | Oracle |
| --- | --- | --- |
| Predict, observe, explain | writes a prediction and the reason for it before the result is revealed, then explains any gap | reality |
| Teach-back | explains the mechanism to a novice you play, who asks "why?" at every leap | reference answer |
| Draw from memory, then run it | draws the structure from memory, then walks a scenario through the drawing (trace a request; kill a component) | reference propositions |
| Concept map | draws nodes with labelled links, each link reading as a sentence | reference propositions |
| Compare cases | finds what two cases share underneath their different surfaces, and where the analogy breaks | canonical source |
| Sort by principle | groups 6–8 problems by the principle that solves each, and explains the sort | reference answer |
| Diagnose | goes from a symptom to its cause before seeing the fix | reality or reference |
| Find the error | spots and explains a planted error in a worked solution | reference answer |
| Design, then compare | designs under stated constraints, then compares their design with the canonical one | canonical source |
| Estimate, then check | makes a Fermi estimate with stated assumptions | real figures |

A drawing helps memory but tests understanding only when the learner runs a scenario through it, so every drawing build ends with one.

## Labs, in any field

A lab is a rig you run so that reality can be the oracle: a script, a container, a headless browser, a calculator that recomputes the learner's spreadsheet. It lives in `labs/<name>/`.

- Smoke-test the rig on a configuration you won't ask about. Running the real one first shows you the answer before you've written the reference.
- Run each configuration at least twice and report any variance. Record the versions and platform, since engine- and platform-specific numbers are part of the result.
- The learner's prediction goes into the log before every run.

## Engineering and systems: replacing hand-coding

Building things by hand taught well because it combined three things: **prediction** (will this work?), **generation** (writing it yourself) and **an honest oracle** (the compiler, the crash, the test). Keep all three. The typing is what you can drop.

- **Predict-then-run lab** (PRIMM: predict, run, investigate, modify, make). You build a small rig in `labs/`. The learner writes a prediction before every run. Afterwards they explain any difference, change one variable, and predict again. Rigs that work well:
  - the timing phases of an HTTP request (`curl -w`)
  - the order of timers, promises and I/O callbacks in an event loop
  - isolation anomalies between two `psql` sessions
  - an outbox relay that crashes between publish and mark-sent
  - three nodes split by `docker network disconnect`
- **Be the machine** (a notional machine). The learner traces state step by step in a table:
  - the stack and environment while an interpreter evaluates `(+ 1 (* 2 3))`
  - tokens and the AST as a parser reads a line
  - TCP states while a connection closes
  - Raft terms and logs across three nodes after the leader crashes
  - the browser pipeline from bytes to pixels
- **Break it.** Name a fault and where it hits: a crash after commit but before publish, a broker down for 30 s, clock skew, a full disk. The learner predicts loss, duplication, stall or reordering. Then run it.
- **Spec, then predict the build.** The learner writes a spec or pseudocode. You implement it exactly as written, mistakes included. The learner predicts which tests fail, and why, before running them. This puts their design under test, not yours.
- **Read the source with a target.** Give a question such as "Where does Redis choose what to evict?" The learner predicts the file, function and mechanism, then reads the code to check.
- **Kernel by hand.** The learner writes the 20–80 lines that embody the chunk, without AI completion: an eval loop, a tokenizer, a relay loop, a Lamport clock. You supply the harness and the tests. Use this when the chunk is an algorithm, or when the learner wants to build.
- **Parsons problem.** The learner reorders the shuffled lines of a procedure that includes one distractor line, and explains each dependency.

Where engineering labs run:

- Everything runs on the learner's machine, touching nothing shared or in production.
- macOS blocks `dtruss` under SIP, so run `strace`, `tcpdump`, `perf` or `bpftrace` in a Linux container.
- On the host, `curl -w`, `lsof`, `nettop` and `sample` all work. `fs_usage` needs sudo, so ask first.
- Browser labs need real frame production, which a container's headless Chrome lacks. Drive the host's Chrome over the DevTools protocol, with a throwaway `--user-data-dir`, and read the result from Performance or Long Animation Frame observers. `--dump-dom` returns before any frame runs.

## Design

- **Critique, then test.** The learner critiques an artifact against named principles (hierarchy, Gestalt grouping, Nielsen's heuristics) and predicts what a user does first. A first-click or five-second test with 3–5 people checks the prediction.
- **Redesign under a constraint**: half the space, keyboard only, a screen reader, a 10× longer label.
- **Predict the winner.** The learner predicts which variant won a published A/B test, with their reason, before you reveal the result.
- **Three alternatives.** The learner sketches three alternatives, chooses one, and argues the trade-off. Then compare it with how a canonical exemplar solved the same problem.
- **Run a flow on the drawing.** The learner draws a funnel or flow, then you send one specific user through it ("a first-time visitor on a phone, coming from an ad") and they follow that user.

Oracles: a usability test with 3–5 people, published experiment results, accessibility checks, canonical exemplars.

## Business

- **Tag the cost sheet.** The learner classifies every line of a real or realistic cost sheet (cost of goods, variable, fixed, acquisition) and predicts the resulting margins. A calculator in `labs/` recomputes from their tags. A wrong classification shows up as a wrong number.
- **Cohort table.** The learner predicts a retention curve and lifetime value from a cohort table, then recomputes it, then predicts what one changed input does.
- **Cash trough.** Given CAC, payback and growth rate, the learner predicts the month cash bottoms out. A small simulator in `labs/` answers.
- **Case predict-then-reveal.** Given the situation a company faced, the learner predicts the decision and the outcome, then reads what actually happened.
- **Fermi estimates**, checked against published figures.
- **Decision memo with a pre-mortem**, compared with how comparable decisions played out.

Oracles: filings (10-K, S-1), published benchmarks and the field's practitioner canon, recomputation in a lab, the learner's own numbers.

## Science and mathematics

- Predict, observe, explain against a simulation you write, or against real data.
- Derive a result, then check it against limiting cases and units.
- Explain a mechanism as a chain of cause and effect at the right level of detail.
- Work interleaved problem sets that mix chunk types, so the learner has to choose the method.

## Any other field

Ask what the field's practitioners actually produce: a historian's argument from sources, a translator's rendering, a clinician's differential diagnosis. Make that the build, and find the oracle the field itself uses to judge it.

## Grading

Grade explanations, drawings and designs by SOLO level (Biggs and Collis):

| Level | The answer |
| --- | --- |
| Prestructural | misses the point |
| Unistructural | gets one relevant aspect |
| Multistructural | lists several relevant aspects without connecting them; memorization looks like this |
| Relational | integrates the aspects into a structure that explains how they interact and supports predictions |
| Extended abstract | goes beyond the taught structure: transfers it, critiques it, or designs with it |

A chunk needs relational. Mixed builds split the grading: reality grades the numbers, the canonical source grades classifications, and SOLO grades the reasoning. For each grade, record the oracle, the SOLO level, the support used (unaided, or the hint rung reached; a revision after question-feedback counts as rung 1) and any misconception.

### Grading a drawing from any tool

1. Before opening it, write the reference as propositions (`A -[label]-> B`) in `reference/`.
2. Read the drawing as propositions. For an Excalidraw file, or a PNG/SVG exported with an embedded scene, run `node <skill-dir>/scripts/excalidraw-graph.mjs <file>`; it lists nodes and labelled edges exactly. For anything else (tldraw, Paper, an iPad sketch, a photo of paper), read the image.
3. Say back what you read ("your drawing says the relay reads the outbox and publishes to Kafka"), and let the learner correct the reading before you grade it. Confirm every end the script marks `snapped` or `unattached`; those are guesses.
4. Classify each proposition as correct, missing, wrong (direction, label or target), extra but valid, or a misconception.
5. Ask about the most consequential gap first, as a scenario on their drawing: "The relay crashes here. Follow the row." Or: "One customer signs up at $40 a month. Follow your arrows to the cash."
6. The learner revises. Save the new version beside the old one.

Grade what the drawing says, not how polished it looks.
