import Footer from "components/layout/footer";
import Link from "next/link";
import { tutorials } from "lib/tutorials";
import { formatEntryDate } from "lib/writing";

export const metadata = {
  title: "Tutorials",
  description:
    "How to do it yourself. Starting points from Holo-Flow Studio for working with long-exposure light painting and adjacent practices.",
};

export default function TutorialsPage() {
  const [hero, ...rest] = tutorials;
  const count = tutorials.length;

  return (
    <>
      <div className="lux-issue-band">
        <span>ISSUE 06</span>
        <span>MAY 2026</span>
        <span>HOLOFLOW STUDIO</span>
        <span>TUTORIALS</span>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="md:flex md:items-end md:gap-12">
          <div className="md:w-1/2">
            <div className="chrome-label">Tutorials in issue</div>
            <div
              className="lux-edition-numeral mt-4"
              aria-label={`${count} tutorials in this issue`}
            >
              {String(count).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-8 md:mt-0 md:w-1/2">
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-chrome-100">
              Tutorials.
            </h1>
            <p className="mt-6 text-chrome-200">
              Step-by-step builds from the studio bench, in voice and
              end-to-end. The Aura Test Chamber sheet at the foot of
              each tutorial holds the supplies, the software, and the
              BOM you can download. The Princess is the proprietor; she
              would like you to do the thing properly, with the
              correct gloves.
            </p>
            <p className="mt-4 text-chrome-300">
              Anyone willing to sit and learn can get here.
            </p>
          </div>
        </div>
        <div className="lux-hairline-strong mt-12 md:mt-16" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="lux-stage">
          {hero && (
            <Link
              href={`/tutorials/${hero.slug}`}
              prefetch={true}
              className="group block"
            >
              <article
                className="lux-card lux-tilt-on-hover lux-shadow-lg lux-paper-stack lux-vignette rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-8 md:p-12"
              >
                <div className="chrome-label text-pink-200">
                  {formatEntryDate(hero.date)} &middot; Latest walkthrough
                </div>
                <h2 className="mt-4 font-display text-3xl md:text-5xl leading-[1.05] text-chrome-100 group-hover:text-pink-200">
                  {hero.title}
                </h2>
                <p className="mt-5 max-w-2xl text-chrome-300">
                  {hero.excerpt}
                </p>
                <span className="mt-6 inline-block text-sm text-pink-200 underline underline-offset-4">
                  Begin the walkthrough &rarr;
                </span>
              </article>
            </Link>
          )}

          <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/tutorials/${entry.slug}`}
                  prefetch={true}
                  className="group block h-full"
                >
                  <article className="lux-card lux-tilt-on-hover lux-shadow-md lux-paper-stack h-full rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-6">
                    <div className="chrome-label text-pink-200">
                      {formatEntryDate(entry.date)}
                    </div>
                    <h3 className="mt-3 font-display text-xl text-chrome-100 group-hover:text-pink-200">
                      {entry.title}
                    </h3>
                    <p className="mt-3 text-sm text-chrome-300">
                      {entry.excerpt}
                    </p>
                    <span className="mt-4 inline-block text-xs text-pink-200 underline underline-offset-4">
                      Open &rarr;
                    </span>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 flex justify-end">
          <span className="lux-folio">
            p.01 &middot; TUTORIALS &middot; MAY 2026
          </span>
        </div>
      </section>

      <Footer />
    </>
  );
}
