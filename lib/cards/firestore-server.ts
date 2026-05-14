/**
 * lib/cards/firestore-server.ts — Server-side card persistence helpers.
 *
 * Uses the Firebase Admin SDK; reads Firestore without forcing the
 * visitor to authenticate. Server-only — must not be imported from a
 * client component (it transitively pulls in 'server-only').
 *
 * The client-side mirror is `lib/cards/firestore-client.ts`.
 */

import "server-only";
import type { Card } from "lib/ar/types";

export interface CardDoc {
  slug: string;
  ownerUid: string;
  ownerEmail: string | null;
  card: Card;
  createdAt: string;
  updatedAt: string;
  public: boolean;
  hosted: boolean;
}

/**
 * Server-side card lookup using the Firebase Admin SDK. Returns null
 * when the slug isn't found, the slug is malformed, or the admin SDK
 * isn't configured (graceful degradation for local dev / unconfigured
 * deployments).
 */
export async function getCardServer(slug: string): Promise<CardDoc | null> {
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(slug)) return null;
  const { getFirebaseAdminDb } = await import("lib/firebase/admin");
  const db = getFirebaseAdminDb();
  if (!db) return null;
  const snap = await db.collection("cards").doc(slug).get();
  if (!snap.exists) return null;
  return snap.data() as CardDoc;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await getCardServer(slug);
  return existing === null;
}
