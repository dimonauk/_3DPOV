/**
 * PriceCard / PriceGrid / PriceFeature
 *
 * Mirrors .price-col / .price-col.featured / .price-feature(.off) from
 * the source HTML. Featured columns get a lavender border tint + badge.
 */

import type { ReactNode } from "react";

export function PriceGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-md border border-warm-black-700 md:grid-cols-3">
      {children}
    </div>
  );
}

export function PriceCard({
  tier,
  price,
  period,
  description,
  features,
  cta,
  featured = false,
  badge,
}: {
  tier: string;
  price: string;
  period?: string;
  description?: string;
  features: Array<{ label: string; included?: boolean }>;
  cta?: { label: string; href: string };
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative border-r border-warm-black-700 p-6 last:border-r-0 ${
        featured ? "bg-lavender-400/5" : ""
      }`}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-sm border border-lavender-400 px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.13em] text-lavender-200">
          {badge}
        </span>
      )}
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
        {tier}
      </div>
      <div className="mt-2 font-display text-3xl font-light leading-none text-chrome-100">
        {price}
      </div>
      {period && (
        <div className="mt-1 font-mono text-[10px] text-chrome-500">{period}</div>
      )}
      {description && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-chrome-400">
          {description}
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-1.5">
        {features.map((f, k) => (
          <li
            key={k}
            className={`relative pl-3 font-mono text-[11px] leading-snug ${
              f.included === false ? "text-chrome-500/60" : "text-chrome-300"
            }`}
          >
            <span
              className={`absolute left-0 ${
                f.included === false ? "text-chrome-500" : "text-teal-400"
              }`}
            >
              {f.included === false ? "·" : "›"}
            </span>{" "}
            {f.label}
          </li>
        ))}
      </ul>
      {cta && (
        <a
          href={cta.href}
          className={`mt-5 block w-full border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
            featured
              ? "border-lavender-400 text-lavender-200 hover:bg-lavender-400 hover:text-warm-black-950"
              : "border-warm-black-700 text-chrome-400 hover:border-gold-400 hover:text-gold-400"
          }`}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
