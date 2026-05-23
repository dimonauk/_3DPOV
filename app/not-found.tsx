/**
 * app/not-found.tsx — global 404 surface.
 *
 * Catalogue-voice. No fancy chrome — when a visitor lands on a URL we
 * don't serve, give them a short honest message and the two doors
 * they're most likely looking for.
 *
 * Triggered when no route matches in the `app/` tree. Per Next.js
 * conventions this file is auto-discovered.
 */

import Link from "next/link";

import { NotFoundGlitch } from "components/glitch/not-found-glitch";

export const metadata = {
  title: "Not here — Holo-Flow Studio",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-warm-black-950 px-6 py-24 font-mono text-chrome-200">
      <NotFoundGlitch />
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <span className="chrome-label text-chrome-400">404 · Not here</span>
        <h1 className="text-3xl uppercase tracking-[0.18em] text-chrome-100">
          The catalogue
          <br />
          doesn&rsquo;t reach.
        </h1>
        <p className="text-sm leading-relaxed text-chrome-300">
          You&rsquo;ve found a URL that isn&rsquo;t indexed. Either it
          was retired, mis-typed, or never lived here. Easiest doors
          are below.
        </p>
        <nav className="flex flex-col gap-2 text-xs">
          <Link
            href="/"
            className="rounded-sm border border-warm-black-700 px-4 py-2 uppercase tracking-wider transition-colors hover:border-pink-200 hover:text-pink-200"
          >
            ← Studio home
          </Link>
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-700 px-4 py-2 uppercase tracking-wider transition-colors hover:border-pink-200 hover:text-pink-200"
          >
            Atelier
          </Link>
          <Link
            href="/search"
            className="rounded-sm border border-warm-black-700 px-4 py-2 uppercase tracking-wider transition-colors hover:border-pink-200 hover:text-pink-200"
          >
            Catalogue
          </Link>
        </nav>
      </div>
    </main>
  );
}
