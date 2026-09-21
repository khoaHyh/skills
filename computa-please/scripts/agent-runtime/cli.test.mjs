import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

test("launches a run and persists an external action before emitting its effect", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "computa-runtime-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const events = join(directory, "run-events.jsonl");
  const launch = join(directory, "launch.json");
  const action = join(directory, "action.json");
  writeFileSync(
    launch,
    JSON.stringify({
      runId: "run-1",
      goal: "Deliver the PR",
      ceiling: "merge-and-verify",
      reviewPlan: "existing-only",
      authorizedActions: ["publish-pr"],
      context: {
        taskWorktree: directory,
        branch: "feature",
        base: "main",
        scope: "runtime",
        verifier: "node --test",
        terminalPredicate: "merge-ready",
      },
    }),
  );
  writeFileSync(
    action,
    JSON.stringify({
      type: "ExternalActionRequested",
      key: "publish:abc",
      action: "publish-pr",
      target: "feature",
      payloadHash: "abc",
    }),
  );

  const launched = run(["launch", "--events", events, "--input", launch]);
  assert.equal(launched.status, 0, launched.stderr);

  for (const phase of ["bound", "synchronized", "implemented", "local-review"]) {
    writeFileSync(
      action,
      JSON.stringify({
        type: "PhaseCompleted",
        phase,
        evidence: { summary: `${phase} complete`, references: [] },
      }),
    );
    const advanced = run(["apply", "--events", events, "--input", action]);
    assert.equal(advanced.status, 0, advanced.stderr);
  }

  writeFileSync(
    action,
    JSON.stringify({
      type: "ExternalActionRequested",
      key: "publish:abc",
      action: "publish-pr",
      target: "feature",
      payloadHash: "abc",
    }),
  );

  const requested = run(["apply", "--events", events, "--input", action]);
  assert.equal(requested.status, 0, requested.stderr);
  const output = JSON.parse(requested.stdout);
  assert.equal(output.value.effects[0].type, "execute-external-action");

  const persisted = readFileSync(events, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(persisted.at(-1).type, "ExternalActionRequested");
  assert.equal(persisted.at(-1).key, "publish:abc");

  const replayed = run(["apply", "--events", events, "--input", action]);
  assert.equal(replayed.status, 1);
  assert.match(replayed.stderr, /ActionAlreadySpent/);
});
