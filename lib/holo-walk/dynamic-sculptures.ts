/**
 * lib/holo-walk/dynamic-sculptures.ts — Runtime store for operator-added
 * HoloWalk splat sculptures.
 *
 * One-line role: the static catalogue in `./locations.ts` is a hand-
 * authored module-level constant — perfect for the curated trail but
 * unable to accept "add a sculpture" at runtime. This module is the
 * companion Firestore-backed store the `/holo-walk/new` flow writes
 * into, and the index page reads from to render operator additions
 * alongside the curated catalogue.
 *
 * # Why a separate collection (rather than splicing into `LOCATIONS`)
 *
 * - The static catalogue is editorially curated; each entry has a
 *   narration script, a description, a heading-at-capture. The dynamic
 *   ones come in with a label and a GPS pair and that's it.
 * - Edits to `LOCATIONS` need a deploy. The dynamic store accepts new
 *   rows live, no rebuild.
 * - Static entries render an attractor engine; dynamic entries render a
 *   splat. Keeping them in different shapes keeps the discriminated
 *   union from getting muddier than it needs to be.
 *
 * # Collection
 *
 * Firestore collection: `holo_walk_dynamic_sculptures`. Admin-write
 * only (mirrors the `media` collection's rule posture).
 *
 * # Shape
 *
 * Stored doc carries the splat training lineage as well as the
 * resulting splat asset, so a fresh page-load can reconstruct the
 * full provenance without having to re-query the bench.
 */

import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";

const COLLECTION = "holo_walk_dynamic_sculptures";

const log = createLogger("holo-walk.dynamic-sculptures");

/**
 * Status of a dynamic sculpture row. `queued` and `running` only
 * appear when the route writes a placeholder before the bench job
 * completes (a forward-looking shape — current implementation writes
 * the row only after the bench round-trip is done, so most rows land
 * directly as `done`). `error` rows are kept so the operator can see
 * what went wrong without scraping logs.
 */
export type DynamicSculptureStatus = "queued" | "running" | "done" | "error";

export type DynamicSculpture = {
  /** Stable id — used in URLs and the Firestore doc id. */
  readonly id: string;
  /** Plain-English label the operator typed at upload time. */
  readonly label: string;
  /** Optional GPS coords (decimal degrees). Absent when the operator
   *  uploaded a video without GPS — the sculpture still appears in the
   *  gallery, just not on the map. */
  readonly lat?: number;
  readonly lon?: number;
  /** Public URL of the trained `.ply`. Set when status === "done". */
  readonly plyUrl?: string;
  /** Bytes of the `.ply` on disk. */
  readonly plyBytes?: number;
  /** Media library id of the PLY record. */
  readonly plyMediaId?: string;
  /** Number of gaussians in the splat. */
  readonly gaussianCount?: number;
  /** Public URL of the source 360 video the operator uploaded. */
  readonly videoUrl: string;
  /** Media library id of the source video record. */
  readonly videoMediaId: string;
  /** Bench-side job id (visible in the operator UI for diagnostics). */
  readonly jobId?: string;
  readonly status: DynamicSculptureStatus;
  /** Free-form failure message — only populated when status === "error". */
  readonly errorMessage?: string;
  /** ISO-8601 timestamp the row was created. */
  readonly createdAt: string;
  /** Firebase auth uid of the operator who created it. */
  readonly createdBy: string;
};

export type DynamicSculptureWriteInput = Omit<
  DynamicSculpture,
  "createdAt"
> & {
  /** Optional override; defaults to `new Date().toISOString()`. */
  createdAt?: string;
};

function toFirestoreData(s: DynamicSculptureWriteInput): Record<string, unknown> {
  const data: Record<string, unknown> = {
    id: s.id,
    label: s.label,
    videoUrl: s.videoUrl,
    videoMediaId: s.videoMediaId,
    status: s.status,
    createdAt: Timestamp.fromDate(new Date(s.createdAt ?? new Date().toISOString())),
    createdBy: s.createdBy,
  };
  if (s.lat !== undefined) data["lat"] = s.lat;
  if (s.lon !== undefined) data["lon"] = s.lon;
  if (s.plyUrl !== undefined) data["plyUrl"] = s.plyUrl;
  if (s.plyBytes !== undefined) data["plyBytes"] = s.plyBytes;
  if (s.plyMediaId !== undefined) data["plyMediaId"] = s.plyMediaId;
  if (s.gaussianCount !== undefined) data["gaussianCount"] = s.gaussianCount;
  if (s.jobId !== undefined) data["jobId"] = s.jobId;
  if (s.errorMessage !== undefined) data["errorMessage"] = s.errorMessage;
  return data;
}

