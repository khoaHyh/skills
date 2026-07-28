# Skill Source Repository

This repository is the canonical source for the custom skills it contains.

## Before Editing

1. Resolve the requested skill path with `realpath`.
2. Distinguish the authored source from installed, generated, or synchronized copies.
3. Check `skills-lock.json` when an installed copy records its upstream source.
4. Edit here only when this repository is the recorded source. Otherwise locate the owning repository or ask the user.

Never edit a synchronized copy under `~/.agents/skills`, `~/.claude/skills`, a dotfiles repository, or a consuming project's `.agents/skills` when its source lives elsewhere.

## Publishing And Syncing

- Add and revise custom skills in this repository.
- Keep each skill in `<skill-name>/SKILL.md`; the frontmatter `name` must match the directory.
- Publish this repository before syncing a changed skill into a consumer.
- Sync through the consumer's established `npx skills` workflow so its lockfile and installed copy stay attributable to this repository.
- Do not commit, push, publish, or sync unless the user explicitly requests that action.

## Verification

- Inspect `git status --short --branch --untracked-files=all`, `git diff --name-only`, and `git diff`.
- Read every untracked file explicitly because Git diffs omit its contents.
- Confirm every referenced skill exists at its published path or is being added in the same change.
- Confirm only canonical source files changed.
