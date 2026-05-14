/**
 * scripts/cctv-fetch-save.ts — Image-fetch + sidecar-write + idempotency
 * helpers for cctv-fetch.
 *
 * The studio reviews each staged image manually before SHARP runs;
 * dignity-of-capture rules are handled by the human at review time, not
 * here. This module's only job is: fetch the bytes, hash them, and write
 * the file + sidecar if the hash is new on disk.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stderr, stdout } from "node:process";

import type { Candidate, StagedSidecar } from "./cctv-fetch-types";

function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

export async function readExistingHashes(
  stagingDir: string,
): Promise<Set<string>> {
  const hashes = new Set<string>();
  let entries: string[];
  try {
    entries = await readdir(stagingDir);
  } catch {
    return hashes;
  }
  for (const name of entries) {
    if (!name.endsWith(".meta.json")) continue;
    try {
      const raw = await readFile(join(stagingDir, name), "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { contentHashSha256?: unknown })
          .contentHashSha256 === "string"
      ) {
        hashes.add(
          (parsed as { contentHashSha256: string }).contentHashSha256,
        );
      }
    } catch {
      // Skip unreadable sidecars; we'll just re-fetch if needed.
    }
  }
  return hashes;
}

function sanitiseCameraId(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function isoNowForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function fetchAndSave(
  candidate: Candidate,
  stagingDir: string,
  existingHashes: Set<string>,
  dryRun: boolean,
): Promise<"saved" | "duplicate" | "skipped" | "error"> {
  if (dryRun) {
    stdout.write(`  [dry-run] would fetch ${candidate.imageUrl}\n`);
    return "skipped";
  }
  let res: Response;
  try {
    res = await fetch(candidate.imageUrl);
  } catch (err) {
    stderr.write(
      `  fetch failed for ${candidate.cameraId}: ${(err as Error).message}\n`,
    );
    return "error";
  }
  if (!res.ok) {
    stderr.write(
      `  ${candidate.cameraId}: HTTP ${res.status} ${res.statusText}\n`,
    );
    return "error";
  }
  const arrayBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  if (bytes.byteLength === 0) {
    stderr.write(`  ${candidate.cameraId}: zero-byte response\n`);
    return "error";
  }
  const hash = sha256(bytes);
  if (existingHashes.has(hash)) {
    return "duplicate";
  }
  existingHashes.add(hash);

  const ext = candidate.imageUrl.toLowerCase().endsWith(".png")
    ? ".png"
    : ".jpg";
  const base = `${sanitiseCameraId(candidate.cameraId)}-${isoNowForFilename()}`;
  const imagePath = join(stagingDir, `${base}${ext}`);
  const metaPath = join(stagingDir, `${base}.meta.json`);

  await writeFile(imagePath, bytes);
  const sidecar: StagedSidecar = {
    cameraId: candidate.cameraId,
    sourceUrl: candidate.imageUrl,
    source: candidate.splatSource,
    fetchedAt: new Date().toISOString(),
    lat: candidate.lat,
    lng: candidate.lng,
    label: candidate.label,
    contentHashSha256: hash,
  };
  await writeFile(metaPath, JSON.stringify(sidecar, null, 2) + "\n");
  stdout.write(`  saved ${base}${ext}\n`);
  return "saved";
}
