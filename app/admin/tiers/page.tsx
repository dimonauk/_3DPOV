/**
 * app/admin/tiers/page.tsx — Operator surface for manual tier overrides.
 *
 * Used for comps (press, collaborators) and for fixing drift before
 * Patreon's webhook fires. Auth-gated by the same ADMIN_EMAILS check
 * the rest of /admin/* uses.
 */

import { TierOverrideClient } from "./tier-override-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator — tiers",
  robots: { index: false, follow: false },
};

export default function AdminTiersPage() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console — tier override
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Set or clear a tier
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Force a tier on a user without waiting on Patreon. Useful for
            comps (press, collaborators) and for fixing drift. The
            override is recorded as <code>compTieredBy</code> +{" "}
            <code>compReason</code> in custom claims so the next Patreon
            webhook can&rsquo;t silently revert it.
          </p>
          <p className="text-xs text-chrome-400">
            Pass <code>tier: null</code> to clear. Side effect: Discord
            role propagation fires automatically (no-op if not
            configured).
          </p>
        </header>

        <TierOverrideClient />

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <a
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Operator console
          </a>
          <span className="chrome-label text-chrome-500">Operator only</span>
        </footer>
      </div>
    </main>
  );
}
