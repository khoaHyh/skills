# Skills

My collection of markdown files and scripts that I give to agents to hopefully do what I expect.

## Catalog

- **jujutsu-colocated**: Guidance and guardrails for agents to use `jj` as a VCS. Opinionated to isolate parallel agent workflows with `jj workspaces` while keeping changes intentionally scoped and safe to integrate.
- **deepen-codebase-design**: Audit codebase architecture using Ousterhout-style complexity and deep-module heuristics, then create or update an RFC artifact under `docs/` with concrete refactor options and recommendation.
- **subtract**: Survey a codebase for removable complexity or simplify unstaged, staged, uncommitted, and committed changes while preserving required behavior.
- **greptile-address**: Consume one existing Greptile review snapshot, address its actionable comments, resolve addressed threads, and never request another review.
- **local-adversarial-review-gauntlet**: Run four isolated local reviewers across Cursor, Codex, and OpenCode against one committed diff, then consolidate supported findings.
- **write-effect-ts**: Write idiomatic Effect TypeScript by matching repo style, following effect-solutions patterns, and verifying current APIs with Context7 before implementing.
- **observability-logging**: Add the least production telemetry needed using structured logs, OpenTelemetry spans/events, bounded metrics, safe fields, and exact-once error recording.
- **tech-spec**: Write an implementation-ready typed call-stack architecture handoff with subtraction-first design and risk-matched verification.
- **computa-please**: Route discussion, specs, minimal implementation, bounded Finish Loops, debugging, review, pickup, and workflow reflection before mutation.
