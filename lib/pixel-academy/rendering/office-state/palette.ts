/**
 * lib/pixel-academy/rendering/office-state/palette.ts
 *
 * Diverse-palette picker. First N agents (N = PALETTE_COUNT) each get
 * a unique base skin in random order; beyond that, skins repeat in
 * balanced rounds with a random hue shift ≥ HUE_SHIFT_MIN_DEG so the
 * visitor's brain can still tell agents apart.
 *
 * Extracted from `office-state.ts` to keep the orchestrator under
 * the 300-line cap.
 */

import {
  HUE_SHIFT_MIN_DEG,
  HUE_SHIFT_RANGE_DEG,
  PALETTE_COUNT,
} from "../../constants";
import type { OfficeState } from "../office-state";

export function pickDiversePalette(
  state: OfficeState,
): { palette: number; hueShift: number } {
  const counts = new Array(PALETTE_COUNT).fill(0) as number[];
  for (const ch of state.characters.values()) {
    if (ch.isSubagent) continue;
    counts[ch.palette]!++;
  }
  const minCount = Math.min(...counts);
  const available: number[] = [];
  for (let i = 0; i < PALETTE_COUNT; i++) {
    if (counts[i] === minCount) available.push(i);
  }
  const palette = available[Math.floor(Math.random() * available.length)]!;
  let hueShift = 0;
  if (minCount > 0) {
    hueShift =
      HUE_SHIFT_MIN_DEG + Math.floor(Math.random() * HUE_SHIFT_RANGE_DEG);
  }
  return { palette, hueShift };
}
