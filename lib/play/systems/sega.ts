/**
 * lib/play/systems/sega.ts — Sega family entries for /play.
 * Split out of families.ts to keep each file under the 300-line cap.
 *
 * Years verified against Wikipedia 2026-05-19 (first market launch —
 * Mega Drive uses the 1988 Japan date; Genesis was 1989 US; Mega
 * Drive Europe was 1990).
 */

import { EMU_NATIVE_DOC, type SystemEntry } from "../families";

export const SEGA_SYSTEMS: SystemEntry[] = [
  {
    slug: "master-system",
    name: "Sega Master System",
    shortName: "Master System",
    year: 1985,
    generation: 3,
    family: "sega",
    manufacturer: "Sega",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "segams" },
      { kind: "emulatorjs", systemSlug: "segams" },
    ],
    blurb:
      "Sega's eight-bit answer to the NES — sold harder in Europe and Brazil than at home in Japan or the US.",
  },
  {
    slug: "mega-drive",
    name: "Sega Mega Drive",
    shortName: "Mega Drive",
    year: 1988,
    generation: 4,
    family: "sega",
    manufacturer: "Sega",
    modelUrl: "/models/devices/consoles/mega-drive.glb",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "segamd" },
      { kind: "emulatorjs", systemSlug: "segamd" },
    ],
    blurb:
      "Matte black, gold band, the first console that printed 'BLAST PROCESSING' on its own packaging.",
  },
  {
    slug: "game-gear",
    name: "Sega Game Gear",
    shortName: "Game Gear",
    year: 1990,
    generation: 4,
    family: "sega",
    manufacturer: "Sega",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "segagg" },
      { kind: "emulatorjs", systemSlug: "segagg" },
    ],
    blurb:
      "Landscape colour LCD handheld with the famous six-AA battery drain — beautiful screen, six hours, that was the trade.",
  },
  {
    slug: "saturn",
    name: "Sega Saturn",
    shortName: "Saturn",
    year: 1994,
    generation: 5,
    family: "sega",
    manufacturer: "Sega",
    launch: [{ kind: "emulatorjs", systemSlug: "segasaturn" }],
    blurb:
      "Two CPUs, two video chips, the dual-architecture machine that asked every developer to write to it twice.",
  },
  {
    slug: "dreamcast",
    name: "Sega Dreamcast",
    shortName: "Dreamcast",
    year: 1998,
    generation: 6,
    family: "sega",
    manufacturer: "Sega",
    modelUrl: "/models/devices/consoles/dreamcast.glb",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Flycast",
        doc: `${EMU_NATIVE_DOC}#flycast`,
      },
    ],
    blurb:
      "Cream, GD-ROM, a swirl logo, and the last console Sega ever made. A short life and a long memory.",
  },
];
