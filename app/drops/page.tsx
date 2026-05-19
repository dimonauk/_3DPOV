import type { Metadata } from "next";
import Link from "next/link";

import {
  isLimitedSoldOut,
  listPublishedDrops,
  totalClaimed,
} from "lib/drops/read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drops — Holo-Flow Studio",
  description:
    "Editioned drops from the bench. Each piece a Unique plus 25 Limited plus an optional Open run. Patron tier gets the first-refusal window; Atelier holds 25% of every Limited.",
};

export default async function DropsIndexPage() {
  const { drops } = await listPublishedDrops({ limit: 24 });
  return (
    <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="chrome-label">Drops</div>
      <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
        Drops from the bench.
      </h1>

      <div className="mt-8 max-w-2xl space-y-5 text-chrome-200">
        <p>
          Each drop is one piece. A Unique, twenty-five Limited, an Open
          run if the piece calls for it &mdash; same architecture every
          time. The first twenty-four hours after publish are the
          first-refusal window for Patron and Atelier tier supporters;
          after that the room opens.
        </p>
        <p>
          The studio fabricates every drop here. No STL is released. The
          piece you buy is the object the studio made. The drop record
          carries its genome id so two pieces from the same lineage
          can find each other on the shelf.
        </p>
      </div>

      {drops.length === 0 ? (
        <div className="mt-16 rounded border border-chrome-700 p-10 text-center">
          <p className="text-chrome-300">
            No drops published yet. When the bench breeds and the
            Printability Oracle waves a piece through, it lands here.
          </p>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drops.map((drop) => {
            const limitedSoldOut = isLimitedSoldOut(drop);
            const limitedRemaining = Math.max(
              0,
              drop.edition.limitedSize - drop.editionState.limitedClaimed,
            );
            return (
              <li key={drop.id}>
                <Link
                  href={`/drops/${drop.id}`}
                  className="group flex h-full flex-col rounded border border-chrome-700 bg-warm-black-900/40 p-6 transition-colors hover:border-pink-200"
                >
                  <div className="chrome-label text-chrome-400">
                    {drop.kingdom}
                  </div>
                  <h2 className="mt-2 text-2xl text-chrome-100 group-hover:text-pink-200">
                    {drop.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm text-chrome-300">
                    {drop.summary}
                  </p>
                  <dl className="mt-6 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="chrome-label text-chrome-500">Unique</dt>
                      <dd className="mt-1 text-chrome-200">
                        {drop.editionState.uniqueClaimed ? "Claimed" : "Open"}
                      </dd>
                    </div>
                    <div>
                      <dt className="chrome-label text-chrome-500">Limited</dt>
                      <dd className="mt-1 text-chrome-200">
                        {limitedSoldOut
                          ? "Sold out"
                          : `${limitedRemaining} / ${drop.edition.limitedSize}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="chrome-label text-chrome-500">Open</dt>
                      <dd className="mt-1 text-chrome-200">
                        {drop.edition.openEnabled
                          ? `${drop.editionState.openClaimed}`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-6 text-xs text-chrome-500">
                    {totalClaimed(drop)} claimed
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
