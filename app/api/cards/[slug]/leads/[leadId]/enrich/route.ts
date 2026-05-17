import { NextResponse, type NextRequest } from "next/server";
import { verifyIdToken, requireFirebaseAdminDb } from "lib/firebase/admin";
import { enrichLead, isEnrichmentConfigured } from "lib/cards/enrich-server";
import { FieldValue } from "firebase-admin/firestore";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * POST   /api/cards/[slug]/leads/[leadId]/enrich
 * DELETE /api/cards/[slug]/leads/[leadId]/enrich
 *
 * Run / clear AI enrichment for a lead. Owner-only, authed via
 * Firebase ID token. See lib/cards/enrich-server.ts for details
 * of the enrichment payload.
 *
 * Every response carries X-Request-Id for log correlation.
 */

export const maxDuration = 60;

type Params = { params: Promise<{ slug: string; leadId: string }> };

export const POST = withRouteLogging<Params>(
  "cards.leads.enrich.post",
  async (req: NextRequest, { params }, log) => {
    const { slug, leadId } = await params;
    log.debug("params", { slug, leadId });

    if (!isEnrichmentConfigured()) {
      log.warn("enrichment_not_configured");
      return NextResponse.json(
        {
          error: "enrichment_not_configured",
          message:
            "AI enrichment needs AI_GATEWAY_API_KEY in Vercel env vars. Set it and the feature activates everywhere.",
        },
        { status: 503 },
      );
    }

    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      log.info("auth:missing_token");
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    let uid: string;
    try {
      uid = (await verifyIdToken(token)).uid;
    } catch (err) {
      log.warn("auth:invalid_token", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    let db: FirebaseFirestore.Firestore;
    try {
      db = requireFirebaseAdminDb();
    } catch (err) {
      log.error("admin:misconfigured", { err: errToObject(err) });
      return NextResponse.json({ error: "no_admin" }, { status: 503 });
    }

    const cardSnap = await db.collection("cards").doc(slug).get();
    if (!cardSnap.exists) {
      log.info("card:not_found", { slug });
      return NextResponse.json({ error: "card_not_found" }, { status: 404 });
    }
    const card = cardSnap.data() as { ownerUid?: string };
    if (card.ownerUid !== uid) {
      log.warn("ownership:mismatch", { slug, uid, ownerUid: card.ownerUid });
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const leadRef = db
      .collection("cards")
      .doc(slug)
      .collection("leads")
      .doc(leadId);
    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      log.info("lead:not_found", { slug, leadId });
      return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
    }
    const lead = leadSnap.data() as {
      email?: string;
      name?: string;
      message?: string;
      enrichment?: Record<string, unknown>;
    };
    if (!lead.email) {
      log.info("lead:no_email", { slug, leadId });
      return NextResponse.json(
        { error: "no_email", message: "Lead has no email to enrich from." },
        { status: 400 },
      );
    }

    let force = false;
    try {
      const body = (await req.json().catch(() => ({}))) as { force?: boolean };
      force = Boolean(body.force);
    } catch (err) {
      log.debug("body:parse_failed_ignored", { err: errToObject(err) });
    }

    if (lead.enrichment && !force) {
      log.info("enrich:returned_cached", { slug, leadId });
      return NextResponse.json({
        ok: true,
        alreadyEnriched: true,
        enrichment: lead.enrichment,
      });
    }

    log.info("enrich:start", { slug, leadId, force });
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
      log.info("enrich:ok", {
        slug,
        leadId,
        confidence: enrichment.confidence,
        hasCompany: !!enrichment.company,
        hasIndustry: !!enrichment.industry,
      });
      return NextResponse.json({ ok: true, enrichment });
    } catch (err) {
      const msg = (err as Error).message ?? "unknown_error";
      log.error("enrich:failed", { slug, leadId, err: errToObject(err) });
      return NextResponse.json(
        { error: "enrich_failed", message: msg },
        { status: 502 },
      );
    }
  },
);

export const DELETE = withRouteLogging<Params>(
  "cards.leads.enrich.delete",
  async (req: NextRequest, { params }, log) => {
    const { slug, leadId } = await params;

    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    let uid: string;
    try {
      uid = (await verifyIdToken(token)).uid;
    } catch (err) {
      log.warn("auth:invalid_token", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    let db: FirebaseFirestore.Firestore;
    try {
      db = requireFirebaseAdminDb();
    } catch (err) {
      log.error("admin:misconfigured", { err: errToObject(err) });
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
    log.info("enrich:cleared", { slug, leadId });

    return NextResponse.json({ ok: true });
  },
);
