#!/usr/bin/env tsx
/**
 * cctv-download-matched.ts
 *
 * Reads scripts/cctv-matches.json (produced by cctv-match-holowalk.ts)
 * and downloads the matched cameras' live still / video frames with
 * intelligent semantic filenames, sorted into per-location folders:
 *
 *   <staging>/<location-id>/
 *     <YYYYMMDD>_<HHMMSS>__<camera-id-suffix>.jpg
 *     <YYYYMMDD>_<HHMMSS>__<camera-id-suffix>.mp4
 *     <YYYYMMDD>_<HHMMSS>__<camera-id-suffix>.jpg.meta.json
 *
 * Filename leads with date + time-of-day so frames sort chronologically
 * within each location's folder; the camera suffix at the end picks
 * which of the location's matched cameras the frame came from. Sidecar
 * JSON sits next to each file with the full match metadata.
 *
 * Idempotent on filename — re-running with the same matches + timestamp
 * skips already-downloaded files. The timestamp granularity is per-run
 * (one wall-clock per invocation), so a fresh run produces a new set of
 * names + downloads the live frames again.
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-download-matched.ts
 *   pnpm exec tsx scripts/cctv-download-matched.ts --matches scripts/cctv-matches.json
 *   pnpm exec tsx scripts/cctv-download-matched.ts --staging scripts/cctv-staging
 *   pnpm exec tsx scripts/cctv-download-matched.ts --kind image  (only stills)
 *   pnpm exec tsx scripts/cctv-download-matched.ts --kind video  (only videos)
 *   pnpm exec tsx scripts/cctv-download-matched.ts --dry-run
 *
 * Node built-ins only.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { argv, exit, stderr, stdout } from "node:process";

import type { CctvMatch } from "../lib/cctv/match";

// ── Types ──────────────────────────────────────────────────────────────────

type MatchesFile = {
  generatedAt: string;
  matches: CctvMatch[];
  cameraIds: string[];
};

type CliFlags = {
  matchesPath: string;
  stagingDir: string;
  kind: "image" | "video" | "both";
  dryRun: boolean;
  /** Per-camera concurrency cap to be gentle on TfL. */
  concurrency: number;
};

type DownloadJob = {
  match: CctvMatch;
  kind: "image" | "video";
  url: string;
  filename: string;
  metaFilename: string;
};

type Outcome =
  | { kind: "ok"; bytes: number; path: string }
  | { kind: "skip"; reason: string; path: string }
  | { kind: "fail"; reason: string; url: string };

// ── CLI ────────────────────────────────────────────────────────────────────

function parseFlags(args: string[]): CliFlags {
  let matchesPath = "scripts/cctv-matches.json";
  let stagingDir = "scripts/cctv-staging";
  let kind: CliFlags["kind"] = "both";
  let dryRun = false;
  let concurrency = 4;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--matches") {
      const next = args[i + 1];
      if (!next) throw new Error("--matches requires a path");
      matchesPath = next;
      i++;
    } else if (a === "--staging") {
      const next = args[i + 1];
      if (!next) throw new Error("--staging requires a path");
      stagingDir = next;
      i++;
    } else if (a === "--kind") {
      const next = args[i + 1];
      if (next !== "image" && next !== "video" && next !== "both") {
        throw new Error("--kind must be image | video | both");
      }
      kind = next;
      i++;
    } else if (a === "--concurrency") {
      const next = args[i + 1];
      if (!next) throw new Error("--concurrency requires a number");
      concurrency = Math.max(1, Math.min(16, Number(next)));
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return { matchesPath, stagingDir, kind, dryRun, concurrency };
}

function printHelp(): void {
  stdout.write(
    [
      "cctv-download-matched — fetch matched-camera frames with semantic names",
      "",
      "Flags:",
      "  --matches <path>     Matches JSON (default scripts/cctv-matches.json)",
      "  --staging <path>     Output directory (default scripts/cctv-staging)",
      "  --kind <k>           image | video | both (default both)",
      "  --concurrency <n>    Parallel downloads, 1-16 (default 4)",
      "  --dry-run            Print intended downloads, write nothing",
      "  --help, -h           This help",
      "",
    ].join("\n"),
  );
}

// ── Filename construction ─────────────────────────────────────────────────

