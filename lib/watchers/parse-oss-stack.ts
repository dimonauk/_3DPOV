/**
 * lib/watchers/parse-oss-stack.ts — Read OPEN-SOURCE-STACK.md and pull
 * out every `github.com/<owner>/<repo>` link as a structured row.
 *
 * The doc is the source of truth for what the watcher polls. Every
 * markdown link to a GitHub repo becomes a candidate for the GitHub
 * Releases poller. Entries below the "Lined up" heading are marked
 * `linedUp: true` so the admin surface can group them.
 *
 * Pure function — fs.readFile happens once at module load, the parse
 * is deterministic, no caching needed.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type OssStackEntry = {
  owner: string;
  repo: string;
  /** Display name from the doc, e.g. "Next.js". */
  name: string;
  /** Where in the doc — section heading or `lined-up`. */
  section: string;
  /** True if the row sits under "Lined up — researched, not yet wired". */
  linedUp: boolean;
};

const STACK_PATH = path.join(
  process.cwd(),
  "docs",
  "OPEN-SOURCE-STACK.md",
);

const GITHUB_LINK = /\[([^\]]+)\]\(https?:\/\/github\.com\/([^/\s)]+)\/([^/\s)#]+)/g;
const LINED_UP_HEADING = /^##\s+Lined up/i;
const HEADING = /^##\s+(.+?)\s*$/;

/**
 * Walk the markdown line-by-line. Track the current heading. On every
 * GitHub link inside a line, emit one OssStackEntry. Dedupe by
 * `owner/repo` — first occurrence wins.
 */
export async function parseOssStack(
  filePath: string = STACK_PATH,
): Promise<OssStackEntry[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return [];
  }

  const lines = raw.split(/\r?\n/);
  const seen = new Set<string>();
  const out: OssStackEntry[] = [];
  let currentSection = "Site framework";
  let linedUp = false;

  for (const line of lines) {
    const headingMatch = HEADING.exec(line);
    if (headingMatch && headingMatch[1]) {
      currentSection = headingMatch[1].trim();
      linedUp = LINED_UP_HEADING.test(line);
      continue;
    }
    // reset regex state
    GITHUB_LINK.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = GITHUB_LINK.exec(line)) !== null) {
      const name = (m[1] ?? "").trim();
      const owner = (m[2] ?? "").trim();
      // strip trailing `/path` segments or `#anchor` from repo
      const repo = (m[3] ?? "").replace(/[).,].*$/, "").trim();
      if (!owner || !repo) continue;
      const key = `${owner}/${repo}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ owner, repo, name, section: currentSection, linedUp });
    }
  }
  return out;
}

/** Returns the curated repo list the GitHub-Releases watcher polls. */
export async function getWiredRepos(): Promise<OssStackEntry[]> {
  const all = await parseOssStack();
  // For now, watch everything — wired + lined-up. The admin surface
  // distinguishes them visually.
  return all;
}
