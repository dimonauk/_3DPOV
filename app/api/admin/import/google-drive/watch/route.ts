/**
 * app/api/admin/import/google-drive/watch/route.ts — Record a Drive
 * folder to watch (stub; cron polling deferred).
 *
 * POST { folderId: string }
 *   Appends folderId to operatorIntegrations/{uid}.watchedDriveFolders[]
 *   (de-duped). Returns the current list back.
 *
 * The actual periodic-sync cron job is a follow-up — this route just
 * captures intent so a future scheduler has something to read.
 */

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";

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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const folderId =
    typeof (json as { folderId?: unknown })?.folderId === "string"
      ? (json as { folderId: string }).folderId
      : "";
  if (!folderId) {
    return NextResponse.json({ error: "Missing folderId." }, { status: 400 });
  }

  try {
    const db = requireFirebaseAdminDb();
    const ref = db.collection("operatorIntegrations").doc(admin.uid);
    await ref.set(
      {
        watchedDriveFolders: FieldValue.arrayUnion(folderId),
      },
      { merge: true },
    );
    const snap = await ref.get();
    const data = snap.data() as
      | { watchedDriveFolders?: string[] }
      | undefined;
    return NextResponse.json(
      { watchedDriveFolders: data?.watchedDriveFolders ?? [folderId] },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write failed." },
      { status: 500 },
    );
  }
}
