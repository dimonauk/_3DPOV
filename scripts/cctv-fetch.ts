#!/usr/bin/env tsx
/**
 * cctv-fetch.ts
 *
 * Step 1 of the local SHARP pipeline. Pulls still frames from public
 * CCTV sources (default: TFL JamCams) and writes them to a staging
 * directory for the SHARP runner to chew through next.
 *
 * The studio reviews each staged image manually before SHARP runs;
 * this script makes no judgements about who or what is in frame.
 * Dignity-of-capture rules are handled by the human at review time,
 * not by a heuristic here. (See docs/CCTV_PIPELINE.md.)
 *
 * Run:
 *   pnpm splat:fetch
 *   pnpm exec tsx scripts/cctv-fetch.ts --config scripts/cctv-fetch.config.json
 *   pnpm exec tsx scripts/cctv-fetch.ts --dry-run
 *   pnpm exec tsx scripts/cctv-fetch.ts --cameras JamCams_00001.01251,JamCams_00001.02697
 *
 * No new npm packages. Uses Node built-ins only (fetch, fs/promises,
 * crypto). Requires Node 18+.
 */

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, exit, stderr, stdout } from "node:process";

// --- Types -----------------------------------------------------------------

type FetchSource = {
  /** Stable id for this source — used in filenames. */
  id: string;
  /** Display name for logs. */
  name: string;
  /** Endpoint type. */
  kind: "tfl-jamcam" | "manual-list" | "placeholder";
  /** For tfl-jamcam: the JSON list endpoint. */
  endpoint?: string;
  /** For manual-list: an explicit list of image URLs to pull. */
  urls?: ManualUrl[];
  /** Toggle for the runtime. */
  enabled: boolean;
  /** Free-form note for the example config. */
  notes?: string;
};

type ManualUrl = {
  cameraId: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  label?: string;
};

type Config = {
  stagingDir: string;
  outputDir: string;
  maxImagesPerRun: number;
  sources: FetchSource[];
};

type StagedSidecar = {
  cameraId: string;
  sourceUrl: string;
  source: "cctv-tfl" | "cctv-other" | "manual";
  fetchedAt: string;
  lat?: number;
  lng?: number;
  label?: string;
  contentHashSha256: string;
};

type TflJamCam = {
  id: string;
  commonName?: string;
  lat?: number;
  lon?: number;
  additionalProperties?: Array<{
    key?: string;
    value?: string;
  }>;
};

// --- CLI parsing -----------------------------------------------------------

type CliFlags = {
  configPath: string;
  dryRun: boolean;
  cameraFilter: Set<string> | null;
};

function parseFlags(args: string[]): CliFlags {
  let configPath = "scripts/cctv-fetch.config.json";
  let dryRun = false;
  let cameraFilter: Set<string> | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--config") {
      const next = args[i + 1];
      if (!next) throw new Error("--config requires a path");
      configPath = next;
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--cameras") {
      const next = args[i + 1];
      if (!next) throw new Error("--cameras requires a comma-separated list");
      cameraFilter = new Set(
        next
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      i++;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return { configPath, dryRun, cameraFilter };
}

function printHelp(): void {
  stdout.write(
    [
      "cctv-fetch — pull CCTV stills into staging for SHARP",
      "",
      "Flags:",
      "  --config <path>    Path to JSON config (default scripts/cctv-fetch.config.json)",
      "  --dry-run          List what would be fetched, write nothing",
      "  --cameras <ids>    Comma-separated camera IDs to include (filters)",
      "  --help             This help",
      "",
    ].join("\n"),
  );
}

// --- Config loading --------------------------------------------------------

async function loadConfig(configPath: string): Promise<Config> {
  const text = await readFile(configPath, "utf8");
  const raw: unknown = JSON.parse(text);
  if (!isConfig(raw)) {
    throw new Error(
      `Config at ${configPath} did not match the expected shape.`,
    );
  }
  return raw;
}

function isConfig(x: unknown): x is Config {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.stagingDir === "string" &&
    typeof obj.outputDir === "string" &&
    typeof obj.maxImagesPerRun === "number" &&
    Array.isArray(obj.sources)
  );
}

// --- Hashing & idempotency -------------------------------------------------

