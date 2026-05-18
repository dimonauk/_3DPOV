/**
 * lib/bureau/order.ts — Bureau order persistence.
 *
 * Persistence helpers around the existing `Order` shape from
 * `./types.ts`. The bureau quote step shipped in commit f6aabb5
 * (stateless price calc); this module turns an accepted quote into a
 * Firestore record + Stripe Payment Intent and walks the
 * `OrderStatus` lifecycle.
 *
 * # Lifecycle (from types.ts)
 *
 *   pending_payment → paid → fulfilling → fulfilled
 *                              ↓
 *                          refunded | cancelled
 *
 * # Storage
 *
 *   bureau_orders/{id}   Firestore — admin SDK only
 *   firestore.rules      add a `match /bureau_orders/{id}` block
 *                        with read/write false (operator + cron only)
 */

import "server-only";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

import type {
  BureauOrderEvent,
  BureauOrderEventKind,
  CreateOrderRequest,
  Order,
  OrderStatus,
  Quote,
  ShippingAddress,
} from "./types";

const log = createLogger("bureau.order");

export const FIRESTORE_COLLECTION = "bureau_orders" as const;
export const EVENTS_SUBCOLLECTION = "events" as const;

export function mintOrderId(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `bo-${y}${m}${d}-${hex}`;
}

/** Event ids are time-ordered so a `.orderBy(id)` read returns the
 *  audit log in chronological order without needing a composite
 *  index on `at`. Format: `evt-<ISO compact>-<4hex>`. */
export function mintEventId(now: Date = new Date()): string {
  const iso = now.toISOString().replace(/[-:.]/g, "").slice(0, 15);
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
  return `evt-${iso}-${hex}`;
}

export type CreateOrderInput = CreateOrderRequest & {
  /** The price re-verified server-side, in pence. */
  priceGbp: number;
  /** Optional address; Stripe Checkout can collect it instead. */
  shippingAddress?: ShippingAddress;
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ orderId: string; docPath: string }> {
  const db = requireFirebaseAdminDb();
  const orderId = mintOrderId();
  const now = new Date().toISOString();
  const order: Order = {
    id: orderId,
    imageId: input.imageId,
    sizeChoice: input.sizeChoice,
    paperChoice: input.paperChoice,
    edition: input.edition,
    priceGbp: input.priceGbp,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    shippingAddress: input.shippingAddress,
    status: "pending_payment",
    createdAt: now,
    updatedAt: now,
  };
  const docRef = db.collection(FIRESTORE_COLLECTION).doc(orderId);
  await docRef.set(order);
  log.info("bureau order created", { orderId, email: input.customerEmail });
  await recordOrderEvent(orderId, {
    kind: "order_created",
    by: `customer:${input.customerEmail}`,
    details: {
      imageId: input.imageId,
      sizeChoice: input.sizeChoice,
      paperChoice: input.paperChoice,
      edition: input.edition,
      priceGbp: input.priceGbp,
    },
  });
  return { orderId, docPath: docRef.path };
}

export async function attachPaymentIntent(
  orderId: string,
  paymentIntentId: string,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection(FIRESTORE_COLLECTION).doc(orderId).update({
    stripePaymentIntentId: paymentIntentId,
    updatedAt: new Date().toISOString(),
  });
  log.info("payment intent attached", { orderId, paymentIntentId });
  await recordOrderEvent(orderId, {
    kind: "payment_intent_attached",
    by: "system",
    details: { paymentIntentId },
  });
}

export async function attachStripeSession(
  orderId: string,
  sessionId: string,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection(FIRESTORE_COLLECTION).doc(orderId).update({
    stripeSessionId: sessionId,
    updatedAt: new Date().toISOString(),
  });
  await recordOrderEvent(orderId, {
    kind: "stripe_session_attached",
    by: "system",
    details: { sessionId },
  });
}

export async function transitionStatus(
  orderId: string,
  to: OrderStatus,
  by: string,
  note?: string,
): Promise<Order> {
  const db = requireFirebaseAdminDb();
  const docRef = db.collection(FIRESTORE_COLLECTION).doc(orderId);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error(`bureau order ${orderId} not found`);
  }
  const order = snap.data() as Order;
  const now = new Date().toISOString();
  const update: Partial<Order> & { updatedAt: string; notes?: string } = {
    status: to,
    updatedAt: now,
  };
  if (to === "paid") update.paidAt = now;
  if (to === "fulfilled") update.fulfilledAt = now;
  if (note) update.notes = note;
  await docRef.update(update);
  log.info("bureau order status transition", {
    orderId,
    from: order.status,
    to,
    by,
  });
  await recordOrderEvent(orderId, {
    kind: "status_transitioned",
    by,
    prevStatus: order.status,
    nextStatus: to,
    details: note ? { note } : undefined,
  });
  return { ...order, ...update } as Order;
}

/**
 * Append-only audit log. Every meaningful side-effect on an order
 * writes a row here. The log is the source of truth for dispute
 * defence (chargebacks, refund claims) and for the operator
 * dashboard's timeline view.
 *
 * Writes are best-effort: a Firestore failure here is logged but
 * does not block the parent operation. The order document remains
 * the system of record for state; the log is provenance.
 */
export async function recordOrderEvent(
  orderId: string,
  event: {
    kind: BureauOrderEventKind;
    by: string;
    prevStatus?: OrderStatus;
    nextStatus?: OrderStatus;
    details?: Record<string, string | number | boolean | null> | undefined;
  },
): Promise<void> {
  try {
    const db = requireFirebaseAdminDb();
    const eventId = mintEventId();
    const row: BureauOrderEvent = {
      id: eventId,
      orderId,
      kind: event.kind,
      by: event.by,
      at: new Date().toISOString(),
      ...(event.prevStatus !== undefined ? { prevStatus: event.prevStatus } : {}),
      ...(event.nextStatus !== undefined ? { nextStatus: event.nextStatus } : {}),
      ...(event.details !== undefined ? { details: event.details } : {}),
    };
    await db
      .collection(FIRESTORE_COLLECTION)
      .doc(orderId)
      .collection(EVENTS_SUBCOLLECTION)
      .doc(eventId)
      .set(row);
  } catch (err) {
    log.warn("audit log write failed", {
      orderId,
      kind: event.kind,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Returns the audit log for an order in chronological order
 *  (oldest first). Used by the operator-dashboard timeline view. */
export async function listOrderEvents(
  orderId: string,
): Promise<BureauOrderEvent[]> {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .doc(orderId)
    .collection(EVENTS_SUBCOLLECTION)
    .orderBy("id", "asc")
    .get();
  return snap.docs.map((d) => d.data() as BureauOrderEvent);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const db = requireFirebaseAdminDb();
  const snap = await db.collection(FIRESTORE_COLLECTION).doc(orderId).get();
  return snap.exists ? (snap.data() as Order) : null;
}

export async function getOrderByPaymentIntent(
  paymentIntentId: string,
): Promise<Order | null> {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0]!.data() as Order;
}

/** Snapshot of a Quote — used as the source of truth for the price
 *  on the order doc at creation time. */
export function priceFromQuote(quote: Quote): number {
  return quote.priceGbp;
}
