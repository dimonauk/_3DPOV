/**
 * lib/play/systems/playstation.ts — PlayStation family entries for /play.
 * Split out of families.ts to keep each file under the 300-line cap.
 *
 * Years verified against Wikipedia 2026-05-19 (first market launch).
 */

import { EMU_NATIVE_DOC } from "../constants";
import type { SystemEntry } from "../types";

export const PLAYSTATION_SYSTEMS: SystemEntry[] = [
  {
    slug: "ps1",
    name: "Sony PlayStation",
    shortName: "PS1",
    year: 1994,
    generation: 5,
    family: "playstation",
    manufacturer: "Sony",
    modelUrl: "/models/devices/consoles/ps1.glb",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "psx" },
      { kind: "emulatorjs", systemSlug: "psx" },
      {
        kind: "bench-bridge",
        emulator: "DuckStation",
        doc: `${EMU_NATIVE_DOC}#duckstation`,
      },
    ],
    blurb:
      "Off-white, lid-loading, the only console that made early polygons look like a deliberate medium and not a budget cut.",
  },
  {
    slug: "ps2",
    name: "PlayStation 2",
    shortName: "PS2",
    year: 2000,
    generation: 6,
    family: "playstation",
    manufacturer: "Sony",
    modelUrl: "/models/devices/consoles/ps2.glb",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "PCSX2 standalone",
        doc: `${EMU_NATIVE_DOC}#pcsx2`,
      },
    ],
    blurb:
      "Glossy black slab, vertical or horizontal, the bestselling console ever made. Wins on stamina more than glamour.",
  },
  {
    slug: "psp",
    name: "PlayStation Portable",
    shortName: "PSP",
    year: 2004,
    generation: 7,
    family: "playstation",
    manufacturer: "Sony",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "PPSSPP",
        doc: `${EMU_NATIVE_DOC}#ppsspp`,
      },
    ],
    blurb:
      "Wide-screen UMD handheld, the first portable to ship console-tier 3D — and the platform PPSSPP keeps alive.",
  },
  {
    slug: "ps3",
    name: "PlayStation 3",
    shortName: "PS3",
    year: 2006,
    generation: 7,
    family: "playstation",
    manufacturer: "Sony",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "RPCS3",
        doc: `${EMU_NATIVE_DOC}#rpcs3`,
      },
    ],
    blurb:
      "Curved black Cell-architecture brick, the console that asked developers to ship for seven heterogeneous cores at once.",
  },
  {
    slug: "ps-vita",
    name: "PlayStation Vita",
    shortName: "PS Vita",
    year: 2011,
    generation: 8,
    family: "playstation",
    manufacturer: "Sony",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Vita3K",
        doc: `${EMU_NATIVE_DOC}#vita3k`,
      },
    ],
    blurb:
      "OLED-front, dual-stick, rear-touchpad handheld — Sony's last portable, undersold and over-loved.",
  },
  {
    slug: "ps4",
    name: "PlayStation 4",
    shortName: "PS4",
    year: 2013,
    generation: 8,
    family: "playstation",
    manufacturer: "Sony",
    launch: [{ kind: "comingSoon" }],
    blurb:
      "x86-64 home console, parallelogram slab, the platform that opened the door to PC-style streaming and capture.",
  },
  {
    slug: "ps5",
    name: "PlayStation 5",
    shortName: "PS5",
    year: 2020,
    generation: 9,
    family: "playstation",
    manufacturer: "Sony",
    modelUrl: "/models/devices/consoles/ps5.glb",
    launch: [{ kind: "comingSoon" }],
    blurb:
      "Two white sails around a black slab. The first console that demanded a room of its own.",
  },
];
