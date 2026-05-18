/**
 * lib/bureau/quote.ts — Pure quote computation. Stateless: same
 * inputs always return the same Quote, no IO. The `/api/bureau/quote`
 * route handler wraps this; the `/api/bureau/order` route also calls
 * it to re-verify the quote it received from the client.
 *
 * Pure functions only — no Firestore, no env reads, no logging.
 */

import {
  EDITION_LABELS,
  PAPER_NOTES,
  SIZE_LABELS,
  basePricePence,
  leadDaysFor,
} from "./pricing";
import {
  ALL_EDITIONS,
  ALL_PAPERS,
  ALL_SIZES,
  type EditionChoice,
  type PaperChoice,
  type Quote,
  type QuoteError,
  type QuoteRequest,
  type SizeChoice,
} from "./types";

export function isValidSize(v: unknown): v is SizeChoice {
  return typeof v === "string" && (ALL_SIZES as string[]).includes(v);
}

export function isValidPaper(v: unknown): v is PaperChoice {
  return typeof v === "string" && (ALL_PAPERS as string[]).includes(v);
}

export function isValidEdition(v: unknown): v is EditionChoice {
  return typeof v === "string" && (ALL_EDITIONS as string[]).includes(v);
}

/** Validate a raw payload + compute the quote. Returns a discriminated
 *  union: `{ ok: true, quote }` or `{ ok: false, error }`. */
export function quoteFor(
  input: unknown,
): { ok: true; quote: Quote } | { ok: false; error: QuoteError } {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      error: {
        error: "missing_image_id",
        message: "Body must be a JSON object.",
      },
    };
  }
  const body = input as Record<string, unknown>;

  const imageId =
    typeof body["imageId"] === "string" ? (body["imageId"] as string) : "";
  if (!imageId.trim()) {
    return {
      ok: false,
      error: {
        error: "missing_image_id",
        message:
          "imageId is required — pass the chamber's provenance id for this frame.",
      },
    };
  }

  if (!isValidSize(body["sizeChoice"])) {
    return {
      ok: false,
      error: {
        error: "invalid_size",
        message: `sizeChoice must be one of: ${ALL_SIZES.join(", ")}.`,
      },
    };
  }
  if (!isValidPaper(body["paperChoice"])) {
    return {
      ok: false,
      error: {
        error: "invalid_paper",
        message: `paperChoice must be one of: ${ALL_PAPERS.join(", ")}.`,
      },
    };
  }
  if (!isValidEdition(body["edition"])) {
    return {
      ok: false,
      error: {
        error: "invalid_edition",
        message: `edition must be one of: ${ALL_EDITIONS.join(", ")}.`,
      },
    };
  }

  const req: QuoteRequest = {
    imageId,
    sizeChoice: body["sizeChoice"],
    paperChoice: body["paperChoice"],
    edition: body["edition"],
  };

  const priceGbp = basePricePence(req.sizeChoice, req.edition);
  const leadDays = leadDaysFor(req.edition);
  const computedAt = new Date().toISOString();

  // Opaque, presentational only. The order endpoint re-runs quoteFor
  // and verifies the result matches what the client thinks it has.
  const quoteId = `q_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;

  const quote: Quote = {
    quoteId,
    imageId: req.imageId,
    sizeChoice: req.sizeChoice,
    paperChoice: req.paperChoice,
    edition: req.edition,
    priceGbp,
    leadDays,
    paperNotes: PAPER_NOTES[req.paperChoice],
    sizeLabel: SIZE_LABELS[req.sizeChoice],
    editionLabel: EDITION_LABELS[req.edition],
    computedAt,
  };

  return { ok: true, quote };
}
