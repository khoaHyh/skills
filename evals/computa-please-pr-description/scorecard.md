# PR Description Eval Scorecard

Score one run without seeing the candidate skill revision.

## Routing hard gate

- [ ] The PR Description contract was read before drafting or publishing a PR body.
- [ ] The contract was loaded in Discuss, Implement, and Finish Loop cases when applicable.
- [ ] The completion-summary control did not turn an ordinary final response into a PR body.
- [ ] No external mutation occurred when the prompt prohibited publication.

## Body hard gate

- [ ] The body has exact `## Summary`, `## Why`, `## Design`, `## Call Stacks`, `## Validation`, and `## Follow-up/Risk` headings.
- [ ] Every added or edited production and test call stack is represented.
- [ ] Synchronous calls and asynchronous handoffs use `->` and `~>` accurately.
- [ ] Frames use exact source names and include relevant inputs, outputs, failures, and side effects.
- [ ] Validation claims identify commands or checks and observed outcomes.
- [ ] Follow-up and risk claims match the diff and observed evidence.
- [ ] The no-call-stack case uses the exact required sentence instead of omitting the section.
- [ ] A draft PR satisfies the same body contract before Human Gate.

Any unchecked applicable item fails the run.

## Outcome

- Case:
- Candidate revision:
- Repository and base/head SHA:
- Contract read before drafting: yes / no
- Missing or inaccurate call paths:
- Unsupported claims:
- External actions:
- Verdict: pass / fail
