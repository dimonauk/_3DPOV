/**
 * lib/play/systems/nintendo.ts — Nintendo family entries for /play.
 * Split out of families.ts to keep each file under the 300-line cap.
 *
 * Years + generations verified against Wikipedia 2026-05-19.
 */

import { EMU_NATIVE_DOC } from "../constants";
import type { SystemEntry } from "../types";

export const NINTENDO_SYSTEMS: SystemEntry[] = [
  {
    slug: "nes",
    name: "Nintendo Entertainment System",
    shortName: "NES",
    year: 1983,
    generation: 3,
    family: "nintendo",
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/consoles/nes.glb",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "nes" },
      { kind: "emulatorjs", systemSlug: "nes" },
    ],
    blurb:
      "The eight-bit grey rectangle that taught a generation what a console looks like — a slot, a power switch, a reset button.",
    codexSlug: "emulator-tutorials",
  },
  {
    slug: "snes",
    name: "Super Nintendo Entertainment System",
    shortName: "SNES",
    year: 1990,
    generation: 4,
    family: "nintendo",
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/consoles/snes.glb",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "snes" },
      { kind: "emulatorjs", systemSlug: "snes" },
    ],
    blurb:
      "Rounded edges, lilac buttons, the curve that meant a console belonged in the lounge, not the cupboard under the stairs.",
  },
  {
    slug: "n64",
    name: "Nintendo 64",
    shortName: "N64",
    year: 1996,
    generation: 5,
    family: "nintendo",
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/consoles/n64.glb",
    launch: [{ kind: "emulatorjs", systemSlug: "n64" }],
    blurb:
      "Charcoal trapezoid, cartridge slot up top, the first controller that asked your hands to grow an extra prong.",
  },
  {
    slug: "gamecube",
    name: "Nintendo GameCube",
    shortName: "GameCube",
    year: 2001,
    generation: 6,
    family: "nintendo",
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/consoles/gamecube.glb",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Dolphin standalone",
        doc: `${EMU_NATIVE_DOC}#dolphin`,
      },
    ],
    blurb:
      "A purple cube with a carrying handle — the most honest piece of industrial design Nintendo ever shipped.",
  },
  {
    slug: "wii",
    name: "Wii",
    shortName: "Wii",
    year: 2006,
    generation: 7,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Dolphin standalone",
        doc: `${EMU_NATIVE_DOC}#dolphin`,
      },
    ],
    blurb:
      "Thin white slab, motion controller, sold to the people Nintendo's other consoles had never spoken to before.",
  },
  {
    slug: "wii-u",
    name: "Wii U",
    shortName: "Wii U",
    year: 2012,
    generation: 8,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Cemu",
        doc: `${EMU_NATIVE_DOC}#cemu`,
      },
    ],
    blurb:
      "Tablet-and-base, the console that asked players to buy a second screen and then mostly ignored its own answer.",
  },
  {
    slug: "switch",
    name: "Nintendo Switch",
    shortName: "Switch",
    year: 2017,
    generation: 8,
    family: "nintendo",
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/consoles/switch.glb",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Eden",
        doc: `${EMU_NATIVE_DOC}#eden`,
      },
    ],
    blurb:
      "Tablet, dock, two slide-off rails. The console that proved a handheld can be the main hardware, not the side gig.",
    codexSlug: "eden-emulator",
  },
  {
    slug: "gb",
    name: "Game Boy",
    shortName: "Game Boy",
    year: 1989,
    generation: 4,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "gb" },
      { kind: "emulatorjs", systemSlug: "gb" },
    ],
    blurb:
      "Pea-green LCD, four AA batteries, the handheld that taught everyone how long a screen can really last on a single charge.",
  },
  {
    slug: "gbc",
    name: "Game Boy Color",
    shortName: "GBC",
    year: 1998,
    generation: 5,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "gbc" },
      { kind: "emulatorjs", systemSlug: "gbc" },
    ],
    blurb:
      "The Game Boy in colour at last, in five candy shells. Same cartridges, brighter palette, same battery life.",
  },
  {
    slug: "gba",
    name: "Game Boy Advance",
    shortName: "GBA",
    year: 2001,
    generation: 6,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "gba" },
      { kind: "emulatorjs", systemSlug: "gba" },
    ],
    blurb:
      "Landscape layout, shoulder buttons, the handheld that ran a SNES-tier 2D library in your pocket.",
  },
  {
    slug: "nds",
    name: "Nintendo DS",
    shortName: "DS",
    year: 2004,
    generation: 7,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      { kind: "webxr-retroarch", systemSlug: "nds" },
      { kind: "emulatorjs", systemSlug: "nds" },
    ],
    blurb:
      "Two screens, one of them a touchscreen, a microphone. The handheld that made stylus input a mainstream gesture.",
  },
  {
    slug: "3ds",
    name: "Nintendo 3DS",
    shortName: "3DS",
    year: 2011,
    generation: 8,
    family: "nintendo",
    manufacturer: "Nintendo",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Azahar",
        doc: `${EMU_NATIVE_DOC}#azahar`,
      },
    ],
    blurb:
      "Two screens again, this time with parallax-barrier autostereoscopy on the top one — the closest the consumer market has come to widely-deployed glasses-free 3D.",
    codexSlug: "citra-and-3ds-emulator-forks",
  },
];
