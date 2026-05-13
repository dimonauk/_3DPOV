#!/usr/bin/env tsx
/**
 * register-splat.ts
 *
 * Step 3 of the local SHARP pipeline. Picks up freshly-generated .ply
 * files from the SHARP output directory and registers them on the
 * site:
 *
 *   1. Copies the .ply into public/splats/{slug}.ply
 *   2. Writes / updates an entry in data/neo-london/zones.json that
 *      conforms to the SplatZone type defined in
 *      lib/neo-london/types.ts (which this script imports only as a
 *      reference — it does not mutate that file).
 *   3. Prints the git commands the studio should run next. We never
 *      auto-commit; the studio reviews zones.json (and the imagery
 *      that produced it) before anything goes public.
 *
 * Run:
 *   pnpm splat:register
 *   pnpm exec tsx scripts/register-splat.ts --output ./tmp/splats \
 *       --ply campsite-2026-05-13.ply \
 *       --slug camden-lock-jamcam \
 *       --name "Camden Lock (TFL JamCam)" \
 *       --notes "Traffic feed grab, 13 May 2026"
 *   pnpm exec tsx scripts/register-splat.ts --output ./tmp/splats --batch
 *
 * No new npm packages.
 */

import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, exit, stderr, stdout } from "node:process";

// --- Types (mirrored from lib/neo-london/types.ts) -------------------------
// We intentionally do not import from lib/* because this is a CLI
// script and the project's tsconfig.json defaults to ESNext modules
// without resolver hooks for tsx; mirroring the shape keeps the
// script self-contained. If lib/neo-london/types.ts changes, update
// here to match.

type SplatSource =
  | "archive-360"
  | "cctv-tfl"
  | "cctv-other"
  | "manual";

type SplatStatus =
  | "placeholder"
  | "frame-captured"
  | "splat-rendered"
  | "mesh-added"
  | "playable";

type SplatZone = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  source: SplatSource;
  sourceFrame?: string;
  plyUrl: string | null;
  meshUrl?: string;
  capturedAt: string;
  splatGeneratedAt?: string;
  sharpVersion?: string;
  notes: string;
  status: SplatStatus;
};

// --- Sidecars produced upstream --------------------------------------------

type SharpSidecar = {
  sourceImage: string;
  sourceImageBasename: string;
  sharpVersion: string;
  runtimeSeconds: number;
  generatedAt: string;
  splatPointCount: number | null;
};

type StagedSidecar = {
  cameraId: string;
  sourceUrl: string;
  source: SplatSource;
  fetchedAt: string;
  lat?: number;
  lng?: number;
  label?: string;
  contentHashSha256: string;
};

// --- CLI -------------------------------------------------------------------

type CliFlags = {
  outputDir: string;
  publicDir: string;
  zonesPath: string;
  batch: boolean;
  ply: string | null;
  slug: string | null;
  name: string | null;
  notes: string | null;
  source: SplatSource | null;
  dryRun: boolean;
};

function parseFlags(args: string[]): CliFlags {
  const flags: CliFlags = {
    outputDir: "tmp/splats",
    publicDir: "public/splats",
    zonesPath: "data/neo-london/zones.json",
    batch: false,
    ply: null,
    slug: null,
    name: null,
    notes: null,
    source: null,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--output") {
      flags.outputDir = requireNext(args, i, "--output");
      i++;
    } else if (a === "--public") {
      flags.publicDir = requireNext(args, i, "--public");
      i++;
    } else if (a === "--zones") {
      flags.zonesPath = requireNext(args, i, "--zones");
      i++;
    } else if (a === "--batch") {
      flags.batch = true;
    } else if (a === "--dry-run") {
      flags.dryRun = true;
    } else if (a === "--ply") {
      flags.ply = requireNext(args, i, "--ply");
      i++;
    } else if (a === "--slug") {
      flags.slug = requireNext(args, i, "--slug");
      i++;
    } else if (a === "--name") {
      flags.name = requireNext(args, i, "--name");
      i++;
    } else if (a === "--notes") {
      flags.notes = requireNext(args, i, "--notes");
      i++;
    } else if (a === "--source") {
      const v = requireNext(args, i, "--source");
      if (
        v === "archive-360" ||
        v === "cctv-tfl" ||
        v === "cctv-other" ||
        v === "manual"
      ) {
        flags.source = v;
      } else {
        throw new Error(`Unknown --source ${v}`);
      }
      i++;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return flags;
}

function requireNext(args: string[], i: number, name: string): string {
  const next = args[i + 1];
  if (!next) throw new Error(`${name} requires a value`);
  return next;
}

function printHelp(): void {
  stdout.write(
    [
      "register-splat — copy .ply files into public/splats and update zones.json",
      "",
      "Flags:",
      "  --output <dir>    SHARP output directory (default tmp/splats)",
      "  --public <dir>    Destination for .ply (default public/splats)",
      "  --zones <path>    Zones JSON (default data/neo-london/zones.json)",
      "  --batch           Register every unregistered .ply in --output",
      "  --dry-run         Show what would happen, write nothing",
      "  --ply <file>      Single-file mode: register this .ply only",
      "  --slug <slug>     Slug to register under",
      "  --name <name>     Display name",
      "  --notes <text>    Notes line for the zone",
      "  --source <kind>   archive-360 | cctv-tfl | cctv-other | manual",
      "  --help            This help",
      "",
    ].join("\n"),
  );
}

// --- Helpers ---------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.ply$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(s);
}

