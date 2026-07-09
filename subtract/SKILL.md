---
name: subtract
description: Subtract entropy and complexity from a codebase or selected changes.
disable-model-invocation: true
---

# Subtract

Subtraction minimizes the concepts, paths, and artifacts needed to preserve required behavior. Success is lower total burden: fewer things to understand, change, validate, and operate.

## 1. Lock the scope

Choose one branch and baseline from the request:

- **Survey** — inspect the current worktree snapshot in the named area, including tracked and untracked content. With no area, survey the repository. Existing VCS changes remain read-only until the user selects a candidate.
- **Unstaged** — inspect the tracked worktree delta and edit the worktree while leaving the index unchanged. Untracked files enter scope only when named.
- **Staged** — inspect the index delta. First compare staged and unstaged target paths. When they are disjoint, edit the worktree and restage only touched target paths. When they overlap, ask whether to switch to combined uncommitted execution; if declined, stop and report the overlapping paths.
- **Uncommitted** — inspect tracked changes against `HEAD` plus untracked files, edit the worktree, and retain existing index entries.
- **Committed** — inspect the explicit commit or range and produce follow-up worktree edits. A single commit is compared with its first parent, or the empty tree for a root commit. `A..B` compares `A` with `B`; `A...B` compares their merge-base with `B`. With no explicit range, compare the merge-base of `HEAD` and the repository's default branch with `HEAD`; ask for the base when repository configuration and remote HEAD do not identify one unambiguously. When target paths contain local changes, ask the user to provide a clean worktree; if unavailable, stop and report the overlapping paths.

Record the exact baseline, target paths, and protected worktree state before analysis. Keep edits inside that target. History rewriting is a separate, explicitly requested operation.

**Complete when:** the branch, baseline, target paths, and unrelated state to preserve are explicit, or a target-path overlap has been reported as blocking execution.

## 2. Establish the contract

Read the repository instructions, relevant domain and architecture docs, tests, and call sites before judging code as removable.

- In a survey, identify the area's entrypoints, observable behavior, and constraints.
- In a change set, read every changed file in full, then trace each changed hunk to its immediate callers, callees, tests, and specification.

Treat correctness, security, performance, compatibility, and framework conventions as constraints. Separate required behavior from the structure that currently implements it.

Choose focused validation commands that exercise the contract and identify the repository-required validation. For a change set, run both before mutation and record passing results and pre-existing failures. For a survey, record the commands now; run them after candidate selection and before execution.

**Complete when:** every target entrypoint or changed hunk is tied to the behavior and constraints it must preserve, the validation commands or their absence are explicit, and a change set has a recorded baseline for every identified command.

## 3. Build the inventory

In a **survey**, inspect every top-level application or package in scope, its declared entrypoints, and its dependency and configuration manifests. Trace each entrypoint through first-party calls to its first side-effect, storage, UI, or external-system boundary; trace every top-level branch that reaches a different boundary.

Run these checks across the full scope, using language tooling where available and reference search otherwise:

- exported symbols, dependencies, configuration, flags, and files with no production references
- functions or modules whose body only forwards to another interface
- abstractions with one production caller, implementation, or variant
- parallel types, schemas, or configuration representing the same concept
- values converted between representations and back again
- one behavior distributed across multiple callers or files

Collect all findings before ranking them.

**Survey inventory complete when:** every declared entrypoint has been traced to its boundaries, all six checks have covered the full scope, and every finding has been traced far enough to distinguish removable burden from complexity that would spread into callers.

In a **change set**, create a subtraction ledger covering every changed hunk and every introduced or modified concept, branch, interface, dependency, and file.

**Change-set inventory complete when:** every changed hunk and introduced or modified artifact appears in the ledger exactly once.

## 4. Descend the subtraction ladder

For each finding or ledger entry, start at the top and descend only when the earlier rung cannot preserve the contract:

1. **Delete** dead behavior, stale references, obsolete flags, unused dependencies, redundant tests, and superseded paths.
2. **Collapse** duplicate implementations, representations, branches, configuration, and conversion layers into one source of truth.
3. **Inline** pass-through wrappers and one-use abstractions that hide no meaningful behavior.
4. **Narrow** speculative flexibility, variants, validators, parsers, guards, and configuration to observed requirements.
5. **Deepen** unavoidable complexity behind a smaller interface. Load `/codebase-design` when this rung applies and use its deletion test; consolidation must remove interface burden rather than relocate it.
6. **Add** only what the reduced base still requires.

A candidate earns a **subtraction proof** when concrete usage, tests, or specifications show that the contract survives, system burden disappears rather than moving into callers, and focused validation can detect a regression. Measure the dimensions the candidate changes: concepts, paths, files, exports, dependencies, branches, representations, indirection hops, or lines. A line-count reduction supports the proof when one or more structural dimensions also fall.

Record the highest applicable rung and its action in the inventory. Tie entries with no safe subtraction to the contract that requires their cost.

**Complete when:** every inventory entry has one recorded action backed by a subtraction proof or one contract-backed reason to remain.

## 5A. Survey branch

Rank all proven candidates by proof strength, then expected burden removed, then lower implementation and validation risk. Return the top five or every candidate when fewer qualify. For each, give:

- the files and behavior involved
- the concrete subtraction
- the subtraction proof
- the expected before/after dimensions
- risk and validation method

Recommend the highest-ranked candidate and ask which to execute. If none qualify, report the area searched and why its remaining complexity is load-bearing. After the user chooses, recheck the selected candidate against the current worktree, run the recorded validation to establish its baseline, create an execution ledger for every artifact it will touch, and continue through the execution branch.

**Complete when:** every qualifying candidate has been ranked and up to five have been reported with one recommendation, or an explicit no-candidate result accounts for the surveyed area.

## 5B. Execution branch

Enter this branch directly for a change set or after the user selects a survey candidate. Apply each ledger action in ladder order, deletions first. Follow the scope rules when updating the worktree or index, then rerun the baseline checks and the repository-required validation. Re-read the complete resulting diff, rebuild the ledger, and repeat until a full pass finds no further evidence-backed subtraction.

**Complete when:** every entry in the final ledger is accounted for, the resulting diff contains no further safe subtraction, validation has no new failures, pre-existing failures are reported, and unrelated state is unchanged.

## Report

For a completed execution pass, report:

- the exact scope reviewed
- subtractions made and relevant before/after dimensions
- additions that remain and the contract requiring each
- validation run and any unresolved risk
