"use client";

/**
 * app/cards/mine/page.tsx — Signed-in user's card dashboard.
 *
 * Lists the cards the current Firebase Auth user has saved via
 * /cards/design. Provides edit (deep-link back to the designer with the
 * card pre-loaded) and delete actions per card.
 *
 * Auth-gated: redirects to /signin if not authed (and after a one-tick
 * grace period to let the AuthProvider hydrate).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-provider";
import {
  deleteCardClient,
  listMyCardsClient,
  type CardDoc,
} from "lib/cards/firestore";

export default function MyCardsPage() {
  const auth = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CardDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const docs = await listMyCardsClient();
      setCards(docs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't load your cards.";
      setError(message);
    }
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/signin");
      return;
    }
    refresh();
  }, [auth.loading, auth.user, refresh, router]);

  const onDelete = async (slug: string) => {
    if (!confirm(`Permanently delete /c/${slug}? This cannot be undone.`))
      return;
    setDeleting(slug);
    try {
      await deleteCardClient(slug);
      setCards((cs) => cs?.filter((c) => c.slug !== slug) ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't delete.";
      alert(message);
    } finally {
      setDeleting(null);
    }
  };

  if (auth.loading || cards === null) {
    return (
      <main className="min-h-screen bg-warm-black-950 px-6 py-20 text-chrome-300">
        <p className="mx-auto max-w-3xl">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-warm-black-950 text-chrome-200">
      <section className="border-b border-warm-black-800">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12 md:px-8 md:py-16">
          <div className="chrome-label">AR cards &middot; My cards</div>
          <h1 className="mt-3 max-w-3xl text-3xl md:text-5xl">
            Your saved cards.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-chrome-300">
            Signed in as{" "}
            <span className="text-chrome-100">
              {auth.user?.displayName ?? auth.user?.email}
            </span>
            . These cards live at their permanent URLs and survive across
            devices. Studio-hosted cards (the commissioned tier) appear on
            the public <Link href="/cards" className="text-pink-200 underline underline-offset-4">/cards</Link>{" "}
            index too.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-10 md:px-8 md:py-14">
        {error && (
          <div className="mb-6 rounded-sm border border-red-300/40 bg-red-300/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-10 text-center">
            <p className="text-chrome-300">You haven&rsquo;t saved any cards yet.</p>
            <Link
              href="/cards/design"
              className="mt-6 inline-block rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Design your first card &rarr;
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((doc) => (
              <li
                key={doc.slug}
                className="overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950/40"
              >
                <div
                  className="aspect-[85/55] p-5"
                  style={{
                    background: `linear-gradient(135deg, ${doc.card.brand.primary}, ${doc.card.brand.secondary})`,
                    color: doc.card.brand.textOnBrand,
                  }}
                >
                  <div
                    className="text-[0.65rem] uppercase tracking-[0.18em] opacity-80"
                    style={{ color: doc.card.brand.textOnBrand }}
                  >
                    {doc.card.studio ?? "Holo-Flow Studio"}
                  </div>
                  <div className="mt-2 font-display text-xl">
                    {doc.card.name}
                  </div>
                  <div className="mt-1 text-sm opacity-90">
                    {doc.card.role}
                  </div>
                </div>

                <div className="border-t border-warm-black-800 px-5 py-4">
                  <div className="font-mono text-[0.7rem] text-pink-200">
                    /c/{doc.slug}
                  </div>
                  <div className="mt-1 text-[0.65rem] text-chrome-500">
                    Updated {formatDate(doc.updatedAt)}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={`/c/${doc.slug}`}
                      className="rounded-full border border-chrome-400/30 px-3 py-1 text-chrome-300 transition-colors hover:border-pink-200 hover:text-pink-200"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/cards/design?slug=${encodeURIComponent(doc.slug)}`}
                      className="rounded-full border border-chrome-400/30 px-3 py-1 text-chrome-300 transition-colors hover:border-pink-200 hover:text-pink-200"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(doc.slug)}
                      disabled={deleting === doc.slug}
                      className="rounded-full border border-red-400/30 px-3 py-1 text-red-200 transition-colors hover:border-red-300 hover:text-red-100 disabled:opacity-50"
                    >
                      {deleting === doc.slug ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 border-t border-warm-black-800 pt-8">
          <Link
            href="/cards/design"
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            + Design a new card
          </Link>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