function fromFirestoreData(
  id: string,
  data: Record<string, unknown>,
): DynamicSculpture {
  const createdAtRaw = data["createdAt"];
  let createdAt: string;
  if (createdAtRaw instanceof Timestamp) {
    createdAt = createdAtRaw.toDate().toISOString();
  } else if (typeof createdAtRaw === "string") {
    createdAt = createdAtRaw;
  } else {
    createdAt = new Date(0).toISOString();
  }
  const status = data["status"];
  const statusNarrowed: DynamicSculptureStatus =
    status === "queued" || status === "running" || status === "done" || status === "error"
      ? status
      : "done";

  const out: DynamicSculpture = {
    id,
    label: typeof data["label"] === "string" ? (data["label"] as string) : "(unlabelled)",
    videoUrl: typeof data["videoUrl"] === "string" ? (data["videoUrl"] as string) : "",
    videoMediaId:
      typeof data["videoMediaId"] === "string" ? (data["videoMediaId"] as string) : "",
    status: statusNarrowed,
    createdAt,
    createdBy:
      typeof data["createdBy"] === "string" ? (data["createdBy"] as string) : "unknown",
    ...(typeof data["lat"] === "number" && Number.isFinite(data["lat"] as number)
      ? { lat: data["lat"] as number }
      : {}),
    ...(typeof data["lon"] === "number" && Number.isFinite(data["lon"] as number)
      ? { lon: data["lon"] as number }
      : {}),
    ...(typeof data["plyUrl"] === "string" ? { plyUrl: data["plyUrl"] as string } : {}),
    ...(typeof data["plyBytes"] === "number"
      ? { plyBytes: data["plyBytes"] as number }
      : {}),
    ...(typeof data["plyMediaId"] === "string"
      ? { plyMediaId: data["plyMediaId"] as string }
      : {}),
    ...(typeof data["gaussianCount"] === "number"
      ? { gaussianCount: data["gaussianCount"] as number }
      : {}),
    ...(typeof data["jobId"] === "string" ? { jobId: data["jobId"] as string } : {}),
    ...(typeof data["errorMessage"] === "string"
      ? { errorMessage: data["errorMessage"] as string }
      : {}),
  };
  return out;
}

/** Persist (or upsert) a dynamic sculpture row. */
export async function writeDynamicSculpture(
  s: DynamicSculptureWriteInput,
): Promise<DynamicSculpture> {
  const db = requireFirebaseAdminDb();
  await db.collection(COLLECTION).doc(s.id).set(toFirestoreData(s));
  return {
    ...s,
    createdAt: s.createdAt ?? new Date().toISOString(),
  } as DynamicSculpture;
}

/**
 * List every dynamic sculpture, newest-first. Tolerant of an unconfigured
 * Firestore (returns `[]` rather than throwing) so a public page render
 * doesn't break in environments where admin creds aren't wired yet.
 */
export async function listDynamicSculptures(): Promise<DynamicSculpture[]> {
  let db;
  try {
    db = requireFirebaseAdminDb();
  } catch (err) {
    // Genuinely-unconfigured Firestore is the expected path here
    // (preview deploys, local dev without ADC); log at debug so
    // operators see it but it doesn't fill prod logs.
    log.debug("admin db not configured, returning empty list", {
      err: errToObject(err),
    });
    return [];
  }
  try {
    const snap = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return snap.docs.map((doc) => fromFirestoreData(doc.id, doc.data()));
  } catch (err) {
    // Real Firestore failure (perms, quota, malformed doc, network).
    // Empty list keeps the gallery rendering, but operators need to
    // see this — silent zero-result is otherwise indistinguishable
    // from "no sculptures yet" on the index page.
    log.error("list failed", { err: errToObject(err) });
    return [];
  }
}

/** Single-id lookup. Returns `null` when not found. */
export async function getDynamicSculpture(
  id: string,
): Promise<DynamicSculpture | null> {
  let db;
  try {
    db = requireFirebaseAdminDb();
  } catch (err) {
    log.debug("admin db not configured, returning null", {
      id,
      err: errToObject(err),
    });
    return null;
  }
  try {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return fromFirestoreData(doc.id, doc.data() ?? {});
  } catch (err) {
    log.error("get failed", { id, err: errToObject(err) });
    return null;
  }
}
