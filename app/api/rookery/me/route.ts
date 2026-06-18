import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { createLogger } from "lib/log";
import {
  getSubscription,
  isSubscriberActive,
} from "lib/rookery/subscriptions";

export const dynamic = "force-dynamic";

const log = createLogger("api.rookery.me");

/**
 * GET /api/rookery/me — return the caller's Rookery subscription state.
 *
 * Auth: `Authorization: Bearer <firebaseIdToken>`. Same pattern as
 * `/api/rookery/onboarding`. No bearer = 401; bad bearer = 401.
 *
 * Response:
 *   { active: boolean,
 *     tier: "perch" | "nest" | "fledge" | null,
 *     status: "active" | "past_due" | "canceled" | "incomplete" | null,
 *     foundingMember: boolean,
 *     currentPeriodEndMs: number | null }
 *
 * Used by the /rookery/new gate to decide whether to render the
 * thread form or the "Join a tier" CTA.
 */
export async function GET(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return NextResponse.json(
      { error: "Missing bearer token" },
      { status: 401 },
    );
  }

  let uid: string;
  try {
    const decoded = await verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    log.warn("verifyIdToken failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const sub = await getSubscription(uid);
    const active = await isSubscriberActive(uid);
    return NextResponse.json({
      active,
      tier: sub?.tier ?? null,
      status: sub?.status ?? null,
      foundingMember: sub?.foundingMember ?? false,
      currentPeriodEndMs: sub?.currentPeriodEndMs ?? null,
    });
  } catch (err) {
    log.error("getSubscription failed", {
      uid,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Could not read subscription state" },
      { status: 500 },
    );
  }
}
