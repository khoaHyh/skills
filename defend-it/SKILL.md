---
name: defend-it
description: Examine the user on a change or document an agent produced, before they merge, ship or sign off, so they own it instead of rubber-stamping it. Takes their hypothesis first, quizzes them unaided on the consequential lines, surfaces the decisions the agent made for them, the summary's unchecked claims and what the checks miss, and gives a merge verdict. Use when the user asks to be quizzed on a PR, diff, branch, spec or agent-written analysis, wants to check they understand a change before merging, or asks whether they could defend it.
---

# Defend it

The user is about to put their name on something an agent made. You are the examiner at a thesis **defense**: you ask, they answer, and a pass means they could explain and defend the work to the person who will maintain it, without an agent's help. A fluent summary that looks right is exactly what lets someone drift from delegating work into accepting it unread.

- The **key** is your answer to each question, taken from the artifact itself (read it, run it) and written before you see any of the user's answers.
- A **decision** is a choice the agent made that the request didn't dictate: a default, a scope cut, an ordering, an error path, a requirement reinterpreted when two of them clashed.
- A **claim** is anything the PR body or summary asserts about the change.
- The **checks** are the tests, builds, screenshots and runs offered as evidence. Each proves one property.

**Independence.** If this session produced the artifact, its key would share the artifact's mistakes. Dispatch a fresh-context subagent that can read and run code to write the key from the artifact and the original request, reading it as if nobody it trusts wrote it. Otherwise write the key yourself from the artifact, never from memory of how it was made.

**Run files** live in `${TMPDIR:-/tmp}/defend-it/<slug>/`, where the slug comes from the branch or document name: `hypothesis.md`, `key.md`, `answers.md`, `decisions.md`, `verdict.md`. Tell the user not to open `key.md`.

## 1. Frame

Name the artifact (a PR, `git diff <base>...HEAD`, a branch, a document path) and the request it answers (the issue, PR body, prompt or ledger entry). Then set the depth by the stakes:

- **Low**: cheap to be wrong and easy to revert. Say so, and offer to skip or to run three items.
- **Normal**: 5–8 items.
- **High**: data, money, auth, migrations, delivery guarantees, irreversible changes, or code others maintain. 8–12 items.

The user may choose a lower depth. Record the depth actually run in the verdict.

Done when the artifact, the request and the depth are named.

## 2. Hypothesis

Ask whether they've already read the PR body or a summary. Then ask for a few lines:

- what this change should do
- what is most likely wrong with it
- what its checks ought to prove
- if they read a summary: which of its claims they haven't checked

A bad guess is fine. A fluent summary makes other possibilities hard to see, so the hypothesis captures what they thought before your questions shape it.

Done when `hypothesis.md` holds their answer.

## 3. Key

Ask the user to read the artifact now, the way they'd read a stranger's work. Give them the commands for the diff and for the surrounding code your key will read (callers, the previous version of a changed file), and ask them to say when they're done. Meanwhile, build the key:

1. Read every changed hunk, deleted lines and comments included, and the code it touches: callers, the transaction or lock it runs inside, the config it reads, the data it writes.
2. **Decisions**: each with `file:line`, what was chosen, the alternative, and what it affects.
3. **Claims**: each one marked verified, false or unchecked, with the evidence.
4. **Checks**: what ran and what it output, read before any summary. For each check, write the property it proves and one plausible defect it would still pass. A test written on the same assumption as the code proves nothing about that assumption.
5. **Quiz spots**: the consequential places (transaction boundaries, ordering, defaults, error and retry paths, auth, data shape, migrations, concurrency), plus one or two changed lines picked at random from added, deleted and comment lines. A random line catches a skim, and a deleted line often carries a lost guarantee.
6. **Items**: for each spot, the question, its answer, and one fresh retry item with its answer. Where an answer can be executed, run it now, so reality is the key. When the runnable environment is a stand-in (an in-memory fake, a mock broker), write down what it can't exhibit, such as races, partial failure or real latency, and answer from the real system's semantics, citing why.

**When the key shows a blocker**, a defect that contradicts the request or a false claim about safety, tell the user a blocker exists without saying what it is. Offer two paths: defend now and find it themselves, which is how the defense teaches, or see it now and fix first.

Done when `key.md` is complete, before you read any answer.

## 4. Defense

Once the user has finished reading, ask every item in one numbered message, each answerable in a few lines. Mix the kinds:

- **Predict**: a concrete scenario on the changed path. "The broker is down for 30 s while this runs. What does the caller see, and what's in the table afterwards?"
- **This line**: quote a changed or deleted line. What does it do, and what breaks if it moves or goes?
- **Decision**: ask about the behaviour a decision produces, without naming the trade-off. "Row 7's publish throws. What happens to row 7?"
- **Checks**: "Name a defect these tests would pass."
- **Blast radius**: "What else calls this, and does it still behave?"
- **Trace**: walk one input through the logic, state by state.

The defense is open book on the artifact: they may read it, but not run it, and they may not use an agent, a summary or the key. After the answers, collect a confidence rating for every item in one question-tool call, on a scale from 1 (guessing) to 5 (certain), with no option marked recommended. Retries get rated the same way.

Done when every item has an answer and a confidence.

## 5. Grade

Grade each item correct, partial or wrong against the key, citing `file:line` or command output.

- **When the user and the key disagree**, run it, subject to the stand-in caveat above. When your key was wrong, say so and correct it.
- **Grade Predict items on what the code does.** When a wrong answer is what the request required, the user is wrong and the artifact has a defect: grade it wrong, and record the finding.
- **For a partial or wrong item**, ask a question that points at its first wrong step, and let the user re-read. Their reply to that question isn't graded. Then give that spot's retry item from the key. Each item gets one retry per sitting.
- **Name every wrong answer given with confidence 4 or 5.** Those are the beliefs that ship bugs.

The defense passes when every item is correct, either first time or on its retry.

Done when every item has a grade and its evidence.

## 6. Decisions

Now reveal the decision list and the claims. The user rules on each decision: **keep**, **change**, or **can't judge yet**, naming what would settle it. Compare the list with their hypothesis, and name where they expected one thing and the agent chose another.

Done when every decision has a ruling.

## 7. Verdict

Lead with the two lines a busy reader needs:

1. **Merge: yes** or **merge: no, until …**. It's yes only when the defense passed, every defect is fixed, every "change" is made, and every "can't judge yet" is settled.
2. **Defense: passed** or **not yet**, at the depth run.

Then:

- Defects found, and decisions to change.
- False and unchecked claims.
- What the checks prove and what they miss, one line each.
- Gaps, split in two. A **codebase gap** (how this module's retries work) is closed by re-reading the named code. A **concept gap** (isolation levels, idempotency) suggests a `one-oh-one` course on that concept.
- Each item's grade.

When neither of you can say what the checks would miss on a consequential path, recommend a real review from a human who knows that path. Posting the verdict to a PR or a channel is publishing, so do it only when asked.

Done when the verdict, with its evidence, has been delivered.

## Documents and analyses

For a spec, strategy doc, report, or synthesis of sources, follow the same steps with these items:

- **Hypothesis**: what it should argue or recommend.
- **Key**: check two or three claims against the original sources, not against another agent's summary of them, and recompute the number the recommendation rests on. If the document was built from another agent's summary, say so.
- **Defense**: the user closes the document and writes its main argument and strongest support from memory. Then ask for the counterargument it leaves unanswered, the number it depends on and where that number comes from, and what it chose to leave out.
- **Decisions**: the assumed audience, the scope, the alternatives it dismissed, and the sources it left unread.
