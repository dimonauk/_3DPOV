/**
 * lib/bureau/pricing.ts — Static price table for the print bureau.
 *
 * MVP-tier pricing. Indicative numbers chosen to land in the
 * fine-art-print band visitors expect for a signed limited-edition
 * piece from an independent studio:
 *
 *   A4 baseline: £45 open · £85 limited · £200 unique
 *   A3 baseline: £85 open · £150 limited · £350 unique
 *   A2 baseline: £150 open · £280 limited · £650 unique
 *
 * Paper choice doesn't shift the base price — every option is in
 * the same archival class. The PAPER_NOTES copy is what surfaces
 * the difference in the picker UI.
 *
 * Operator can tune any of these later; nothing downstream
 * hard-codes pence amounts.
 *
 * Content registry — exempt from the 300-line cap per
 * holoflow-modularise-300.
 */

import type {
  EditionChoice,
  PaperChoice,
  SizeChoice,
} from "./types";

export const SIZE_LABELS: Record<SizeChoice, string> = {
  A4: "A4 — 210×297 mm",
  A3: "A3 — 297×420 mm",
  A2: "A2 — 420×594 mm",
};

export const SIZE_DESCRIPTIONS: Record<SizeChoice, string> = {
  A4: "Desk-scale. Frames well in a study or hallway. Single shot from across a room.",
  A3: "Wall-scale at conversation distance. The standard living-room hang.",
  A2: "The studio target. Reads as a presence — designed to be viewed at 2-3 m.",
};

export const PAPER_LABELS: Record<PaperChoice, string> = {
  "canson-baryta-photographique": "Canson Baryta Photographique",
  "hahnemuhle-photo-rag": "Hahnemühle Photo Rag",
  "ilford-smooth-pearl": "Ilford Smooth Pearl",
};

export const PAPER_NOTES: Record<PaperChoice, string> = {
  "canson-baryta-photographique":
    "Cotton + barium sulphate, semi-gloss. Deepest blacks of the three, highest dynamic range. Best for night-shot light paintings.",
  "hahnemuhle-photo-rag":
    "100% cotton, smooth matte. Painterly, no glare under gallery lights. The classic fine-art surface.",
  "ilford-smooth-pearl":
    "Resin-coated pearl finish. Cleanest highlights, lower price point, ships flat without curling. Good for the open edition.",
};

export const EDITION_LABELS: Record<EditionChoice, string> = {
  open: "Open edition",
  limited: "Limited edition of 25",
  unique: "Unique — only one ever",
};

export const EDITION_DESCRIPTIONS: Record<EditionChoice, string> = {
  open: "Available indefinitely. Each print signed and numbered with its run position.",
  limited: "Hand-numbered up to 25. Once sold, the limited edition closes for this frame.",
  unique:
    "The only one. Hand-signed and dated. Once sold, the unique slot for this frame is gone forever — the AR anchor is the only record left.",
};

/** Base price in pence per (size, edition). Paper choice doesn't
 *  shift the base; it's a texture decision, not a tier decision. */
const BASE_PRICE_PENCE: Record<SizeChoice, Record<EditionChoice, number>> = {
  A4: { open: 4500, limited: 8500, unique: 20000 },
  A3: { open: 8500, limited: 15000, unique: 35000 },
  A2: { open: 15000, limited: 28000, unique: 65000 },
};

/** Lead time before shipping in business days. Open + Limited are
 *  printed on demand from the studio's PRO-1100 — the queue
 *  capacity is ~20-30 A2/week. Unique is hand-signed + dated, so
 *  buffer an extra two days for the signing pass. */
const LEAD_DAYS: Record<EditionChoice, number> = {
  open: 3,
  limited: 3,
  unique: 5,
};

export function basePricePence(
  size: SizeChoice,
  edition: EditionChoice,
): number {
  return BASE_PRICE_PENCE[size][edition];
}

export function leadDaysFor(edition: EditionChoice): number {
  return LEAD_DAYS[edition];
}
