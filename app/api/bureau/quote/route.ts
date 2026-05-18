/**
 * POST /api/bureau/quote — Compute a print quote from a size + paper
 * + edition + imageId.
 *
 * Stateless: same inputs → same priceGbp + leadDays. The quoteId in
 * the response is presentational; the `/api/bureau/order` route
 * re-runs the quote computation against the client's choices instead
 * of trusting any opaque server token. That keeps this endpoint
 * cache-friendly and the surface very small.
 *
 * Request:
 *   { imageId, sizeChoice, paperChoice, edition }
 *
 * Response:
 *   200 → Quote (see lib/bureau/types)
 *   400 → { error, message } — invalid size/paper/edition or missing imageId
 *
 * No auth: quotes are public (any visitor on a chamber can see what
 * the print would cost). The /order endpoint will be the gated step.
 */

import { NextResponse, type NextRequest } from "next/server";

import { quoteFor } from "lib/bureau/quote";
import { errToObject, withRouteLogging } from "lib/log";

export const dynamic = "force-dynamic";

export const POST = withRouteLogging(
  "bureau.quote",
  async (req: NextRequest, _ctx, log) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch (err) {
      log.warn("body:invalid_json", { err: errToObject(err) });
      return NextResponse.json(
        { error: "invalid_body", message: "Body must be JSON." },
        { status: 400 },
      );
    }

    const result = quoteFor(body);
    if (!result.ok) {
      log.info("quote:invalid", { error: result.error.error });
      return NextResponse.json(result.error, { status: 400 });
    }

    log.info("quote:ok", {
      imageId: result.quote.imageId,
      sizeChoice: result.quote.sizeChoice,
      paperChoice: result.quote.paperChoice,
      edition: result.quote.edition,
      priceGbp: result.quote.priceGbp,
    });
    return NextResponse.json(result.quote);
  },
);
