/**
 * app/admin/import/google/connect/page.tsx — Operator's Google
 * connection landing.
 *
 * Server component. The route is protected by `app/admin/layout.tsx`
 * (Agent J) which gates anyone whose email isn't on the allow-list, so
 * we don't re-check here. We DO still render a "connect" CTA so the
 * operator can re-consent / refresh scopes.
 *
 * The route can't read Firestore directly without knowing the operator's
 * uid — and we only have that on the client (Firebase Auth user). So
 * we render a client island that shows the connection state and the
 * "Connect Google" link.
 */

import { ConnectGooglePanel } from "./connect-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connect Google — Operator console",
  robots: { index: false, follow: false },
};

export default async function ConnectGooglePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / Import
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Connect Google
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Authorise the studio to pull bytes from your Google Photos picker
            sessions and from your Google Drive. The studio never sees your
            library in bulk — only the items you pick or the files you select.
          </p>
          <p className="text-xs leading-relaxed text-chrome-400">
            Scopes requested:{" "}
            <code className="text-pink-200">
              photospicker.mediaitems.readonly
            </code>
            ,{" "}
            <code className="text-pink-200">drive.readonly</code>. Both are
            read-only.
          </p>
        </header>

        {status === "ok" ? (
          <div className="rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3 text-xs text-emerald-200">
            Connected. You can close this tab or proceed to the Photos / Drive
            importers below.
          </div>
        ) : null}
        {status === "error" && error ? (
          <div className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            Connection failed: {error}
          </div>
        ) : null}

        <ConnectGooglePanel />

        <nav className="flex flex-col gap-3 border-t border-warm-black-700 pt-6">
          <a
            href="/admin/import/google-photos"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">A</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Pick from Google Photos
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Open Google&rsquo;s picker, choose items, import into the
              catalogue.
            </span>
          </a>
          <a
            href="/admin/import/google-drive"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">B</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Browse Google Drive
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Walk a folder tree. Tick the files to ingest. Optional watch.
            </span>
          </a>
        </nav>

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
