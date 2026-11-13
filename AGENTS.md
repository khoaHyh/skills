# Skill Source Repository

This repository is the canonical source for the custom skills it contains.

## Before Editing

1. Resolve the requested skill path with `realpath`.
2. Distinguish the authored source from installed, generated, or synchronized copies.
3. Check `skills-lock.json` when an installed copy records its upstream source.
4. Edit here only when this repository is the recorded source. Otherwise locate the owning repository or ask the user.

Edit the canonical source first; synchronize installed copies only through the authorized workflow below.

## Publishing And Syncing

- Add and revise custom skills in this repository.
- Keep each skill in `<skill-name>/SKILL.md`; the frontmatter `name` must match the directory.
- Edit in `~/dev/skills` on `main`, with no worktree or PR.
- Current local-review hold: leave changes uncommitted and unpublished; sync by local copy for review, without `npx` or changing published provenance hashes.
- Only after explicit publication approval, commit/push and sync through the consumer's established `npx skills` workflow, preserving lockfile attribution.

## Verification

- Inspect `git status --short --branch --untracked-files=all`, `git diff --name-only`, and `git diff`.
- Read every untracked file explicitly because Git diffs omit its contents.
- Confirm every referenced skill exists at its published path or is being added in the same change.
- Confirm only canonical source files changed.
