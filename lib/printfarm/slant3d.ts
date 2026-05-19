/**
 * lib/printfarm/slant3d.ts — Slant3D provider (POD drop-ship).
 *
 * Slant3D runs a print-on-demand REST API designed for drop-shipping.
 * Their pattern:
 *   1. POST /api/order  with a payload (file URL or base64, material,
 *      colour, customer shipping address) → returns an `orderId`
 *   2. Webhook events to your callback URL when status changes
 *      (printing → shipped → delivered)
 *   3. GET /api/order/<id> for polling status (alternative to webhook)
 *
 * # Posture
 *
 * Foundation-phase stub — throws "service-unavailable" until
 * SLANT3D_API_KEY is set. Once wired, drops in as the
 * `PRINTFARM_PROVIDER=slant3d` choice in lib/printfarm/index.ts.
 *
 * # Auth
 *
 * SLANT3D_API_KEY in env (api-key auth via header).
 *
 * # Pricing
 *
 * Slant3D's quote API returns price per file based on bounding-box
 * volume + material. The printfiles engine's intake pipeline probes
 * bounding box; we POST it to /api/quote to get a price BEFORE
 * forwarding the actual order, so we can include the quote in the
 * gracious reply.
 */

import "server-only";

import { createLogger, errToObject } from "lib/log";

import type { PrintfilesOrder } from "lib/printfiles/types";

import type { ForwardResult, PrintfarmProviderModule } from "./_base";

const log = createLogger("printfarm.slant3d");

const SLANT3D_BASE = "https://www.slant3dapi.com";

type Slant3DOrderResponse = {
  orderId?: string;
  status?: string;
  trackingUrl?: string;
};

function envOrThrow(): string {
  const key = process.env.SLANT3D_API_KEY;
  if (!key) {
    throw Object.assign(
      new Error(
        "SLANT3D_API_KEY not set — Slant3D provider unavailable. Either " +
          "set the env var or switch PRINTFARM_PROVIDER back to 'manual'.",
      ),
      { code: "service-unavailable" as const },
    );
  }
  return key;
}

async function forwardOrder(order: PrintfilesOrder): Promise<ForwardResult> {
  const apiKey = envOrThrow();

  // TODO: shape the payload per Slant3D's API docs. Their actual
  // /api/order endpoint expects { fileURL, color, profile,
  // shippingAddress } where shippingAddress comes from the customer's
  // confirmation step — NOT from the initial email. So this needs to
  // happen AFTER the customer confirms the quote + provides an
  // address, not on email intake.
  //
  // For v0 (this stub): log the intent + return a manual-style result
  // so the order doesn't get dropped. The real implementation routes
  // through:
  //   1. /api/printfiles/<id>/pay collects shipping address + payment
  //   2. on payment confirmed, this provider's forwardOrder is called
  //   3. POSTs to Slant3D with the now-resolved address
  //   4. customer gets the tracking webhook → status updates

  log.warn("Slant3D forwardOrder is a stub — falling through to manual queue", {
    orderId: order.id,
    apiKeyConfigured: Boolean(apiKey),
  });

  return {
    externalId: null,
    trackingUrl: null,
    notes:
      "Slant3D provider in stub mode. Order queued; operator must " +
      "complete the customer-confirmation step before forwarding.",
    newStatus: "queued",
  };
}

/**
 * Poll Slant3D for an order's current status. Used by the operator
 * dashboard's "refresh" button + by a future cron poll job. Stub.
 */
export async function pollOrderStatus(
  externalId: string,
): Promise<Slant3DOrderResponse | null> {
  const apiKey = process.env.SLANT3D_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${SLANT3D_BASE}/api/order/${externalId}`, {
      headers: { "api-key": apiKey },
    });
    if (!res.ok) {
      log.warn("Slant3D status poll non-200", { externalId, status: res.status });
      return null;
    }
    return (await res.json()) as Slant3DOrderResponse;
  } catch (err) {
    log.warn("Slant3D status poll failed", { externalId, err: errToObject(err) });
    return null;
  }
}

export const slant3dProvider: PrintfarmProviderModule = {
  id: "slant3d",
  label: "Slant3D (POD drop-ship)",
  envRequirements: [
    "SLANT3D_API_KEY (api key from slant3dapi.com)",
  ],
  forwardOrder,
};