async function readJsonIfPresent<T>(path: string): Promise<T | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function readZones(zonesPath: string): Promise<SplatZone[]> {
  const data = await readJsonIfPresent<SplatZone[]>(zonesPath);
  if (!data) return [];
  if (!Array.isArray(data)) {
    throw new Error(`${zonesPath} is not a JSON array.`);
  }
  return data;
}

async function writeZones(
  zonesPath: string,
  zones: SplatZone[],
): Promise<void> {
  const sorted = [...zones].sort((a, b) => a.slug.localeCompare(b.slug));
  await writeFile(zonesPath, JSON.stringify(sorted, null, 2) + "\n");
}

// --- Lookup helpers --------------------------------------------------------

async function findStagedSidecar(
  basename: string,
  outputDir: string,
): Promise<StagedSidecar | null> {
  // SHARP's sidecar records the source image path; we re-derive the
  // staged sidecar by stem.
  // The staged sidecar lives next to the source image, usually under
  // tmp/staging — but we read it via the sharp sidecar's sourceImage
  // field which carries an absolute path.
  const sharpSidecarPath = join(outputDir, basename.replace(/\.ply$/i, ".meta.json"));
  const sharp = await readJsonIfPresent<SharpSidecar>(sharpSidecarPath);
  if (!sharp) return null;
  const sourceImageMeta = sharp.sourceImage
    .replace(/\.(jpg|jpeg|png)$/i, ".meta.json");
  return await readJsonIfPresent<StagedSidecar>(sourceImageMeta);
}

async function readSharpSidecar(
  plyPath: string,
): Promise<SharpSidecar | null> {
  return await readJsonIfPresent<SharpSidecar>(
    plyPath.replace(/\.ply$/i, ".meta.json"),
  );
}

// --- Registration core -----------------------------------------------------

type RegisterArgs = {
  plyAbsPath: string;
  publicDirAbs: string;
  zones: SplatZone[];
  slug: string;
  name: string;
  notes: string;
  source: SplatSource;
  lat: number;
  lng: number;
  capturedAt: string;
  sharpVersion: string;
  splatGeneratedAt: string;
  sourceFrame?: string;
  dryRun: boolean;
};

async function registerOne(args: RegisterArgs): Promise<{
  zones: SplatZone[];
  copied: string;
}> {
  const plyDest = join(args.publicDirAbs, `${args.slug}.ply`);
  if (!args.dryRun) {
    await mkdir(args.publicDirAbs, { recursive: true });
    await copyFile(args.plyAbsPath, plyDest);
  }
  const existingIdx = args.zones.findIndex((z) => z.slug === args.slug);
  const next: SplatZone = {
    slug: args.slug,
    name: args.name,
    lat: args.lat,
    lng: args.lng,
    source: args.source,
    sourceFrame: args.sourceFrame,
    plyUrl: `/splats/${args.slug}.ply`,
    capturedAt: args.capturedAt,
    splatGeneratedAt: args.splatGeneratedAt,
    sharpVersion: args.sharpVersion,
    notes: args.notes,
    status: "splat-rendered",
  };
  const updated =
    existingIdx >= 0
      ? args.zones.map((z, i) => (i === existingIdx ? { ...z, ...next } : z))
      : [...args.zones, next];
  return { zones: updated, copied: plyDest };
}

