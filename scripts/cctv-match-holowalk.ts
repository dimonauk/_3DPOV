#!/usr/bin/env tsx
/**
 * cctv-match-holowalk.ts
 *
 * Cross-references the TfL JamCams catalogue against the studio's
 * HoloWalk location catalogue, identifying which CCTV cameras sit
 * within a configurable radius of each photographed kata spot.
 *
 * The matched-camera output is suitable for feeding into cctv-fetch.ts
 * via the --cameras flag, so the studio only pulls frames from
 * cameras that overlook actual HoloWalk locations.
 *
 * Manchester locations are reported as "no public CCTV API" — TfL
 * has no equivalent outside Greater London. Manchester would need a
 * different source (local-authority feed, NWES, or partner contract)
 * to participate in this pipeline.
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-match-holowalk.ts
 *   pnpm exec tsx scripts/cctv-match-holowalk.ts --radius 300
 *   pnpm exec tsx scripts/cctv-match-holowalk.ts --output scripts/cctv-matches.json
 *   pnpm exec tsx scripts/cctv-match-holowalk.ts --fetch  (chains into cctv-fetch.ts)
 *
 * Node built-ins only — fetch (Node 18+), fs/promises, path.
 */

import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { argv, exit, stderr, stdout } from "node:process";

import { listLocations, type SculptureLocation } from "../lib/holo-walk/locations";
import {
  matchCamerasToLocations,
  type CctvMatch,
} from "../lib/cctv/match";
import type { TflJamCam } from "../lib/cctv/tfl";

// Local alias for readability — same shape as CctvMatch from lib/cctv/match.
type Match = CctvMatch;

type CliFlags = {
  radiusMeters: number;
  outputPath: string;
  fetch: boolean;
  verbose: boolean;
};

// ── CLI ────────────────────────────────────────────────────────────────────

function parseFlags(args: string[]): CliFlags {
  let radiusMeters = 250;
  let outputPath = "scripts/cctv-matches.json";
  let fetchFlag = false;
  let verbose = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--radius") {
      const next = args[i + 1];
      if (!next) throw new Error("--radius requires a number (metres)");
      radiusMeters = Number(next);
      if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
        throw new Error("--radius must be a positive number");
      }
      i++;
    } else if (a === "--output") {
      const next = args[i + 1];
      if (!next) throw new Error("--output requires a path");
      outputPath = next;
      i++;
    } else if (a === "--fetch") {
      fetchFlag = true;
    } else if (a === "--verbose" || a === "-v") {
      verbose = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return { radiusMeters, outputPath, fetch: fetchFlag, verbose };
}

function printHelp(): void {
  stdout.write(
    [
      "cctv-match-holowalk — cross-reference TfL JamCams with HoloWalk locations",
      "",
      "Flags:",
      "  --radius <m>     Match radius in metres (default 250)",
      "  --output <path>  Write matches JSON to this path (default scripts/cctv-matches.json)",
      "  --fetch          After matching, run cctv-fetch.ts on the matched camera IDs",
      "  --verbose, -v    Show every location's nearest camera (not just matches)",
      "  --help, -h       This help",
      "",
    ].join("\n"),
  );
}

// ── Geo + TfL helpers (delegated to lib/cctv) ──────────────────────────────

