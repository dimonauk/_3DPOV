#!/usr/bin/env tsx
/**
 * cctv-sharp-batch.ts
 *
 * Walks the staged CCTV stills (scripts/cctv-staging/<loc>/*.jpg),
 * submits each one to the studio's local SHARP service (the
 * python-services/sharp_service.py FastAPI wrapper), polls until
 * done, and downloads the resulting .ply gaussian-splat next to
 * the source frame. Sidecar `.sharp.meta.json` records the SHARP
 * job id, durations, and any failure reason.
 *
 * The REST client lives in `./cctv-sharp-client.ts`.
 *
 * The SHARP service must be running on the studio's 3080 Ti
 * machine. Default URL: http://localhost:7842 (override via
 * SHARP_SERVICE_URL env). When the service is offline this script
 * reports it and exits cleanly — no half-submitted jobs.
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts --staging scripts/cctv-staging
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts --service http://3080ti.local:7842
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts --format spz
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts --limit 5  (per-location cap)
 *   pnpm exec tsx scripts/cctv-sharp-batch.ts --dry-run
 *
 * Idempotent on filename — re-running skips frames whose .ply
 * (or .spz) result already exists next to the source.
 */

import { existsSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { argv, env, exit, stderr, stdout } from "node:process";

import {
  downloadResult,
  isServiceUp,
  submitJob,
  waitForCompletion,
} from "./cctv-sharp-client";

type CliFlags = {
  stagingDir: string;
  serviceUrl: string;
  format: "ply" | "spz";
  perLocationLimit: number | null;
  dryRun: boolean;
  pollIntervalMs: number;
};

function parseFlags(args: string[]): CliFlags {
  let stagingDir = "scripts/cctv-staging";
  let serviceUrl = env.SHARP_SERVICE_URL ?? "http://localhost:7842";
  let format: CliFlags["format"] = "ply";
  let perLocationLimit: number | null = null;
  let dryRun = false;
  let pollIntervalMs = 3000;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--staging") {
      const next = args[i + 1];
      if (!next) throw new Error("--staging requires a path");
      stagingDir = next;
      i++;
    } else if (a === "--service") {
      const next = args[i + 1];
      if (!next) throw new Error("--service requires a URL");
      serviceUrl = next;
      i++;
    } else if (a === "--format") {
      const next = args[i + 1];
      if (next !== "ply" && next !== "spz") {
        throw new Error("--format must be ply | spz");
      }
      format = next;
      i++;
    } else if (a === "--limit") {
      const next = args[i + 1];
      if (!next) throw new Error("--limit requires a number");
      perLocationLimit = Math.max(1, Number(next));
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--poll-interval-ms") {
      const next = args[i + 1];
      if (!next) throw new Error("--poll-interval-ms requires a number");
      pollIntervalMs = Math.max(500, Number(next));
      i++;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return {
    stagingDir,
    serviceUrl,
    format,
    perLocationLimit,
    dryRun,
    pollIntervalMs,
  };
}

function printHelp(): void {
  stdout.write(
    [
      "cctv-sharp-batch — submit staged CCTV stills to SHARP, download .ply / .spz results",
      "",
      "Flags:",
      "  --staging <path>        Staged stills root (default scripts/cctv-staging)",
      "  --service <url>         SHARP base URL (default $SHARP_SERVICE_URL or http://localhost:7842)",
      "  --format ply|spz        Output format (default ply)",
      "  --limit <n>             Per-location max frames to process",
      "  --poll-interval-ms <n>  Polling cadence (default 3000)",
      "  --dry-run               List intended jobs, no submissions",
      "  --help, -h              This help",
      "",
    ].join("\n"),
  );
}

type FrameJob = {
  imagePath: string;
  locationId: string;
  basename: string;
  metaPath: string;
  resultPath: string;
};

async function walkFrames(
  stagingDir: string,
  format: "ply" | "spz",
  perLocationLimit: number | null,
): Promise<FrameJob[]> {
  const entries = await readdir(stagingDir, { withFileTypes: true });
  const jobs: FrameJob[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const locDir = join(stagingDir, entry.name);
    const files = (await readdir(locDir)).filter((f) =>
      f.toLowerCase().endsWith(".jpg"),
    );
    files.sort();
    const limited = perLocationLimit ? files.slice(0, perLocationLimit) : files;
    for (const f of limited) {
      const base = f.replace(/\.jpg$/i, "");
      jobs.push({
        imagePath: join(locDir, f),
        locationId: entry.name,
        basename: base,
        metaPath: join(locDir, `${f}.meta.json`),
        resultPath: join(locDir, `${base}.${format}`),
      });
    }
  }
  return jobs;
}

async function readSidecar(
  metaPath: string,
): Promise<Record<string, unknown> | null> {
  if (!existsSync(metaPath)) return null;
  try {
    const raw = await readFile(metaPath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const stagingDir = resolve(flags.stagingDir);

  stdout.write(`SHARP service: ${flags.serviceUrl}\n`);
  const health = await isServiceUp(flags.serviceUrl);
  if (!health.ok) {
    stderr.write(
      `\nSHARP service unreachable — ${health.reason ?? "unknown reason"}.\n`,
    );
    stderr.write(
      `\nStart the bench on the 3080 Ti machine and re-run:\n` +
        `  cd D:\\.github\\_3DPOV\\python-services\n` +
        `  uvicorn sharp_service:app --host 0.0.0.0 --port 7842\n\n`,
    );
    exit(2);
  }
  stdout.write(
    `Service OK · version ${health.version ?? "?"} · queue depth ${health.queueDepth ?? 0} · GPU ${health.gpuAvailable ? "yes" : "no"}\n`,
  );

  const stagingStat = await stat(stagingDir).catch(() => null);
  if (!stagingStat || !stagingStat.isDirectory()) {
    stderr.write(`Staging directory not found: ${stagingDir}\n`);
    exit(1);
  }

  const allJobs = await walkFrames(
    stagingDir,
    flags.format,
    flags.perLocationLimit,
  );
  const todo = allJobs.filter((j) => !existsSync(j.resultPath));
  const skipped = allJobs.length - todo.length;
  stdout.write(
    `\n${allJobs.length} frames found · ${todo.length} to process · ${skipped} already have ${flags.format} results\n`,
  );

  if (flags.dryRun) {
    stdout.write(`\nDry run — would submit:\n`);
    for (const j of todo) {
      stdout.write(`  ${relative(stagingDir, j.imagePath)} → ${relative(stagingDir, j.resultPath)}\n`);
    }
    return;
  }

  let ok = 0;
  let fail = 0;
  let totalBytes = 0;
  for (const job of todo) {
    const sidecar = await readSidecar(job.metaPath);
    stdout.write(`\n[${ok + fail + 1}/${todo.length}] ${job.locationId}/${job.basename}.jpg\n`);
    let jobId: string;
    try {
      jobId = await submitJob(
        flags.serviceUrl,
        job.imagePath,
        {
          title: job.basename,
          locationId: job.locationId,
          photographSlug: sidecar?.["location"]
            ? (sidecar["location"] as { id?: string }).id
            : null,
          sourceSidecar: sidecar,
        },
        flags.format,
      );
      stdout.write(`  submitted · jobId ${jobId}\n`);
    } catch (err) {
      fail++;
      stderr.write(`  submit failed: ${err instanceof Error ? err.message : String(err)}\n`);
      continue;
    }

    const final = await waitForCompletion(
      flags.serviceUrl,
      jobId,
      flags.pollIntervalMs,
      (s) => {
        if (s.state === "queued") stdout.write(`  queued · position ${s.positionInQueue}\r`);
        else if (s.state === "running")
          stdout.write(`  running · ${s.progressPct.toFixed(0)}%\r`);
      },
    );
    stdout.write("\n");

    if (final.state !== "done") {
      fail++;
      stderr.write(
        `  ${final.state}${final.state === "error" ? `: ${final.message}` : ""}\n`,
      );
      const failMeta = {
        sharpJobId: jobId,
        state: final.state,
        error: final.state === "error" ? final.message : undefined,
        recordedAt: new Date().toISOString(),
      };
      await writeFile(
        job.imagePath + ".sharp.meta.json",
        JSON.stringify(failMeta, null, 2),
        "utf8",
      );
      continue;
    }

    try {
      const bytes = await downloadResult(flags.serviceUrl, jobId, job.resultPath);
      totalBytes += bytes;
      ok++;
      stdout.write(`  ✓ ${(bytes / 1024).toFixed(0)} KB · ${relative(stagingDir, job.resultPath)}\n`);
      const okMeta = {
        sharpJobId: jobId,
        state: "done",
        durationSeconds: final.durationSeconds,
        format: final.format,
        sizeBytes: bytes,
        recordedAt: new Date().toISOString(),
      };
      await writeFile(
        job.imagePath + ".sharp.meta.json",
        JSON.stringify(okMeta, null, 2),
        "utf8",
      );
    } catch (err) {
      fail++;
      stderr.write(
        `  download failed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }

  stdout.write(
    `\nDone — ${ok} ok, ${fail} failed, ${skipped} skipped (already done), ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.\n`,
  );
}

main().catch((err) => {
  stderr.write(`\nError: ${err instanceof Error ? err.message : String(err)}\n`);
  exit(1);
});
