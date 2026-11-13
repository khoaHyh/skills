# Skills

My collection of markdown files and scripts that I give to agents to hopefully do what I expect.

## Catalog

- **ground-rules**: Shared scope, authority, and proof rules; harness adapters load this small universal layer.
- **review-policy**: Select reviewers, assign request ownership, prevent duplicate requests, and reuse substantive coverage.
- **adapt**: Turn session feedback into a targeted improvement to an owned skill, agent prompt, or workflow tool; resolve its canonical source, check the behavioral change, then publish and sync.
- **mine**: Digest recent OpenCode task trees (conducta plus delegates), read them in parallel slices for recurring corrections and repeated manual effort, and shortlist up to three fixes at the strongest layer, routed to `/correct`, `/adapt`, or tooling.
- **feature-grill**: Settle only the product decisions blocking a selected feature delivery, then resume the authorized task.
- **subtract**: Survey a codebase for removable complexity or simplify unstaged, staged, uncommitted, and committed changes while preserving required behavior.
- **scope-prune**: Cut a completed implementation back to the minimum durable change for its agreed problem.
- **review-remediation**: Resolve a frozen set of PR feedback with evidence-backed root-cause fixes and version-matched research where needed.
- **observability-logging**: Add the least production telemetry needed using structured logs, OpenTelemetry spans/events, bounded metrics, safe fields, and exact-once error recording.
- **computa-please**: Deliver the accepted outcome with minimum durable scope, proportionate proof, and authorized completion.
- **record-verification**: Record an honest before/after UI walkthrough with checks, then cut it into a review video that reads at PR size: evidence framed and marked, captions under the footage, every speed-up, cut and freeze labelled against the original take's clock.
- **blast-radius**: Find what a change could break beyond its diff and prove the one fact it's safe because of by running real code. Adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT).
- **impact-report**: Measure whether a shipped change moved a metric against a same-day baseline and a control, then render before/after chart PNGs and post them to Slack.
- **work-ledger**: Keep one durable file per work item in `~/dev/ledger` (outcome, sourced decisions, authority, live state, evidence, next action) so any session or coordinator picks up where the last one stopped, and hand off with a one-line pointer.
- **motion-film**: Direct a high-energy animated short from real material: a ten-question director's grill, a story mined from the sources, game-feel motion (trauma shake, hit-stop, slams), a beat-synced mix and shutter blur, rendered as code with HyperFrames. Motion rules adapted from [psychopomp](https://github.com/kitlangton/psychopomp) (MIT).
- **one-oh-one**: Run a bounded 101 in any field that leaves the learner with a mental model they can extend alone. It opens with a placement grill. Sessions have the learner build predictions, traces, drawings, designs and teach-backs that reality grades. Spaced reviews follow, and it ends on a final with fresh transfer items and a preparation-for-future-learning item. Grounded in Oakley's *A Mind for Numbers* and the learning-science canon; the evidence lives in `references/evidence.md`.
- **conducta**: Run the engineering program from one long-lived thread: track every work item in the ledger, dispatch one background worker per slice, check proof and review coverage before calling a PR ready, use `verifya` for independent real-path proof where needed, and report a board of what needs you.
- **defend-it**: Examine the user on a change or document an agent produced before they merge or sign off. It takes their hypothesis first, writes an answer key from the artifact (run where possible, in a fresh context if this session wrote it), quizzes them unaided on the consequential and randomly chosen lines, reveals the agent's decisions and the summary's unchecked claims, and leads with a merge verdict. Practices adapted from Addy Osmani's "Critical thinking when agents do the work".
