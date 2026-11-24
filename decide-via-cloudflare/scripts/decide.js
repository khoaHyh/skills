// Paste into the agent's Code Mode. Executor's call wrapper invokes ai_run.
async function decideViaCloudflare({ accountId, state, questions, model = "clef-flash" }) {
  const models = { "clef-flash": "@cf/cloudflare/clef-flash", jev: "typesafe/jev" };
  if (!Object.hasOwn(models, model)) throw Error("Use clef-flash or jev");
  if (JSON.stringify(state).length > 24000 || Object.keys(questions).length < 1 || Object.keys(questions).length > 16 || JSON.stringify(questions).length > 4000) {
    throw Error("Decision input exceeds the client limits");
  }
  if (!Object.values(questions).every(q => q && typeof q.instructions === "string" && q.instructions.trim())) throw Error("Each question needs instructions");
  // Clef requires its own selector inside input; the Jev REST example
  // specifies the selector only in the outer model field.
  const input = model === "clef-flash" ? { model, state, questions } : { state, questions };
  let outcome;
  try {
    outcome = await tools.executor_v2.call({
      calls: {
        path: 'tools["cloudflare-mcp"].ai_run',
        input: { accountId, input: { body: { model: models[model], input } } },
      },
    });
  } catch { return { status: "uncertain" }; }
  if (outcome.status === "approval-required" || outcome.status === "input-required") return { status: "pending", requestId: outcome.requestId };
  const call = outcome.execution?.value;
  if (outcome.status !== "completed" || !outcome.execution?.ok || !call?.ok || call.value?.isError) return { status: "uncertain" };
  let envelope = call.value?.structuredContent;
  if (!envelope) {
    const text = call.value?.content?.find(x => x.type === "text")?.text;
    try { envelope = JSON.parse(text); } catch { return { status: "uncertain" }; }
  }
  const result = envelope?.success === true ? envelope.result : (envelope?.success === undefined && envelope?.answers ? envelope : undefined);
  const tokens = result?.usage?.input_tokens;
  if (!Number.isSafeInteger(tokens) || tokens < 0 || !result?.answers) return { status: "uncertain" };
  const answers = Object.create(null);
  const fraction = x => typeof x === "number" && x >= 0 && x <= 1;
  for (const id of Object.keys(questions)) {
    const q = questions[id], x = result.answers[id];
    if (!x || x.type !== q.type) return { status: "uncertain", tokens };
    if (q.type === "noul" && fraction(x.noul)) answers[id] = { type: "noul", noul: x.noul };
    else if (q.type === "choice") {
      const keys = Object.keys(q.criteria);
      const p = x.probabilities;
      if (!p || !keys.includes(x.choice) || Object.keys(p).length !== keys.length || !keys.every(k => fraction(p[k]))
        || Math.abs(keys.reduce((sum, k) => sum + p[k], 0) - 1) > 0.02) return { status: "uncertain", tokens };
      answers[id] = { type: "choice", choice: x.choice, probabilities: Object.fromEntries(keys.map(k => [k, p[k]])) };
    } else if (q.type === "score" && Number.isFinite(x.score) && x.score >= 0 && x.score <= q.criteria.length - 1) {
      answers[id] = { type: "score", score: x.score };
    } else return { status: "uncertain", tokens };
  }
  return { status: "ok", answers, tokens };
}
