---
name: pr-body
description: Use when writing or editing a pull request body.
---

## Why the change

{Exactly one sentence explaining the problem this PR solves and what becomes possible after it ships.}

## What changed

dont write essays, dont include that you ran tests. rather, write a concise body. focus on mermaid codeblock diagrams, code samples/snippets (this can be apis, or even sample usage). use bullet points for the text you do write. 'validation/i ran tests' is not needed
for benchmarks, always show tables of before/after (baseline from target branch, candidate from the PR)
dont at intermediate PR details - e.g. if we reduced PR size from +6k lines to +1k lines, dont even mention it lol. if we refactored from one commit to another commit doesnt matter. only the final aggregate squash merge commit is what matters for commentary
for truely impressive, difficult, or high risk/wide scoped changes you might write the body like a technical blog (again with context, storytelling, code refs/before/after etc diagrams, images whatever.
feel free to use code refs

## Demos

Optional, last in the PR body, after diagrams and text comparisons. This is where useful screenshots or recordings are included; omit this section when none are available.

This skill organizes available evidence; it does not request new screenshots or recordings.
