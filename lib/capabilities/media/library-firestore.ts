/**
 * lib/capabilities/media/library-firestore.ts — Firestore metadata store.
 *
 * One-line role: CRUD for `Media` records in the `media` collection.
 * Uses the admin SDK (server-only) so writes don't have to go through
 * the client SDK's permission model — the operator admin route is
 * already gated by Firebase Auth + an allow-list on the operator's
 * email; this layer trusts that gate.
 *
 * # Firestore rules
 * The `media` collection is admin-write only (no client writes).
 * Reads are public (the URL is the canonical reference, no extra
 * lookup token needed). See `firestore.rules` for the policy text.
 */

import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { requireFirebaseAdminDb } from "lib/firebase/admin";

import {
  MediaLibraryError,
  type Media,
  type MediaPage,
  type MediaQuery,
} from "./library-types";

const COLLECTION = "media";

function toFirestoreData(media: Media): Record<string, unknown> {
  const data: Record<string, unknown> = {
    id: media.id,
    kind: media.kind,
    subject: media.subject,
    source: media.source,
    url: media.url,
    mimeType: media.mimeType,
    uploadedAt: Timestamp.fromDate(new Date(media.uploadedAt)),
    uploadedBy: media.uploadedBy,
  };
  if (media.title !== undefined) data["title"] = media.title;
  if (media.description !== undefined) data["description"] = media.description;
  if (media.capturedAt !== undefined)
    data["capturedAt"] = Timestamp.fromDate(new Date(media.capturedAt));
  if (media.width !== undefined) data["width"] = media.width;
  if (media.height !== undefined) data["height"] = media.height;
  if (media.durationSeconds !== undefined)
    data["durationSeconds"] = media.durationSeconds;
  if (media.sizeBytes !== undefined) data["sizeBytes"] = media.sizeBytes;
  if (media.sha256 !== undefined) data["sha256"] = media.sha256;
  if (media.tags !== undefined) data["tags"] = media.tags;
  if (media.location !== undefined) data["location"] = media.location;
  if (media.sourceRef !== undefined) data["sourceRef"] = media.sourceRef;
  if (media.variants !== undefined) data["variants"] = media.variants;
  if (media.retired !== undefined) data["retired"] = media.retired;
  return data;
}

function fromFirestoreData(id: string, data: Record<string, unknown>): Media {
  const get = <T>(k: string): T | undefined =>
    data[k] !== undefined ? (data[k] as T) : undefined;
  const ts = (k: string): string | undefined => {
    const v = data[k];
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    return undefined;
  };
  return {
    id,
    kind: data["kind"] as Media["kind"],
    subject: data["subject"] as Media["subject"],
    source: data["source"] as Media["source"],
    url: data["url"] as string,
    mimeType: data["mimeType"] as string,
    uploadedAt: ts("uploadedAt") ?? new Date(0).toISOString(),
    uploadedBy: data["uploadedBy"] as string,
    title: get<string>("title"),
    description: get<string>("description"),
    capturedAt: ts("capturedAt"),
    width: get<number>("width"),
    height: get<number>("height"),
    durationSeconds: get<number>("durationSeconds"),
    sizeBytes: get<number>("sizeBytes"),
    sha256: get<string>("sha256"),
    tags: get<string[]>("tags"),
    location: get<Media["location"]>("location"),
    sourceRef: get<Media["sourceRef"]>("sourceRef"),
    variants: get<Media["variants"]>("variants"),
    retired: get<boolean>("retired"),
  };
}

export async function writeMediaRecord(media: Media): Promise<void> {
  const db = requireFirebaseAdminDb();
  try {
    await db.collection(COLLECTION).doc(media.id).set(toFirestoreData(media));
  } catch (err) {
    throw new MediaLibraryError(
      `Firestore write failed: ${err instanceof Error ? err.message : String(err)}`,
      "metadata-write-failed",
    );
  }
}

export async function getMediaRecord(id: string): Promise<Media | null> {
  const db = requireFirebaseAdminDb();
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return fromFirestoreData(id, snap.data() ?? {});
}

export async function deleteMediaRecord(id: string): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection(COLLECTION).doc(id).delete();
}

export async function listMediaRecords(q: MediaQuery): Promise<MediaPage> {
  const db = requireFirebaseAdminDb();
  let ref: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (q.subject) {
    const subjects = Array.isArray(q.subject) ? q.subject : [q.subject];
    if (subjects.length === 1 && subjects[0] !== undefined) {
      ref = ref.where("subject", "==", subjects[0]);
    } else if (subjects.length > 1) {
      ref = ref.where("subject", "in", subjects.slice(0, 10));
    }
  }
  if (q.kind) {
    const kinds = Array.isArray(q.kind) ? q.kind : [q.kind];
    if (kinds.length === 1 && kinds[0] !== undefined) {
      ref = ref.where("kind", "==", kinds[0]);
    } else if (kinds.length > 1) {
      ref = ref.where("kind", "in", kinds.slice(0, 10));
    }
  }
  if (q.source) {
    const sources = Array.isArray(q.source) ? q.source : [q.source];
    if (sources.length === 1 && sources[0] !== undefined) {
      ref = ref.where("source", "==", sources[0]);
    } else if (sources.length > 1) {
      ref = ref.where("source", "in", sources.slice(0, 10));
    }
  }
  if (q.tag) ref = ref.where("tags", "array-contains", q.tag);
  if (q.locationSlug) ref = ref.where("location.slug", "==", q.locationSlug);
  if (q.uploadedBy) ref = ref.where("uploadedBy", "==", q.uploadedBy);
  if (!q.includeRetired) ref = ref.where("retired", "!=", true);

  const orderField = q.orderBy ?? "uploadedAt";
  ref = ref.orderBy(orderField, "desc");

  if (q.cursor) {
    const cursorSnap = await db.collection(COLLECTION).doc(q.cursor).get();
    if (cursorSnap.exists) ref = ref.startAfter(cursorSnap);
  }

  const limit = Math.min(Math.max(1, q.limit ?? 50), 200);
  ref = ref.limit(limit + 1);

  const snap = await ref.get();
  const docs = snap.docs.slice(0, limit);
  const items = docs.map((d) => fromFirestoreData(d.id, d.data()));
  const nextCursor =
    snap.docs.length > limit ? docs[docs.length - 1]?.id : undefined;
  return nextCursor !== undefined ? { items, nextCursor } : { items };
}
