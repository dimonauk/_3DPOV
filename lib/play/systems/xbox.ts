/**
 * lib/play/systems/xbox.ts — Xbox family entries for /play.
 * Split out of families.ts to keep each file under the 300-line cap.
 *
 * Years verified against Wikipedia 2026-05-19.
 */

import { EMU_NATIVE_DOC } from "../constants";
import type { SystemEntry } from "../types";

export const XBOX_SYSTEMS: SystemEntry[] = [
  {
    slug: "xbox-original",
    name: "Xbox",
    shortName: "Xbox",
    year: 2001,
    generation: 6,
    family: "xbox",
    manufacturer: "Microsoft",
    launch: [{ kind: "comingSoon" }],
    blurb:
      "Heavy black box with the green jewel — the PC-vendor's first console, with an internal hard drive when nobody else had one.",
  },
  {
    slug: "xbox-360",
    name: "Xbox 360",
    shortName: "Xbox 360",
    year: 2005,
    generation: 7,
    family: "xbox",
    manufacturer: "Microsoft",
    launch: [
      {
        kind: "bench-bridge",
        emulator: "Xenia Canary",
        doc: `${EMU_NATIVE_DOC}#xenia-canary`,
      },
    ],
    blurb:
      "Curved white tower, the console that taught the industry what an achievement system feels like — and what red rings of death feel like.",
  },
  {
    slug: "xbox-one",
    name: "Xbox One",
    shortName: "Xbox One",
    year: 2013,
    generation: 8,
    family: "xbox",
    manufacturer: "Microsoft",
    launch: [{ kind: "comingSoon" }],
    blurb:
      "Black VCR-shaped box, the generation where Microsoft pivoted from media-hub-first back to games-first.",
  },
  {
    slug: "xbox-series",
    name: "Xbox Series X | S",
    shortName: "Xbox Series",
    year: 2020,
    generation: 9,
    family: "xbox",
    manufacturer: "Microsoft",
    launch: [{ kind: "comingSoon" }],
    blurb:
      "Two boxes — the black fridge and the small white slab — the same chip family, different memory budgets, the same library.",
  },
];
