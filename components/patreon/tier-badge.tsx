"use client";

import { useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type Tier = "reader-plus" | "member" | "patron" | "atelier" | null;

const META: Record<NonNullable<Tier>, { label: string; classes: string; line: string }> = {
  "reader-plus": {
    label: "Reader+",
    classes:
      "border-chrome-500/60 bg-chrome-500/10 text-chrome-200",
    line: "Recognised legacy supporter",
  },
  member: {
    label: "Member",
    classes:
      "border-pink-300/60 bg-pink-300/10 text-pink-100",
    line: "On the perch",
  },
  patron: {
    label: "Patron",
    classes:
      "border-amber-300/60 bg-amber-300/10 text-amber-100",
    line: "First-refusal window unlocked",
  },
  atelier: {
    label: "Atelier",
    classes:
      "border-violet-300/60 bg-violet-300/10 text-violet-100",
    line: "Bench-pass allocation",
  },
};

/**
 * <TierBadge /> — reads the current user's tier from Firebase custom
 * claims and renders a small badge. Returns null when:
 *
 *   - Auth is unconfigured
 *   - User isn't signed in
 *   - User has no tier (skip rendering rather than show a "no tier"
 *     state — the connect page is the right surface for that)
 *
 * The badge auto-refreshes the ID token (force=true) when mounting so
 * a freshly-applied tier from a Patreon webhook shows up without the
 * user signing out and back in.
 */
export function TierBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { user, configured } = useAuth();
  const [tier, setTier] = useState<Tier>(null);

  useEffect(() => {
    if (!configured || !user) {
      setTier(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await user.getIdTokenResult(true);
      if (cancelled) return;
      const t = token.claims.tier;
      if (
        t === "reader-plus" ||
        t === "member" ||
        t === "patron" ||
        t === "atelier"
      ) {
        setTier(t);
      } else {
        setTier(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, configured]);

  if (!tier) return null;
  const m = META[tier];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${m.classes}`}
        title={m.line}
      >
        {m.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-col items-start rounded border px-3 py-2 text-xs ${m.classes}`}
    >
      <span className="font-medium tracking-wide uppercase">{m.label}</span>
      <span className="opacity-80">{m.line}</span>
    </span>
  );
}
