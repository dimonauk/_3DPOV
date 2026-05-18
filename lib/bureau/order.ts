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
  CreateOrderRequest,
  Order,
  OrderStatus,
  Quote,
  ShippingAddress,
} from "./types";

const log = createLogger("bureau.order");

export const FIRESTORE_COLLECTION = "bureau_orders" as const;

export function mintOrderId(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `bo-${y}${m}${d}-${hex}`;
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
  return { ...order, ...update } as Order;
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
