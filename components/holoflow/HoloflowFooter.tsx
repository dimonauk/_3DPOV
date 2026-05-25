/**
 * HoloflowFooter — 5-column link grid + bottom strip with mark + copyright.
 *
 * Pass column groups; the footer renders each as a labeled list. Below
 * the columns sits a horizontal divider + the brand mark (italic gold)
 * and copyright line.
 */

import Link from "next/link";

export type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export function HoloflowFooter({
  columns,
  mark = "Holo-Flow Studio",
  copyright,
}: {
  columns: FooterColumn[];
  mark?: string;
  copyright?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-warm-black-700 bg-warm-black-950 px-6 py-8 md:px-10">
      <div className="mb-6 grid grid-cols-2 gap-8 md:grid-cols-5">
        {columns.map((col, k) => (
          <div key={k}>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-chrome-500">
              {col.title}
            </div>
            <ul className="flex flex-col gap-2">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link
                    href={l.href}
                    className="font-mono text-[11px] text-chrome-400 transition-colors hover:text-chrome-100"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-warm-black-700 pt-4">
        <span className="font-display text-base italic text-gold-300">{mark}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chrome-500">
          {copyright ?? `© ${year} · all rights reserved`}
        </span>
      </div>
    </footer>
  );
}
