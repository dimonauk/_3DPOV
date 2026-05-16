import { NextResponse, type NextRequest } from "next/server";
import { verifyIdToken, requireFirebaseAdminDb } from "lib/firebase/admin";
import { enrichLead, isEnrichmentConfigured } from "lib/cards/enrich-server";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/cards/[slug]/leads/[leadId]/enrich — run AI enrichment
 * for an existing lead and persist the result back to the lead doc.
 *
 * Auth: owner-only. Caller's uid must match cards/<slug>.ownerUid.
 *
 * Rate limiting: implicit via Anthropic API spend — owners are
 * highly motivated to enrich only the leads they care about (one
 * click per lead, easily auditable in the dashboard).
 *
 * Responses:
 *   200 → { enrichment, alreadyEnriched? }
 *   401 → unauthenticated
 *   403 → not the card owner
 *   404 → unknown card or unknown lead
 *   503 → ANTHROPIC_API_KEY not configured
 *   502 → upstream Anthropic API error
 *
 * On success, enrichment is stored at the lead document path:
 *   cards/<slug>/leads/<leadId>.enrichment = { ... }
 *   cards/<slug>/leads/<leadId>.enrichedAt = serverTimestamp
 *
 * The leads list endpoint already returns the full lead doc, so the
 * dashboard automatically picks up the enrichment on its next reload.
 */

type Params = { params: Promise<{ slug: string; leadId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug, leadId } = await params;

  if (!isEnrichmentConfigured()) {
    return NextResponse.json(
      {
        error: "enrichment_not_configured",
        message:
          "AI enrichment needs ANTHROPIC_API_KEY in Vercel env vars. Set it and the feature activates everywhere.",
      },
      { status: 503 },
    );
  }

  // Auth.
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  // DB access.
  let db: FirebaseFirestore.Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return NextResponse.json({ error: "no_admin" }, { status: 503 });
  }

  // Ownership check.
  const cardSnap = await db.collection("cards").doc(slug).get();
  if (!cardSnap.exists) {
    return NextResponse.json({ error: "card_not_found" }, { status: 404 });
  }
  const card = cardSnap.data() as { ownerUid?: string };
  if (card.ownerUid !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Fetch the lead.
  const leadRef = db
    .collection("cards")
    .doc(slug)
    .collection("leads")
    .doc(leadId);
  const leadSnap = await leadRef.get();
  if (!leadSnap.exists) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }
  const lead = leadSnap.data() as {
    email?: string;
    name?: string;
    message?: string;
    enrichment?: Record<string, unknown>;
  };
  if (!lead.email) {
    return NextResponse.json(
      { error: "no_email", message: "Lead has no email to enrich from." },
      { status: 400 },
    );
  }

  // Allow body to override the force-flag — owner may want to re-enrich.
  let force = false;
  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as { force?: boolean };
    force = Boolean(body.force);
  } catch {
    // ignore
  }

  if (lead.enrichment && !force) {
    return NextResponse.json({
      ok: true,
      alreadyEnriched: true,
      enrichment: lead.enrichment,
    });
  }

  try {
    const enrichment = await enrichLead({
      email: lead.email,
      name: lead.name,
      message: lead.message,
    });
    await leadRef.update({
      enrichment,
      enrichedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, enrichment });
  } catch (err) {
    const msg = (err as Error).message ?? "unknown_error";
    console.error("Enrichment error:", msg);
    return NextResponse.json(
      { error: "enrich_failed", message: msg },
      { status: 502 },
    );
  }
}

/**
 * DELETE /api/cards/[slug]/leads/[leadId]/enrich — clear an
 * enrichment from a lead (e.g. it was wrong, owner wants to re-run).
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug, leadId } = await params;

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  let db: FirebaseFirestore.Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return NextResponse.json({ error: "no_admin" }, { status: 503 });
  }

  const cardSnap = await db.collection("cards").doc(slug).get();
  if (!cardSnap.exists) {
    return NextResponse.json({ error: "card_not_found" }, { status: 404 });
  }
  const card = cardSnap.data() as { ownerUid?: string };
  if (card.ownerUid !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await db
    .collection("cards")
    .doc(slug)
    .collection("leads")
    .doc(leadId)
    .update({
      enrichment: FieldValue.delete(),
      enrichedAt: FieldValue.delete(),
    });

  return NextResponse.json({ ok: true });
}
