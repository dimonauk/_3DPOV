/**
 * app/admin/drops/new/page.tsx — Drop publishing route shell.
 *
 * Server component. The outer `app/admin/layout.tsx` (client component)
 * already gates `/admin/*` on Firebase auth + the operator allow-list,
 * so this page only needs to provide chrome + render the client form.
 *
 * Static metadata; no robots indexing — operator console.
 */

import Link from "next/link";

import { NewDropClient } from "./new-drop-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publish a drop — operator console",
  robots: { index: false, follow: false },
};

export default function NewDropPage() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between border-b border-warm-black-700 pb-6">
          <div className="flex flex-col gap-2">
            <span className="chrome-label text-chrome-400">
              Operator &middot; drops &middot; new
            </span>
            <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
              Publish a drop
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-chrome-400">
              One genome becomes a rookery post + a Firestore drop record.
              Oracle + Sieve gates run before either write fires.
            </p>
          </div>
          <Link
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            &larr; Console
          </Link>
        </header>

        <NewDropClient />
      </div>
    </main>
  );
}
