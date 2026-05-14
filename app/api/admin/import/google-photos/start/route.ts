/**
 * app/api/admin/import/google-photos/start/route.ts — Create a Photos
 * Picker session for the operator.
 *
 * POST /api/admin/import/google-photos/start
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Returns: { sessionId, pickerUri, pollingInterval }
 *
 * The operator's browser opens `pickerUri` in a new tab; meanwhile
 * the import page polls /poll until mediaItemsSet === true.
 */

import { NextResponse } from "next/server";

import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";
import { createPickerSession } from "lib/integrations/google/photos-picker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
    const accessToken = await getOperatorAccessToken(admin.uid);
    const session = await createPickerSession(accessToken);
    return NextResponse.json(
      {
        sessionId: session.id,
        pickerUri: session.pickerUri,
        pollingInterval: session.pollingConfig?.pollInterval ?? "2s",
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create picker session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
