/**
 * app/api/admin/import/google/status/route.ts — Is the operator
 * connected to Google?
 *
 * GET /api/admin/import/google/status
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Returns either { connected: false }
 *       or { connected: true, scopes: string[], connectedAt: string }
 */

import { NextResponse } from "next/server";

import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { getStoredOperatorTokens } from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const stored = await getStoredOperatorTokens(admin.uid);
    if (!stored) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }
    return NextResponse.json(
      {
        connected: true,
        scopes: stored.googleScopes ?? [],
        connectedAt: stored.googleConnectedAt,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status read failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
