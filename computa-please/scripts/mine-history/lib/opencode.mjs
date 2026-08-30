import { DatabaseSync } from "node:sqlite";

/** @typedef {{ kind: "pr_number" | "worktree_slug" | "branch_segment", value: string }} PrHint */
/** @typedef {{ id: string, title: string, directory: string, issueId?: string, prHints: PrHint[], at: number }} SessionRef */
/** @typedef {{ sessionId: string, text: string, at: number }} UserTurn */

const FORBIDDEN_SQL = /\b(credential|account_state|control_account|account)\b/i;
const LIKE_PREFILTER = `
  title LIKE '%ENG-%' OR title LIKE '%eng-%'
  OR title LIKE '%PR%' OR title LIKE '%pr%'
  OR directory LIKE '%ENG-%' OR directory LIKE '%eng-%'
  OR directory LIKE '%PR%' OR directory LIKE '%pr%'
  OR title LIKE '%worktree%' OR directory LIKE '%worktree%'
`;
const CORRELATE_RE = /ENG-\d+|\bPR\b|pr[- /#]?\d+|worktrees?/i;
const ISSUE_RE = /ENG-\d+/i;
const PR_NUMBER_RE = /(?:\bpr[- /#]?|#)(\d+)/gi;
const WORKTREE_SLUG_RE = /worktrees\/([^/]+)/i;
const BATCH = 40;

/**
 * @param {string} sql
 */
function assertSafeSql(sql) {
  if (FORBIDDEN_SQL.test(sql)) {
    throw new Error("refused: credential/account tables are off limits");
  }
}

/**
 * @param {string} title
 * @param {string} directory
 * @returns {SessionRef["issueId"]}
 */
function extractIssueId(title, directory) {
  const m = `${title}\n${directory}`.match(ISSUE_RE);
  return m ? m[0].toUpperCase() : undefined;
}

/**
 * @param {string} title
 * @param {string} directory
 * @returns {PrHint[]}
 */
function extractPrHints(title, directory) {
  const blob = `${title}\n${directory}`;
  /** @type {PrHint[]} */
  const hints = [];
  const seen = new Set();
  for (const m of blob.matchAll(PR_NUMBER_RE)) {
    const value = m[1];
    const key = `pr:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hints.push({ kind: "pr_number", value });
  }
  const wt = directory.match(WORKTREE_SLUG_RE);
  if (wt) hints.push({ kind: "worktree_slug", value: wt[1] });
  const segs = directory.split("/").filter(Boolean);
  const last = segs.at(-1);
  if (last && /__|^(stack-|feat\/|fix\/)/i.test(last) && last !== wt?.[1]) {
    hints.push({ kind: "branch_segment", value: last });
  }
  return hints;
}

/**
 * @param {string} title
 * @param {string} directory
 */
export function isCorrelatable(title, directory) {
  return CORRELATE_RE.test(`${title} ${directory}`);
}

/**
 * @param {string} dbPath
 */
export function openReadOnly(dbPath) {
  const uri = `file:${dbPath}?mode=ro`;
  const sqlite = new DatabaseSync(uri, { uri: true, readOnly: true });

  /**
   * @param {string} sql
   */
  const prepare = (sql) => {
    assertSafeSql(sql);
    return sqlite.prepare(sql);
  };

  return {
    /**
     * @param {number} [limit]
     * @returns {SessionRef[]}
     */
    correlatableSessions(limit) {
      const rows = prepare(`
        SELECT id, title, directory, time_created
        FROM session
        WHERE ${LIKE_PREFILTER}
        ORDER BY time_created DESC
      `).all();
      const sessions = [];
      for (const row of rows) {
        const title = String(row.title ?? "");
        const directory = String(row.directory ?? "");
        if (!isCorrelatable(title, directory)) continue;
        sessions.push({
          id: String(row.id),
          title,
          directory,
          issueId: extractIssueId(title, directory),
          prHints: extractPrHints(title, directory),
          at: Number(row.time_created) || 0,
        });
        if (limit && sessions.length >= limit) break;
      }
      return sessions;
    },

    /**
     * @param {string[]} sessionIds
     * @returns {UserTurn[]}
     */
    userTurns(sessionIds) {
      /** @type {UserTurn[]} */
      const turns = [];
      const seen = new Set();
      const push = (sessionId, text, at) => {
        if (typeof text !== "string") return;
        const trimmed = text.trim();
        if (!trimmed) return;
        const key = `${sessionId}\0${trimmed.replace(/\s+/g, " ").toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        turns.push({ sessionId, text: trimmed, at: Number(at) || 0 });
      };

      for (let i = 0; i < sessionIds.length; i += BATCH) {
        const batch = sessionIds.slice(i, i + BATCH);
        const ph = batch.map(() => "?").join(",");
        const partRows = prepare(`
          SELECT m.session_id AS sessionId, m.time_created AS at,
                 json_extract(p.data, '$.text') AS text
          FROM message m
          JOIN part p ON p.message_id = m.id
          WHERE m.session_id IN (${ph})
            AND json_extract(m.data, '$.role') = 'user'
            AND json_extract(p.data, '$.type') = 'text'
        `).all(...batch);
        for (const row of partRows) {
          push(String(row.sessionId), row.text, row.at);
        }

        const inputRows = prepare(`
          SELECT session_id AS sessionId, prompt AS text, time_created AS at
          FROM session_input
          WHERE session_id IN (${ph})
        `).all(...batch);
        for (const row of inputRows) {
          push(String(row.sessionId), row.text, row.at);
        }
      }
      return turns;
    },

    close() {
      sqlite.close();
    },
  };
}
