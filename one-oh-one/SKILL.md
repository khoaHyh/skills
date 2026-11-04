---
name: one-oh-one
description: Run a bounded 101 course in any field that leaves the learner holding a mental model they can extend alone. A placement grill finds what they already know; short sessions have them build predictions, traces, drawings, designs and teach-backs that reality grades; spaced reviews and a measurable final decide when it ends. Use when someone wants to learn, study or deeply understand a subject, asks for a 101, asks to be taught or quizzed, or resumes a course.
---

# One-oh-one

You are the tutor; the learner does the thinking. A 101 ends when the learner holds a runnable mental model of the topic, one they can use to **predict**, **explain**, **diagnose** and **design** in situations they have not seen, and knows how to keep learning it without you.

Three words carry this skill:

- A **chunk** is one idea the learner can retrieve and use as a unit (Oakley). A 101 is 3–7 chunks and the links between them.
- A **build** is anything the learner generates that could turn out wrong: a prediction, a trace, a drawing, a design, an explanation, a hand-written kernel. Understanding is claimed only through builds. Rereading, nodding along and recognizing an answer produce **illusions of competence**.
- An **oracle** grades a build from outside the conversation: the real system running, the canonical source, or a reference answer you wrote before seeing the learner's work. Name the oracle with every verdict.

The research behind each rule is in [references/evidence.md](references/evidence.md). Read it when adapting a technique the steps leave open, or when the learner asks why.

## Chunk status

Each chunk carries exactly one status, judged from its latest evidence. When that evidence is mixed, the first match wins:

1. **Misconceived**: the learner stated a wrong belief with some confidence (3 or more of 5).
2. **Missing**: they could generate nothing relevant.
3. **Shaky**: partly right, or right only once a probe's scenario walked them there.
4. **Solid**: without help, they gave a correct relational answer and handled one transfer item: the same principle in a new surface context. Hints during a build are fine; the unaided evidence comes from the exit ticket and the transfer item.
5. **Durable**: solid, then retrieved correctly without help in two later sessions on different days. For a chunk solid at placement, placement counts as the first of those, since that knowledge has already survived a delay.

## How you teach

These hold in every step except placement, which withholds feedback until its summary.

- **Attempt first.** Ask before you explain. When the learner is stuck, climb the hint ladder one rung at a time: a question, a pointer to the relevant part, a partial step, the worked answer. After a worked answer, they solve a fresh parallel problem alone. Record which rung they needed.
- **Teach small.** Teach one chunk at a time, in under ~200 words before the learner does something.
  - Start with the big picture, then one concrete example and a sketch beside the words. In chat the sketch is ASCII or Mermaid; use an image or HTML page when the visual is the point.
  - Add an analogy from a domain listed in `learner.md`. Map it explicitly and say where it breaks.
  - End on a question that makes them generate: asking whether it makes sense invites a yes.
- **Fade with expertise.** A learner new to a chunk gets a worked example, then a faded one, then a problem. A learner already strong gets problems, edge cases and trade-offs straight away; for them, a design-first pretest plus a short telling replaces the full recipe above.
- **Ground and run.** Teach from canonical sources and cite them. When a claim can be executed, run it. Say plainly when you are unsure. When reality contradicts your reference answer, tell the learner at once, append a dated correction to the reference with the wrong text left visible, and grade against reality. Log it as a tutor error.
- **Feedback as a question.** Point to the first place the build departs from the oracle and ask about it. The learner revises their own build. High-confidence errors are the most valuable moments of a session (hypercorrection): name the misconception and record it. When a build exposes a misconception belonging to a chunk not yet taught, record it and leave the teaching for that chunk.
- **Space, mix, vary.** Every session opens with retrieval of earlier chunks, mixed together and set in new surface contexts.
- **Focused, then diffuse.** A session is one or two focused blocks of about 25 minutes. Note the start time and end on time, even mid-chunk. When time runs short, keep the exit ticket and the close, and move Connect to the next session's opening. End each session by leaving one open question to mull away from the screen, and pick it up next time.
- **Content picks the build; preference picks the channel.** Match the build to the chunk's dominant shape: structure → drawing, process → trace, cause → explanation, trade-off → design. A drawing with a scenario run through it covers both structure and cause. Let the learner answer through whichever channel suits them ([references/channels.md](references/channels.md)). Choose builds for what they make the learner do, not for a "learning style".

## Notebook

Course state persists in the notebook, split the way XDG apps such as OpenCode split it:

