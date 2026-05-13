"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { articles } from "lib/articles";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import { loopPositions } from "lib/loop";
import { ladders } from "lib/curriculum";
import { useShell } from "components/shell/shell-context";

type Crumb = { label: string; href?: string };

/**
 * Derive a small breadcrumb from a pathname. The first segment becomes
 * the section name; deeper segments are decoded and re-titled.
 */
function pathToCrumbs(pathname: string): Crumb[] {
  if (pathname === "/" || pathname === "") {
    return [{ label: "Home", href: "/" }];
  }
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  let accum = "";
  for (let i = 0; i < parts.length; i += 1) {
    const segment = parts[i];
    if (!segment) continue;
    accum += `/${segment}`;
    const decoded = decodeURIComponent(segment).replace(/-/g, " ");
    const label = decoded
      .split(" ")
      .map((w) => (w.length === 0 ? w : w[0]!.toUpperCase() + w.slice(1)))
      .join(" ");
    const isLast = i === parts.length - 1;
    crumbs.push({ label, href: isLast ? undefined : accum });
  }
  return crumbs;
}

/**
 * Find which Loop position a route lives at, if any. Matches on exact
 * href of the route entries inside each position.
 */
function findLoopPositionFor(pathname: string):
  | { name: string; slug: string }
  | null {
  for (const pos of loopPositions) {
    if (pos.routes.some((r) => r.href === pathname)) {
      return { name: pos.name, slug: pos.slug };
    }
  }
  return null;
}

/** Find which curriculum rung a route lives at, if any. */
function findCurriculumRungFor(
  pathname: string,
): { ladder: string; rung: string } | null {
  for (const ladder of ladders) {
    for (const rung of ladder.rungs) {
      if (rung.href === pathname) {
        return { ladder: ladder.title, rung: rung.title };
      }
    }
  }
  return null;
}

type RecentEntry = {
  slug: string;
  title: string;
  date: string;
  kind: "article" | "journal" | "tutorial";
  href: string;
};

function buildRecent(): RecentEntry[] {
  const all: RecentEntry[] = [
    ...articles.map<RecentEntry>((e) => ({
      slug: e.slug,
      title: e.title,
      date: e.date,
      kind: "article",
      href: `/articles/${e.slug}`,
    })),
    ...journal.map<RecentEntry>((e) => ({
      slug: e.slug,
      title: e.title,
      date: e.date,
      kind: "journal",
      href: `/journal/${e.slug}`,
    })),
    ...tutorials.map<RecentEntry>((e) => ({
      slug: e.slug,
      title: e.title,
      date: e.date,
      kind: "tutorial",
      href: `/tutorials/${e.slug}`,
    })),
  ];
  return all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
}

export function LeftPanelBody() {
  const pathname = usePathname() ?? "/";
  const { setOpen } = useShell();

  const crumbs = useMemo(() => pathToCrumbs(pathname), [pathname]);
  const loopHit = useMemo(() => findLoopPositionFor(pathname), [pathname]);
  const rungHit = useMemo(() => findCurriculumRungFor(pathname), [pathname]);
  const recent = useMemo(() => buildRecent(), []);

  const isLearnRoute = pathname.startsWith("/learn");

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5 text-chrome-300">
      <section>
        <div className="chrome-label mb-2 text-cyan-400/80">
          Where you are now
        </div>
        <nav aria-label="Breadcrumb">
          <ol className="space-y-1 text-sm">
            {crumbs.map((c, idx) => (
              <li key={`${c.label}-${idx}`} className="leading-snug">
                {c.href ? (
                  <Link
                    href={c.href}
                    className="text-chrome-200 hover:text-pink-200"
                    onClick={() => setOpen("left", false)}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-chrome-100">{c.label}</span>
                )}
                {idx < crumbs.length - 1 ? (
                  <span className="ml-1 text-chrome-500">/</span>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section>
        <div className="chrome-label mb-2 text-cyan-400/80">
          Position in the loop
        </div>
        {loopHit ? (
          <p className="text-sm leading-snug">
            <span className="text-chrome-100">{loopHit.name}</span>
            <span className="block text-xs text-chrome-500">
              <Link
                href={`/the-loop#${loopHit.slug}`}
                className="hover:text-pink-200"
                onClick={() => setOpen("left", false)}
              >
                See it placed &rarr;
              </Link>
            </span>
          </p>
        ) : (
          <p className="text-sm text-chrome-500">
            This page sits outside the six named positions. The whole loop
            is at{" "}
            <Link
              href="/the-loop"
              className="text-chrome-300 hover:text-pink-200"
              onClick={() => setOpen("left", false)}
            >
              /the-loop
            </Link>
            .
          </p>
        )}
      </section>

      {isLearnRoute ? (
        <section>
          <div className="chrome-label mb-2 text-cyan-400/80">
            Curriculum rung
          </div>
          {rungHit ? (
            <p className="text-sm leading-snug">
              <span className="text-chrome-100">{rungHit.rung}</span>
              <span className="block text-xs text-chrome-500">
                Ladder &mdash; {rungHit.ladder}
              </span>
            </p>
          ) : (
            <p className="text-sm text-chrome-500">
              Inside the curriculum, but not on a named rung yet. The full
              set of ladders is at{" "}
              <Link
                href="/learn"
                className="text-chrome-300 hover:text-pink-200"
                onClick={() => setOpen("left", false)}
              >
                /learn
              </Link>
              .
            </p>
          )}
        </section>
      ) : null}

      <section>
        <div className="chrome-label mb-2 text-cyan-400/80">Recent work</div>
        <ul className="space-y-2 text-sm">
          {recent.map((e) => (
            <li key={`${e.kind}-${e.slug}`} className="leading-snug">
              <Link
                href={e.href}
                className="text-chrome-200 hover:text-pink-200"
                onClick={() => setOpen("left", false)}
              >
                {e.title}
              </Link>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                {e.kind} &mdash; {e.date}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="chrome-label mb-2 text-cyan-400/80">Search</div>
        <input
          type="text"
          disabled
          placeholder="Search across the sphere &mdash; v0.2"
          aria-label="Search the studio (coming in v0.2)"
          className="w-full cursor-not-allowed rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 text-xs text-chrome-500 placeholder:text-chrome-500"
        />
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
          Coming soon
        </p>
      </section>

      <section className="mt-auto border-t border-warm-black-800 pt-4">
        <Link
          href="/sphere"
          className="text-sm text-chrome-200 hover:text-pink-200"
          onClick={() => setOpen("left", false)}
        >
          See the full cross-reference graph &rarr;
        </Link>
      </section>
    </div>
  );
}
