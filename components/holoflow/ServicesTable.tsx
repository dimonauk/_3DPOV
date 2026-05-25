/**
 * ServicesTable — numbered service rows with rate column.
 *
 * The "01 · 360° heritage documentation · £750/day" pattern from the
 * source HTML. Hover slides a 2px teal bar in from the left + nudges
 * content right.
 */

import type { ReactNode } from "react";

export type ServiceRow = {
  title: string;
  body: ReactNode;
  rate: string;
};

export function ServicesTable({ rows }: { rows: ServiceRow[] }) {
  return (
    <div className="my-6">
      {rows.map((r, i) => (
        <div
          key={i}
          className="group relative grid grid-cols-[32px_1fr_auto] items-start gap-4 border-b border-warm-black-700 py-4 transition-[padding] hover:pl-2 last:border-b-0"
        >
          <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-transparent transition-colors group-hover:bg-teal-400" />
          <span className="font-display text-2xl italic text-teal-400/15 leading-none">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="text-[12px] font-semibold text-chrome-100">{r.title}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-chrome-400">{r.body}</div>
          </div>
          <span className="whitespace-nowrap pt-1 font-mono text-[11px] text-gold-300">
            {r.rate}
          </span>
        </div>
      ))}
    </div>
  );
}
