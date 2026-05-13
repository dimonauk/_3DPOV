import Link from "next/link";

import { getMode } from "lib/chrono-protocol";
import type { Zone } from "lib/chrono-protocol/zones";

/**
 * Zone-selection card for the HUB and the landing page.
 *
 * Shows the zone name, billing line, difficulty badge, brief
 * description, mode roster, lock state, and the enter button. Locked
 * cards render the lock icon + a reason line; unlocked cards link to
 * the zone-briefing page at /chrono-protocol/zone/[slug].
 */

const DIFFICULTY_LABEL: Record<Zone["difficulty"], string> = {
  tutorial: "Tutorial",
  normal: "Normal",
  hard: "Hard",
};

const DIFFICULTY_TINT: Record<Zone["difficulty"], string> = {
  tutorial: "text-[#00cc66]",
  normal: "text-[#ffcc00]",
  hard: "text-[#ff3344]",
};

export type ZoneCardProps = {
  zone: Zone;
  /** Whether the zone is currently accessible. */
  unlocked: boolean;
  /** Optional human-readable reason for being locked. */
  lockReason?: string;
  /** Best score, if any. */
  bestScore?: number | null;
};

export function ZoneCard({
  zone,
  unlocked,
  lockReason,
  bestScore = null,
}: ZoneCardProps) {
  const enterHref = `/chrono-protocol/zone/${zone.slug}`;
  return (
    <div
      className={`rounded-sm border p-5 transition-colors ${
        unlocked
          ? "border-warm-black-800 bg-warm-black-900/40 hover:border-pink-200/40"
          : "border-warm-black-900 bg-warm-black-950/60"
      }`}
    >
      <div className="chrome-label flex flex-wrap items-baseline gap-2 text-chrome-500">
        <span>Zone</span>
        <span>&middot;</span>
        <span className={DIFFICULTY_TINT[zone.difficulty]}>
          {DIFFICULTY_LABEL[zone.difficulty]}
        </span>
        {!unlocked ? (
          <>
            <span>&middot;</span>
            <span className="text-chrome-500">Locked</span>
          </>
        ) : null}
      </div>

      <h3
        className={`mt-1 text-xl ${
          unlocked ? "text-chrome-100" : "text-chrome-400"
        }`}
      >
        {zone.name}
      </h3>
      <p
        className={`mt-0.5 text-sm ${
          unlocked ? "text-chrome-300" : "text-chrome-500"
        }`}
      >
        {zone.billing}
      </p>

      <p
        className={`mt-3 text-sm leading-relaxed ${
          unlocked ? "text-chrome-300" : "text-chrome-500"
        }`}
      >
        {zone.description.length > 220
          ? `${zone.description.slice(0, 217)}…`
          : zone.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {zone.activeModes.map((modeSlug) => {
          const mode = getMode(modeSlug);
          if (!mode) return null;
          return (
            <span
              key={modeSlug}
              className="rounded-sm border px-2 py-0.5 font-mono text-[0.65rem] tracking-wide"
              style={{
                borderColor: mode.hexColor,
                color: mode.hexColor,
                background: `${mode.hexColor}14`,
              }}
            >
              {mode.name}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-chrome-500">
        <div className="font-mono">
          {zone.enemies.length} enemies
          {zone.boss ? " &middot; 1 boss" : " &middot; no boss"}
        </div>
        {bestScore != null && bestScore > 0 ? (
          <div className="font-mono">
            Best: {bestScore.toLocaleString()}
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        {unlocked ? (
          <Link
            href={enterHref}
            className="inline-flex items-center gap-2 rounded-sm border border-pink-200/40 bg-pink-200/5 px-3 py-1.5 text-xs text-pink-200 transition-colors hover:bg-pink-200/10"
          >
            Enter brief &rarr;
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/50 px-3 py-1.5 text-xs text-chrome-500">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 5V3.5a3 3 0 1 1 6 0V5h.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5H3zm1 0h4V3.5a2 2 0 1 0-4 0V5z" />
            </svg>
            {lockReason ?? "Locked"}
          </div>
        )}
      </div>
    </div>
  );
}
