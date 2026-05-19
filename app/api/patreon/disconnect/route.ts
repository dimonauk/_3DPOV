/**
 * POST /api/patreon/disconnect — let a signed-in user clear their
 * Patreon-derived tier claim and (optionally) the stashed Patreon ID.
 *
 * Use case: a supporter changes their Patreon email so the auto-sync
 * stops working and wants to unbind the stale link before re-linking
 * from the new email; or wants to opt out entirely.
 *
 * Auth: Authorization: Bearer <Firebase ID token>.
 *
 * Note: this does NOT cancel the Patreon pledge — that's only doable
 * via Patreon itself. It only removes the tier claim from the Firebase
 * user record. The next time the Patreon webhook fires
 * (`members:update`, monthly billing cycle, etc.) the claim will be
 * re-applied automatically. To permanently disconnect, the user must
 * cancel on Patreon's side.
 */

import { NextResponse } from "next/server";

import {
  requireFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

const log = createLogger("api.patreon.disconnect");

export async function POST(req: Request): Promise<Response> {
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.slice("bearer ".length).trim();

  let uid: string;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  const auth = requireFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;

  const next: Record<string, unknown> = { ...existing };
  delete next.tier;
  delete next.tierStartedAt;
  delete next.lifetimePledgeCents;
  delete next.patreonId;

  await auth.setCustomUserClaims(uid, next);
  log.info("patreon claim cleared", { uid });

  return NextResponse.json({ ok: true, cleared: true });
}
