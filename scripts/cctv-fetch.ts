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
 * Pieces live in sibling modules:
 *   - `./cctv-fetch-types`   — Config + Candidate + StagedSidecar + loader
 *   - `./cctv-fetch-sources` — resolveTflJamCams, resolveManualList
 *   - `./cctv-fetch-save`    — readExistingHashes, fetchAndSave
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

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, exit, stderr, stdout } from "node:process";

import { loadConfig, type Candidate, type Config } from "./cctv-fetch-types";
import { resolveCandidates } from "./cctv-fetch-sources";
import { fetchAndSave, readExistingHashes } from "./cctv-fetch-save";

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
    stdout.write(
      `Next: python scripts/sharp-runner.py --staging ${config.stagingDir} --output ${config.outputDir}\n`,
    );
  }
}

main().catch((err: unknown) => {
  stderr.write(`cctv-fetch: fatal — ${(err as Error).message}\n`);
  exit(1);
});
