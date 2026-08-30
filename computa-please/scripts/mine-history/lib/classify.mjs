/** Pure miss classification + redaction for ENG-360 Phase 0. */

/** @typedef {"guessed_root_cause" | "skipped_proof" | "mutated_before_design_gate" | "pr_body_without_gate" | "typecheck_as_proof" | "never_drove_app" | "other_process"} MissClass */
/** @typedef {"user_correction" | "bot_confirmed_fix" | "bot_dismissed"} Source */
/** @typedef {"hard_check" | "skill_patch" | "verify_gap" | "ignore"} CandidateFix */

const MIN_LEN = 12;
const MAX_LEN = 800;
const QUOTE_LEN = 240;
const OTHER_PROCESS_HIGH = 10;

const VERIFY = new Set(["never_drove_app", "typecheck_as_proof", "skipped_proof"]);
const PROCESS_GATE = new Set([
  "mutated_before_design_gate",
  "pr_body_without_gate",
  "guessed_root_cause",
]);

const CLASS_RULES = [
  {
    class: /** @type {MissClass} */ ("guessed_root_cause"),
    re: /don['’]?t guess|stop guessing|you guessed|guess(?:ed|ing) (?:the )?root cause|reproduce (?:it |this )?first/i,
  },
  {
    class: /** @type {MissClass} */ ("typecheck_as_proof"),
    re: /typecheck(?:ing)?\s+is\s+not|\btypecheck\b.*\bnot\b.*\b(?:proof|enough|verif)/i,
  },
  {
    class: /** @type {MissClass} */ ("never_drove_app"),
    re: /drive(?:s|d)? the app|never drove|open the (?:running )?app and|screenshot (?:the|this) (?:ui|page|screen)/i,
  },
  {
    class: /** @type {MissClass} */ ("skipped_proof"),
    re: /\b(?:not proof|prove it|proof is|strongest (?:seam|proof)|skipped proof)\b/i,
  },
  {
    class: /** @type {MissClass} */ ("mutated_before_design_gate"),
    re: /don['’]?t (?:change|edit|implement|mutate) yet|design first|spec first|no code yet/i,
  },
  {
    class: /** @type {MissClass} */ ("pr_body_without_gate"),
    re: /\bpr body\b|call stacks|personal-drafting/i,
  },
];

const CORRECTIVE_TONE = /\b(?:that'?s wrong|you (?:should(?:n'?t)?|need to) redo|don['’]?t guess)\b/i;

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/g,
  /github_pat_[A-Za-z0-9_]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /AKIA[0-9A-Z]{16}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /(?:api[_-]?key|token|secret|password|passwd)\s*[:=]\s*\S+/gi,
];

/**
 * @param {string} text
 */
export function isNoise(text) {
  const t = text.trim();
  if (t.length < MIN_LEN || t.length > MAX_LEN) return true;
  if (t.startsWith("<task ")) return true;
  if (t.startsWith("You are the isolated")) return true;
  if (t.startsWith('"You are the isolated')) return true;
  if (t.startsWith("Continue if you have next steps")) return true;
  if (/^"?Review read-only/i.test(t)) return true;
  if (/^Read-only\b/i.test(t)) return true;
  if (/^Research only\b/i.test(t)) return true;
  if (/^Do not mutate\b/i.test(t)) return true;
  if (/^Findings only\b/i.test(t)) return true;
  if (/^Audit PR\b/i.test(t)) return true;
  if (/invoke the skill tool/i.test(t)) return true;
  if (t.includes("<path>") || t.includes("<entries>") || t.includes("<type>")) return true;
  return false;
}

/**
 * @param {string} text
 */
export function redact(text) {
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}

function quoteFrom(text) {
  const collapsed = redact(text).replace(/\s+/g, " ").trim();
  return collapsed.length > QUOTE_LEN
    ? `${collapsed.slice(0, QUOTE_LEN - 3)}...`
    : collapsed;
}

/**
 * @param {string} text
 * @returns {MissClass | null}
 */
export function classForText(text) {
  for (const rule of CLASS_RULES) {
    if (rule.re.test(text)) return rule.class;
  }
  if (CORRECTIVE_TONE.test(text)) return "other_process";
  return null;
}

/**
 * @param {{ sessionId: string, text: string, at: number }} turn
 * @param {{ id: string, issueId?: string, prHints: { kind: string, value: string }[] }} session
 */
export function classifyTurn(turn, session) {
  if (isNoise(turn.text)) return null;
  if (turn.text.length > 280 && !/\b(you|your|i |i'|we |don't|do not)\b/i.test(turn.text)) {
    return null;
  }
  const cls = classForText(turn.text);
  if (!cls) return null;
  const pr = session.prHints?.find((h) => h.kind === "pr_number");
  return {
    class: cls,
    source: /** @type {Source} */ ("user_correction"),
    sessionId: session.id,
    ...(session.issueId ? { issueId: session.issueId } : {}),
    ...(pr ? { prNumber: Number(pr.value) } : {}),
    quote: quoteFrom(turn.text),
    at: turn.at,
  };
}

/**
 * @param {{ repo: string, prNumber: number, body: string, disposition: string, at: number }} finding
 */
export function classifyFinding(finding) {
  const cls = classForText(finding.body) ?? "other_process";
  return {
    class: cls,
    source:
      finding.disposition === "confirmed_fix"
        ? /** @type {Source} */ ("bot_confirmed_fix")
        : /** @type {Source} */ ("bot_dismissed"),
    prNumber: finding.prNumber,
    repo: finding.repo,
    quote: quoteFrom(finding.body),
    at: finding.at,
  };
}

/**
 * @param {MissClass} cls
 * @param {Record<Source, number>} bySource
 * @returns {CandidateFix}
 */
export function candidateFixFor(cls, bySource) {
  const user = bySource.user_correction ?? 0;
  const confirmed = bySource.bot_confirmed_fix ?? 0;
  const dismissed = bySource.bot_dismissed ?? 0;
  const count = user + confirmed + dismissed;
  if (count > 0 && dismissed === count) return "ignore";
  if (VERIFY.has(cls)) return confirmed > 0 ? "hard_check" : "verify_gap";
  if (PROCESS_GATE.has(cls)) return confirmed > 0 || user >= 5 ? "hard_check" : "skill_patch";
  return count >= OTHER_PROCESS_HIGH ? "skill_patch" : "ignore";
}
