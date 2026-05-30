/**
 * HeroSideStats — the rotating numbers column on the right of the hero.
 *
 *   84   Packages
 *   ---
 *   8    Live ports
 *   ---
 *   144  Jewel cells
 *
 * Big serif violet number + tiny mono uppercase label, separated by a
 * 20px hairline. Lays out vertically; absolute-positioned by caller.
 */

export type Stat = { value: number | string; label: string };

export function HeroSideStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-col items-end gap-3">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-end gap-3">
          <div>
            <div className="font-display text-2xl font-light leading-none text-lavender-200">
              {s.value}
            </div>
            <div className="mt-1 font-mono text-[0.42rem] uppercase tracking-[0.2em] text-chrome-500">
              {s.label}
            </div>
          </div>
          {i < stats.length - 1 && (
            <span className="ml-auto h-5 w-px bg-warm-black-700" />
          )}
        </div>
      ))}
    </div>
  );
}