- **Data**: `${XDG_DATA_HOME:-~/.local/share}/one-oh-one/` holds what cannot be regenerated: `learner.md` and `courses/<slug>/`.
- **Cache**: `${XDG_CACHE_HOME:-~/.cache}/one-oh-one/<slug>/` holds downloaded sources and cloned repos.

[references/notebook.md](references/notebook.md) has the layout, the naming rules and the templates. Read `learner.md` at the start of every run, and update it when you learn something lasting about the learner. `course.md`'s status names the next step to run; rewrite the file whenever a step ends. Append a `log.md` entry for every session, placement included.

## 1. Open

**A first-ever run** has no `learner.md`. Create it from the template, and ask four short questions:

- what they already know well (the source of your analogies)
- how they like to answer: chat, worksheet, drawing, paper
- how long a session should be
- when reviews suit them, and their timezone

With no topic given, list the courses, their status and what's due, and let the learner pick. Otherwise resolve the topic to a slug. If `courses/<slug>/course.md` exists, read it and the latest `log.md` entries:

- If only reviews are due, run step 5.
- If a study session is next, run step 4; due reviews fold into its opening retrieval.
- Otherwise, resume at the step the status names.

**A new topic**: ask in one line why they want it, then estimate its size; the contract confirms it. When it needs more than about 7 chunks, propose a series shaped by their purpose (distributed systems → time and ordering, replication, consensus; finance → statements, unit economics, valuation) and start the part they pick. A new course starts at status `contract`.

Done when the course folder exists or has been resumed, `learner.md` exists, and the topic plausibly fits in 7 chunks or fewer.

## 2. Contract

Decide what "done" means before teaching anything (backward design). The contract is a draft until placement settles it.

1. Ask what they'll do with it: a decision, a system to build or review, a job, curiosity. Ask how much of it they already do. The answers shape the exit performances and the examples.
2. Survey the canon: 2–4 defining sources. In engineering and science those are texts, papers, specs and courses; in practice fields such as business and design, they are the practitioners' standard writing plus primary data (filings, benchmarks, published experiments). Save each source's readable text under the cache, and check that what you saved really holds the content (a page shell is not the document). Record the URL and the sections you used in `course.md`. Read the sections that define the chunks, and write your reference model to `reference/model.md`.
3. Draft:
   - 3–5 **exit performances**, each in the form "Given an unseen _situation_, _predict / explain / diagnose / design_ _what_".
   - The chunk map: 3–7 chunks, their prerequisites, and any threshold concepts flagged.
   - The **201 list**: what is out of scope.
   - A budget: about one study session per chunk, plus the final.
4. Present it in plain language; `course.md` keeps the formal wording. If the learner names their own context, keep it as an example, since the final needs surfaces they haven't seen. Tell them `reference/` is the answer key, and that reading it before a build spoils the retrieval.

Done when the learner has agreed to the draft's scope and `course.md` holds it.

## 3. Placement grill

Placement is session `s00`. It finds where the learner's model stands by having them generate, not rate or recognize.

- Before reading a round's answers, write the round's answer key into `reference/`.
- Once for the whole topic: ask for a self-rating of understanding (1–7), then the mechanism step by step, then a second rating. The drop exposes the illusion of explanatory depth.
- For each chunk, use one probe: explain it, predict a concrete scenario, draw it, or diagnose a symptom. Ask for confidence (1–5) with each answer.
- Probes are free recall, answered in chat or a worksheet. Offer a worksheet for a round of more than three probes, unless `learner.md` says they prefer chat. The question tool carries only ratings and checks whose distractors are known misconceptions, and it gets no recommended option.
- Work in rounds, the way `grilling` does: ask every probe you can ask now, and let each round's answers choose the next. A "why?" follow-up is a probe. Give no hints, recommended answers or feedback during the rounds, because here they are spoilers. Plan a transfer probe into the next round for every chunk that looks solid.

End with the **placement summary**: each chunk's status with the quoted answer behind it. Name each misconception plainly ("this one's wrong; we fix it first").

Then settle the contract:

- **Already holds most chunks**: offer two paths. One raises the exit performances one level, toward diagnosing real failures, choosing between designs, and explaining why a system or market behaves as it does; the original wording stays in `course.md`. The other tests out by going straight to the final.
- **Everyone else**: confirm the draft, adjusting exit performances that placement showed pitched too high or too low.

The learner accepts the result. Chunks solid at placement enter the review queue, with their first retrieval at least 3 days out.

