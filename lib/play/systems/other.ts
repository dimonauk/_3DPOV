/**
 * lib/play/systems/other.ts — Atari, NEC, Coleco, 3DO, arcade.
 * Split out of families.ts to keep each file under the 300-line cap.
 *
 * Years verified against Wikipedia 2026-05-19.
 */

import { type SystemEntry } from "../families";

export const OTHER_SYSTEMS: SystemEntry[] = [
  {
    slug: "atari-2600",
    name: "Atari 2600",
    shortName: "Atari 2600",
    year: 1977,
    generation: 2,
    family: "other",
    manufacturer: "Atari",
    launch: [{ kind: "emulatorjs", systemSlug: "atari2600" }],
    blurb:
      "Wood-grain plastic, joystick, paddle. The console that taught the industry that a cartridge was a product.",
  },
  {
    slug: "atari-5200",
    name: "Atari 5200",
    shortName: "Atari 5200",
    year: 1982,
    generation: 2,
    family: "other",
    manufacturer: "Atari",
    launch: [{ kind: "emulatorjs", systemSlug: "atari5200" }],
    blurb:
      "The follow-up to the 2600 — analogue stick, more colours, never the cultural foothold of its predecessor.",
  },
  {
    slug: "atari-7800",
    name: "Atari 7800",
    shortName: "Atari 7800",
    year: 1986,
    generation: 3,
    family: "other",
    manufacturer: "Atari",
    launch: [{ kind: "emulatorjs", systemSlug: "atari7800" }],
    blurb:
      "Backwards-compatible with the 2600, designed for sprite-heavy arcade ports — Atari's third-gen run at the home market.",
  },
  {
    slug: "lynx",
    name: "Atari Lynx",
    shortName: "Lynx",
    year: 1989,
    generation: 4,
    family: "other",
    manufacturer: "Atari",
    launch: [{ kind: "emulatorjs", systemSlug: "lynx" }],
    blurb:
      "The first colour-LCD handheld — wider than a Game Boy, hungrier on batteries, technically the more capable machine.",
  },
  {
    slug: "jaguar",
    name: "Atari Jaguar",
    shortName: "Jaguar",
    year: 1993,
    generation: 5,
    family: "other",
    manufacturer: "Atari",
    launch: [{ kind: "emulatorjs", systemSlug: "jaguar" }],
    blurb:
      "Atari's last console — multi-chip RISC architecture marketed as 64-bit, infamous for how hard it was to write for.",
  },
  {
    slug: "turbografx-16",
    name: "TurboGrafx-16 / PC Engine",
    shortName: "TG-16",
    year: 1987,
    generation: 4,
    family: "other",
    manufacturer: "NEC + Hudson",
    launch: [{ kind: "emulatorjs", systemSlug: "pce" }],
    blurb:
      "Tiny cream brick that punched well above its size class — the third runner in the late-eighties console race.",
  },
  {
    slug: "3do",
    name: "3DO Interactive Multiplayer",
    shortName: "3DO",
    year: 1993,
    generation: 5,
    family: "other",
    manufacturer: "Panasonic / Goldstar / Sanyo",
    launch: [{ kind: "emulatorjs", systemSlug: "3do" }],
    blurb:
      "The licensed-platform experiment — multiple OEMs shipped the same spec for £600 a unit. The story closed inside three years.",
  },
  {
    slug: "colecovision",
    name: "ColecoVision",
    shortName: "ColecoVision",
    year: 1982,
    generation: 2,
    family: "other",
    manufacturer: "Coleco",
    launch: [{ kind: "emulatorjs", systemSlug: "colecovision" }],
    blurb:
      "Arcade ports done well — the console that brought Donkey Kong, Zaxxon and Lady Bug into the living room with fewer compromises than its peers.",
  },
  {
    slug: "arcade",
    name: "Arcade (MAME 2003-plus)",
    shortName: "Arcade",
    year: 1972,
    generation: 1,
    family: "other",
    manufacturer: "Various",
    launch: [{ kind: "emulatorjs", systemSlug: "arcade" }],
    blurb:
      "Not a console — a cabinet. The medium most retro consoles were trying to fit into the living room. MAME holds the catalogue.",
  },
];
