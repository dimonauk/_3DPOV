import Link from "next/link";

import {
  type SystemEntry,
  type LaunchPath,
  launchChipLabel,
  launchHref,
  primaryLaunch,
} from "lib/play/families";
import { getFamily } from "lib/play/families";

/**
 * SystemTile — one card in the GameHub-style /play index.
 *
 * Server component. The thumbnail is a primitive-fallback gradient that
 * mirrors the device-gallery accent-on-warm-black treatment; once GLBs
 * land at public/models/devices/consoles/<slug>.glb we can swap in a
 * client R3F snapshot. The chip below the title is the first launchable
 * path's CTA — "Play in browser", "Walk in VR", "Native · <emulator>",
 * or "Coming soon" when no path is wired yet.
 */
export type SystemTileProps = {
  entry: SystemEntry;
  /** Tile size. Tiles default to "md"; per-family pages use "lg". */
  size?: "md" | "lg";
};

function chipClasses(launch: LaunchPath): string {
  switch (launch.kind) {
    case "emulatorjs":
      return "border-pink-200/40 bg-pink-200/[0.06] text-pink-200";
    case "webxr-retroarch":
      return "border-pink-200/60 bg-pink-200/[0.08] text-pink-200";
    case "bench-bridge":
      return "border-chrome-400/40 bg-warm-black-900/60 text-chrome-200";
    case "comingSoon":
      return "border-warm-black-700 bg-warm-black-900/40 text-chrome-500";
  }
}

export function SystemTile({ entry, size = "md" }: SystemTileProps) {
  const family = getFamily(entry.family);
  const accent = family?.accent ?? "#cccccc";
  const launch = primaryLaunch(entry);
  const href = `/play/${entry.family}/${entry.slug}`;
  const chipHref = launchHref(launch);

  const thumbHeight = size === "lg" ? "h-44" : "h-32";
  const titleSize =
    size === "lg" ? "text-2xl md:text-3xl" : "text-xl";

  return (
    <article className="flex w-full flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-4 transition-colors hover:border-pink-200/30">
      <Link href={href} className="block">
        <div
          aria-hidden
          className={`relative ${thumbHeight} w-full overflow-hidden rounded-sm border border-warm-black-800`}
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, rgba(12,10,18,0.94) 70%)`,
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-12"
            style={{
              background:
                "linear-gradient(to top, rgba(12,10,18,0.85), transparent)",
            }}
          />
          {!entry.modelUrl && (
            <div className="chrome-label absolute right-2 bottom-2 rounded-sm bg-warm-black-950/85 px-2 py-1 text-[0.55rem] text-chrome-300">
              Primitive
            </div>
          )}
        </div>
      </Link>

      <header className="flex flex-col gap-1">
        <Link
          href={href}
          className={`font-display ${titleSize} leading-tight text-chrome-100 hover:text-pink-200`}
        >
          {entry.shortName}
        </Link>
        <div className="chrome-label flex items-center gap-2 text-chrome-400">
          <span
            aria-hidden
            className="inline-block h-2 w-4"
            style={{ background: accent }}
          />
          <span>
            {entry.manufacturer} &middot; {entry.year}
          </span>
        </div>
      </header>

      {size === "lg" && (
        <p className="text-sm text-chrome-300 leading-snug">{entry.blurb}</p>
      )}

      <div className="mt-1">
        {chipHref ? (
          <Link
            href={chipHref}
            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[0.65rem] uppercase tracking-widest transition-colors ${chipClasses(
              launch,
            )}`}
          >
            <span>{launchChipLabel(launch)}</span>
            <span aria-hidden>&rarr;</span>
          </Link>
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[0.65rem] uppercase tracking-widest ${chipClasses(
              launch,
            )}`}
          >
            {launchChipLabel(launch)}
          </span>
        )}
      </div>
    </article>
  );
}

export default SystemTile;
