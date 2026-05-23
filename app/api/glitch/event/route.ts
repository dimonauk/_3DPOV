/**
 * POST /api/glitch/event — server-push glitch events.
 *
 * The browser fires most glitch events directly into the Zustand
 * store. This route exists for the cases the browser can't observe:
 *
 *   - server-rendered surfaces that want to credit the visitor for
 *     reaching a particular page or completing a particular flow
 *   - Python bench services (chrono-protocol score landing, watcher
 *     reconciliations) that want to nudge the visitor's signature
 *   - admin scripts seeding a signature for test accounts
 *
 * The route validates against the closed `GlitchFamily` enum,
 * rate-limits per IP, and persists to Firestore via the Admin SDK so
 * an abuser can't write arbitrary counts. Persistence is best-effort:
 * when Firebase Admin isn't configured (local dev), the event is
 * still logged and the route returns 200 so the caller's flow isn't
 * coupled to Firestore availability.
 *
 * Body:
 *   {
 *     family: GlitchFamily,           // closed enum
 *     uid?: string,                   // anonymous-auth uid; required for persistence
 *     meta?: Record<string, unknown>, // ≤ 4KB stringified
 *   }
 *
 * Response:
 *   200 { ok: true, token: GlitchToken }
 *   400 invalid body / unknown family / meta too large
 *   429 rate-limited
 */

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { withRouteLogging, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import { getFirebaseAdminDb } from "lib/firebase/admin";
import {
  GlitchFamily,
  type GlitchToken,
} from "lib/glitch/taxonomy";

const RATE_LIMIT_PER_MIN = 30;
const MAX_META_BYTES = 4 * 1024;

const limiter = createFixedWindowLimiter({
  scope: "api.glitch.event",
  limit: RATE_LIMIT_PER_MIN,
  windowMs: 60_000,
});

export const POST = withRouteLogging(
  "api.glitch.event",
  async (req: NextRequest, _ctx, log) => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const limit = await limiter.consume(`ip:${ip}`);
    if (!limit.ok) {
      log.info("glitch_event:rate_limited", { ip, backend: limiter.backend });
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    let body: {
      family?: string;
      uid?: string;
      meta?: Record<string, unknown>;
    };
    try {
      body = await req.json();
    } catch (err) {
      log.warn("glitch_event:invalid_json", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const family = body.family;
    if (typeof family !== "string" || !(family in GlitchFamily)) {
      log.warn("glitch_event:unknown_family", { family });
      return NextResponse.json({ error: "unknown_family" }, { status: 400 });
    }

    const meta = body.meta ?? {};
    if (typeof meta !== "object" || meta === null || Array.isArray(meta)) {
      return NextResponse.json({ error: "invalid_meta" }, { status: 400 });
    }
    if (JSON.stringify(meta).length > MAX_META_BYTES) {
      return NextResponse.json({ error: "meta_too_large" }, { status: 400 });
    }

    const familyKey = family as keyof typeof GlitchFamily;
    const token: GlitchToken = {
      id: randomUUID(),
      family: familyKey,
      genre: GlitchFamily[familyKey].genre,
      firedAt: Date.now(),
      meta,
    };

    // Persist when we have both a uid and a configured Admin SDK.
    // Best-effort: failures log + degrade, the response still succeeds
    // so the caller's flow isn't blocked by Firestore.
    const uid = typeof body.uid === "string" && body.uid.length > 0 ? body.uid : null;
    if (uid) {
      const db = getFirebaseAdminDb();
      if (db) {
        try {
          await db
            .collection("glitch-signatures")
            .doc(uid)
            .collection("events")
            .doc(token.id)
            .set({ ...token, ip });
        } catch (err) {
          log.warn("glitch_event:persist_failed", {
            err: errToObject(err),
            uid,
            family: familyKey,
          });
        }
      } else {
        log.debug("glitch_event:admin_unconfigured", { uid });
      }
    }

    log.info("glitch_event:fired", {
      family: familyKey,
      genre: token.genre,
      uid: uid ?? null,
    });

    return NextResponse.json({ ok: true, token });
  },
);
