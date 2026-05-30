/**
 * components/holoflow/PillarCard.tsx — numbered service-pillar card.
 *
 * The "01 / 03 · ⟁ · Heritage Documentation" card from the pillar grid.
 * Cyan-on-hover bar at the bottom, tag list, glyph header. Designed to
 * slot into a 3-column grid (other PillarCards on its left and right).
 */

import Link from "next/link";

export type PillarAccent = "gold" | "lavender" | "teal" | "coral" | "pink";

const BAR: Record<PillarAccent, string> = {
  gold: "bg-gold-400",
  lavender: "bg-lavender-400",
  teal: "bg-teal-400",
  coral: "bg-coral-400",
  pink: "bg-pink-400",
};

export function PillarCard({
  n,
  total,
  glyph,
  title,
  desc,
  tags = [],
  accent = "lavender",
  href,
}: {
  n: number;
  total: number;
  glyph: string;
  title: string;
  desc: string;
  tags?: string[];
  accent?: PillarAccent;
  href?: string;
}) {
  const body = (
    <>
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-chrome-500">
        {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      <div className="mt-5 text-xl leading-none">{glyph}</div>
      <h3 className="mt-3 font-display text-2xl font-light leading-tight">{title}</h3>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-chrome-400">{desc}</p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t, k) => (
            <span
              key={k}
              className="rounded-sm border border-warm-black-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-chrome-500"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${BAR[accent]}`}
      />
    </>
  );

  const cls =
    "group relative block border-r border-warm-black-700 p-7 transition-colors last:border-r-0 hover:bg-warm-black-925";

  return href ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function PillarGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 grid grid-cols-1 border border-warm-black-700 md:grid-cols-3">
      {children}
    </div>
  );
}
