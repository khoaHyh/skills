# PR Description Contract

Use this contract whenever drafting, creating, or updating a pull request description, whether the description is returned in the conversation or published externally.

## Draft

1. Derive every claim from the PR diff and observed evidence. Keep implementation and review Proof internal; the body does not list test commands or validation results.
2. Load `show-me` for every PR description. Identify the one thing the reviewer needs to understand first, then choose the GitHub-rendered format yourself from the observed flow shape:
   - Use a fenced `diff` call tree when production execution changed and before/after structure is the point. Prefix removed frames with `-`, added frames with `+`, and unchanged locating context with a space so GitHub renders removals red and additions green. An entirely new linear path is an after-only `diff` tree whose frames are additions.
   - Use fenced `mermaid` when actor interaction, branching, concurrency, retries, manual gates, or asynchronous handoffs are the point. Keep unchanged context neutral; mark additions and removals with both `+`/`−` labels and green/red styling so color is not the only signal.
   - When production execution did not change, let `show-me` choose the smallest fitting visual. Reserve `text` fences for small file or component trees and pseudocode without before/after execution semantics.
3. Account for every materially distinct changed production call stack across the smallest complete set of visuals. A call stack runs from an affected entrypoint through each callable or boundary to its terminal result or effect. Give each visual one reviewer question, one named flow, and a short caption naming its primary changed files. Group shared structure and include only enough unchanged context to locate the edited seam; split unrelated entrypoints, actors, or lifecycle stages instead of mixing visual grammars in one fence. Do not inventory test call stacks.
4. Use exact callable, module, boundary, event, and terminal-result names. Add file paths, types, errors, or effects only where they explain the changed contract. When an outline uses `->` for a direct call or `~>` for an asynchronous handoff, put `Legend: -> direct call; ~> asynchronous handoff` directly above its first use. Nest a changed consumer without implying synchronous completion.
5. If available, use `calldiff` to discover changed paths: `npx calldiff@latest diff <base> <head>`, narrowed with `--entry`, `--file`, or an affected path when useful. Treat its result as evidence, not authority; verify routes, dependency injection, RPC, events, dynamic calls, and other unresolved edges against source. Do not block the PR on `calldiff`.
6. After the visual is settled, load `personal-drafting` and shape only the surrounding prose for the GitHub PR audience. Keep the visual's factual structure intact.

## Required schema

Use these `##` headings in this order with the exact titles below. Add another section only when the target repository requires it.

- **What changed:** at most two sentences. Lead with the observable change; add its motivation only when the change is not self-explanatory.
- **Where to look:** the smallest complete set of nonempty fenced visuals. Follow the production call-stack rules above when production execution changes.
- **Why it is safe:** one to three diff-backed facts about preserved boundaries, invariants, or material remaining risk. Do not include test commands or a validation summary.

## Verify

After the body exists, run the structural check. The script owns required-heading and fenced-visual presence:

```bash
node <computa-please>/scripts/check-pr-body.mjs --file <body.md>
# or: <body on stdin> | node <computa-please>/scripts/check-pr-body.mjs
```

Then compare the body with the diff and confirm that its claims are factual; every materially distinct changed production call stack is represented; each visual has one purpose and uses the applicable format, red/green change highlighting, labels, caption, and legend where applicable; test call stacks and validation output are absent; and every additional section is repository-required.

**Complete when:** `check-pr-body` exits 0 and the manual comparison passes every condition above.
