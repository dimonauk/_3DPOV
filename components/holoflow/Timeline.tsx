/**
 * Timeline — vertical year-tagged history list.
 *
 * The bio-timeline pattern: left-side rail with rhombus dots; each
 * item has a year stamp, title, and short description. Used for the
 * "Dimona Dougherty" about section.
 */

import type { ReactNode } from "react";

export type TimelineItem = {
  year: string;
  title: string;
  body: ReactNode;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative my-6 list-none pl-6">
      <span className="absolute bottom-0 left-[7px] top-0 w-px bg-warm-black-700" />
      {items.map((it, i) => (
        <li key={i} className="relative mb-6 last:mb-0">
          <span className="absolute -left-[19px] top-1 h-[7px] w-[7px] rotate-45 border border-teal-400 bg-warm-black-925" />
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal-400">
            {it.year}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-chrome-100">{it.title}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-chrome-400">{it.body}</div>
        </li>
      ))}
    </ol>
  );
}