// --- Entry point -----------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const here = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(here, "..");
  const outputDir = resolve(projectRoot, flags.outputDir);
  const publicDir = resolve(projectRoot, flags.publicDir);
  const zonesPath = resolve(projectRoot, flags.zonesPath);

  let entries: string[];
  try {
    entries = await readdir(outputDir);
  } catch (err) {
    stderr.write(
      `register-splat: cannot read --output ${outputDir}: ${(err as Error).message}\n`,
    );
    exit(1);
    return;
  }

  let plyFiles = entries.filter((n) => n.toLowerCase().endsWith(".ply"));
  if (flags.ply) {
    plyFiles = plyFiles.filter((n) => n === flags.ply);
    if (plyFiles.length === 0) {
      stderr.write(`register-splat: --ply ${flags.ply} not found in ${outputDir}\n`);
      exit(1);
      return;
    }
  }

  if (!flags.batch && !flags.ply) {
    stderr.write(
      "register-splat: pass --batch to register everything, or --ply <file> for one.\n",
    );
    exit(1);
    return;
  }

  let zones = await readZones(zonesPath);
  const alreadyRegisteredPlys = new Set(
    zones
      .map((z) => z.plyUrl)
      .filter((u): u is string => typeof u === "string")
      .map((u) => u.replace(/^\/splats\//, "")),
  );

  const registeredThisRun: SplatZone[] = [];
  const skipped: string[] = [];

  for (const ply of plyFiles) {
    const plyAbs = join(outputDir, ply);
    const sharpMeta = await readSharpSidecar(plyAbs);
    const stagedMeta = await findStagedSidecar(ply, outputDir);

    const baseStem = ply.replace(/\.ply$/i, "");

    let slug: string;
    if (flags.slug && (flags.ply === ply || plyFiles.length === 1)) {
      slug = slugify(flags.slug);
    } else if (stagedMeta?.cameraId) {
      slug = slugify(
        `${stagedMeta.cameraId}-${stagedMeta.fetchedAt.slice(0, 10)}`,
      );
    } else {
      slug = slugify(baseStem);
    }

    if (alreadyRegisteredPlys.has(`${slug}.ply`) && !flags.ply) {
      skipped.push(`${ply} -> /splats/${slug}.ply (already registered)`);
      continue;
    }

    const name =
      flags.name ??
      stagedMeta?.label ??
      slug.replace(/-/g, " ");

    const source: SplatSource =
      flags.source ??
      stagedMeta?.source ??
      "manual";

    const composedNotes =
      [
        stagedMeta?.label,
        stagedMeta?.cameraId
          ? `Source camera ${stagedMeta.cameraId}${
              source === "cctv-tfl" ? " (TFL JamCams — attribution required)" : ""
            }.`
          : null,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
    const notes =
      flags.notes ??
      (composedNotes !== ""
        ? composedNotes
        : "Auto-registered from SHARP batch. Review and edit before commit.");

    const lat = stagedMeta?.lat ?? 0;
    const lng = stagedMeta?.lng ?? 0;
    if ((lat === 0 && lng === 0) && !flags.ply) {
      stderr.write(
        `  warning: ${ply} has no lat/lng in staged sidecar; defaulted to 0,0 — edit zones.json before commit.\n`,
      );
    }

    const capturedAt =
      stagedMeta?.fetchedAt && isISODate(stagedMeta.fetchedAt)
        ? stagedMeta.fetchedAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    const splatGeneratedAt =
      sharpMeta?.generatedAt ?? new Date().toISOString();
    const sharpVersion = sharpMeta?.sharpVersion ?? "unknown";

    const { zones: nextZones, copied } = await registerOne({
      plyAbsPath: plyAbs,
      publicDirAbs: publicDir,
      zones,
      slug,
      name,
      notes,
      source,
      lat,
      lng,
      capturedAt,
      sharpVersion,
      splatGeneratedAt,
      sourceFrame: stagedMeta?.sourceUrl,
      dryRun: flags.dryRun,
    });
    zones = nextZones;
    const registered = zones.find((z) => z.slug === slug);
    if (registered) registeredThisRun.push(registered);
    stdout.write(
      `  ${flags.dryRun ? "[dry-run] " : ""}${ply} -> ${copied}\n`,
    );
  }

  if (!flags.dryRun && registeredThisRun.length > 0) {
    await writeZones(zonesPath, zones);
  }

  stdout.write(
    `\nregister-splat: registered=${registeredThisRun.length} skipped=${skipped.length}\n`,
  );
  for (const s of skipped) stdout.write(`  skipped: ${s}\n`);

  if (registeredThisRun.length > 0) {
    stdout.write("\nReview the new entries in data/neo-london/zones.json, then:\n");
    const filesToAdd = [
      "data/neo-london/zones.json",
      ...registeredThisRun.map((z) => `public/splats/${z.slug}.ply`),
    ];
    stdout.write(`  git add ${filesToAdd.join(" ")}\n`);
    stdout.write(
      `  git commit -m "splats: register ${registeredThisRun
        .map((z) => z.slug)
        .join(", ")}"\n`,
    );
    stdout.write("  git push  # triggers the Vercel build\n");
  }
}

main().catch((err: unknown) => {
  stderr.write(`register-splat: fatal — ${(err as Error).message}\n`);
  exit(1);
});
