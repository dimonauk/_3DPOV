/**
 * app/api/admin/import/google-drive/list/route.ts — List a Drive folder.
 *
 * GET /api/admin/import/google-drive/list?folderId=…&mediaOnly=1
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Returns: { files: DriveFile[], nextPageToken?: string }
 *
 * `folderId=root` walks the user's My Drive root. `mediaOnly` filters
 * to images, videos, and subfolders — which is what the importer needs
 * 99% of the time.
 */

import { NextResponse } from "next/server";

import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { listFolderContents } from "lib/integrations/google/drive";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";

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

  const url = new URL(req.url);
  const folderId = url.searchParams.get("folderId") ?? "root";
  const mediaOnly = url.searchParams.get("mediaOnly") !== "0";
  const pageToken = url.searchParams.get("pageToken") ?? undefined;

  try {
    const accessToken = await getOperatorAccessToken(admin.uid);
    const result = await listFolderContents(accessToken, folderId, {
      mediaOnly,
      pageToken,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Drive list failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
