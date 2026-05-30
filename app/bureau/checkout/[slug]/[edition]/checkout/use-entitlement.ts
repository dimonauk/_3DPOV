"use client";

/**
 * app/bureau/checkout/[slug]/[edition]/checkout/use-entitlement.ts
 *
 * Subscribes to a buyer's edition entitlement at
 * `users/{uid}/editions/{slug}-{editionNumber}` via Firestore
 * onSnapshot. Returns `{ entitlement, loading, error }`; the page
 * reacts in real time when the Stripe webhook flips the doc from
 * pending-payment to paid.
 *
 * No external state, no Zustand: the entitlement is per-page-
 * instance. Hook closes its listener on unmount.
 */

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

import { getFirebaseDb } from "lib/firebase/client";

import type { EntitlementDoc } from "./types";

export type UseEntitlement = {
  entitlement: EntitlementDoc | null;
  loading: boolean;
  error: string | null;
};

export function useEntitlement(
  user: User | null,
  configured: boolean,
  entitlementId: string,
): UseEntitlement {
  const [entitlement, setEntitlement] = useState<EntitlementDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) {
      setLoading(false);
      setEntitlement(null);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      setError("Firestore is not configured.");
      return;
    }
    const ref = doc(db, "users", user.uid, "editions", entitlementId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setEntitlement(snap.exists() ? (snap.data() as EntitlementDoc) : null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Couldn’t read your entitlement.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [configured, user, entitlementId]);

  return { entitlement, loading, error };
}
