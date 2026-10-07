# Local Review

Use at most one independent Codex provider pass against the complete PR candidate, after focused behavioral proof and before the final required checks and publication. This review challenges defects; the author’s scope and necessity checks remain separate.

## Applicability

Apply to substantive agent-authored PR work, or a PR entering end-to-end delivery without review covering its current semantic diff. Reuse existing valid evidence. Exempt:

- Local-only work unless independent review was requested.
- Mechanical maintenance or description-only updates introducing no substantive implementation change and carrying no pending review requirement.
- An established remote-review contract naming reviewers, completion criteria, required CI, and human approval owner, unless repository policy or the user requires a local pass.

Record the exemption and its source in working context. It replaces only the local pass, not behavioral proof, required checks, or remaining remote gates. A requested named review follows its own workflow.

## One Pass

1. Stabilize the complete slice and any known synchronization. Pin the intended base and complete candidate, including dirty work when it belongs to the target. Choose `autoreview`’s matching target mode; review does not grant commit authority or require an otherwise unnecessary commit.
2. Load `autoreview` and follow its preparation and result contract. Use Codex with explicit P0/P1 scope (`--max-priority P1`) and `--max-review-passes 1`. Its dry-run can establish whether the complete target fits. A multi-pass requirement or unavailable tool is a named blocker, not permission to omit evidence, narrow the diff, or install a replacement.
3. Treat the provider call as spending the budget. Verify every candidate finding through its owning path; fix evidenced in-scope defects and reject unsupported, duplicate, speculative, or stale claims with evidence.
4. Refresh affected behavioral proof and run the final checks under [Execution](execution.md#verification). Retain a compact receipt: base, reviewed target, exact result status, dispositions, resulting candidate, and verification. Use working context or the existing handoff, not a new document requirement.

An incomplete, malformed, or mismatched result is not a clean review. A filtered result makes only its stated severity claim. CI repairs, mechanical restacks, remediation, publication, and pickup do not replenish the pass budget. Carry evidence across mechanical changes only after confirming semantic content and relevant base inputs are unchanged. New product scope returns to the user; it does not silently earn another review campaign.

Complete when the applicable pass or exemption is accounted for, every finding has an evidenced disposition, and current required proof passes or a concrete blocker is reported.
