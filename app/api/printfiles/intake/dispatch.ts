/**
 * app/api/printfiles/intake/dispatch.ts
 *
 * Post-persist fan-out: forward the order to the print farm provider
 * and send the gracious reply. Both run in parallel; each updates
 * the Firestore doc with its result.
 *
 * Side-effects only — returns nothing. The caller awaits via
 * `Promise.allSettled` so neither failure blocks the other.
 */

import { createLogger, errToObject } from "lib/log";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { sendGraciousReply } from "lib/printfiles/reply";
import { FIRESTORE_COLLECTION, type PrintfilesOrder } from "lib/printfiles/types";
import type { resolveProvider } from "lib/printfarm";

const log = createLogger("api.printfiles.intake.dispatch");

type Provider = ReturnType<typeof resolveProvider>;

export async function forwardToProvider(
  order: PrintfilesOrder,
  provider: Provider,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  try {
    const result = await provider.forwardOrder(order);
    await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
      status: result.newStatus,
      "printfarm.externalId": result.externalId,
      "printfarm.trackingUrl": result.trackingUrl,
      updatedAt: new Date().toISOString(),
    });
    log.info("forward to provider ok", {
      orderId: order.id,
      provider: provider.id,
      externalId: result.externalId,
      newStatus: result.newStatus,
    });
  } catch (err) {
    log.error("forward to provider failed", {
      orderId: order.id,
      provider: provider.id,
      err: errToObject(err),
    });
    await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
      status: "errored",
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function sendReply(order: PrintfilesOrder): Promise<void> {
  const db = requireFirebaseAdminDb();
  try {
    const result = await sendGraciousReply(order);
    await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
      graciousReplyId: result.id,
      updatedAt: new Date().toISOString(),
    });
    log.info("gracious reply sent", {
      orderId: order.id,
      resendId: result.id,
    });
  } catch (err) {
    log.error("gracious reply failed", {
      orderId: order.id,
      err: errToObject(err),
    });
  }
}
