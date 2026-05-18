/**
 * app/api/admin/printfiles/[id]/status/route.ts
 *
 * Operator updates the status of a printfile order from the dashboard.
 * Gated to admin emails. Validates the requested next-state against
 * the order's current state (no skipping from "received" → "shipped"
 * without going through queued/sent-to-farm; prevents data drift).
 */

import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { isAdminEmail } from "lib/auth/admin-emails";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";

import {
  FIRESTORE_COLLECTION,
  type PrintfilesOrder,
  type PrintfilesOrderStatus,
} from "lib/printfiles/types";

export const dynamic = "force-dynamic";

const log = createLogger("api.admin.printfiles.status");

const VALID_STATUSES: PrintfilesOrderStatus[] = [
  "received",
  "queued",
  "sent-to-farm",
  "printing",
  "shipped",
  "delivered",
  "rejected",
  "errored",
];

/** Allowed transitions. Keeps the lifecycle honest. */
const TRANSITIONS: Record<PrintfilesOrderStatus, PrintfilesOrderStatus[]> = {
  received: ["queued", "rejected", "errored"],
  queued: ["sent-to-farm", "rejected", "errored"],
  "sent-to-farm": ["printing", "shipped", "errored"],
  printing: ["shipped", "errored"],
  shipped: ["delivered"],
  delivered: [],
  rejected: [],
  errored: ["queued", "rejected"],
};

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1]!.trim() : null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const token = bearer(req);
  if (!token) {
    return NextResponse.json({ error: "missing bearer" }, { status: 401 });
  }
  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch (err) {
    log.warn("verifyIdToken failed", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  if (!isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const next = body.status?.trim();
  if (!next || !VALID_STATUSES.includes(next as PrintfilesOrderStatus)) {
    return NextResponse.json(
      { error: "invalid status", valid: VALID_STATUSES },
      { status: 400 },
    );
  }
  const nextStatus = next as PrintfilesOrderStatus;

  const db = requireFirebaseAdminDb();
  const docRef = db.collection(FIRESTORE_COLLECTION).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const order = snap.data() as PrintfilesOrder;

  const allowed = TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      {
        error: "illegal transition",
        from: order.status,
        to: nextStatus,
        allowed,
      },
      { status: 409 },
    );
  }

  await docRef.update({
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  });
  log.info("status updated", {
    orderId: id,
    from: order.status,
    to: nextStatus,
    operator: decoded.email,
  });

  return NextResponse.json({ ok: true, id, status: nextStatus });
}
