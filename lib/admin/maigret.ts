/**
 * lib/admin/maigret.ts — Server-side Maigret wrapper.
 *
 * Spawns Maigret (installed at D:/Tools/osint/.venv) and parses the
 * JSON output. Maigret sweeps 2,500+ sites for a username; we use
 * it to confirm a person's Instagram / Threads / Bluesky / X handle
 * before adding them to the rolodex sources.
 *
 * Maigret's `--json simple` flag emits a JSON file per username at
 * the report path. We run it in a tmp dir and read the file back.
 *
 * Admin-gated. Never call from a public endpoint.
 */

import "server-only";

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const MAIGRET_PY = process.env.MAIGRET_PYTHON ??
  "D:/Tools/osint/.venv/Scripts/python.exe";

const RUN_TIMEOUT_MS = 90_000;

export type MaigretHit = {
  /** Site name as Maigret reports it ("Instagram", "Bluesky", etc.). */
  site: string;
  /** Site URL where the username resolved. */
  url: string;
  /** Whether Maigret marked the username as claimed on the site. */
  claimed: boolean;
};

export type MaigretRun = {
  username: string;
  hits: MaigretHit[];
  errors: string[];
};

/** Run Maigret for one username; return parsed hits + any non-fatal
 *  warnings. Throws only on spawn / fs failures. */
export async function runMaigret(username: string): Promise<MaigretRun> {
  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(username)) {
    throw new Error("invalid username");
  }
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "maigret-"));
  const errors: string[] = [];
  try {
    await runProcess(
      MAIGRET_PY,
      [
        "-m",
        "maigret",
        username,
        "--json",
        "simple",
        "--folderoutput",
        tmpDir,
        "--no-color",
      ],
      errors,
    );

    // Maigret writes report_<username>_simple.json into the folder.
    const reportPath = path.join(tmpDir, `report_${username}_simple.json`);
    let raw: string;
    try {
      raw = await fs.readFile(reportPath, "utf8");
    } catch {
      return { username, hits: [], errors: [...errors, "report missing"] };
    }
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    const hits: MaigretHit[] = [];
    for (const [site, payload] of Object.entries(parsed)) {
      const url = typeof payload.url === "string" ? payload.url : undefined;
      const status = payload.status as Record<string, unknown> | undefined;
      const claimed = status?.status === "Claimed" || status?.status === "claimed";
      if (!url) continue;
      if (!claimed) continue;
      hits.push({ site, url, claimed: true });
    }
    return { username, hits, errors };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

function runProcess(
  cmd: string,
  args: string[],
  errors: string[],
): Promise<void> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const timer = setTimeout(() => {
      errors.push(`maigret timeout after ${RUN_TIMEOUT_MS}ms`);
      proc.kill("SIGKILL");
    }, RUN_TIMEOUT_MS);
    proc.stderr.on("data", (b) => {
      const s = b.toString();
      // Maigret writes progress to stderr; only capture the last lines
      // to keep the response small.
      if (s.match(/error|exception|traceback/i)) {
        errors.push(s.split("\n").slice(0, 3).join(" ").slice(0, 400));
      }
    });
    proc.on("error", (err) => {
      errors.push(err.message);
    });
    proc.on("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
