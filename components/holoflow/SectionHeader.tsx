/**
 * SectionHeader — eyebrow + serif h2 with italic accent + mono body.
 *
 * The recurring pattern at the top of every vertical's deep-dive
 * section. Uses ChromeLabel for the eyebrow; accepts JSX for the
 * title so callers can wrap an <em> for the gold-italic accent.
 *
 *   <SectionHeader
 *     eyebrow="Vertical 01 — Deep Dive"
 *     title={<>Heritage <em>Documentation</em></>}
 *     body="..."
 *   />
 */

import type { ReactNode } from "react";

import { ChromeLabel } from "./ChromeLabel";
import type { PillarAccent } from "./PillarCard";

export function SectionHeader({
  eyebrow,
  title,
  body,
  accent = "lavender",
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  accent?: PillarAccent;
}) {
  return (
    <header>
      <ChromeLabel accent={accent} withRule>{eyebrow}</ChromeLabel>
      <h2 className="mt-3 font-display text-3xl font-light leading-[1.05] md:text-5xl">
        {title}
      </h2>
      {body && (
        <p className="mt-3 max-w-xl font-mono text-[11px] leading-loose text-chrome-400">
          {body}
        </p>
      )}
    </header>
  );
}
