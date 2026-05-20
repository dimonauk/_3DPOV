/**
 * lib/play/families.ts — Family metadata + catalogue composition +
 * helpers for the GameHub-style /play surface.
 *
 * Direction (Dimona, 2026-05-19): "all nintendo, playstation, xbox
 * systems with gamehub light and such at the top, its all in games".
 *
 * The types and shared constants live in sibling files
 * (`./types.ts`, `./constants.ts`) so the per-family system files
 * under `./systems/` can import them without a circular dependency
 * through this file.
 *
 * Reference (study, don't copy):
 *   - GameHub  https://github.com/tkashkin/GameHub  (GPL-3.0)
 *   - Playnite https://github.com/JosefNemec/Playnite (MIT)
 */

import { NINTENDO_SYSTEMS } from "./systems/nintendo";
import { PLAYSTATION_SYSTEMS } from "./systems/playstation";
import { XBOX_SYSTEMS } from "./systems/xbox";
import { SEGA_SYSTEMS } from "./systems/sega";
import { OTHER_SYSTEMS } from "./systems/other";
import type {
  FamilyMeta,
  LaunchPath,
  PlatformFamily,
  SystemEntry,
} from "./types";

// Re-export the types so external callers only need one import path.
export type {
  FamilyMeta,
  LaunchPath,
  PlatformFamily,
  SystemEntry,
} from "./types";
export { EMU_NATIVE_DOC } from "./constants";

/**
 * Family metadata — order matters; this is the shelf order on /play.
 */
export const FAMILIES: FamilyMeta[] = [
  {
    slug: "nintendo",
    name: "Nintendo",
    tagline: "Eight generations, mostly under one roof.",
    accent: "#e60012",
  },
  {
    slug: "playstation",
    name: "PlayStation",
    tagline: "From the CD-ROM bet to the spatial-audio era.",
    accent: "#003791",
  },
  {
    slug: "xbox",
    name: "Xbox",
    tagline: "The PC family that joined the living room.",
    accent: "#107c10",
  },
  {
    slug: "sega",
    name: "Sega",
    tagline: "The challenger that became a publisher.",
    accent: "#0066cc",
  },
  {
    slug: "other",
    name: "Other",
    tagline: "Atari, NEC, SNK, 3DO — the rest of the canon.",
    accent: "#888888",
  },
];

// ─── Catalogue composition ────────────────────────────────────────

export const SYSTEMS: SystemEntry[] = [
  ...NINTENDO_SYSTEMS,
  ...PLAYSTATION_SYSTEMS,
  ...XBOX_SYSTEMS,
  ...SEGA_SYSTEMS,
  ...OTHER_SYSTEMS,
];

// ─── Helpers ───────────────────────────────────────────────────────

export const FAMILY_SLUGS: ReadonlySet<PlatformFamily> = new Set(
  FAMILIES.map((f) => f.slug),
);

export function isFamilySlug(value: string): value is PlatformFamily {
  return FAMILY_SLUGS.has(value as PlatformFamily);
}

export function getFamily(slug: string): FamilyMeta | undefined {
  return FAMILIES.find((f) => f.slug === slug);
}

export function systemsByFamily(family: PlatformFamily): SystemEntry[] {
  return SYSTEMS.filter((s) => s.family === family).sort(
    (a, b) => a.year - b.year,
  );
}

export function getSystem(slug: string): SystemEntry | undefined {
  return SYSTEMS.find((s) => s.slug === slug);
}

/** Total entries — used in the section opener's edition numeral. */
export function totalSystemCount(): number {
  return SYSTEMS.length;
}

/** First launchable path on a system. Falls back to comingSoon. */
export function primaryLaunch(entry: SystemEntry): LaunchPath {
  return entry.launch[0] ?? { kind: "comingSoon" };
}

/** Human-readable short label for the tile chip. */
export function launchChipLabel(launch: LaunchPath): string {
  switch (launch.kind) {
    case "emulatorjs":
      return "Play in browser";
    case "webxr-retroarch":
      return "Walk in VR";
    case "bench-bridge":
      return `Native · ${launch.emulator}`;
    case "comingSoon":
      return "Coming soon";
  }
}

/** Where the launch chip points. */
export function launchHref(launch: LaunchPath): string | undefined {
  switch (launch.kind) {
    case "emulatorjs":
      return `/emulator/${launch.systemSlug}`;
    case "webxr-retroarch":
      return `/atelier/webxr-retroarch/${launch.systemSlug}`;
    case "bench-bridge":
      return launch.doc;
    case "comingSoon":
      return undefined;
  }
}

/** All launch paths grouped for the "available via" subsection. */
export type LaunchSummary = {
  browser: LaunchPath[];
  vr: LaunchPath[];
  bench: LaunchPath[];
  comingSoon: boolean;
};

export function summariseLaunches(entry: SystemEntry): LaunchSummary {
  const browser = entry.launch.filter((l) => l.kind === "emulatorjs");
  const vr = entry.launch.filter((l) => l.kind === "webxr-retroarch");
  const bench = entry.launch.filter((l) => l.kind === "bench-bridge");
  const comingSoon = entry.launch.some((l) => l.kind === "comingSoon");
  return { browser, vr, bench, comingSoon };
}
