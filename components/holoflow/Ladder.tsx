/**
 * components/holoflow/Ladder.tsx — skill / curriculum rung list.
 *
 * The "Heritage Skills Ladder · 5 rungs" component from the Holo-Flow
 * landing. Each rung is a 28px number + name/desc + level badge.
 *
 * Levels carry their own colour identity:
 *   entry  — teal      (start here)
 *   mid    — gold      (you're competent)
 *   adv    — lavender  (you're paid for this)
 *   master — pink      (you teach it)
 */

import type { ReactNode } from "react";

export type LadderLevel = "entry" | "mid" | "adv" | "master";

const LEVEL_CLASS: Record<LadderLevel, string> = {
  entry: "border-teal-400 text-teal-400",
  mid: "border-gold-400 text-gold-400",
  adv: "border-lavender-400 text-lavender-400",
  master: "border-pink-400 text-pink-400",
};

const LEVEL_LABEL: Record<LadderLevel, string> = {
  entry: "Entry",
  mid: "Intermediate",
  adv: "Advanced",
  master: "Master",
};

export function Ladder({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-warm-black-700">
      <div className="flex items-center justify-between border-b border-warm-black-700 bg-warm-black-925 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-400">
          {title}
        </span>
        {badge && (
          <span className="rounded-sm border border-lavender-400 px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.16em] text-lavender-300">
            {badge}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function LadderRung({
  n,
  name,
  desc,
  level,
}: {
  n: number | string;
  name: string;
  desc: string;
  level: LadderLevel;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-start gap-2.5 border-b border-warm-black-700 px-4 py-3 transition-colors last:border-b-0 hover:bg-warm-black-925">
      <div className="font-display text-base font-light leading-none text-chrome-500">
        {typeof n === "number" ? n.toString().padStart(2, "0") : n}
      </div>
      <div>
        <div className="text-[11px] text-chrome-100">{name}</div>
        <div className="mt-0.5 font-mono text-[10px] leading-snug text-chrome-400">
          {desc}
        </div>
      </div>
      <div className={`mt-0.5 rounded-sm border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.15em] ${LEVEL_CLASS[level]}`}>
        {LEVEL_LABEL[level]}
      </div>
    </div>
  );
}
