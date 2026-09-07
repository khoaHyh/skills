# Worktree And VCS Actions Contract

Establish one task-owned checkout for mutation, durable state, delegation, and VCS actions in any `computa-please` mode.

## Preflight

1. Load `worktrees` and `vcs-detect`, follow the applicable local or cloud branch, and use the repository's established Git or Graphite workflow. When Graphite tracks the task branch, load `graphite` and use it for commits and submission; use Git for state inspection and scoped staging.
2. Inspect repository instructions, current root, branch, status, and worktree list; identify the canonical checkout, linked checkouts, and task ownership before choosing a write path.
3. When the local layout applies, follow `worktrees` to establish or reuse exactly one Task Worktree before any repository-content or Durable State write.
4. In the local layout, use the canonical checkout only to bootstrap the Task Worktree, and leave it on `main`. If it already contains task changes, preserve them and stop for a migration decision. Re-anchor every later tool working directory, repository path, artifact path, and delegated local agent to the Task Worktree.
5. Before commit, synchronization, push, or publication, inspect the complete intended diff and relevant commit subjects. Before PR publication, inspect every subject between the intended base and `HEAD`.
6. Confirm the action is authorized. An active Finish Loop authorizes its scoped Task Worktree bootstrap and ledger initialization; afterward it authorizes only actions permitted by its recorded delivery ceiling and pre-recorded in its external-action journal. Otherwise obtain explicit approval before commit, push, or PR publication. Stage only intended files and preserve unrelated changes.

## Durable State

Persist only for a user request, cross-session recovery, coordination, or a Finish Loop ledger. Establish the Task Worktree first, then use its `.computa-please/` directory with only these files:

```text
<task-slug>-tech-spec-YYYY-MM-DD.md
handoff.md
```

Reuse the tech spec. Keep the handoff append-only: add a dated section after material changes with the spec path, state, decisions, rejected approaches, Compatibility, Proof, external actions, residual risk, and next action. A Finish Loop owns its ledger schema inside this handoff. Store renderer-owned maps elsewhere and link them. Keep secrets, customer data, and private transcripts out of artifacts.

Account for `.computa-please/` in status checks, but keep this workflow-owned local state out of product diffs, commits, and PRs.

## Commits

- Give every agent-authored commit a Conventional Commit subject in the exact shape `<type>(<scope>): <description>`. Choose the type and scope from the diff and repository vocabulary; use a repository-mandated stricter format when one exists.
- Keep each coherent implementation or remediation slice in an additive commit. On a Graphite-tracked branch, stage only intended files and use `gt modify --commit -m "<type>(<scope>): <description>"` to add the commit.
- Preserve existing commits, including unpublished ones. Amend only with explicit user approval; a request to commit, fix feedback, or submit calls for additive commits. This policy takes precedence over amendment examples in the loaded Graphite skill.
- After committing, verify the resulting subject and committed file set before pushing or publishing.
- Before PR publication, account for every nonconforming subject in the base-to-`HEAD` range. Repair an unpublished agent-authored subject only with explicit amend or history-rewrite approval; otherwise stop and report it.

## Branches And Publication

- When Graphite tracks the branch, mutate or submit only the current diff unless the user explicitly authorizes a stack-wide action. Account for automatic descendant restacking before mutation; ask for scope approval if the operation would change another diff.
- If a Graphite tracking or remote-update guard refuses an operation, inspect local, remote, and tracking state and resolve the cause within existing authority before retrying. If resolution requires a guard override, history rewrite, broader stack mutation, or fallback to `git push`, report the evidence and request explicit approval for that action. A successful Git push alone does not resolve a Graphite guard.
- Publish every new PR as a draft. After the Finish Loop's local review and publication gates pass, either recorded delivery ceiling authorizes marking its active PR ready. Outside a Finish Loop, mark it ready only when the user explicitly requests that state.
- Before drafting, creating, or updating a PR body, satisfy the router's PR Description gate through **Verify** (`check-pr-body` exits 0).

## Completion

Routing is complete when the Task Worktree's path, branch, and ownership are verified and every planned write resolves beneath it. A later VCS action completes only when its authorization, workflow, scope, staged files, resulting commit, applicable base-to-`HEAD` subjects, remote branch, and PR state match the request, with any unperformed or ambiguous action reported explicitly.
