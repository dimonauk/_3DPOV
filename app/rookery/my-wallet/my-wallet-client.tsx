"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type ClaimsSummary = {
  tier: "reader-plus" | "member" | "patron" | "atelier" | null;
  tierStartedAt: string | null;
  lifetimePledgeCents: number;
  patreonId: string | null;
  discordUserId: string | null;
  role: string | null;
};

const TIER_LINE: Record<NonNullable<ClaimsSummary["tier"]>, string> = {
  "reader-plus": "Recognised legacy /dimonauk supporter. No paid tier on the studio side.",
  member: "Member tier. Early-view on drops. Bench dispatches.",
  patron: "Patron tier. First-refusal window. Quarterly studio postcard.",
  atelier: "Atelier tier. Bench-pass + 25% of every Limited edition reserved.",
};

const BANNER: Record<string, { tone: "ok" | "info" | "warn"; line: string }> = {
  "patreon=linked": {
    tone: "ok",
    line: "Patreon linked. The page below reflects your tier.",
  },
  "discord=linked-and-synced": {
    tone: "ok",
    line: "Discord linked and your role is up to date.",
  },
  "discord=pending-invite": {
    tone: "info",
    line: "Discord linked, but you're not in the studio server yet. Visit /rookery/discord for the invite.",
  },
  "discord=linked-sync-failed": {
    tone: "warn",
    line: "Discord linked, but the role didn't apply. Visit /rookery/discord and click Re-sync.",
  },
};

export function MyWalletClient({
  searchParams,
}: {
  searchParams: Promise<{ patreon?: string; discord?: string; reason?: string }>;
}) {
  const params = use(searchParams);
  const { user, loading, configured } = useAuth();
  const [claims, setClaims] = useState<ClaimsSummary | null>(null);

  useEffect(() => {
    if (!user) {
      setClaims(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await user.getIdTokenResult(true);
      if (cancelled) return;
      const c = token.claims as unknown as Record<string, unknown>;
      const rawTier = c.tier;
      const tier: ClaimsSummary["tier"] =
        rawTier === "reader-plus" ||
        rawTier === "member" ||
        rawTier === "patron" ||
        rawTier === "atelier"
          ? rawTier
          : null;
      setClaims({
        tier,
        tierStartedAt:
          typeof c.tierStartedAt === "string" ? c.tierStartedAt : null,
        lifetimePledgeCents:
          typeof c.lifetimePledgeCents === "number" ? c.lifetimePledgeCents : 0,
        patreonId: typeof c.patreonId === "string" ? c.patreonId : null,
        discordUserId:
          typeof c.discord_user_id === "string" ? c.discord_user_id : null,
        role: typeof c.role === "string" ? c.role : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!configured) {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Auth isn&rsquo;t wired in this environment.
      </div>
    );
  }
  if (loading) {
    return <div className="mt-10 text-chrome-400">Loading&hellip;</div>;
  }
  if (!user) {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Sign in to the Rookery first.{" "}
        <Link href="/rookery" className="underline hover:text-pink-200">
          Back to /rookery
        </Link>
        .
      </div>
    );
  }

  const bannerKey = params.patreon
    ? `patreon=${params.patreon}`
    : params.discord
      ? `discord=${params.discord}`
      : null;
  const banner = bannerKey ? BANNER[bannerKey] : null;

  return (
    <div className="mt-10 space-y-6">
      {banner && (
        <div
          className={`rounded border p-4 text-sm ${
            banner.tone === "ok"
              ? "border-emerald-300/40 bg-emerald-300/5 text-emerald-100"
              : banner.tone === "warn"
                ? "border-pink-300/40 bg-pink-300/5 text-pink-100"
                : "border-chrome-500/40 bg-chrome-500/5 text-chrome-100"
          }`}
        >
          {banner.line}
        </div>
      )}

      <section className="rounded border border-chrome-700 p-6">
        <div className="chrome-label">Identity</div>
        <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-chrome-400">Email</dt>
          <dd className="text-chrome-100">{user.email ?? "—"}</dd>
          <dt className="text-chrome-400">Display name</dt>
          <dd className="text-chrome-100">{user.displayName ?? "—"}</dd>
          <dt className="text-chrome-400">UID</dt>
          <dd className="text-chrome-300 font-mono text-xs">{user.uid}</dd>
        </dl>
      </section>

      <section className="rounded border border-chrome-700 p-6">
        <div className="chrome-label">Tier</div>
        {claims?.tier ? (
          <div className="mt-4">
            <div className="text-pink-200 text-xl">{claims.tier}</div>
            <p className="mt-2 text-chrome-200 text-sm">
              {TIER_LINE[claims.tier]}
            </p>
            {claims.tierStartedAt && (
              <p className="mt-1 text-chrome-400 text-xs">
                Since {new Date(claims.tierStartedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            )}
            {claims.lifetimePledgeCents > 0 && (
              <p className="mt-1 text-chrome-400 text-xs">
                Lifetime support: £{(claims.lifetimePledgeCents / 100).toFixed(2)}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-chrome-300 text-sm">
            No tier. Visit{" "}
            <Link href="/rookery/patreon" className="underline hover:text-pink-200">
              /rookery/patreon
            </Link>{" "}
            to link a Patreon supporter account, or just stay on the
            public side &mdash; you don&rsquo;t need a tier to read.
          </p>
        )}
      </section>

      <section className="rounded border border-chrome-700 p-6">
        <div className="chrome-label">Patreon link</div>
        <p className="mt-4 text-chrome-200 text-sm">
          {claims?.patreonId
            ? `Linked. Patreon user id ${claims.patreonId}.`
            : "Not linked."}
        </p>
        <Link
          href="/rookery/patreon"
          className="mt-3 inline-block text-sm underline hover:text-pink-200"
        >
          {claims?.patreonId ? "Manage" : "Connect Patreon"} →
        </Link>
      </section>

      <section className="rounded border border-chrome-700 p-6">
        <div className="chrome-label">Discord link</div>
        <p className="mt-4 text-chrome-200 text-sm">
          {claims?.discordUserId
            ? `Linked. Discord user id ${claims.discordUserId}.`
            : "Not linked."}
        </p>
        <Link
          href="/rookery/discord"
          className="mt-3 inline-block text-sm underline hover:text-pink-200"
        >
          {claims?.discordUserId ? "Manage" : "Connect Discord"} →
        </Link>
      </section>

      {claims?.role && (
        <section className="rounded border border-amber-300/40 bg-amber-300/5 p-6">
          <div className="chrome-label text-amber-200">Operator</div>
          <p className="mt-4 text-chrome-200 text-sm">
            You have role <code className="text-amber-100">{claims.role}</code>.
            <Link
              href="/admin"
              className="ml-3 text-sm underline hover:text-amber-200"
            >
              Open the operator console →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
