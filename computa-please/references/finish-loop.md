# Finish Loop

Use for requested end-to-end delivery, not merely because a PR exists. Keep scope to one task’s change unless the user selected a stack; that case also follows [Graphite Stack Merge](graphite-merge.md). No specification document or event-log runtime is required.

## Establish The Boundary

Recover the requested terminal state and already-granted [authority](vcs.md#authority): a verified draft, green checks, merge-ready, or merged-and-verified. An explicit merge/land request supplies merge authority for its named scope; a draft or “get it green” request does not. Ask only about a still-ambiguous consequential action, after useful read-only preparation. Carry the grant across same-task resumes.

Inspect the task-owned checkout, intended base, complete diff, live PR head, conflicts, required checks, and applicable review contract. Reuse existing evidence when it still covers the semantic candidate. Synchronize and repair only the accepted change; a stack parent or failed check is not permission to import another feature.

Keep a compact working record of the target, authority source, evidence, outstanding gates, and next action. Use the existing handoff only when recovery or coordination needs persistence.

## Prepare And Publish

Complete necessary implementation under [Execution](execution.md), follow [Local Review](local-review.md) or its exemption, and run current required local checks. Publish through [VCS](vcs.md#commits-and-publication) as a draft and confirm the intended head and base. Keep the description accurate against the final diff.

Mark ready only when the requested delivery includes readiness or merge. If that transition triggers a review or another external effect, reconcile it with the applicable contract before acting. Draft-publication permission does not itself authorize spending review quota.

## CI And External Review

Required checks gate delivery at the requested boundary. Observe provider results for the current head; local evidence cannot replace required CI. Honor explicit CI waivers in their named scope and report those checks as skipped, not green. A waiver does not waive review, conflicts, authority, or head/base consistency, nor authorize changing protections or cancelling runs.

For attributable failures, diagnose the first causal error, make the smallest scoped repair, refresh affected local proof, and publish an additive update. Reuse unaffected evidence; honor exact-final-head checks required by the repository. Stop after two consecutive repair attempts for the same failure yield no new evidence or diagnosis. Pending runs follow a bounded provider or agreed deadline; external outages and unavailable required infrastructure are blockers.

Use the existing review contract rather than inventing another reviewer stage. Resolve required reviewers and completion signals from live provider state. Progress notices, identity, eligibility notices, and summary scores are not completed feedback. Reuse attributable completed results. Request a review only when authorized, at most once per named action for this delivery; record the attempt before invoking it and retain it through timeout, ambiguous results, new commits, and pickup. An absent required result at its deadline is a blocker, not a reason to spend another request.

Once selected feedback is complete, freeze its IDs, bodies, and reviewed revision and use `review-remediation` once for that set. Verify every item against the current patch; account for zero findings explicitly. Publish fixes before any authorized reply or resolved-state update. Messages and provider state changes retain their separate authority. Reconcile ambiguous effects before retrying. Later feedback is a separate bounded set, not an automatic restart of local or external review.

Before readiness or merge, reconfirm the final head/base, conflicts, current required CI or scoped waivers, and applicable completed review/dispositions. For draft-only delivery, identify any remaining remote review gates without silently making the PR ready.

## Merge And Verify

With merge authority and the applicable gates satisfied:

1. Identify the intended target and relevant post-merge workflows, expected commit lineage, discovery deadline, terminal deadline, and accepted conclusions before merging.
2. Check the [production boundary](../SKILL.md#prove-and-finish) if merge or a workflow rerun would cause live effects. Obtain the specific required operational authority before that action.
3. Reconfirm the final candidate and use the repository’s normal merge mechanism, with an expected-head precondition when supported. For a single PR, stop if it targets an unmerged parent or would mutate an unowned diff. A selected stack follows its own runbook.
4. Treat accepted, queued, or ambiguous merge responses as needing reconciliation, not as merged or permission for admin bypass. Bypass or protection changes need their explicit authority. Confirm the provider’s merged result and target-branch lineage before reporting success.
5. Observe the expected post-merge workflows for the merged result, not the former PR head when squash/rebase changed it. A missing expected run is a blocker. If none are configured, establish that from repository/provider evidence and confirm the landed result itself.

Merged-and-verified delivery includes focused follow-up PRs for failures attributable to the landed change, under the original scope and authority. Start from the protected target in a task branch, never by editing the target directly or rewriting history. Each repair PR follows the applicable verification and delivery gates. Stop after two consecutive repairs bring no new failure evidence, diagnosis, or terminal workflow progress; code churn alone is not progress. Pre-existing failures and new product or operational decisions remain outside the repair grant.

## Completion

Finish when the requested terminal state is observed and its applicable proof and delivery gates are complete, or a concrete blocker prevents it. Report relevant PR links and heads, checks and review actually completed, merge/post-merge results when requested, waivers, and only remaining risk or human action. A production delivery claim additionally needs the owning project’s evidence of the actual effect and target.
