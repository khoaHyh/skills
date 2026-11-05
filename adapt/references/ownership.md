# Ownership and routing

## Canonical sources

- `~/dev/skills` is the source for Khoa's custom skills. Confirm its remote is `khoaHyh/skills` (case-insensitive) and follow its `AGENTS.md`. For installed skills, check the consumer's lockfile for that source before mapping the skill path here.
- `~/dev/macOS-dots/opencode/agents/` owns Khoa's OpenCode agent prompts; `opencode/plugins/` owns local loading and context-injection mechanisms. Read the relevant repository instructions before changes.
- `~/.agents/skills` and consuming projects' skill directories are installed copies. Their location does not establish authorship. Third-party entries, including `statechart`, `correct`, and `retro`, remain upstream-owned.

## Choose by the failed decision

| Decision | First owner to inspect |
| --- | --- |
| Dispatch, worker steering, cross-item coordination, board reporting | `conducta/SKILL.md` |
| Implementation scope, proof, stopping, delivery, skill routing | `computa-please/SKILL.md`, then its relevant reference |
| Persisting decisions, reconciling state, handoff context | `work-ledger/SKILL.md` |
| Grok launching or steering OpenCode sessions, lane selection, session lifecycle | `drive-opencode-sessions/SKILL.md` |
| Agent identity, startup contract, permissions | The matching `opencode/agents/*.md` or owning configuration |
| Skill attachment or ledger injection did not happen | The matching `opencode/plugins/` implementation |
| A specialized owned workflow failed | That skill's body or owning reference |

These are navigation hints, not a list of files to update. Inspect the current source before choosing. Keep agent prompts as startup and role contracts; workflow details belong in their skills.

For example, unnecessary `statechart` invocation can be a `computa-please` routing defect. Incorrect guidance inside `statechart` is an upstream finding. Neither justifies editing its installed copy.