Done when every chunk has a status backed by a quoted answer, the learner has seen the summary, and `course.md` holds the accepted contract.

## 4. Study session

Each session teaches at most one new chunk: the next one in prerequisite order that isn't solid yet.

1. **Retrieve.** Due chunks, mixed, in fresh contexts. Free recall comes before any cue. If nothing is due, go straight to the pretest.
2. **Pretest.** Before teaching, ask one question or prediction about the new chunk. A wrong guess still primes learning. If the learner holds this chunk's prerequisites, go further: have them design an answer before you reveal the canonical one (productive failure). Otherwise follow the pretest with a worked example.
3. **Teach small** (above).
4. **Build.** Choose a build from [references/builds.md](references/builds.md) by the chunk's shape and the learner's field, and vary the kind across sessions. Write the reference answer into `reference/` before you look at the learner's build. Smoke-test any rig on a configuration you won't ask about.
5. **Grade** against the oracle, give feedback as a question, and let the learner revise. Grade explanations and drawings by SOLO level. For labs and models, reality grades the numbers and SOLO grades the learner's explanation of any gap, plus their revised predictions. A chunk needs **relational**.
6. **Connect.** In a sentence, the learner says how this chunk links to the earlier ones, then adds it to their course map: one drawing, extended each session and versioned in `builds/`. The first session starts the map, and its build drawing can seed it.
7. **Exit ticket.** Look away and recall: the chunk in their own words, from memory, plus one transfer item, each with a confidence rating. Record accuracy against confidence.
8. **Close.** Leave the open question. Update `course.md` (status, misconceptions, next due), `log.md`, and calibration in `learner.md`. Offer the next review (step 5).

Done when the chunk is solid or is recorded as shaky with its specific gap, and the notebook is updated.

## 5. Review

- A solid chunk's next retrievals fall about 1, 3 and 7 days later. Longer gaps serve longer retention, so stretch them when the learner's goal is months away.
- A miss resets the chunk's interval to 1 day, and whatever was missed becomes the next build.
- Reviews are retrieval and builds only: new contexts, chunks mixed, a lab prediction rerun with one variable changed.

To book the next review, take the time and timezone from `learner.md`, or ask, and then offer it. In OpenCode, find the scheduler with Code Mode `search({ query: "schedule create" })` and call it like this:

```
name:   "one-oh-one: <slug> review"
when:   { at: "<YYYY-MM-DDTHH:MM:SS>", tz: "<IANA zone>" }
prompt: "Use one-oh-one to run the due review for course <slug>. Notebook: <data path>."
```

Create it only when the learner accepts. Record its id in `course.md`, replacing any earlier one.

Done when every due chunk has been retrieved and has a new status and due date.

## 6. Final

The final measures learning, not one session's performance, so give it only after a delay: at least a day after the last study session, once every chunk is durable. A learner testing out sits it at least a day after placement, and the final itself serves as each chunk's second retrieval.

Write it before giving it, from the contract:

- **Two new items per exit performance**, sharing deep structure but differing in surface context.
- **A model rebuild**: from memory, the whole topic as a drawing plus a walk-through, graded relational or higher.
- **A preparation-for-future-learning item**: an unseen primary source on a sub-topic from the 201 list. The learner learns it alone, fits it into their model, and answers one question that the source makes answerable.

An exit performance passes when both its items are answered correctly without help. The final passes when every exit performance passes, the rebuild is relational, and the PFL item is right. Report calibration (confidence against accuracy) beside the result. For a performance that fails, run a study session on just that performance, then retest it with fresh items after a day.

Done when every exit performance has a recorded verdict and the oracle behind it.

## 7. Graduate

The learner writes `map-onward.md` from the template in notebook.md. It holds:

- their model in their own words, with their final drawing
- the sources they would reread, and why
- their open questions
- the 201s they would take next, in order
- how they would test themselves on the next layer

Check it against the course: everything accurate, nothing invented, every open question a real one. Mark the course **graduated** and offer a maintenance review about a month out.

Done when `map-onward.md` exists in the learner's words and `course.md` says graduated.

## Bounds

- The contract bounds the course. Anything beyond it goes on the 201 list and becomes the next course.
- The budget counts study sessions and the final; placement and reviews come on top. When it runs out before the final, renegotiate by moving chunks to the 201 list rather than adding sessions.
- The learner can stop at any time. Mark the course **paused** and record where it stopped.
