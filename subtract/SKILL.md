---
name: subtract
description: Simplify a codebase or selected changes while preserving required behavior.
disable-model-invocation: true
---

# Subtract

Reduce the concepts, paths, and artifacts needed to preserve required behavior. Fewer lines count only when they reduce what callers, maintainers, or operators must understand.

## Scope

For an exploratory request, **survey** the named area, or the repository when none is named. Include tracked and untracked content; keep it read-only until the user selects a candidate. An explicit request to simplify a target authorizes **execution**, without a separate candidate-approval round.

For unstaged, staged, uncommitted, or committed changes, use [Change Scopes](references/change-scopes.md) to establish the baseline and protect the index and unrelated work. Keep the scope and baseline in the conversation.

## Subtraction Judgment

Ground removals in callers, tests, specifications, and actual consumers. Preserve correctness, security, performance, framework conventions, and real compatibility obligations. Investigate dynamic discovery, generated code, and external consumers before treating an absence of references as proof of dead code.

Look for dead paths, duplicate representations, pass-through wrappers, speculative flexibility, round-trip conversions, and behavior scattered across owners. Prefer, in order:

1. **Delete** behavior and artifacts no longer required.
2. **Collapse** duplicates into one source of truth.
3. **Inline** indirection that hides no meaningful behavior.
4. **Narrow** flexibility to observed requirements.
5. **Deepen** necessary complexity behind a smaller interface. Use `codebase-design` when this needs an interface decision.
6. **Add** only what the reduced design still requires.

A **subtraction proof** shows that required behavior survives and burden disappears rather than moving into callers. Name the evidence and the dimensions reduced: concepts, paths, exports, dependencies, branches, representations, indirection, or files. Retain complexity whose removal would weaken the contract.

## Survey Result

Rank evidence-backed candidates by proof strength, burden removed, and implementation risk. Return the strongest few with files, proposed subtraction, expected reduction, and validation method; recommend one and ask which to execute. State coverage and material gaps so a bounded survey is not presented as exhaustive. If none qualify, explain what makes the remaining complexity necessary.

After selection, recheck the candidate against live worktree state and execute it.

## Execution Result

Apply the supported subtractions, deletions first, and carry the authorized change through verification and fixes for attributable failures. Use focused evidence that can detect a behavior regression and the repository's required checks. Establish a pre-change baseline when needed to prove equivalence or distinguish an existing failure; routine edits need no blanket before-and-after suite.

Finish when the intended simplification is present, required behavior has supporting evidence, and unrelated work is intact. Broaden or repeat checks only for a new change, failure, or unresolved risk; further cleanup outside the target is a new candidate.

Report scope, reductions made, necessary additions, verification, and remaining risks or blockers. A blocker in one candidate need not stop independent authorized work.
