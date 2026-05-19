/**
 * POST /api/admin/agents/research/index — Operator route that triggers
 * the one-shot internal-docs indexer.
 *
 * One-line role: kick the `indexInternalDocs` walker across every
 * doc directory in the repo and write a `ResearchEntry` per (doc,
 * specialist) pair. Admin-gated. No body needed.
 *
 * Returns:
 *   { ok: true, scanned: number, indexed: number,
 *     perSpecialist: Record<string, number>, missingRoots: string[],
 *     finishedAt: string }
 *
 * Auth: Authorization: Bearer <Firebase ID token>; the token's email
 * must be in `ADMIN_EMAILS` (case-insensitive) OR the token must
 * carry a `role=operator` custom claim.
 *
 * maxDuration is 300 because the indexer walks ~100 articles plus the
 * docs tree and writes one Firestore doc per (doc × specialist) — a
 * cold run is in the low minutes range. The runtime is whatever
 * Next/Vercel picks for an API route in this app (do NOT pin
 * `runtime = "nodejs"` here — the rest of the admin tree leaves it
 * default and that's the convention).
 */

import { NextResponse } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { indexInternalDocs } from "lib/agents/research/index-internal-docs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api.admin.agents.research.index");

export async function POST(req: Request): Promise<Response> {
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

  const isOperator =
    operatorRole === "operator" || isAdminEmail(operatorEmail);
  if (!isOperator) {
    log.warn("non-operator tried to trigger research index", {
      operatorUid,
      operatorEmail,
    });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  log.info("indexInternalDocs: starting", { operatorUid });
  const started = Date.now();
  try {
    const result = await indexInternalDocs();
    log.info("indexInternalDocs: done", {
      operatorUid,
      durMs: Date.now() - started,
      scanned: result.scanned,
      indexed: result.indexed,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error("indexInternalDocs failed", {
      operatorUid,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "index_failed", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
