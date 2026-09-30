# Production And Ops

Use when requested work includes production deployments or operational changes, or when a code-delivery action would trigger them. Finish Loop owns code delivery and its post-merge workflow watch, not production execution or proof of production delivery.

## Ownership And Authority

1. Identify the supervising agent or operational owner and the project's operational contract. Resolve project-specific action names, approval classes, targets, and evidence requirements from that contract; a label alone grants no authority.
2. Separate the requested code change from operational effects such as switching deployment tracks, adopting or repairing live resources, destructive data changes, reusing immutable images, or querying inventory. Keep the project's terminology and procedures in its own runbook rather than extending this router's modes.
3. Obtain explicit user authority for the specific production action and target. Read-only access and code-merge authority do not imply authority to change production. If a merge or workflow rerun would trigger an unauthorized production change, stop before that action and report the smallest missing permission.

## Proof

Use the project's required evidence against the actual target: the run URL or equivalent execution record, selected environment and release, observed delivery effect rather than a no-op, and requested read-only inventory or state checks. Workflow success alone is not a delivery verdict. Report missing or wrong-target evidence as inconclusive.

**Complete when:** the operational owner, contract, and authority are explicit, and required evidence establishes the requested effect or a named blocker is returned to the owner. Report code delivery and production delivery separately; production work does not create a new Finish Loop phase.
