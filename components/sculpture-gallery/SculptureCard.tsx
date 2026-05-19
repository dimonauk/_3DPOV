/**
 * components/sculpture-gallery/SculptureCard.tsx — Editorial card for
 * a catalogue entry.
 *
 * Server component (no `"use client"`) so it can be inlined into
 * articles, journal entries, and the gallery index page without
 * pulling React Three Fiber across the wire. Renders an accent strip
 * + title + year + edition + blurb, plus an optional still preview
 * panel that holds the accent colour as a gradient block until a
 * real preview image lands in `public/models/sculpture-gallery/`.
 *
 * Variants:
 *   - "index" (default): full editorial card, used in the gallery
 *     list view.
 *   - "inline": tighter horizontal layout for use inside running
 *     article copy.
 */

import type { ReactNode } from "react";
import Link from "next/link";

import type { SculptureEntry } from "lib/sculpture-gallery/catalogue";

export type SculptureCardProps = {
  entry: SculptureEntry;
  /** Layout variant. Default "index". */
  variant?: "index" | "inline";
  /** When true, the title links to the single-piece view. Default true. */
  linked?: boolean;
};

/**
 * Conditional Link wrapper — renders an `<a>`-shaped Link when
 * `linked` is true, otherwise the plain children. Keeps the type
 * signature clean (vs. the `Title = linked ? Link : "div"` trick
 * which forces the href prop into a "div"-shaped slot).
 */
function MaybeLink({
  linked,
  href,
  className,
  children,
}: {
  linked: boolean;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (linked) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

export function SculptureCard({
  entry,
  variant = "index",
  linked = true,
}: SculptureCardProps) {
  const href = `/atelier/sculpture-gallery/${entry.slug}`;

  if (variant === "inline") {
    return (
      <aside className="my-6 flex gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
        <div
          aria-hidden
          className="h-16 w-16 flex-shrink-0 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${entry.accent} 0%, rgba(12,10,18,0.85) 100%)`,
          }}
        />
        <div className="flex flex-col gap-1">
          <MaybeLink
            linked={linked}
            href={href}
            className="font-display text-lg leading-snug text-chrome-100 hover:text-pink-200"
          >
            {entry.title}
          </MaybeLink>
          <div className="chrome-label text-chrome-400">
            {entry.year}
            {entry.edition ? (
              <>
                {" · "}edition {entry.edition.number} of {entry.edition.of}
              </>
            ) : (
              " · open edition"
            )}
          </div>
          <p className="mt-1 text-sm text-chrome-300">{entry.blurb}</p>
        </div>
      </aside>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      {/* Still preview panel. Holds the accent colour as a diagonal
          gradient until a real card image lands at
          public/models/sculpture-gallery/<slug>.jpg. Replace this
          with `<Image>` when that surface fills in. */}
      <div
        aria-hidden
        className="relative h-44 w-full overflow-hidden rounded-sm border border-warm-black-800"
        style={{
          background: `linear-gradient(135deg, ${entry.accent} 0%, rgba(12,10,18,0.92) 70%)`,
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background:
              "linear-gradient(to top, rgba(12,10,18,0.85), transparent)",
          }}
        />
      </div>

      <header className="flex flex-col gap-1">
        <MaybeLink
          linked={linked}
          href={href}
          className="font-display text-2xl leading-tight text-chrome-100 hover:text-pink-200"
        >
          {entry.title}
        </MaybeLink>
        <div className="chrome-label flex items-center gap-2 text-chrome-400">
          <span
            aria-hidden
            className="inline-block h-2 w-6"
            style={{ background: entry.accent }}
          />
          <span>
            {entry.year}
            {entry.edition ? (
              <>
                {" · "}edition {entry.edition.number} of {entry.edition.of}
              </>
            ) : (
              " · open edition"
            )}
          </span>
        </div>
      </header>

      <p className="text-sm text-chrome-300">{entry.blurb}</p>

      <p className="text-xs text-chrome-500">{entry.note}</p>

      {linked && (
        <div className="mt-1">
          <Link
            href={href}
            className="text-xs text-pink-200 underline-offset-4 hover:underline"
          >
            walk to the piece &rarr;
          </Link>
        </div>
      )}
    </article>
  );
}

export default SculptureCard;
