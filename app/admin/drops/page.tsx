/**
 * app/admin/drops/page.tsx — Drops admin list view.
 *
 * Shows every drop in `drops/{}` (regardless of status), with quick
 * counts and a withdraw button per row. Same auth posture as the rest
 * of /admin/* (ADMIN_EMAILS or role=operator).
 */

import Link from "next/link";

import { isFirebaseAdminConfigured } from "lib/firebase/admin";
import { listPublishedDrops } from "lib/drops/read";

import { DropAdminRow } from "./drop-admin-row";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator — drops",
  robots: { index: false, follow: false },
};

export default async function AdminDropsListPage() {
  const wired = isFirebaseAdminConfigured();
  const { drops } = wired ? await listPublishedDrops({ limit: 60 }) : { drops: [] };

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console — drops
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Published drops
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Edition state lives here. Withdraw a drop to remove it from
            the public feed (claim handler will 404 thereafter; existing
            entitlements stay valid). Pull the trigger only after
            checking with anyone mid-fulfilment.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/drops/new"
              className="rounded-sm border border-pink-200 px-4 py-2 chrome-label text-pink-100 transition-colors hover:bg-pink-200 hover:text-warm-black-950"
            >
              + Publish a drop
            </Link>
            <Link
              href="/admin"
              className="chrome-label text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              ← Operator console
            </Link>
          </div>
        </header>

        {!wired ? (
          <p className="text-chrome-300 text-sm">
            Firestore admin not configured. Set Firebase Admin env to
            list drops.
          </p>
        ) : drops.length === 0 ? (
          <p className="text-chrome-400 text-sm">
            No published drops yet. Use{" "}
            <Link href="/admin/drops/new" className="underline hover:text-pink-200">
              /admin/drops/new
            </Link>{" "}
            to publish.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {drops.map((drop) => (
              <DropAdminRow key={drop.id} drop={drop} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
