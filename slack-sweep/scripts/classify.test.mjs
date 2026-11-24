import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const sources = [
  "../../decide-via-cloudflare/scripts/decide.js",
  "./classify.js",
].map(file => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
const lease = { day: new Date().toISOString().slice(0, 10), calls: 1, maxTokens: 24576, model: "clef-flash" };
const retained = "synthetic retained";
const scan = { complete: true, channels: [{ channelId: "C123", threads: [], messages: [
  { ts: "1.1", who: "U111", text: "<@U222> deterministic" },
  { ts: "1.2", who: "U111", text: retained },
  { ts: "1.3", who: "U111", text: "not sent because of the lease" },
] }] };
const fixture = {
  success: true,
  result: {
    answers: { ask: { type: "noul", noul: 0.1 }, urgent: { type: "noul", noul: 0.11 },
      kind: { type: "choice", choice: "chatter", probabilities: { needs_engineer: 0, fyi: 0.1, chatter: 0.8, bot: 0.1 } } },
    usage: { input_tokens: 90 },
  },
};
async function classify(call, arg = lease) {
  return runInNewContext(sources + "\nclassifySlackReading(scan, options)", {
    scan, options: { ownerId: "U222", accountId: "acc_fixture", lease: arg },
    tools: { executor_v2: { call } },
  });
}
test("deterministic messages bypass Clef; lease caps calls and output contains no text", async () => {
  const result = await classify(async ({ calls }) => {
    assert.equal(calls.path, 'tools["cloudflare-mcp"].ai_run');
    assert.equal(calls.input.input.body.model, "@cf/cloudflare/clef-flash");
    assert.equal(calls.input.input.body.input.model, "clef-flash");
    assert.match(calls.input.input.body.input.questions.ask.instructions, /ask an engineer/);
    assert.equal(JSON.parse(calls.input.input.body.input.state).newestMessage, retained);
    return { status: "completed", execution: { ok: true, value: { ok: true, value: { content: [{ type: "text", text: JSON.stringify(fixture) }] } } } };
  });
  assert.equal(result.attempts, 1);
  assert.equal(result.tokens, 90);
  assert.equal(result.outcomes.map(row => `${row.id}:${row.band}`).join(","), "C123:1.2:dropped,C123:1.3:uncertain");
  assert.ok(!JSON.stringify(result).includes(retained));
});

test("Jev selection uses the same wrapper; failure charges its reservation and leaves rows uncertain", async () => {
  const result = await classify(async ({ calls }) => {
    assert.equal(calls.input.input.body.model, "typesafe/jev");
    assert.equal(calls.input.input.body.input.model, undefined);
    assert.match(calls.input.input.body.input.questions.urgent.instructions, /incident/);
    return { status: "completed", execution: { ok: true, value: { ok: false } } };
  }, { ...lease, calls: 2, maxTokens: 32000, model: "jev" });
  assert.equal(result.attempts, 1);
  assert.equal(result.tokens, 32000);
  assert.equal(result.status, "degraded");
  assert.ok(result.outcomes.every(row => row.band === "uncertain"));
});
