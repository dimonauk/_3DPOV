/**
 * app/guide/page.tsx — Hitchhiker's Guide index.
 *
 * Each entry is rendered as a bracket-cornered "page card" with a
 * monospaced number, title, and one-line gloss. Not a list, not
 * infinite scroll — a grid of small plates the reader chooses
 * between.
 *
 * Server component. Scoped CSS lives in ./styles.ts.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import { guideEntries } from "lib/guide";

import { GUIDE_STYLES } from "./styles";

export const metadata = {
  title: "The Guide — Holo-Flow Studio",
  description:
    "A page-based pad of orientation notes from the studio. Six short entries on poi, long exposure, 360 capture, VR, and the act of printing the immaterial.",
};

export default function GuideIndexPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GUIDE_STYLES }} />
      <article className="hhg-root">
        <div className="hhg-frame-label">
          File: Holoflow // Guide // Index
        </div>
        <h1 className="hhg-title">The Guide.</h1>
        <p className="hhg-lede">
          A small pad of pages for visitors who have wandered into the
          studio and require orientation. Six entries to begin with.
          Read in order, or sideways. The pad does not mind.
        </p>

        <ul className="hhg-grid">
          {guideEntries.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/guide/${entry.slug}`}
                className="hhg-card"
                prefetch={true}
              >
                <div className="hhg-card-num">PAGE {entry.number}</div>
                <h2 className="hhg-card-title">{entry.title}</h2>
                <p className="hhg-card-gloss">{entry.gloss}</p>
                <span className="hhg-card-cta">Open &rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      </article>
      <Footer />
    </>
  );
}
