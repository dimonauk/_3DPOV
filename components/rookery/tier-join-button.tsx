"use client";

import { useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type TierSlug = "perch" | "nest" | "fledge";

/**
 * Client-side CTA for a Rookery tier card. POSTs to
 * /api/stripe/checkout with { tier } and redirects the buyer to the
 * returned Stripe Checkout URL.
 *
 * On 503 (gate not wired yet) the button surfaces the route's message
 * inline instead of navigating away — the tiers page already says
 * "the gate is being wired", so this just confirms it visibly.
 */
export function TierJoinButton({
  tier,
  label,
}: {
  tier: TierSlug;
  label: string;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function go() {
    if (loading) return;
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          ...(user?.uid ? { uid: user.uid } : {}),
          ...(user?.email ? { email: user.email } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage(
        data.error ??
          "Could not start checkout. Try again in a moment.",
      );
    } catch {
      setMessage(
        "Network error. The gate may not be wired yet — write to the studio.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2.5 text-sm text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:opacity-60"
      >
        {loading ? "Opening checkout..." : label}
      </button>
      {message ? (
        <p className="mt-3 text-sm text-chrome-400">{message}</p>
      ) : null}
    </div>
  );
}