/** Sanitise a slug-ish string to a filesystem-safe filename component. */
function sanitise(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

type Timestamp = {
  /** YYYYMMDD UTC */
  date: string;
  /** HHMMSS UTC — "time of day", leads the filename */
  time: string;
};

function nowStamp(): Timestamp {
  const d = new Date();
  const pad = (n: number, w = 2): string => n.toString().padStart(w, "0");
  return {
    date: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`,
  };
}

/** Strip TfL's "JamCams_00001." prefix; fall back to a sanitised full id. */
function cameraSuffix(cameraId: string): string {
  const match = /JamCams_0*1?\.(.+)$/i.exec(cameraId);
  if (match && match[1]) return sanitise(match[1]);
  return sanitise(cameraId);
}

function buildJobs(
  matches: CctvMatch[],
  stamp: Timestamp,
  kind: CliFlags["kind"],
): DownloadJob[] {
  const jobs: DownloadJob[] = [];
  for (const m of matches) {
    const locSlug = sanitise(m.location.id);
    const camSuffix = cameraSuffix(m.camera.id);
    // Filename: <YYYYMMDD>_<HHMMSS>__<cam-suffix>.<ext>
    // Folder:   <staging>/<location-id>/
    const baseInFolder = `${stamp.date}_${stamp.time}__${camSuffix}`;
    if ((kind === "image" || kind === "both") && m.camera.imageUrl) {
      jobs.push({
        match: m,
        kind: "image",
        url: m.camera.imageUrl,
        filename: `${locSlug}/${baseInFolder}.jpg`,
        metaFilename: `${locSlug}/${baseInFolder}.jpg.meta.json`,
      });
    }
    if ((kind === "video" || kind === "both") && m.camera.videoUrl) {
      jobs.push({
        match: m,
        kind: "video",
        url: m.camera.videoUrl,
        filename: `${locSlug}/${baseInFolder}.mp4`,
        metaFilename: `${locSlug}/${baseInFolder}.mp4.meta.json`,
      });
    }
  }
  return jobs;
}

// ── Download ──────────────────────────────────────────────────────────────

async function downloadOne(
  job: DownloadJob,
  stagingDir: string,
  dryRun: boolean,
): Promise<Outcome> {
  const path = join(stagingDir, job.filename);
  const metaPath = join(stagingDir, job.metaFilename);
  if (existsSync(path)) {
    return { kind: "skip", reason: "already exists", path };
  }
  if (dryRun) {
    return { kind: "skip", reason: "dry-run", path };
  }
  try {
    const res = await fetch(job.url);
    if (!res.ok) {
      return {
        kind: "fail",
        reason: `${res.status} ${res.statusText}`,
        url: job.url,
      };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buf);
    const sidecar = {
      source: "cctv-tfl",
      kind: job.kind,
      sourceUrl: job.url,
      fetchedAt: new Date().toISOString(),
      bytes: buf.byteLength,
      location: job.match.location,
      camera: job.match.camera,
      distanceMeters: job.match.distanceMeters,
    };
    await writeFile(metaPath, JSON.stringify(sidecar, null, 2), "utf8");
    return { kind: "ok", bytes: buf.byteLength, path };
  } catch (err) {
    return {
      kind: "fail",
      reason: err instanceof Error ? err.message : String(err),
      url: job.url,
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const matchesPath = resolve(flags.matchesPath);
  const stagingDir = resolve(flags.stagingDir);

  const raw = await readFile(matchesPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Matches file ${matchesPath} did not parse to an object`);
  }
  const file = parsed as MatchesFile;
  if (!Array.isArray(file.matches)) {
    throw new Error(`Matches file ${matchesPath} has no .matches array`);
  }

  const stamp = nowStamp();
  const jobs = buildJobs(file.matches, stamp, flags.kind);

  stdout.write(
    `${file.matches.length} matches → ${jobs.length} download jobs (kind=${flags.kind})\n`,
  );
  stdout.write(`Staging dir: ${stagingDir}\n`);
  stdout.write(`Timestamp:   ${stamp.date}_${stamp.time} (UTC)\n`);
  if (flags.dryRun) {
    stdout.write(`\nDry run — would download:\n`);
    for (const job of jobs) {
      stdout.write(
        `  ${job.kind.padEnd(5, " ")}  ${job.filename}  ←  ${job.url}\n`,
      );
    }
    return;
  }

  await mkdir(stagingDir, { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;
  let bytes = 0;
  const outcomes = await runWithConcurrency(
    jobs,
    (job) => downloadOne(job, stagingDir, flags.dryRun),
    flags.concurrency,
  );
  for (let i = 0; i < outcomes.length; i++) {
    const o = outcomes[i]!;
    const job = jobs[i]!;
    if (o.kind === "ok") {
      ok++;
      bytes += o.bytes;
      stdout.write(`  ✓  ${(o.bytes / 1024).toFixed(0).padStart(5)} KB  ${job.filename}\n`);
    } else if (o.kind === "skip") {
      skip++;
      stdout.write(`  ·  skip [${o.reason}]  ${job.filename}\n`);
    } else {
      fail++;
      stderr.write(`  ✗  ${o.reason}  ${job.url}\n`);
    }
  }
  stdout.write(
    `\nDone — ${ok} ok, ${skip} skipped, ${fail} failed, ${(bytes / 1024 / 1024).toFixed(2)} MB total.\nFiles in ${stagingDir}\n`,
  );
}

main().catch((err) => {
  stderr.write(`\nError: ${err instanceof Error ? err.message : String(err)}\n`);
  exit(1);
});
