/**
 * HoloflowNav — sticky top navigation with logo + links + CTA + key hint.
 *
 * Matches the source HTML's <nav>: serif italic gold logo with mono
 * superscript, uppercase letter-spaced links with underline-on-hover,
 * bordered CTA that fills on hover, optional keyboard hint badge.
 */

import Link from "next/link";

import { KeyboardHint } from "./KeyboardHint";

export type NavLink = { label: string; href: string };

export function HoloflowNav({
  logo,
  superscript = "TM",
  links,
  ctaLabel,
  ctaHref,
  keyHint,
}: {
  logo: string;
  superscript?: string;
  links: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  keyHint?: string;
}) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-warm-black-700 bg-warm-black-950/95 px-6 py-3 backdrop-blur-xl md:px-10">
      <Link href="/" className="font-display text-lg italic text-gold-300 tracking-wide">
        {logo}
        <sup className="ml-0.5 font-mono text-[0.44rem] not-italic text-lavender-200 tracking-[0.2em]">
          {superscript}
        </sup>
      </Link>
      <div className="hidden flex-wrap items-center gap-6 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group relative font-mono text-[0.57rem] uppercase tracking-[0.2em] text-chrome-400 transition-colors hover:text-chrome-100"
          >
            {l.label}
            <span className="absolute -bottom-1 left-0 right-0 h-px origin-left scale-x-0 bg-gold-400 transition-transform group-hover:scale-x-100" />
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {keyHint && <KeyboardHint code={keyHint} />}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="border border-gold-400 px-3 py-1.5 font-mono text-[0.57rem] uppercase tracking-[0.18em] text-gold-400 transition-colors hover:bg-gold-400 hover:text-warm-black-950"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </nav>
  );
}
