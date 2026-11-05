# Trace delegated work

The session receiving feedback is the starting point, not necessarily the source of the failure. A worker's returned summary is a claim to check against its actions.

## Follow the relevant chain

1. Find the affected work item and dispatch in the current session. Use the ledger's worker session IDs and actual delegation calls to locate the relevant child sessions. Follow nested delegates only where their output influenced the disputed decision; leave unrelated items and siblings alone.
2. Retrieve the dispatch and steering messages, the context the child actually received, its relevant actions and tool results, its returned evidence, and the parent's subsequent decision. Digest the task tree with `python3 -I ~/.agents/skills/mine/scripts/digest.py --root <root session>`: it follows every delegate and records each dispatch, the skills attached at run time with a content hash, tool errors, and returned reports, with message IDs to read in full through `opencode api get /api/session/<id>/message`. Delegate bulk reads under the lead's existing rules.
3. Trace **user requirement → dispatch → received context → child action → returned evidence → parent response**. At each relevant boundary, identify what was required, what was available to that agent, and what it did. Distinguish instructions evidenced in that run from today's source files; do not assume the latest skill was attached then.
4. Locate the first evidenced divergence and the instruction or mechanism responsible. Separate a downstream consequence from an independently failed check. If two boundaries independently failed, account for both, but justify each proposed edit separately.

Done when the trace supports a responsible decision and owner, or identifies a missing link. A follow-up explanation from the worker can help find evidence, but does not substitute for the recorded actions. With missing evidence, state what cannot be attributed and how to retrieve it; do not rewrite a prompt on suspicion.

## Attribute by evidence

| Evidence | Owner to investigate |
| --- | --- |
| Lead omitted a requirement from the brief and the child had no other way to receive it | Lead's dispatch procedure |
| Computa received the requirement and supporting context but stopped before satisfying it | `computa-please` or the specialized owned procedure governing that step |
| Explore supplied an unsupported claim that drove the implementation decision | `opencode/agents/explore.md`; also inspect how the caller used the claim |
| Verify applied the wrong success criterion despite receiving the correct outcome and proof | `opencode/agents/verify.md` |
| Lead declared readiness without its required independent verification | Lead's readiness procedure |
| Required skill or ledger context never reached the child | The owning attachment/injection mechanism |

These locate an investigation, not an automatic prose edit. If the responsible instruction already says the right thing, continue diagnosing its failure as required by `adapt`.

Pass the repair worker a compact trace with session/message or tool-result pointers, the decisive evidence, remaining gaps, and the bounded change. Keep raw transcripts out of published skills and shared artifacts.
