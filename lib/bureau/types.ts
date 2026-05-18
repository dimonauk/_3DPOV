/**
 * lib/bureau/types.ts — Shared types for the print bureau pipeline.
 *
 * The bureau is the commerce loop's print half (per
 * docs/BUREAU-AR-LOOP-PLAN.md). One frame from any chamber becomes
 * a fine-art print + a provenance card + (eventually) an AR anchor.
 *
 * This file defines the cross-cutting types — the surface shared by
 * the quote endpoint, the order endpoint, the picker UI, the
 * operator dashboard, the provenance page.
 *
 * Content (paper/size/edition descriptions) is in pricing.ts. The
 * Provenance shape on Firestore is in here because it ties the
 * print + AR + edition halves of the loop together.
 */

export type SizeChoice = "A4" | "A3" | "A2";

export const ALL_SIZES: SizeChoice[] = ["A4", "A3", "A2"];

/** Stable kebab-case slug for the paper choice. Used as the URL-safe
 *  identifier in API payloads + Firestore documents. */
export type PaperChoice =
  | "canson-baryta-photographique"
  | "hahnemuhle-photo-rag"
  | "ilford-smooth-pearl";

export const ALL_PAPERS: PaperChoice[] = [
  "canson-baryta-photographique",
  "hahnemuhle-photo-rag",
  "ilford-smooth-pearl",
];

/** Edition stance. Plan §"Editions strategy" — every frame gets one
 *  Unique + 25 Limited + an Open run. Once the Unique sells, gone
 *  forever; once the Limited sells out, only the AR is left. The
 *  asymmetry is the moat. */
export type EditionChoice = "open" | "limited" | "unique";

export const ALL_EDITIONS: EditionChoice[] = ["open", "limited", "unique"];

/** Request body for POST /api/bureau/quote. */
export type QuoteRequest = {
  /** Provenance ID — the ChamberOutput's stable handle. The quote
   *  endpoint doesn't yet validate this exists; the order endpoint
   *  will. */
  imageId: string;
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
};

/** Response body from POST /api/bureau/quote — what the picker UI
 *  renders + what the subsequent /order call expects to mirror. */
export type Quote = {
  /** Opaque token. Quotes are stateless on the server for now;
   *  the token is presentational. The /order endpoint recomputes
   *  the price and verifies it matches the original quote inputs
   *  rather than trusting this id. */
  quoteId: string;
  imageId: string;
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
  /** Price in pence. Frontend formats with toLocaleString(undefined,
   *  { style: "currency", currency: "GBP" }). */
  priceGbp: number;
  /** Expected lead time before shipping. */
  leadDays: number;
  /** One- or two-sentence honest description of the paper choice —
   *  texture, sheen, archival rating. Surfaced under the size
   *  selector in the picker UI. */
  paperNotes: string;
  /** Friendly label for the size choice ("A2 — large, 420×594 mm"). */
  sizeLabel: string;
  /** Friendly label for the edition ("Limited edition of 25"). */
  editionLabel: string;
  /** When this quote was computed. ISO 8601. */
  computedAt: string;
};

/** Reasons a quote might be refused — kept as a discriminated union
 *  so the picker UI can surface a clear message. */
export type QuoteError =
  | { error: "invalid_size"; message: string }
  | { error: "invalid_paper"; message: string }
  | { error: "invalid_edition"; message: string }
  | { error: "missing_image_id"; message: string };

/** The bridge shape — one Firestore doc at `provenance/{id}`
 *  documents the artwork, what was sold, and where the AR anchor
 *  lives. Mirrors the Provenance shape in
 *  docs/BUREAU-AR-LOOP-PLAN.md §"The Firestore shape" — kept here
 *  as the typed surface for the rest of the bureau code. */
export type Provenance = {
  id: string;
  title: string;
  /** Operator's Firebase uid. The bureau is operator-fulfilled in
   *  the MVP — one artist, one print bench. */
  artistId: string;
  /** ISO timestamp of the original capture. */
  captureDate: string;
  /** Capture GPS — accuracy may be wide for handheld phone shots,
   *  tight (<1 m) for drone or studio captures. */
  gpsCoord?: { lat: number; lng: number; accuracyM: number };
  /** Capture camera metadata, lifted from EXIF where possible. */
  camera?: { make: string; model: string };
  /** Movement description for light-paint frames — what the
   *  performer did with the poi/light. Lifted from inverse-kata's
   *  orchestrator output. */
  kataScript?: string[];
  /** Which chamber produced the frame (lightpaint, imagen,
   *  image-edit, image-to-mesh, print-check, etc.). */
  sourceChamber: string;
  /** gs:// or https:// URL to the full-res source. */
  sourceMediaPath: string;
  /** Edition state — one frame's Unique + Limited + Open status. */
  editions: {
    unique?: { state: "available" | "sold"; soldTo?: string };
    limited: {
      sizeTotal: number;
      soldCount: number;
      remaining: number;
    };
    open: { state: "available" | "closed" };
  };
  /** When an anchor exists in /api/holo-walk/anchor, its id. */
  holoWalkAnchorId?: string;
  /** ISO timestamp of when this provenance row was created. */
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Orders — the persistent shape behind the Stripe Checkout Session.
// `lib/bureau/order.ts` owns the lifecycle transitions; the route handlers
// at app/api/bureau/order/route.ts + /api/stripe/webhook/route.ts wire
// the outer edges.
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "fulfilling"
  | "fulfilled"
  | "refunded"
  | "cancelled";

export type ShippingAddress = {
  name?: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postcode: string;
  country: string;
};

export type CreateOrderRequest = {
  imageId: string;
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
  quoteId?: string;
  customerEmail: string;
  customerName?: string;
};

export type Order = {
  id: string;
  imageId: string;
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
  /** Price the order was quoted at, in pence. */
  priceGbp: number;
  customerEmail: string;
  customerName?: string;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  notes?: string;
};