// Locally-defined fetcher (script bypasses Next.js's fetch caching).
async function fetchJamCams(): Promise<TflJamCam[]> {
  const url = "https://api.tfl.gov.uk/Place/Type/JamCam";
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(
      `TfL JamCams fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("Unexpected TfL response shape");
  return json as TflJamCam[];
}

function haversine(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const EARTH_R_M = 6_371_000;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nearestPerLocation(
  cams: TflJamCam[],
  locations: SculptureLocation[],
): Array<{ loc: SculptureLocation; nearest: TflJamCam; distance: number }> {
  const result: Array<{
    loc: SculptureLocation;
    nearest: TflJamCam;
    distance: number;
  }> = [];
  for (const loc of locations) {
    if (loc.city !== "london") continue;
    let best: TflJamCam | null = null;
    let bestD = Infinity;
    for (const cam of cams) {
      if (typeof cam.lat !== "number" || typeof cam.lon !== "number") continue;
      const d = haversine(loc.coords.lat, loc.coords.lon, cam.lat, cam.lon);
      if (d < bestD) {
        bestD = d;
        best = cam;
      }
    }
    if (best) result.push({ loc, nearest: best, distance: bestD });
  }
  return result;
}

// ── Output ─────────────────────────────────────────────────────────────────

function summarise(matches: Match[]): void {
  const byLocation = new Map<string, Match[]>();
  for (const m of matches) {
    const list = byLocation.get(m.location.id) ?? [];
    list.push(m);
    byLocation.set(m.location.id, list);
  }
  stdout.write(`\nMatched ${matches.length} (camera, location) pairs across ${byLocation.size} locations.\n\n`);
  for (const [locId, list] of byLocation) {
    const loc = list[0]!.location;
    stdout.write(`  ${loc.name} (${locId})\n`);
    for (const m of list) {
      stdout.write(
        `    └─ ${Math.round(m.distanceMeters).toString().padStart(4, " ")} m · ${m.camera.id} · ${m.camera.name}\n`,
      );
    }
  }
  stdout.write("\n");
}

function summariseVerbose(
  nearest: Array<{ loc: SculptureLocation; nearest: TflJamCam; distance: number }>,
): void {
  stdout.write("\nNearest TfL JamCam per HoloWalk London location:\n\n");
  for (const n of nearest.sort((a, b) => a.distance - b.distance)) {
    const tag = n.distance < 250 ? "✓" : n.distance < 1000 ? "·" : "✗";
    stdout.write(
      `  ${tag} ${Math.round(n.distance).toString().padStart(5, " ")} m · ${n.loc.name.padEnd(35, " ")} → ${n.nearest.commonName ?? n.nearest.id}\n`,
    );
  }
  stdout.write("\n");
}

async function writeMatchesJson(
  matches: Match[],
  outputPath: string,
): Promise<void> {
  const path = resolve(outputPath);
  const payload = {
    generatedAt: new Date().toISOString(),
    matches,
    cameraIds: Array.from(new Set(matches.map((m) => m.camera.id))),
  };
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
  stdout.write(`Wrote ${matches.length} matches to ${path}\n`);
}

async function chainFetch(cameraIds: string[]): Promise<void> {
  if (cameraIds.length === 0) {
    stderr.write("No matched cameras to fetch.\n");
    return;
  }
  const cmd = "pnpm";
  const args = [
    "exec",
    "tsx",
    "scripts/cctv-fetch.ts",
    "--cameras",
    cameraIds.join(","),
  ];
  stdout.write(`\nFetching ${cameraIds.length} matched cameras…\n`);
  stdout.write(`$ ${cmd} ${args.join(" ")}\n\n`);
  await new Promise<void>((resolveProc, rejectProc) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => {
      if (code === 0) resolveProc();
      else rejectProc(new Error(`cctv-fetch.ts exited with code ${code}`));
    });
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const locations = listLocations();
  const londonCount = locations.filter((l) => l.city === "london").length;
  const manchesterCount = locations.filter((l) => l.city === "manchester").length;

  stdout.write(
    `HoloWalk: ${locations.length} locations (${londonCount} London, ${manchesterCount} Manchester)\n`,
  );
  stdout.write(`Match radius: ${flags.radiusMeters} m\n`);
  stdout.write("Fetching TfL JamCams catalogue…\n");

  const cams = await fetchJamCams();
  stdout.write(`Retrieved ${cams.length} TfL JamCam cameras.\n`);

  const matches = matchCamerasToLocations(cams, locations, flags.radiusMeters);
  summarise(matches);

  if (flags.verbose) {
    const nearest = nearestPerLocation(cams, locations);
    summariseVerbose(nearest);
  }

  await writeMatchesJson(matches, flags.outputPath);

  if (manchesterCount > 0) {
    stdout.write(
      `\nNote: ${manchesterCount} Manchester locations excluded — TfL JamCams only covers Greater London. A separate source is needed for the Manchester half of the catalogue.\n\n`,
    );
  }

  if (flags.fetch) {
    const cameraIds = Array.from(new Set(matches.map((m) => m.camera.id)));
    await chainFetch(cameraIds);
  }
}

main().catch((err) => {
  stderr.write(`\nError: ${err instanceof Error ? err.message : String(err)}\n`);
  exit(1);
});
