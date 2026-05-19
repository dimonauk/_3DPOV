/**
 * components/devices/DeviceCard.tsx — Editorial card for a single
 * device catalogue entry.
 *
 * Server component (no `"use client"`) so it can be inlined into
 * articles, codex entries, and the gallery index page without pulling
 * React Three Fiber across the wire. Renders an accent strip + name +
 * manufacturer + year, the Princess note, and the attribution chip
 * (the load-bearing surface — every model carries its source + author
 * + licence prominently).
 *
 * Two variants:
 *   - "index" (default): full card, used in the gallery list view.
 *   - "inline": tighter horizontal layout for use inside articles.
 */

import type { ReactNode } from "react";
import Link from "next/link";

import type { DeviceEntry } from "lib/devices/catalogue";

export type DeviceCardProps = {
  entry: DeviceEntry;
  variant?: "index" | "inline";
  linked?: boolean;
};

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

function AttributionChip({
  entry,
  className,
}: {
  entry: DeviceEntry;
  className?: string;
}) {
  const accent = entry.presentation.accent;
  return (
    <a
      href={entry.attribution.url}
      target="_blank"
      rel="noreferrer noopener"
      className={
        className ??
        "inline-flex flex-wrap items-center gap-2 rounded-sm border px-2 py-1 text-[0.65rem] uppercase tracking-widest text-chrome-300 hover:text-pink-200"
      }
      style={{ borderColor: accent + "66" }}
    >
      <span style={{ color: accent }}>{entry.attribution.licence}</span>
      <span>&middot;</span>
      <span>{entry.attribution.source}</span>
      <span>&middot;</span>
      <span>{entry.attribution.author}</span>
    </a>
  );
}

export function DeviceCard({
  entry,
  variant = "index",
  linked = true,
}: DeviceCardProps) {
  const href = `/atelier/devices/${entry.slug}`;
  const accent = entry.presentation.accent;

  if (variant === "inline") {
    return (
      <aside className="my-6 flex gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
        <div
          aria-hidden
          className="h-16 w-16 flex-shrink-0 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, rgba(12,10,18,0.85) 100%)`,
          }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <MaybeLink
            linked={linked}
            href={href}
            className="font-display text-lg leading-snug text-chrome-100 hover:text-pink-200"
          >
            {entry.name}
          </MaybeLink>
          <div className="chrome-label text-chrome-400">
            {entry.manufacturer} &middot; {entry.year}
          </div>
          <p className="mt-1 text-sm text-chrome-300">{entry.note}</p>
        </div>
      </aside>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div
        aria-hidden
        className="relative h-36 w-full overflow-hidden rounded-sm border border-warm-black-800"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, rgba(12,10,18,0.92) 70%)`,
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background:
              "linear-gradient(to top, rgba(12,10,18,0.85), transparent)",
          }}
        />
        {!entry.modelPresent && (
          <div className="chrome-label absolute right-2 bottom-2 rounded-sm bg-warm-black-950/85 px-2 py-1 text-[0.55rem] text-chrome-300">
            Primitive fallback
          </div>
        )}
      </div>

      <header className="flex flex-col gap-1">
        <MaybeLink
          linked={linked}
          href={href}
          className="font-display text-2xl leading-tight text-chrome-100 hover:text-pink-200"
        >
          {entry.name}
        </MaybeLink>
        <div className="chrome-label flex items-center gap-2 text-chrome-400">
          <span
            aria-hidden
            className="inline-block h-2 w-6"
            style={{ background: accent }}
          />
          <span>
            {entry.manufacturer} &middot; {entry.year}
          </span>
        </div>
      </header>

      <p className="text-sm text-chrome-300">{entry.note}</p>

      <AttributionChip entry={entry} />

      {linked && (
        <div className="mt-1">
          <Link
            href={href}
            className="text-xs text-pink-200 underline-offset-4 hover:underline"
          >
            walk to the device &rarr;
          </Link>
        </div>
      )}
    </article>
  );
}

export { AttributionChip };
export default DeviceCard;
