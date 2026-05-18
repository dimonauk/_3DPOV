/**
 * lib/printfarm/_base.ts — provider interface for third-party 3D
 * print fulfilment.
 *
 * The print-files engine forwards customer orders to a print-farm
 * partner who actually prints and ships. Different farms have
 * different APIs (or none — some need manual operator forwarding).
 * This interface is the shape every provider implements; the
 * intake pipeline talks to whichever provider PRINTFARM_PROVIDER
 * env var selects.
 *
 * v1 ships with `manual` (no API; emails the operator with the
 * order packet — operator forwards to their chosen partner). Future
 * providers: treatstock, slant3d, craftcloud, hubs.
 */

import "server-only";

import type { PrintfarmProvider, PrintfilesOrder } from "lib/printfiles/types";

export type ForwardResult = {
  /** External order/job id from the print farm. Null when the
   *  provider can't return one synchronously (e.g. manual). */
  externalId: string | null;
  /** Tracking URL if the provider returns one upfront. */
  trackingUrl: string | null;
  /** Free-form notes the dashboard can show. */
  notes: string;
  /** New order status to set. Most providers go "received" -> "sent-to-farm";
   *  manual provider goes "received" -> "queued" (operator picks it up). */
  newStatus: PrintfilesOrder["status"];
};

export type PrintfarmProviderModule = {
  /** Stable identifier matching `PrintfarmProvider`. */
  id: PrintfarmProvider;
  /** Human-friendly name for the dashboard. */
  label: string;
  /** Does this provider need any credentials to function? */
  envRequirements: string[];
  /** Forward an order to the provider. Throws on failure; caller
   *  catches + marks the order "errored". */
  forwardOrder(order: PrintfilesOrder): Promise<ForwardResult>;
};
