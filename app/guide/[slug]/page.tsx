/**
 * app/guide/[slug]/page.tsx — Single Hitchhiker's Guide page.
 *
 * Shows ONE page at a time. Page number top-right, title, body of
 * 5-15 short paragraphs, and a Prev/Next pair at the bottom. The page
 * itself is a plate with bracket corners; two SVG circuit traces sit
 * in the corners as decoration. Scan-lines + CRT flicker engage only
 * if the visitor has not requested reduced motion (see styles.ts).
 *
 * Server component. Scoped CSS lives in ../styles.ts.
 */

import Footer from "components/layout/footer";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getGuideEntry,
  getGuideNeighbours,
  guideEntries,
} from "lib/guide";

import { GUIDE_STYLES } from "../styles";

export function generateStaticParams() {
  return guideEntries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getGuideEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.number} — ${entry.title} | The Guide`,
    description: entry.gloss,
  };
}

/**
 * One pre-baked corner-trace SVG. Axis-aligned right-angle paths plus
 * a few node dots — reads as a schematic, not a doodle. The same SVG
 * renders top-left and (rotated 180deg via CSS) bottom-right.
 */
function CornerTrace({ position }: { position: "tl" | "br" }) {
  return (
    <svg
      className={`hhg-trace hhg-trace-${position}`}
      viewBox="0 0 110 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path
        d="M 0 12 L 22 12 L 22 30 L 54 30 L 54 56 L 82 56 L 82 78 L 110 78"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M 0 40 L 14 40 L 14 64 L 38 64"
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity="0.55"
      />
      <circle cx="22" cy="12" r="1.8" fill="currentColor" />
      <circle cx="54" cy="30" r="1.8" fill="currentColor" />
      <circle cx="82" cy="56" r="1.8" fill="currentColor" />
      <circle cx="14" cy="64" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getGuideEntry(slug);
  if (!entry) notFound();

  const { prev, next } = getGuideNeighbours(slug);
  const fileLabel = `HOLOFLOW//GUIDE/${entry.slug.toUpperCase()}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GUIDE_STYLES }} />
      <article className="hhg-page-root">
        <Link href="/guide" className="hhg-back">
          &larr; Guide index
        </Link>

        <section className="hhg-page" aria-labelledby="hhg-title">
          <div className="hhg-scanlines" aria-hidden="true" />
          <CornerTrace position="tl" />
          <CornerTrace position="br" />

          <header className="hhg-page-header">
            <div className="hhg-page-file">
              FILE: {fileLabel}
              <br />
              Page {entry.number} of{" "}
              {String(guideEntries.length).padStart(3, "0")}
            </div>
            <div className="hhg-page-num" aria-hidden="true">
              {entry.number}
            </div>
          </header>

          <h1 id="hhg-title" className="hhg-page-title">
            {entry.title}
          </h1>
          <div className="hhg-page-rule" aria-hidden="true" />

          <div className="hhg-page-body">{entry.body}</div>
        </section>

        <nav className="hhg-nav" aria-label="Guide page navigation">
          {prev ? (
            <Link
              href={`/guide/${prev.slug}`}
              className="hhg-nav-link"
              prefetch={true}
            >
              <span className="hhg-nav-label">
                &larr; Page {prev.number}
              </span>
              <span className="hhg-nav-title">{prev.title}</span>
            </Link>
          ) : (
            <div className="hhg-nav-disabled">
              <span className="hhg-nav-label">First page</span>
            </div>
          )}
          {next ? (
            <Link
              href={`/guide/${next.slug}`}
              className="hhg-nav-link is-right"
              prefetch={true}
            >
              <span className="hhg-nav-label">
                Page {next.number} &rarr;
              </span>
              <span className="hhg-nav-title">{next.title}</span>
            </Link>
          ) : (
            <div className="hhg-nav-disabled is-right">
              <span className="hhg-nav-label">Last page</span>
            </div>
          )}
        </nav>

        <Link href="/guide" className="hhg-index-link">
          Return to index
        </Link>
      </article>
      <Footer />
    </>
  );
}