function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function readExistingHashes(stagingDir: string): Promise<Set<string>> {
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

// --- Source resolvers ------------------------------------------------------

type Candidate = {
  cameraId: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  label?: string;
  splatSource: "cctv-tfl" | "cctv-other" | "manual";
};

async function resolveTflJamCams(source: FetchSource): Promise<Candidate[]> {
  if (!source.endpoint) {
    throw new Error(`Source ${source.id} (tfl-jamcam) needs an endpoint.`);
  }
  const res = await fetch(source.endpoint);
  if (!res.ok) {
    throw new Error(
      `TFL JamCams endpoint returned ${res.status} ${res.statusText}`,
    );
  }
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error("TFL JamCams response was not an array.");
  }
  const out: Candidate[] = [];
  for (const item of raw as TflJamCam[]) {
    if (!item || typeof item.id !== "string") continue;
    const propList = Array.isArray(item.additionalProperties)
      ? item.additionalProperties
      : [];
    let imageUrl: string | undefined;
    let available = true;
    for (const p of propList) {
      if (!p) continue;
      if (p.key === "imageUrl" && typeof p.value === "string") {
        imageUrl = p.value;
      }
      if (p.key === "available" && typeof p.value === "string") {
        if (p.value.toLowerCase() === "false") available = false;
      }
    }
    if (!imageUrl || !available) continue;
    out.push({
      cameraId: item.id,
      imageUrl,
      lat: typeof item.lat === "number" ? item.lat : undefined,
      lng: typeof item.lon === "number" ? item.lon : undefined,
      label: item.commonName,
      splatSource: "cctv-tfl",
    });
  }
  return out;
}

function resolveManualList(source: FetchSource): Candidate[] {
  const urls = source.urls ?? [];
  return urls.map((u) => ({
    cameraId: u.cameraId,
    imageUrl: u.imageUrl,
    lat: u.lat,
    lng: u.lng,
    label: u.label,
    splatSource: "manual",
  }));
}

async function resolveCandidates(
  source: FetchSource,
): Promise<Candidate[]> {
  switch (source.kind) {
    case "tfl-jamcam":
      return resolveTflJamCams(source);
    case "manual-list":
      return resolveManualList(source);
    case "placeholder":
      return [];
    default:
      stderr.write(`Unknown source kind for ${source.id}, skipping.\n`);
      return [];
  }
}

// --- Fetch & save ----------------------------------------------------------

function sanitiseCameraId(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function isoNowForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function fetchAndSave(
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

// --- Entry point -----------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const here = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(here, "..");
  const configPath = resolve(projectRoot, flags.configPath);

  let config: Config;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    stderr.write(
      `Could not load config at ${configPath}: ${(err as Error).message}\n`,
    );
    stderr.write(
      "Tip: copy scripts/cctv-fetch.config.example.json to scripts/cctv-fetch.config.json and edit it.\n",
    );
    exit(1);
  }

  const stagingDir = resolve(projectRoot, config.stagingDir);
  await mkdir(stagingDir, { recursive: true });

  stdout.write(`cctv-fetch: staging into ${stagingDir}\n`);
  if (flags.dryRun) stdout.write("cctv-fetch: DRY RUN — no files written\n");

  const existingHashes = await readExistingHashes(stagingDir);
  stdout.write(
    `cctv-fetch: ${existingHashes.size} prior frame hash(es) on disk\n`,
  );

  let savedThisRun = 0;
  let duplicates = 0;
  let errors = 0;

  for (const source of config.sources) {
    if (!source.enabled) {
      stdout.write(`- ${source.id}: disabled, skipping\n`);
      continue;
    }
    stdout.write(`- ${source.id} (${source.kind}): resolving\n`);
    let candidates: Candidate[] = [];
    try {
      candidates = await resolveCandidates(source);
    } catch (err) {
      stderr.write(
        `  resolver failed for ${source.id}: ${(err as Error).message}\n`,
      );
      errors++;
      continue;
    }
    if (flags.cameraFilter) {
      candidates = candidates.filter((c) =>
        flags.cameraFilter!.has(c.cameraId),
      );
    }
    stdout.write(`  ${candidates.length} candidate(s) after filter\n`);

    for (const cand of candidates) {
      if (savedThisRun >= config.maxImagesPerRun) {
        stdout.write(
          `  maxImagesPerRun (${config.maxImagesPerRun}) reached, stopping\n`,
        );
        break;
      }
      const outcome = await fetchAndSave(
        cand,
        stagingDir,
        existingHashes,
        flags.dryRun,
      );
      if (outcome === "saved") savedThisRun++;
      else if (outcome === "duplicate") duplicates++;
      else if (outcome === "error") errors++;
    }
    if (savedThisRun >= config.maxImagesPerRun) break;
  }

  stdout.write(
    `\ncctv-fetch: done. saved=${savedThisRun} duplicates=${duplicates} errors=${errors}\n`,
  );
  if (savedThisRun > 0 && !flags.dryRun) {
    stdout.write(`Next: python scripts/sharp-runner.py --staging ${config.stagingDir} --output ${config.outputDir}\n`);
  }
}

main().catch((err: unknown) => {
  stderr.write(`cctv-fetch: fatal — ${(err as Error).message}\n`);
  exit(1);
});
