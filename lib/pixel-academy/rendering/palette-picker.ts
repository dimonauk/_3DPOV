/**
 * lib/pixel-academy/rendering/palette-picker.ts
 *
 * Stateless palette + hue-shift picker. Takes an iterable of existing
 * (real, not sub-agent) characters and chooses the least-used base
 * palette. After every base has been used at least once, subsequent
 * picks add a random hue shift ≥ HUE_SHIFT_MIN_DEG so the viewer can
 * still tell agents apart visually.
 *
 * Pure function — no state, no side effects, perfect for unit tests.
 */

import {
  HUE_SHIFT_MIN_DEG,
  HUE_SHIFT_RANGE_DEG,
  PALETTE_COUNT,
} from "../constants";
import type { Character } from "../types";

export function pickDiversePalette(
  characters: Iterable<Character>,
): { palette: number; hueShift: number } {
  const counts = new Array(PALETTE_COUNT).fill(0) as number[];
  for (const ch of characters) {
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
