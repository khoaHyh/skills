# Parent-managed child outage continuation

Defaults remain authoritative. Use this only after the existing child's terminal
provider-failure completion, within its current task grant. Root/parent outage
recovery is unsupported: use the manual owner escape, not a replacement root.
No runtime plugin, retry hook, quota polling, automatic reset or model-quality
equivalence is implied.

1. Read the failed child's current agent/model/parent, idle state and completed
   tool receipts. Only positively identified **model-request** quota or terminal
   503/529 overload qualifies. Unknown Claude text, usage warnings, auth/policy,
   no-route, tool errors and task/test failure do not. Reconcile uncertain
   external effects first; retained tool results are not exactly-once proof.
2. Establish an **exclusive selection-owner handoff** covering this child and
   task, with a receipt. An idle API response is not exclusive ownership.
   The public switch API has no CAS; check-then-switch cannot prevent a user
   or another parent changing selection. If exclusivity cannot be established,
   stop for manual owner action. The local guard coordinates participating
   parents only; it cannot lock the UI/API or establish ownership itself.
3. Build a local metadata-only admission packet with the fields checked by
   `~/.config/opencode/scripts/child-fallback.py`. Its `MAPPINGS` is the single
   mapping source. Preserve the existing authority/security/proof pointers;
   verifier, QA and shipping substitutions also require accepted outcome
   evidence. Fixture routing passes are not that acceptance.
4. Claim once:
   `python3 ~/.config/opencode/scripts/child-fallback.py PACKET.json`.
   A duplicate/restart or uncertain prior action is a **manual reconciliation
   hold**, not permission to resend. A claim is not execution or proof that
   exclusive ownership exists. Current outage direction excludes Claude:
   leave the guard's default exclusion on. Only an explicit new owner direction
   permits `--claude-allowed-by-owner`; no timer or quota probe can enable it.
5. Under that exclusive handoff, continue through the normal `subagent` tool:
   same `sessionID`, same `agent`, explicit approved `model`, and a brief of
   changed facts, reconciled effects and remaining proof. Keep the same
   instructions, permissions and authority. Never recreate the original task
   in a fresh child. Verify the resulting selection/parent and admission.
   Reconcile uncertain admission before any further action.
6. One alternate only. If it fails or a concurrent selection/authority issue
   appears, stop; no reverse fallback/ping-pong. Close the task on its fallback
   selection without resetting it. Later reuse needs an explicit idle selection
   handoff and a new task identity. Keep the episode receipt for restart/dedup.
