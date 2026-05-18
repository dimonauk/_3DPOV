/**
 * app/admin/page.tsx — Operator landing.
 *
 * Catalogue-voice. Two doors: upload, library. Nothing else lives here.
 */

import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator console",
  robots: { index: false, follow: false },
};

export default function AdminLandingPage() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">Operator console</span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Back of house
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Where the studio puts things into the catalogue before the public
            ever sees them.
          </p>
          <p className="text-xs leading-relaxed text-chrome-400">
            Uploads land in Vercel Blob. Metadata lives in Firestore. The
            public read path resolves through the same record either route
            below produces.
          </p>
        </header>

        <nav className="flex flex-col gap-3">
          <Link
            href="/admin/upload"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">01</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Upload media
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Drag a folder in. Tag the subject, kind, and any capture metadata.
              Push to the catalogue.
            </span>
          </Link>
          <Link
            href="/admin/library"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">02</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Browse library
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Filter the existing records by subject, kind, source, or tag.
              Retire or delete in place.
            </span>
          </Link>
          <Link
            href="/admin/assets"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">03</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Asset registry
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Add a mesh, Blender file, gallery album or archive to
              data/assets.json. Vercel Blob for &lt; 50 MB, Drive for larger,
              Photos for gallery links.
            </span>
          </Link>
          <Link
            href="/admin/wardrobe"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">04</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Wardrobe
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Add a .vrm outfit to data/wardrobe.json. Browser-direct upload
              to Vercel Blob, then paste the snippet.
            </span>
          </Link>
          <Link
            href="/admin/people-finder"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">05</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              People finder
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Batch-verify usernames across 2,500+ sites via Maigret. Paste
              names, get the claimed-platform hits per person.
            </span>
          </Link>
          <Link
            href="/admin/targeting"
            className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 transition-colors hover:border-pink-200"
          >
            <span className="chrome-label text-chrome-400">06</span>
            <span className="text-sm uppercase tracking-[0.18em] text-chrome-100">
              Targeting
            </span>
            <span className="text-xs leading-relaxed text-chrome-400">
              Match a piece of studio content against the rolodex. Sorted
              by shared scenes + tags; per-person outreach links.
            </span>
          </Link>
        </nav>

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <a
            href="/"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Studio
          </a>
          <span className="chrome-label text-chrome-500">
            Operator only
          </span>
        </footer>
      </div>
    </main>
  );
}
