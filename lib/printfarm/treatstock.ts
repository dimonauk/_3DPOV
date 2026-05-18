/**
 * lib/printfarm/treatstock.ts — Treatstock provider.
 *
 * Treatstock has a wider provider network than Slant3D (more
 * materials, regional pricing) but their API is heavier to integrate
 * — multi-step quote/order/print/ship with their own provider-bidding
 * logic. Use this when Slant3D's material/finish options are too
 * narrow for what a customer asked for.
 *
 * # Posture
 *
 * Foundation-phase stub.
 *
 * # Auth
 *
 * TREATSTOCK_API_KEY in env.
 */

import "server-only";

import { createLogger } from "lib/log";

import type { PrintfilesOrder } from "lib/printfiles/types";

import type { ForwardResult, PrintfarmProviderModule } from "./_base";

const log = createLogger("printfarm.treatstock");

async function forwardOrder(order: PrintfilesOrder): Promise<ForwardResult> {
  const apiKey = process.env.TREATSTOCK_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error(
        "TREATSTOCK_API_KEY not set — Treatstock provider unavailable. " +
          "Either set the env var or switch PRINTFARM_PROVIDER back to 'manual' / 'slant3d'.",
      ),
      { code: "service-unavailable" as const },
    );
  }

  log.warn("Treatstock forwardOrder is a stub — falling through to manual queue", {
    orderId: order.id,
  });

  return {
    externalId: null,
    trackingUrl: null,
    notes:
      "Treatstock provider in stub mode. Their API requires customer " +
      "address + material/finish picks before placing the order.",
    newStatus: "queued",
  };
}

export const treatstockProvider: PrintfarmProviderModule = {
  id: "treatstock",
  label: "Treatstock (POD aggregator)",
  envRequirements: [
    "TREATSTOCK_API_KEY (api key from treatstock.com/api)",
  ],
  forwardOrder,
};
