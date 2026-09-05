# Change Scopes

Use the requested baseline and keep edits inside the target. Identify protected staged, unstaged, and untracked work before mutation. History rewriting requires a separate explicit request.

| Scope | Baseline and mutation |
| --- | --- |
| Unstaged | Tracked worktree delta against the index. Edit the worktree; leave the index unchanged. Include untracked files only when named. |
| Staged | Index delta against `HEAD`. When staged and unstaged target paths are disjoint, edit and restage only touched target paths. For overlapping paths, ask whether to use combined uncommitted scope; leave those paths untouched without that choice. |
| Uncommitted | Tracked changes against `HEAD` plus untracked files. Edit the worktree; preserve existing index entries. |
| Committed | Explicit commit or range. Produce follow-up worktree edits without changing the index or rewriting history. Isolate targets with local edits in a clean task-owned worktree, or ask how to handle the overlap. |

For committed scope:

- A single commit compares with its first parent, or the empty tree for a root commit.
- `A..B` compares `A` with `B`; `A...B` compares their merge-base with `B`.
- With no range, compare `HEAD` with its merge-base with the repository's default branch. Ask for a base only when repository configuration and remote HEAD do not identify one unambiguously.

Carry established task ownership into any worktree choice. If an overlap cannot be isolated safely, report the affected paths as blocked and continue only on independent authorized targets.
