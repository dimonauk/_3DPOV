#!/usr/bin/env node
/**
 * scripts/bench/poll-git-activity.mjs — Bench-side poller for the
 * Polymaths Feed.
 *
 * Runs on Sovereign-PC (the bench), reads `git log` from the three
 * local clones (Holoflow / Hangar / Dolly OS), and POSTs new commits
 * since the last run to /api/internal/feed-ingest on the deployed
 * site.
 *
 * Hangar + DollyOS don't have public GitHub remotes — this is how
 * their git activity reaches the public /news surface.
 *
 * # Setup
 *
 *   1. Set env vars in a `.env.bench` file alongside this script:
 *        HOLOFLOW_FEED_INGEST_URL=https://holoflow.co.uk/api/internal/feed-ingest
 *        FEED_INGEST_TOKEN=<same token configured in Vercel>
 *
 *   2. Optional: set repo paths if different from the defaults below.
 *
 *   3. Schedule via Task Scheduler (Windows) or cron (WSL):
 *        */15 * * * *  node scripts/bench/poll-git-activity.mjs
 *
 * # State
 *
 * Last-seen SHA per repo is kept in `.bench/git-poller-state.json`
 * next to the script. First run reports the most recent 50 commits
 * per repo; subsequent runs report only what's new.
 *
 * # Voice
 *
 * This script is a stopgap. The right long-term answer is a private
 * git host (Gitea / forgejo) the website can pull from directly, but
 * the bench-bridge buys us time without a new runtime to babysit.
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const REPOS = [
  {
    source: "holoflow",
    root: process.env.HOLOFLOW_REPO ?? "D:\\.github\\_3DPOV",
  },
  {
    source: "hangar",
    root: process.env.HANGAR_REPO ?? "D:\\The_Hangar",
  },
  {
    source: "dollyos",
    root: process.env.DOLLYOS_REPO ?? "D:\\The_Hangar\\Dolly_OS",
  },
];

const FIRST_RUN_LIMIT = 50;
const STATE_PATH = path.join(
  process.cwd(),
  ".bench",
  "git-poller-state.json",
);
const INGEST_URL = process.env.HOLOFLOW_FEED_INGEST_URL;
const TOKEN = process.env.FEED_INGEST_TOKEN;

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

function gitLog(repoRoot, lastSeen) {
  // %x1f = unit separator, %x1e = record separator. Splits cleanly
  // even if commit subjects contain pipes, tabs, or quotes.
  const format = "%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e";
  const args = ["-C", repoRoot, "log", `--pretty=format:${format}`];
  if (lastSeen) {
    args.push(`${lastSeen}..HEAD`);
  } else {
    args.push(`-n`, String(FIRST_RUN_LIMIT));
  }
  let raw = "";
  try {
    raw = execFileSync("git", args, { encoding: "utf8" });
  } catch (err) {
    console.error(`[git-log] ${repoRoot}: ${err.message}`);
    return [];
  }
  return raw
    .split("\x1e")
    .map((rec) => rec.trim())
    .filter(Boolean)
    .map((rec) => {
      const [sha, author, date, subject, body] = rec.split("\x1f");
      return {
        sha,
        author: author?.trim() || undefined,
        publishedAt: date,
        title: subject.trim(),
        body: body?.trim() || undefined,
      };
    });
}

function currentBranch(repoRoot) {
  try {
    return execFileSync("git", ["-C", repoRoot, "branch", "--show-current"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
}

async function postBatch(entries) {
  if (entries.length === 0) return { ingested: 0 };
  const resp = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ entries }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ingest http ${resp.status}: ${text}`);
  }
  return await resp.json();
}

async function main() {
  if (!INGEST_URL || !TOKEN) {
    console.error(
      "Set HOLOFLOW_FEED_INGEST_URL and FEED_INGEST_TOKEN before running.",
    );
    process.exit(1);
  }
  const state = await loadState();
  const all = [];
  for (const repo of REPOS) {
    const lastSeen = state[repo.source];
    let commits = [];
    try {
      commits = gitLog(repo.root, lastSeen);
    } catch (err) {
      console.error(`[${repo.source}] ${err.message}`);
      continue;
    }
    if (commits.length === 0) {
      console.log(`[${repo.source}] no new commits`);
      continue;
    }
    const branch = currentBranch(repo.root);
    for (const c of commits) {
      all.push({
        source: repo.source,
        sha: c.sha,
        title: c.title.slice(0, 280),
        body: c.body?.slice(0, 2000),
        author: c.author,
        publishedAt: c.publishedAt,
        branch,
      });
    }
    // Newest first in git log output — record the newest SHA as the
    // new high-water mark.
    state[repo.source] = commits[0].sha;
    console.log(`[${repo.source}] ${commits.length} commit(s) queued`);
  }
  if (all.length === 0) return;
  const result = await postBatch(all);
  console.log(`Posted ${all.length} entries, server stored=${result.stored}`);
  await saveState(state);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
