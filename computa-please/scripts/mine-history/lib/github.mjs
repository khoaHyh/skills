import { spawn } from "node:child_process";

/** @typedef {{ id: string, title: string, directory: string, issueId?: string, prHints: { kind: string, value: string }[], at: number }} SessionRef */
/** @typedef {{ repo: string, prNumber: number, author: string, body: string, disposition: "confirmed_fix" | "dismissed", fixCommitSha?: string, at: number }} RemediationFinding */
/** @typedef {(args: string[]) => Promise<string>} GhRunner */

const BOT_RE = /greptile|bugbot|cursor-bugbot/i;

/**
 * @param {string[]} args
 * @returns {Promise<string>}
 */
export function runGh(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `gh exited ${code}`));
    });
  });
}

/**
 * @param {string} url
 */
function repoFromUrl(url) {
  const m = String(url).match(/github\.com\/([^/]+\/[^/]+)/);
  return m ? m[1].replace(/\.git$/, "") : "";
}

/**
 * Skip when later-activity is unclear so unconfirmed bot noise stays out of the rollup.
 * @param {SessionRef[]} sessions
 * @param {GhRunner} [run]
 * @returns {Promise<RemediationFinding[]>}
 */
export async function collectRemediations(sessions, run = runGh) {
  const issueIds = [...new Set(sessions.map((s) => s.issueId).filter(Boolean))];
  /** @type {RemediationFinding[]} */
  const findings = [];

  for (const issueId of issueIds) {
    let prs;
    try {
      prs = JSON.parse(
        await run(["search", "prs", issueId, "--limit", "8", "--json", "number,url,repository,title"]),
      );
    } catch {
      continue;
    }
    if (!Array.isArray(prs)) continue;

    for (const pr of prs) {
      const repo = pr.repository?.nameWithOwner || repoFromUrl(pr.url || "");
      const prNumber = Number(pr.number);
      if (!repo || !Number.isFinite(prNumber)) continue;

      /** @type {any[]} */
      let comments = [];
      /** @type {any[]} */
      let commits = [];
      try {
        comments = JSON.parse(await run(["api", `repos/${repo}/pulls/${prNumber}/comments`]));
      } catch {
        continue;
      }
      try {
        commits = JSON.parse(await run(["api", `repos/${repo}/pulls/${prNumber}/commits`]));
      } catch {
        commits = [];
      }
      if (!Array.isArray(comments)) continue;

      for (const comment of comments) {
        const author = String(comment.user?.login ?? "");
        if (!BOT_RE.test(author)) continue;
        const at = Date.parse(comment.created_at) || 0;
        const later = Array.isArray(commits)
          ? commits.find((c) => Date.parse(c.commit?.committer?.date || "") > at)
          : null;
        if (!later) continue;
        findings.push({
          repo,
          prNumber,
          author,
          body: String(comment.body ?? ""),
          disposition: "confirmed_fix",
          fixCommitSha: later.sha,
          at,
        });
      }
    }
  }
  return findings;
}
