"use client";

/**
 * components/shell/right-panel-inspectors.tsx — Per-route inspector
 * blocks for the right-side shell panel. Each function returns the
 * inspector body for one route family (play level, the loop overview,
 * visualisers, chrono-protocol, services, or the generic fallback).
 *
 * Article / journal / tutorial detail is delegated to the shared
 * `EntryInspector`; this file holds the rest.
 */

import Link from "next/link";

import { chronoModes } from "lib/chrono-protocol";
import { loopPositions } from "lib/loop";
import { getPlayLevel } from "lib/play";
import { services } from "lib/services";

import { Row, extractSlug } from "./right-panel-shared";

export function PlayLevelInspector({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick: () => void;
}) {
  const slug = extractSlug(pathname, "play");
  if (!slug) return null;
  const level = getPlayLevel(slug);
  if (!level) return null;
  // onLinkClick reserved for future inline links inside the level summary.
  void onLinkClick;
  return (
    <div className="space-y-4">
      <div>
        <div className="chrome-label mb-1 text-cyan-400/80">Play level</div>
        <p className="text-sm leading-snug text-chrome-100">{level.name}</p>
      </div>
      <Row label="Mechanic">{level.mechanic}</Row>
      <Row label="Proves">{level.proves}</Row>
      <Row label="Goal">{level.goal}</Row>
      <Row label="Status">{level.status}</Row>
    </div>
  );
}

export function LoopOverviewInspector({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div className="space-y-3">
      <div className="chrome-label text-cyan-400/80">The six positions</div>
      <ol className="space-y-2 text-sm text-chrome-200">
        {loopPositions.map((p, i) => (
          <li key={p.slug} className="leading-snug">
            <span className="text-chrome-500">{i + 1}.</span>{" "}
            <Link
              href={`/the-loop#${p.slug}`}
              className="hover:text-pink-200"
              onClick={onLinkClick}
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function VisualiserInspector({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick: () => void;
}) {
  const visualiserSlug = extractSlug(pathname, "visualiser");
  return (
    <div className="space-y-3">
      <div>
        <div className="chrome-label mb-1 text-cyan-400/80">Visualiser</div>
        <p className="text-sm leading-snug text-chrome-100">
          {visualiserSlug ? visualiserSlug.replace(/-/g, " ") : "Index"}
        </p>
      </div>
      <p className="text-sm leading-snug text-chrome-300">
        Interactive scene. Data source &mdash; the studio&rsquo;s own
        recordings and parameter sets; no third-party telemetry.
      </p>
      <Link
        href="/visualiser"
        className="text-sm text-chrome-200 hover:text-pink-200"
        onClick={onLinkClick}
      >
        See all visualisers &rarr;
      </Link>
    </div>
  );
}

export function ChronoProtocolInspector() {
  return (
    <div className="space-y-3">
      <div className="chrome-label text-cyan-400/80">Chrono-Protocol wheel</div>
      <div
        className="relative mx-auto h-32 w-32"
        aria-label="Five-mode colour wheel"
        role="img"
      >
        {chronoModes.map((m, i) => {
          const angle = (i / chronoModes.length) * 2 * Math.PI - Math.PI / 2;
          const r = 48;
          const x = 50 + (r / 64) * 50 * Math.cos(angle);
          const y = 50 + (r / 64) * 50 * Math.sin(angle);
          return (
            <span
              key={m.slug}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                backgroundColor: m.hexColor,
                boxShadow: `0 0 10px ${m.hexColor}80`,
              }}
              title={m.name}
            />
          );
        })}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-chrome-400">
          5 modes
        </span>
      </div>
      <ul className="space-y-1 text-xs text-chrome-300">
        {chronoModes.map((m) => (
          <li key={m.slug} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: m.hexColor }}
            />
            <span className="text-chrome-200">{m.name}</span>
            <span className="text-chrome-500">&mdash; {m.function}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicesInspector() {
  const counts: Record<string, number> = {};
  for (const s of services) {
    counts[s.category] = (counts[s.category] ?? 0) + 1;
  }
  return (
    <div className="space-y-3">
      <div className="chrome-label text-cyan-400/80">By category</div>
      <ul className="space-y-1 text-sm text-chrome-300">
        {Object.entries(counts).map(([cat, n]) => (
          <li key={cat} className="flex justify-between">
            <span className="text-chrome-200">{cat.replace(/-/g, " ")}</span>
            <span className="font-mono text-chrome-500">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GenericInspector({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="chrome-label mb-1 text-cyan-400/80">
          Page architecture
        </div>
        <p className="font-mono text-xs text-chrome-200">{pathname}</p>
      </div>
      <div>
        <div className="chrome-label mb-1 text-cyan-400/80">
          More from the studio
        </div>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href="/the-loop"
              className="text-chrome-200 hover:text-pink-200"
              onClick={onLinkClick}
            >
              The Loop &mdash; the studio&rsquo;s six positions
            </Link>
          </li>
          <li>
            <Link
              href="/sphere"
              className="text-chrome-200 hover:text-pink-200"
              onClick={onLinkClick}
            >
              The Sphere &mdash; cross-reference graph
            </Link>
          </li>
          <li>
            <Link
              href="/articles"
              className="text-chrome-200 hover:text-pink-200"
              onClick={onLinkClick}
            >
              Articles &mdash; the arguments
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
