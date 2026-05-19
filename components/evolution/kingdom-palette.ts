/**
 * components/evolution/kingdom-palette.ts — Muted brand-aligned colours
 * for each SculptureKingdom plus the "unspecified" fallback. Shared by
 * the fan chart and biography strip so wedges and thumbnails agree.
 */

import type { SculptureKingdom } from "lib/assets/genomes";

export const KINGDOM_COLOURS: Record<
  SculptureKingdom | "unspecified",
  string
> = {
  techno: "#7a8bb0",
  artistic: "#d8a3b8",
  choreographic: "#c4a86a",
  biomech: "#7fa896",
  thermal: "#cc7e5a",
  protean: "#9d7fc0",
  assemblage: "#8b8b88",
  curvilinear: "#a8c2c4",
  unspecified: "#5a5a55",
};

export function kingdomLabel(kind: SculptureKingdom | "unspecified"): string {
  return kind;
}
