"use client";

import { useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type ClaimSummary = {
  tier: "reader-plus" | "member" | "patron" | "atelier" | null;
  tierStartedAt: string | null;
  lifetimePledgeCents: number;
  patreonId: string | null;
};

const TIER_COPY: Record<NonNullable<ClaimSummary["tier"]>, { label: string; line: string }> = {
  "reader-plus": {
    label: "Reader+",
    line: "Legacy patreon.com/dimonauk supporter recognised. Early-view on public posts; no studio tier.",
  },
  member: {
    label: "Member",
    line: "On the perch. Early-view on drops; bench dispatches.",
  },
  patron: {
    label: "Patron",
    line: "First-refusal window on Limited editions; quarterly studio postcard; everything Member gets.",
  },
  atelier: {
    label: "Atelier",
    line: "Bench-pass allocation, 25% of the edition reserved during the first-refusal window, plus everything below.",
  },
};

export function ConnectPatreonClient() {
  const { user, loading, configured } = useAuth();
  const [claim, setClaim] = useState<ClaimSummary | null>(null);
  const [status, setStatus] = useState<"idle" | "linking" | "disconnecting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await user.getIdTokenResult(true);
      if (cancelled) return;
      const c = token.claims as unknown as Record<string, unknown>;
      const rawTier = c.tier;
      const tier: ClaimSummary["tier"] =
        rawTier === "reader-plus" ||
        rawTier === "member" ||
        rawTier === "patron" ||
        rawTier === "atelier"
          ? rawTier
          : null;
      setClaim({
        tier,
        tierStartedAt:
          typeof c.tierStartedAt === "string" ? c.tierStartedAt : null,
        lifetimePledgeCents:
          typeof c.lifetimePledgeCents === "number" ? c.lifetimePledgeCents : 0,
        patreonId: typeof c.patreonId === "string" ? c.patreonId : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onConnect = async () => {
    if (!user) return;
    setStatus("linking");
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const here = typeof window !== "undefined" ? window.location.pathname : "/rookery/patreon";
      const url = `/api/patreon/oauth/start?return=${encodeURIComponent(here)}&id_token=${encodeURIComponent(idToken)}`;
      window.location.href = url;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not start the link.");
    }
  };

  const onDisconnect = async () => {
    if (!user) return;
    setStatus("disconnecting");
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/patreon/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Disconnect failed (${res.status})`);
      }
      await user.getIdToken(true);
      setClaim({
        tier: null,
        tierStartedAt: null,
        lifetimePledgeCents: 0,
        patreonId: null,
      });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not disconnect.");
    }
  };

  if (!configured) {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Auth isn&rsquo;t wired in this environment. Set the Firebase
        client config to use this page.
      </div>
    );
  }

  if (loading) {
    return <div className="mt-10 text-chrome-400">Checking your sign-in&hellip;</div>;
  }

  if (!user) {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Sign in to the Rookery first, then come back here to link
        Patreon. The link is per-account, not per-device.
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {claim?.tier ? (
        <div className="rounded border border-pink-300/40 bg-pink-300/5 p-6">
          <div className="chrome-label text-pink-200">{TIER_COPY[claim.tier].label}</div>
          <p className="mt-3 text-chrome-100">{TIER_COPY[claim.tier].line}</p>
          {claim.tierStartedAt ? (
            <p className="mt-2 text-xs text-chrome-400">
              Linked since {new Date(claim.tierStartedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}.
            </p>
          ) : null}
          {claim.lifetimePledgeCents > 0 ? (
            <p className="mt-1 text-xs text-chrome-400">
              Lifetime support: £{(claim.lifetimePledgeCents / 100).toFixed(2)}.
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onConnect}
              disabled={status === "linking"}
              className="rounded border border-chrome-600 px-4 py-2 text-chrome-200 text-sm hover:border-chrome-300 disabled:opacity-50"
            >
              Re-sync from Patreon
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={status === "disconnecting"}
              className="rounded border border-chrome-700 px-4 py-2 text-chrome-400 text-sm hover:border-chrome-300 disabled:opacity-50"
            >
              {status === "disconnecting" ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={onConnect}
            disabled={status === "linking"}
            className="rounded bg-pink-200 px-6 py-3 text-warm-black-950 text-sm hover:bg-pink-100 disabled:opacity-50"
          >
            {status === "linking" ? "Heading to Patreon…" : "Connect Patreon"}
          </button>
        </div>
      )}

      {error ? <p className="text-pink-300 text-sm">{error}</p> : null}
    </div>
  );
}
