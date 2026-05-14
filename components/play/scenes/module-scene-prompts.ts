/**
 * components/play/scenes/module-scene-prompts.ts — Prompt bank for the
 * Module level. Each prompt names a target (sword / beam / fire / stars)
 * and the brush slug that fits it. Pass-condition gates on slug match.
 */

import type { BrushSlug } from "./module-scene-brushes";

export type Prompt = {
  /** Short instruction the player reads. */
  text: string;
  /** Which brush is the right one for this prompt. */
  correct: BrushSlug;
  /** One-line reason, shown on pass or fail. */
  reason: string;
};

export const PROMPTS: Prompt[] = [
  {
    text: "Draw a sword.",
    correct: "thin",
    reason:
      "A sword is a line. The blade reads as edge — the thin line is the edge module.",
  },
  {
    text: "Draw a beam of light.",
    correct: "fat",
    reason:
      "A beam has mass and breadth. The fat brush carries the body of the beam; a thin line is only its centre.",
  },
  {
    text: "Draw a fire trail.",
    correct: "additive",
    reason:
      "Fire reads through long exposure, brightest where the body lingers. The additive smear is the fire module.",
  },
  {
    text: "Draw a field of stars.",
    correct: "dotted",
    reason:
      "A star field is discrete marks. The dotted module is the only one that gives the gaps as well as the points.",
  },
  {
    text: "Draw a thrown shape.",
    correct: "fat",
    reason:
      "A throw has weight. The fat brush carries the mass; a thin line reads as a thread, not a thrown object.",
  },
  {
    text: "Draw a calligraphic curve.",
    correct: "thin",
    reason:
      "Calligraphy is the path itself. The thin line is the path module.",
  },
  {
    text: "Draw a glow.",
    correct: "additive",
    reason:
      "A glow is light that bleeds. The additive smear bleeds; the other modules only mark.",
  },
  {
    text: "Draw a rhythm of beats.",
    correct: "dotted",
    reason:
      "Beats are discrete. The dotted module is the rhythm; the others are continuous.",
  },
];

export function pickPrompt(): Prompt {
  const i = Math.floor(Math.random() * PROMPTS.length);
  return PROMPTS[i] ?? PROMPTS[0]!;
}
