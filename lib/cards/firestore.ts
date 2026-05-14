/**
 * lib/cards/firestore.ts — Card persistence layer.
 *
 * Firestore-backed card storage with the slug as the document ID
 * (global uniqueness). Mirrors the in-memory `Card` shape from
 * `lib/ar/types.ts` plus ownership + timestamp metadata.
 *
 * Two-sided file:
 *   - Client helpers (load, save, list, delete) use the Firebase
 *     client SDK; protected by Firestore Security Rules.
 *   - Server helpers (admin load) use the Firebase Admin SDK; allow
 *     the public /c/<slug> route to render Firestore-stored cards
 *     without making the visitor authenticate.
 *
 * Slug collision: the slug IS the document ID. If a slug is already
 * taken, attempting to save will overwrite the existing doc IF the
 * caller owns it, or fail with a permission error if it belongs to
 * someone else. The rules enforce this.
 */

import type { Card } from "lib/ar/types";

export interface CardDoc {
  /** Slug (URL fragment; also the doc ID). */
  slug: string;
  /** Firebase Auth UID of the owner. */
  ownerUid: string;
  /** Denormalised email for display + admin contact. */
  ownerEmail: string | null;
  /** The full Card object as designed. */
  card: Card;
  /** ISO timestamp (set client-side; Firestore also has serverTimestamp). */
  createdAt: string;
  updatedAt: string;
  /** When true, this card appears on the public /cards index. */
  public: boolean;
  /** When true, this card was created via the studio's commissioned tier. */
  hosted: boolean;
}

/* ───────────────────────────────────────────────────────────────── */
/* CLIENT helpers — used from "use client" components.                */
/* ───────────────────────────────────────────────────────────────── */

/**
 * Save a card to Firestore. Creates a new doc if the slug doesn't
 * exist; updates the existing one if it does and the caller owns it.
 *
 * Throws a typed error in three cases:
 *   - "not-signed-in": no Firebase auth user
 *   - "firebase-not-configured": env vars missing
 *   - "slug-taken": slug exists and is owned by someone else
 *   - "permission-denied": Firestore rules rejected the write
 */
export async function saveCardClient(card: Card): Promise<CardDoc> {
  // Lazy-load the client SDK so this file is tree-shakeable in server bundles.
  const { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } = await import(
    "lib/firebase/client"
  );
  const { doc, getDoc, setDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );

  if (!isFirebaseConfigured()) {
    throw makeCardError("firebase-not-configured");
  }
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db) throw makeCardError("firebase-not-configured");

  const user = auth.currentUser;
  if (!user) throw makeCardError("not-signed-in");

  const slug = card.slug.toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(slug)) {
    throw makeCardError(
      "invalid-slug",
      "Slug must be 2–32 chars, lowercase, a-z 0-9 -, must start with a letter or digit.",
    );
  }

  const ref = doc(db, "cards", slug);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data() as CardDoc;
    if (data.ownerUid !== user.uid) {
      throw makeCardError(
        "slug-taken",
        `The slug "${slug}" is already in use. Choose a different one.`,
      );
    }
  }

  const nowIso = new Date().toISOString();
  const payload: CardDoc = {
    slug,
    ownerUid: user.uid,
    ownerEmail: user.email ?? null,
    card: { ...card, slug },
    createdAt: existing.exists()
      ? (existing.data() as CardDoc).createdAt
      : nowIso,
    updatedAt: nowIso,
    public: Boolean(card.public),
    hosted: false,
  };

  try {
    await setDoc(ref, {
      ...payload,
      // Mirror serverTimestamp on the write so the document carries
      // the real backend clock too. The plain ISO string above is for
      // immediate client-side display before the server returns.
      _createdAt: existing.exists()
        ? (existing.data() as { _createdAt?: unknown })._createdAt ??
          serverTimestamp()
        : serverTimestamp(),
      _updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    // The Firebase SDK surfaces permission errors with code === 'permission-denied'
    const code = (err as { code?: string })?.code;
    if (code === "permission-denied") {
      throw makeCardError(
        "permission-denied",
        "Firestore rejected the write. Check that you're signed in and that the slug isn't reserved.",
      );
    }
    throw err;
  }
  return payload;
}

/** Fetch the current user's cards. Returns [] if not signed in or unconfigured. */
export async function listMyCardsClient(): Promise<CardDoc[]> {
  const { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } = await import(
    "lib/firebase/client"
  );
  const { collection, getDocs, orderBy, query, where } = await import(
    "firebase/firestore"
  );
  if (!isFirebaseConfigured()) return [];
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db || !auth.currentUser) return [];

  const q = query(
    collection(db, "cards"),
    where("ownerUid", "==", auth.currentUser.uid),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CardDoc);
}

/** Load a single card by slug (read-only, public). */
export async function getCardClient(slug: string): Promise<CardDoc | null> {
  const { getFirebaseDb, isFirebaseConfigured } = await import(
    "lib/firebase/client"
  );
  const { doc, getDoc } = await import("firebase/firestore");
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDb();
  if (!db) return null;
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(slug)) return null;
  const snap = await getDoc(doc(db, "cards", slug));
  return snap.exists() ? (snap.data() as CardDoc) : null;
}

/** Delete a card. Only the owner can do this (enforced by rules). */
export async function deleteCardClient(slug: string): Promise<void> {
  const { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } = await import(
    "lib/firebase/client"
  );
  const { deleteDoc, doc } = await import("firebase/firestore");
  if (!isFirebaseConfigured()) throw makeCardError("firebase-not-configured");
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db) throw makeCardError("firebase-not-configured");
  if (!auth.currentUser) throw makeCardError("not-signed-in");
  await deleteDoc(doc(db, "cards", slug));
}

/* ───────────────────────────────────────────────────────────────── */
/* SERVER helpers — used from server components / API routes.         */
/* ───────────────────────────────────────────────────────────────── */

/**
 * Server-side card lookup using the Firebase Admin SDK. Lets the
 * public /c/<slug> server component render Firestore-stored cards
 * without making the visitor authenticate.
 *
 * Returns null if Firebase Admin isn't configured (graceful
 * degradation for local dev / unconfigured deployments).
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

/** Check if a slug is available (for server-side validation on signup). */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await getCardServer(slug);
  return existing === null;
}

/* ───────────────────────────────────────────────────────────────── */
/* Error type — discriminated by code for UI handling.                */
/* ───────────────────────────────────────────────────────────────── */

export type CardErrorCode =
  | "not-signed-in"
  | "firebase-not-configured"
  | "invalid-slug"
  | "slug-taken"
  | "permission-denied"
  | "unknown";

export class CardError extends Error {
  code: CardErrorCode;
  constructor(code: CardErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CardError";
  }
}

function makeCardError(code: CardErrorCode, message?: string): CardError {
  const messages: Record<CardErrorCode, string> = {
    "not-signed-in": "You need to sign in before saving a card.",
    "firebase-not-configured":
      "Firebase isn't configured on this deployment. Studio cards are unavailable.",
    "invalid-slug":
      "Slug must be 2–32 chars, lowercase, a-z 0-9 hyphen.",
    "slug-taken": "That slug is already taken. Try another.",
    "permission-denied":
      "You don't have permission to save this card. Check ownership.",
    unknown: "Something went wrong saving the card.",
  };
  return new CardError(code, message ?? messages[code]);
}
