#!/usr/bin/env tsx
/**
 * cctv-mesh-batch.ts
 *
 * Mirror of cctv-sharp-batch.ts but routed at the mesh service
 * (python-services/mesh_service.py — InstantMesh wrapper). Walks
 * scripts/cctv-staging/<location-id>/*.jpg, submits each to the mesh
 * service, polls until done, and downloads the resulting .glb next
 * to the source frame. Sidecar .mesh.meta.json carries the job id +
 * duration + any failure state.
 *
 * The mesh service runs InstantMesh, which is Apache-2.0 licensed —
 * the commercially-safe path for the studio's print-bar. SHARP path
 * (cctv-sharp-batch.ts) remains the R&D / archive path.
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-mesh-batch.ts
 *   pnpm exec tsx scripts/cctv-mesh-batch.ts --service http://3080ti.local:7844
 *   pnpm exec tsx scripts/cctv-mesh-batch.ts --limit 5
 *   pnpm exec tsx scripts/cctv-mesh-batch.ts --dry-run
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { argv, env, exit, stderr, stdout } from "node:process";

// ── Config ─────────────────────────────────────────────────────────────────

type CliFlags = {
  stagingDir: string;
  serviceUrl: string;
  perLocationLimit: number | null;
  dryRun: boolean;
  pollIntervalMs: number;
};

function parseFlags(args: string[]): CliFlags {
  let stagingDir = "scripts/cctv-staging";
  let serviceUrl = env.MESH_SERVICE_URL ?? "http://localhost:7844";
  let perLocationLimit: number | null = null;
  let dryRun = false;
  let pollIntervalMs = 4000;
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
    } else if (a === "--limit") {
      const next = args[i + 1];
      if (!next) throw new Error("--limit requires a number");
      perLocationLimit = Math.max(1, Number(next));
      i++;
    } else if (a === "--poll-interval-ms") {
      const next = args[i + 1];
      if (!next) throw new Error("--poll-interval-ms requires a number");
      pollIntervalMs = Math.max(500, Number(next));
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return { stagingDir, serviceUrl, perLocationLimit, dryRun, pollIntervalMs };
}

function printHelp(): void {
  stdout.write(
    [
      "cctv-mesh-batch — submit staged CCTV stills to InstantMesh, download .glb meshes",
      "",
      "Flags:",
      "  --staging <path>        Staged stills root (default scripts/cctv-staging)",
      "  --service <url>         Mesh service URL (default $MESH_SERVICE_URL or http://localhost:7844)",
      "  --limit <n>             Per-location max frames to process",
      "  --poll-interval-ms <n>  Polling cadence (default 4000)",
      "  --dry-run               List intended jobs, no submissions",
      "  --help, -h              This help",
      "",
    ].join("\n"),
  );
}

// ── Mesh service REST client ──────────────────────────────────────────────

type MeshStatus =
  | { state: "queued"; positionInQueue: number; submittedAt: string }
  | { state: "running"; progressPct: number; etaSeconds: number | null }
  | {
      state: "done";
      resultUrl: string;
      format: "glb";
      sizeBytes: number;
      durationSeconds: number;
    }
  | { state: "error"; message: string; code?: string }
  | { state: "cancelled" };

async function isServiceUp(serviceUrl: string): Promise<{
  ok: boolean;
  version?: string;
  queueDepth?: number;
  gpuAvailable?: boolean;
  config?: string;
  reason?: string;
}> {
  try {
    const res = await fetch(`${serviceUrl}/health`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, reason: `${res.status} ${res.statusText}` };
    const body = (await res.json()) as {
      status?: string;
      version?: string;
      queue_depth?: number;
      gpu_available?: boolean;
      config?: string;
    };
    return {
      ok: body.status === "ok",
      version: body.version,
      queueDepth: body.queue_depth,
      gpuAvailable: body.gpu_available,
      config: body.config,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

async function submitJob(
  serviceUrl: string,
  imagePath: string,
  meta: Record<string, unknown>,
): Promise<string> {
  const buf = await readFile(imagePath);
  const blob = new Blob([buf], { type: "image/jpeg" });
  const form = new FormData();
  form.append("image", blob, imagePath.split(/[\\/]/).pop() ?? "image.jpg");
  form.append("meta", JSON.stringify(meta));
  const res = await fetch(`${serviceUrl}/jobs`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `submit failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`,
    );
  }
  const body = (await res.json()) as { jobId?: unknown };
  if (typeof body.jobId !== "string") {
    throw new Error("submit response missing jobId");
  }
  return body.jobId;
}

async function pollJob(serviceUrl: string, jobId: string): Promise<MeshStatus> {
  const res = await fetch(
    `${serviceUrl}/jobs/${encodeURIComponent(jobId)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) {
    return {
      state: "error",
      message: `poll failed ${res.status}`,
      code: "POLL_FAILED",
    };
  }
  return (await res.json()) as MeshStatus;
}

async function downloadResult(
  serviceUrl: string,
  jobId: string,
  destPath: string,
): Promise<number> {
  const res = await fetch(
    `${serviceUrl}/jobs/${encodeURIComponent(jobId)}/result`,
  );
  if (!res.ok) {
    throw new Error(`result download failed: ${res.status} ${res.statusText}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.byteLength;
}

async function waitForCompletion(
  serviceUrl: string,
  jobId: string,
  pollIntervalMs: number,
  onProgress: (s: MeshStatus) => void,
): Promise<MeshStatus> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const s = await pollJob(serviceUrl, jobId);
    onProgress(s);
    if (s.state === "done" || s.state === "error" || s.state === "cancelled") {
      return s;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}

// ── Walking the staging tree ───────────────────────────────────────────────

type FrameJob = {
  imagePath: string;
  locationId: string;
  basename: string;
  metaPath: string;
  resultPath: string;
};

async function walkFrames(
  stagingDir: string,
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
        resultPath: join(locDir, `${base}.glb`),
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

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const stagingDir = resolve(flags.stagingDir);

  stdout.write(`Mesh service: ${flags.serviceUrl}\n`);
  const health = await isServiceUp(flags.serviceUrl);
  if (!health.ok) {
    stderr.write(
      `\nMesh service unreachable — ${health.reason ?? "unknown reason"}.\n`,
    );
    stderr.write(
      `\nStart the bench on the 3080 Ti machine and re-run:\n` +
        `  conda activate instantmesh\n` +
        `  cd D:\\.github\\_3DPOV\\python-services\n` +
        `  uvicorn mesh_service:app --host 0.0.0.0 --port 7844\n\n`,
    );
    exit(2);
  }
  stdout.write(
    `Service OK · v${health.version ?? "?"} · queue ${health.queueDepth ?? 0} · GPU ${health.gpuAvailable ? "yes" : "no"} · config ${health.config ?? "?"}\n`,
  );

  const stagingStat = await stat(stagingDir).catch(() => null);
  if (!stagingStat || !stagingStat.isDirectory()) {
    stderr.write(`Staging directory not found: ${stagingDir}\n`);
    exit(1);
  }

  const allJobs = await walkFrames(stagingDir, flags.perLocationLimit);
  const todo = allJobs.filter((j) => !existsSync(j.resultPath));
  const skipped = allJobs.length - todo.length;
  stdout.write(
    `\n${allJobs.length} frames found · ${todo.length} to process · ${skipped} already have .glb results\n`,
  );

  if (flags.dryRun) {
    stdout.write(`\nDry run — would submit:\n`);
    for (const j of todo) {
      stdout.write(
        `  ${relative(stagingDir, j.imagePath)} → ${relative(stagingDir, j.resultPath)}\n`,
      );
    }
    return;
  }

  let ok = 0;
  let fail = 0;
  let totalBytes = 0;
  for (const job of todo) {
    const sidecar = await readSidecar(job.metaPath);
    stdout.write(
      `\n[${ok + fail + 1}/${todo.length}] ${job.locationId}/${job.basename}.jpg\n`,
    );
    let jobId: string;
    try {
      jobId = await submitJob(flags.serviceUrl, job.imagePath, {
        title: job.basename,
        locationId: job.locationId,
        sourceSidecar: sidecar,
      });
      stdout.write(`  submitted · jobId ${jobId}\n`);
    } catch (err) {
      fail++;
      stderr.write(
        `  submit failed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      continue;
    }

    const final = await waitForCompletion(
      flags.serviceUrl,
      jobId,
      flags.pollIntervalMs,
      (s) => {
        if (s.state === "queued")
          stdout.write(`  queued · position ${s.positionInQueue}\r`);
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
      await writeFile(
        job.imagePath + ".mesh.meta.json",
        JSON.stringify(
          {
            meshJobId: jobId,
            state: final.state,
            error: final.state === "error" ? final.message : undefined,
            recordedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        "utf8",
      );
      continue;
    }

    try {
      const bytes = await downloadResult(
        flags.serviceUrl,
        jobId,
        job.resultPath,
      );
      totalBytes += bytes;
      ok++;
      stdout.write(
        `  ✓ ${(bytes / 1024).toFixed(0)} KB · ${relative(stagingDir, job.resultPath)}\n`,
      );
      await writeFile(
        job.imagePath + ".mesh.meta.json",
        JSON.stringify(
          {
            meshJobId: jobId,
            state: "done",
            durationSeconds: final.durationSeconds,
            format: final.format,
            sizeBytes: bytes,
            recordedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
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
    `\nDone — ${ok} ok, ${fail} failed, ${skipped} skipped, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.\n`,
  );
}

main().catch((err) => {
  stderr.write(
    `\nError: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  exit(1);
});
