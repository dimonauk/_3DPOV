/**
 * lib/drops/read.ts — server-side read helpers for the public Drop surface.
 *
 * Firestore is the source of truth for commerce state (edition counts,
 * first-refusal windows). Sanity carries the editorial copy in parallel.
 * For now the public read path reads from Firestore directly so the
 * `/drops` and `/drops/[slug]` pages reflect live edition state without
 * the Sanity cache TTL getting in the way.
 *
 * Read pattern: server-only, runs in Vercel functions, force-dynamic on
 * the consuming pages. Adds defensive shape-narrowing in
 * `firestoreDocToDrop` because Firestore returns `DocumentData`
 * (effectively `any`).
 */

import "server-only";

import {
  getFirebaseAdminDb,
  isFirebaseAdminConfigured,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

import type {
  Drop,
  DropStatus,
  EditionConfig,
  FirstRefusalRadius,
  TierIncludedFlags,
} from "./types";

const log = createLogger("drops.read");

const COLLECTION = "drops";

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}
function asStatus(v: unknown): DropStatus {
  return v === "draft" || v === "published" || v === "sold-out" || v === "withdrawn"
    ? v
    : "draft";
}
function asRadius(v: unknown): FirstRefusalRadius {
  return v === "parent-only" ||
    v === "parent+grandparent+siblings-of-parent" ||
    v === "full-kingdom"
    ? v
    : "parent-only";
}

function firestoreDocToDrop(
  id: string,
  raw: Record<string, unknown>,
): Drop {
  const editionRaw = (raw.edition ?? {}) as Record<string, unknown>;
  const edition: EditionConfig = {
    unique: true,
    limitedSize: asNumber(editionRaw.limitedSize, 25),
    openEnabled: asBool(editionRaw.openEnabled, true),
  };
  const tierIncludedRaw = (raw.tierIncluded ?? {}) as Record<string, unknown>;
  const tierIncluded: TierIncludedFlags = {
    member: asBool(tierIncludedRaw.member),
    patron: asBool(tierIncludedRaw.patron),
    atelier: asBool(tierIncludedRaw.atelier),
  };
  const editionStateRaw = (raw.editionState ?? {}) as Record<string, unknown>;
  return {
    id,
    publishedBy: asString(raw.publishedBy),
    title: asString(raw.title),
    summary: asString(raw.summary),
    genomeId: asString(raw.genomeId),
    parentageChain: asStringArray(raw.parentageChain),
    kingdom: asString(raw.kingdom, "unspecified"),
    edition,
    tierIncluded,
    firstRefusalRadius: asRadius(raw.firstRefusalRadius),
    passkitEnabled: asBool(raw.passkitEnabled),
    editionState: {
      uniqueClaimed: asBool(editionStateRaw.uniqueClaimed),
      limitedClaimed: asNumber(editionStateRaw.limitedClaimed),
      openClaimed: asNumber(editionStateRaw.openClaimed),
    },
    sanityDocId: asString(raw.sanityDocId) || undefined,
    createdAt: asString(raw.createdAt, new Date(0).toISOString()),
    updatedAt: asString(raw.updatedAt, new Date(0).toISOString()),
    publishedAt: asString(raw.publishedAt) || undefined,
    status: asStatus(raw.status),
  };
}

export async function getDropBySlug(slug: string): Promise<Drop | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getFirebaseAdminDb();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(slug).get();
    if (!snap.exists) return null;
    const data = snap.data() ?? {};
    return firestoreDocToDrop(snap.id, data);
  } catch (err) {
    log.error("getDropBySlug failed", {
      slug,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function listPublishedDrops(opts: {
  limit?: number;
  cursor?: string | null;
} = {}): Promise<{ drops: Drop[]; nextCursor: string | null }> {
  if (!isFirebaseAdminConfigured()) return { drops: [], nextCursor: null };
  const db = getFirebaseAdminDb();
  if (!db) return { drops: [], nextCursor: null };

  const limit = Math.max(1, Math.min(60, opts.limit ?? 24));
  try {
    let q = db
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(limit);
    if (opts.cursor) q = q.startAfter(opts.cursor);
    const snap = await q.get();
    const drops = snap.docs.map((d) =>
      firestoreDocToDrop(d.id, d.data() as Record<string, unknown>),
    );
    const last = snap.docs[snap.docs.length - 1];
    const nextCursor =
      drops.length === limit && last
        ? asString(
            (last.data() as Record<string, unknown>).publishedAt,
            "",
          ) || null
        : null;
    return { drops, nextCursor };
  } catch (err) {
    log.error("listPublishedDrops failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return { drops: [], nextCursor: null };
  }
}

export function totalEditionCapacity(drop: Drop): number | null {
  // Unique always = 1. Limited = configured size. Open = unbounded → null.
  if (drop.edition.openEnabled) return null;
  return 1 + drop.edition.limitedSize;
}

export function totalClaimed(drop: Drop): number {
  return (
    (drop.editionState.uniqueClaimed ? 1 : 0) +
    drop.editionState.limitedClaimed +
    drop.editionState.openClaimed
  );
}

export function isLimitedSoldOut(drop: Drop): boolean {
  return drop.editionState.limitedClaimed >= drop.edition.limitedSize;
}
