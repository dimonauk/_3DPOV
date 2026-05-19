"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { Drop } from "lib/drops/types";
import type { FirstRefusalWindowState } from "lib/drops/first-refusal-window";

type Tier = "reader-plus" | "member" | "patron" | "atelier" | null;

/**
 * Client-side claim CTA. Reads the user's tier claim from Firebase and
 * decides which call-to-action to surface:
 *
 *   - Unsigned-in → "Sign in to claim"
 *   - Signed in, no tier, window active → "Locked: Patron tier required during the first-refusal window"
 *   - Signed in, Patron+, window active → "Claim" buttons
 *   - Signed in, anyone, window ended → "Claim" buttons
 *
 * On click, POST /api/drops/{slug}/claim with the variant. The server
 * runs a Firestore transaction to decrement the right edition counter
 * + reserve the entitlement + mint a pass record, then returns a
 * checkout URL the client navigates to.
 */
export function DropClaimCta({
  drop,
  window,
  soldOut,
}: {
  drop: Drop;
  window: FirstRefusalWindowState;
  soldOut: boolean;
}) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [tier, setTier] = useState<Tier>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await user.getIdTokenResult(true);
      if (cancelled) return;
      const t = token.claims.tier;
      setTier(
        t === "reader-plus" || t === "member" || t === "patron" || t === "atelier"
          ? t
          : null,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const claim = async (variant: "unique" | "limited" | "open") => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/drops/${encodeURIComponent(drop.id)}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ variant }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        checkoutUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        if (body.error === "first_refusal_window_active") {
          setError("Window is Patron+ only. Upgrade on Patreon and refresh.");
        } else if (body.error === "limited_sold_out") {
          setError("The Limited edition just sold out. Try Open or the Unique.");
        } else if (body.error === "unique_already_claimed") {
          setError("Someone just claimed the Unique. Refresh to see new state.");
        } else if (body.error === "open_run_disabled") {
          setError("This drop has no Open run.");
        } else {
          throw new Error(body.error ?? `Claim failed (${res.status})`);
        }
        return;
      }
      if (body.checkoutUrl) {
        router.push(body.checkoutUrl);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Checkout isn&rsquo;t wired in this environment.
      </div>
    );
  }

  if (loading) {
    return <div className="mt-10 text-chrome-400">Checking your sign-in…</div>;
  }

  const windowGated =
    window.kind === "active" && tier !== "patron" && tier !== "atelier";

  return (
    <div className="mt-10 space-y-4">
      {!user ? (
        <Link
          href={`/rookery/sign-in?next=${encodeURIComponent(`/drops/${drop.id}`)}`}
          className="inline-flex rounded bg-pink-200 px-6 py-3 text-warm-black-950 hover:bg-pink-100"
        >
          Sign in to claim
        </Link>
      ) : windowGated ? (
        <div className="rounded border border-amber-300/40 bg-amber-300/5 p-6">
          <p className="text-amber-100">
            The first-refusal window is active. Patron and Atelier
            supporters can claim now; other tiers can claim once the
            window closes.
          </p>
          <Link
            href="/rookery/patreon"
            className="mt-3 inline-block text-sm underline hover:text-amber-200"
          >
            Upgrade on Patreon →
          </Link>
        </div>
      ) : soldOut && !drop.edition.openEnabled ? (
        <div className="rounded border border-chrome-700 p-6 text-chrome-300">
          The Limited edition is sold out and this drop has no Open run.
          Catch the next one.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {!drop.editionState.uniqueClaimed && (
              <button
                type="button"
                onClick={() => claim("unique")}
                disabled={busy}
                className="rounded bg-pink-200 px-6 py-3 text-warm-black-950 hover:bg-pink-100 disabled:opacity-50"
              >
                {busy ? "Claiming…" : "Claim the Unique"}
              </button>
            )}
            {!soldOut && (
              <button
                type="button"
                onClick={() => claim("limited")}
                disabled={busy}
                className="rounded border border-pink-200 px-6 py-3 text-pink-100 hover:bg-pink-200 hover:text-warm-black-950 disabled:opacity-50"
              >
                {busy ? "Claiming…" : "Claim Limited"}
              </button>
            )}
            {drop.edition.openEnabled && (
              <button
                type="button"
                onClick={() => claim("open")}
                disabled={busy}
                className="rounded border border-chrome-600 px-6 py-3 text-chrome-200 hover:border-chrome-200 disabled:opacity-50"
              >
                {busy ? "Claiming…" : "Claim Open"}
              </button>
            )}
          </div>
          {error ? <p className="text-pink-300 text-sm">{error}</p> : null}
        </>
      )}
    </div>
  );
}
