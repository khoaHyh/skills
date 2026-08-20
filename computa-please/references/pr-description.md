# PR Description Contract

Use this contract whenever drafting, creating, or updating a pull request description, whether the description is returned in the conversation or published externally.

## Required schema

Use these sections for every PR body:

- **Summary:** the observable change, kept concise.
- **Why:** the problem, constraint, or opportunity that requires the change.
- **Design:** the chosen shape, important boundaries, and rejected alternatives that matter to review.
- **Call Stacks:** every added or edited execution path under the contract below.
- **Validation:** commands or checks run and their outcomes; state material checks not run.
- **Follow-up/Risk:** remaining risk, rollout or ordering constraints, and genuinely separate follow-up work.

Use `##` headings with these exact section names. Additional repository-required sections may follow them. Complete only when all six sections are present, the claims match the diff and observed evidence, and Call Stacks accounts for every added or edited call stack. If there are no added or edited call stacks, write `No call stacks added or edited.` under `## Call Stacks`.

## Call stacks

A call stack is an ordered execution path from an affected entrypoint through each callable or boundary to its terminal result or effect. Derive the before state from the PR base and the after state from the current diff. The readable form is a code-shaped outline, not a numbered inventory: indentation shows a call or caused handoff, and sibling lines stay at the same depth in execution order.

In the PR body's `Call Stacks` section:

- Account for every added or edited call stack.
- If available, use `calldiff` to discover the structural change before writing the section: `npx calldiff@latest diff <base> <head>`, narrowed with `--entry`, `--file`, or an affected path when needed. Treat its AST result as evidence, not authority: verify each path against source and add routes, dependency-injection edges, RPC boundaries, events, dynamic calls, and other edges a syntactic call tree cannot resolve. Do not block the PR on installing or running it.
- Give each semantic flow its own heading. Split materially different paths such as `Production`, `Tests`, a worker, or an event consumer instead of braiding them into one tree. A test double or in-memory adapter belongs in the test tree, not in the production tree.
- Show the complete path, including unchanged context around the edited layer. Use one `Before` and one `After` tree when the path is short; use a `diff` tree when the paths mostly share context. For a new path, show `Before: Not present.` and one `After` tree.
- Use exact callable, module, boundary, event, and terminal-result names. Put the input and output types on the frame as `name(input) -> output`; use concrete runtime shapes when the codebase is untyped.
- Keep errors and side effects compact and local to the frame that owns them. Add `[errors: ...; effects: ...]` only when those facts are non-empty or materially important; do not repeat `None` on every frame. Include typed failures, thrown exceptions or defects, and boundary failures with their trigger conditions.
- Use `->` for a direct call and `~>` for an asynchronous event or handoff. Show the handoff's consumer as a nested path when the PR changes that consumer. Do not imply synchronous completion for a published event, queued job, or worker.
- Keep the tree as the primary view. Use strict Mermaid only when the important fact is interaction between multiple actors, branching, concurrency, retries, or an asynchronous message exchange that an outline would hide. Use a fenced `mermaid` block with valid Mermaid syntax and simple quoted labels; do not use Mermaid for a linear call stack merely because it can draw boxes.

Use this shape for a production path:

````markdown
### `<entrypoint> -> <terminal result or effect>`

#### Production
```text
<entrypoint>(<input>) -> <response>
  -> <callable>(<input>) -> <output>
    -> <boundary>(<input>) -> <output> [errors: <error and trigger>; effects: <effect>]
      ~> <consumer>(<input>) -> <output>
```

#### Tests
```text
<test entrypoint>(<fixture>) -> <assertion>
  -> <callable>(<input>) -> <output>
    -> <test double or real adapter>(<input>) -> <output>
```

#### Contracts
- `<frame>`: errors `<typed failure and trigger>`; effects `<effect>`.

For a before/after change, prefer a diff-shaped tree:

```diff
  <entrypoint>(<input>) -> <response>
    -> <unchanged callable>(<input>) -> <output>
-     -> <old callable>(<input>) -> <old output>
+     -> <new callable>(<input>) -> <new output> [errors: <error and trigger>; effects: <effect>]
```

Put long error or side-effect details in the adjacent `Contracts` list keyed by exact frame name. The tree must remain readable at a glance while the contracts retain the facts a reviewer needs to verify.
````
