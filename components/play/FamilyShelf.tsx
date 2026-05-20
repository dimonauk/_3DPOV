import Link from "next/link";

import { SystemTile } from "./SystemTile";
import {
  type FamilyMeta,
  type SystemEntry,
} from "lib/play/families";

/**
 * FamilyShelf — one platform-family row on the /play index. The
 * family name, tagline, and accent band sit above a responsive grid
 * of SystemTiles sorted by release year.
 *
 * Server component. The accent colour is the family's own brand red
 * / blue / green / etc., used as a thin band rather than a flood — the
 * page stays warm-black-on-pink and lets the family colour signal
 * just enough to navigate.
 */
export type FamilyShelfProps = {
  family: FamilyMeta;
  systems: SystemEntry[];
  /** "lg" — used on the per-family focused page; "md" — used on the index. */
  tileSize?: "md" | "lg";
};

export function FamilyShelf({
  family,
  systems,
  tileSize = "md",
}: FamilyShelfProps) {
  const href = `/play/${family.slug}`;

  return (
    <section className="mt-14 first:mt-0">
      <header className="flex flex-col gap-3 border-b border-warm-black-800 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-chrome-100 md:text-4xl">
            <Link href={href} className="hover:text-pink-200">
              {family.name}
            </Link>
          </h2>
          <Link
            href={href}
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            view family &rarr;
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-1 w-12 rounded-sm"
            style={{ background: family.accent }}
          />
          <p className="text-sm text-chrome-300 italic">{family.tagline}</p>
        </div>
      </header>

      <div
        className={
          tileSize === "lg"
            ? "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            : "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        }
      >
        {systems.map((entry) => (
          <SystemTile key={entry.slug} entry={entry} size={tileSize} />
        ))}
      </div>
    </section>
  );
}

export default FamilyShelf;
