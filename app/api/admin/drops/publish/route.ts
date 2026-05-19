/**
 * app/api/admin/drops/publish/route.ts — Operator drop-publish endpoint.
 *
 * POST { DropPublishInput }
 *
 * Flow:
 *   1. Verify Firebase ID token on `Authorization: Bearer …`.
 *   2. Gate on operator role:
 *      - Primary check: decoded `role` custom claim === "operator".
 *      - Fallback: email on the `ADMIN_EMAILS` allow-list (matches the
 *        rest of the admin routes — see `lib/integrations/google/admin-guard.ts`).
 *      The double gate keeps the spec contract (`token.role === 'operator'`)
 *      and stays compatible with existing operators whose accounts
 *      don't yet have a role claim set.
 *   3. Validate body with Zod.
 *   4. Hand off to `publishDrop()`.
 *
 * Returns:
 *   - 201 { drop }                             on success
 *   - 400 { error: "gate_failed", oracle, sieve, message } on gate fail
 *   - 400 { error, issues }                    on validation fail
 *   - 401 / 403                                on auth fail
 *   - 5xx { error }                            on persistence fail
 */

import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFirebaseAdminAuth } from "lib/firebase/admin";
import { isAdminEmail } from "lib/auth/admin-emails";
import { createLogger, errToObject } from "lib/log";
import { DropPublishGateError, publishDrop } from "lib/drops/publish";
import type { DropPublishInput } from "lib/drops/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const log = createLogger("api.admin.drops.publish");

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const TierIncludedSchema = z.object({
  member: z.boolean(),
  patron: z.boolean(),
  atelier: z.boolean(),
});

const EditionConfigSchema = z.object({
  unique: z.literal(true),
  limitedSize: z.number().int().min(0).max(10_000),
  openEnabled: z.boolean(),
});

const FirstRefusalRadiusSchema = z.enum([
  "parent-only",
  "parent+grandparent+siblings-of-parent",
  "full-kingdom",
]);

const DropPublishInputSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(120),
  summary: z.string().trim().min(1, "summary is required").max(2_000),
  genomeId: z.string().trim().min(1, "genomeId is required"),
  parentageChain: z.array(z.string()).optional(),
  edition: EditionConfigSchema,
  tierIncluded: TierIncludedSchema,
  firstRefusalRadius: FirstRefusalRadiusSchema,
  passkitEnabled: z.boolean(),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function extractBearer(req: Request): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m && m[1] ? m[1].trim() : null;
}

type OperatorContext = {
  uid: string;
  email: string | undefined;
  source: "role-claim" | "admin-allow-list";
};

async function requireOperator(req: Request): Promise<OperatorContext> {
  const token = extractBearer(req);
  if (!token) {
    throw new OperatorAuthError(401, "Missing Authorization: Bearer <idToken>");
  }
  const auth = requireFirebaseAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  const role = typeof decoded["role"] === "string" ? decoded["role"] : undefined;
  if (role === "operator") {
    return {
      uid: decoded.uid,
      email: decoded.email,
      source: "role-claim",
    };
  }
  if (isAdminEmail(decoded.email)) {
    return {
      uid: decoded.uid,
      email: decoded.email,
      source: "admin-allow-list",
    };
  }
  throw new OperatorAuthError(
    403,
    `Not authorised: account ${decoded.email ?? "(no email)"} does not have the operator role and is not on the admin allow-list.`,
  );
}

class OperatorAuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "OperatorAuthError";
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // --- Auth -----------------------------------------------------------
  let operator: OperatorContext;
  try {
    operator = await requireOperator(req);
  } catch (err) {
    if (err instanceof OperatorAuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // --- Body parse -----------------------------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Expected application/json body" },
      { status: 400 },
    );
  }

  const parsed = DropPublishInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const input: DropPublishInput = parsed.data;

  // --- Publish --------------------------------------------------------
  try {
    const drop = await publishDrop(input, operator.uid);
    log.info("drop published", {
      dropId: drop.id,
      genomeId: drop.genomeId,
      operator: operator.email ?? operator.uid,
      authSource: operator.source,
    });
    return NextResponse.json({ drop }, { status: 201 });
  } catch (err) {
    if (err instanceof DropPublishGateError) {
      return NextResponse.json(
        {
          error: "gate_failed",
          oracle: err.oracle,
          sieve: err.sieve,
          message: err.message,
        },
        { status: 400 },
      );
    }
    log.error("drop publish failed", { err: errToObject(err) });
    const message = err instanceof Error ? err.message : "publish failed";
    const status = /not configured/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
