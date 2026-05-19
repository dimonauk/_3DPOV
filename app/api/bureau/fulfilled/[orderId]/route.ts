/**
 * app/api/bureau/fulfilled/[orderId]/route.ts — POST { tracking }.
 *
 * Operator marks a bureau order shipped + attaches tracking. Triggers
 * the customer's "your print is on its way" email.
 */

import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { isAdminEmail } from "lib/auth/admin-emails";
import { createLogger, errToObject } from "lib/log";

import { getOrder, transitionStatus } from "lib/bureau/order";

export const dynamic = "force-dynamic";

const log = createLogger("api.bureau.fulfilled");

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1]!.trim() : null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  const { orderId } = await ctx.params;
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "missing bearer" }, { status: 401 });

  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch (err) {
    log.warn("token verify failed", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  if (!isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { tracking?: { carrier?: string; number?: string; url?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const tracking = body.tracking;
  if (!tracking?.carrier || !tracking?.number || !tracking?.url) {
    return NextResponse.json(
      { error: "tracking { carrier, number, url } required" },
      { status: 400 },
    );
  }

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (order.status !== "paid" && order.status !== "fulfilling") {
    return NextResponse.json(
      { error: `cannot fulfil from status "${order.status}"`, requires: "paid | fulfilling" },
      { status: 409 },
    );
  }

  await transitionStatus(
    orderId,
    "fulfilled",
    decoded.email ?? "operator",
    `Shipped via ${tracking.carrier} #${tracking.number} (${tracking.url}).`,
  );
  // TODO: send Resend email with the tracking link.
  log.info("bureau order fulfilled", { orderId, operator: decoded.email });

  return NextResponse.json({ ok: true, orderId, status: "fulfilled", tracking });
}
