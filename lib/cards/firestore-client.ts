/**
 * lib/cards/firestore-client.ts — Client-side card persistence helpers.
 *
 * Used from "use client" components. Talks to Firestore via the
 * Firebase Web SDK. Protected by Firestore Security Rules.
 *
 * Mirrors `lib/cards/firestore-server.ts` which handles server-side
 * lookups via the Admin SDK; they're split because server-only
 * helpers can't be safely traced into client bundles.
 */

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
    "invalid-slug": "Slug must be 2–32 chars, lowercase, a-z 0-9 hyphen.",
    "slug-taken": "That slug is already taken. Try another.",
    "permission-denied":
      "You don't have permission to save this card. Check ownership.",
    unknown: "Something went wrong saving the card.",
  };
  return new CardError(code, message ?? messages[code]);
}

/**
 * Save a card to Firestore. Creates a new doc when the slug doesn't
 * exist; updates the existing one when it does and the caller owns
 * it.
 */
export async function saveCardClient(card: Card): Promise<CardDoc> {
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
      _createdAt: existing.exists()
        ? (existing.data() as { _createdAt?: unknown })._createdAt ??
          serverTimestamp()
        : serverTimestamp(),
      _updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
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
