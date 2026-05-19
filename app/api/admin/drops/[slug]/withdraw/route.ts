/**
 * POST /api/admin/drops/[slug]/withdraw — operator pulls a drop from
 * the public feed.
 *
 * Sets `status: "withdrawn"` on the drop record. The public read path
 * (`getDropBySlug` followed by `drop.status !== "published"` check on
 * `/drops/[slug]`) will then 404 the URL; the catalogue grid filters
 * to `status === "published"` so it disappears there too.
 *
 * Existing entitlements (rows under `users/{uid}/editions/`) are
 * untouched — buyers who already claimed keep their claim.
 */

import { NextResponse } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import {
  getFirebaseAdminDb,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

const log = createLogger("api.admin.drops.withdraw");

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let operatorUid: string;
  let operatorEmail: string | null;
  let operatorRole: string | null = null;
  try {
    const decoded = await verifyIdToken(
      authHeader.slice("bearer ".length).trim(),
    );
    operatorUid = decoded.uid;
    operatorEmail = decoded.email?.toLowerCase() ?? null;
    operatorRole =
      typeof (decoded as unknown as Record<string, unknown>).role === "string"
        ? ((decoded as unknown as Record<string, unknown>).role as string)
        : null;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  if (operatorRole !== "operator" && !isAdminEmail(operatorEmail)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "firestore_unavailable" },
      { status: 503 },
    );
  }

  const ref = db.collection("drops").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
  }

  await ref.update({
    status: "withdrawn",
    withdrawnAt: new Date().toISOString(),
    withdrawnBy: operatorUid,
    updatedAt: new Date().toISOString(),
  });

  log.info("drop withdrawn", { slug, operatorUid });
  return NextResponse.json({ ok: true, slug });
}
