# VCS Actions Contract

Use this contract before a mutating VCS command, commit, push, branch or worktree creation, synchronization, or pull request publication in any `computa-please` mode.

## Preflight

1. Load `vcs-detect` before VCS commands and use the repository's established Git or Graphite workflow.
2. Inspect repository instructions, status, the complete intended diff, and relevant commit subjects before mutation. Before PR publication, inspect every subject between the intended base and `HEAD`.
3. Confirm the action is authorized. An active Finish Loop authorizes only the operations and scope recorded in its ledger; otherwise obtain explicit approval before commit, push, or PR publication.
4. Stage only intended files. Preserve unrelated worktree changes.

## Commits

- Give every agent-authored commit a Conventional Commit subject in the exact shape `<type>(<scope>): <description>`. Choose the type and scope from the diff and repository vocabulary; use a repository-mandated stricter format when one exists.
- Keep each coherent implementation or remediation slice in an additive commit.
- Preserve commits already pushed, reviewed, recorded, or observed by CI. Amend only with explicit user approval.
- After committing, verify the resulting subject and committed file set before pushing or publishing.
- Before PR publication, account for every nonconforming subject in the base-to-`HEAD` range. Repair an unpublished agent-authored subject only with explicit amend or history-rewrite approval; otherwise stop and report it.

## Branches And Publication

- Create workflow-owned worktrees under `~/dev/worktrees/<repo-slug>__<branch-slug>`. Inspect and reuse a matching safe worktree; use another location only when the user explicitly requests it.
- When Graphite tracks the branch, mutate or submit only the current diff unless the user explicitly authorizes a stack-wide action.
- Publish every new PR as a draft. Mark it ready only when the user explicitly requests that state.
- Before drafting, creating, or updating a PR body, satisfy the router's PR Description gate.

## Completion

Complete only when authorization, workflow, scope, staged files, resulting commit, every base-to-`HEAD` subject, remote branch, and PR state match the intended action, with any unperformed or ambiguous action reported explicitly.
