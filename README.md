# Skills

My collection of markdown files and scripts that I give to agents to hopefully do what I expect.

## Catalog

- **jujutsu-colocated**: Guidance and guardrails for agents to use `jj` as a VCS. Opinionated to isolate parallel agent workflows with `jj workspaces` while keeping changes intentionally scoped and safe to integrate.
- **deepen-codebase-design**: Audit codebase architecture using Ousterhout-style complexity and deep-module heuristics, then create or update an RFC artifact under `docs/` with concrete refactor options and recommendation.
- **subtract**: Survey a codebase for removable complexity or simplify unstaged, staged, uncommitted, and committed changes while preserving required behavior.
- **greptile-address**: One-pass Greptile PR feedback workflow. Trigger checks once, address actionable comments once, resolve addressed threads, and report remaining issues without iterative looping.
- **write-effect-ts**: Write idiomatic Effect TypeScript by matching repo style, following effect-solutions patterns, and verifying current APIs with Context7 before implementing.
- **computa-please**: Personal orchestration workflow for brainstorming into a persisted tech spec, grill-with-docs checkpoints, RGR TDD implementation, manual review repair prompts, local adversarial review, and Greptile/CI final gates.
