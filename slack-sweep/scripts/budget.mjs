// Text-free, shared between sweeps on this host. In-flight timeouts keep their
// reservation. Only a verified completed Code Mode call can release unused input.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const limits = { "clef-flash": 24576, jev: 32000 };
const day = new Date().toISOString().slice(0, 10);
const base = join(homedir(), ".local/state/slack-sweep");
mkdirSync(base, { recursive: true, mode: 0o700 });
process.umask(0o077);
const db = new DatabaseSync(join(base, "decisions.sqlite"));
db.exec(`PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS budget (id TEXT PRIMARY KEY, day TEXT, tokens INTEGER, settled INTEGER);
  BEGIN IMMEDIATE`);
try {
  const [op, arg, extra] = process.argv.slice(2);
  if (op === "reserve") {
    const want = Number(arg), model = extra ?? "clef-flash";
    if (!Object.hasOwn(limits, model) || !Number.isSafeInteger(want) || want < 1 || want > 200) throw Error("reserve <1–200> [clef-flash|jev]");
    const used = db.prepare("SELECT coalesce(sum(tokens), 0) AS used FROM budget WHERE day=?").get(day).used;
    const maxTokens = limits[model], calls = Math.min(want, Math.max(0, Math.floor((2_000_000 - used) / maxTokens)));
    const id = calls ? randomUUID() : null;
    if (id) db.prepare("INSERT INTO budget VALUES (?,?,?,0)").run(id, day, calls * maxTokens);
    db.exec("COMMIT");
    console.log(JSON.stringify({ id, day, model, calls, maxTokens }));
  } else if (op === "settle") {
    const charged = Number(extra);
    if (!arg || extra === undefined || !Number.isSafeInteger(charged) || charged < 0) throw Error("settle <reservation-id> <charged-input-tokens>");
    const row = db.prepare("SELECT tokens,settled FROM budget WHERE id=?").get(arg);
    if (!row || row.settled || charged > row.tokens) throw Error("Invalid or already settled reservation");
    db.prepare("UPDATE budget SET tokens=?,settled=1 WHERE id=?").run(charged, arg);
    db.exec("COMMIT");
  } else throw Error("Use reserve or settle");
} catch (e) {
  db.exec("ROLLBACK");
  throw e;
} finally { db.close(); }
