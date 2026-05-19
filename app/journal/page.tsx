import Footer from "components/layout/footer";
import { NewsletterForm } from "components/layout/newsletter-form";
import Link from "next/link";
import { journal } from "lib/journal";
import { formatEntryDate } from "lib/writing";

export const metadata = {
  title: "Journal — field records",
  description:
    "Field records from Holo-Flow Studio. Notes from the bench, the workshop, and the air. Roughly monthly, never advertising.",
};

export default function JournalPage() {
  const [hero, ...rest] = journal;
  const count = journal.length;

  return (
    <>
      <div className="lux-issue-band">
        <span>ISSUE 06</span>
        <span>MAY 2026</span>
        <span>HOLOFLOW STUDIO</span>
        <span>JOURNAL</span>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="md:flex md:items-end md:gap-12">
          <div className="md:w-1/2">
            <div className="chrome-label">Entries in issue</div>
            <div
              className="lux-edition-numeral mt-4"
              aria-label={`${count} entries in this issue`}
            >
              {String(count).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-8 md:mt-0 md:w-1/2">
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-chrome-100">
              Journal.
            </h1>
            <p className="mt-6 text-chrome-200">
              Field records from the bench and the air. Where the rigs
              went, what the weather was doing, what came back on the
              card. I keep these so I can read them later and remember
              what I did. You are welcome to read over my shoulder.
            </p>
            <p className="mt-4 text-chrome-300">
              Roughly monthly. Never advertising.
            </p>
          </div>
        </div>
        <div className="lux-hairline-strong mt-12 md:mt-16" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="lux-stage">
          {hero && (
            <Link
              href={`/journal/${hero.slug}`}
              prefetch={true}
              className="group block"
            >
              <article
                className="lux-card lux-tilt-on-hover lux-shadow-lg lux-paper-stack lux-vignette rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-8 md:p-12"
              >
                <div className="chrome-label text-pink-200">
                  {formatEntryDate(hero.date)} &middot; Latest field record
                </div>
                <h2 className="mt-4 font-display text-3xl md:text-5xl leading-[1.05] text-chrome-100 group-hover:text-pink-200">
                  {hero.title}
                </h2>
                <p className="mt-5 max-w-2xl text-chrome-300">
                  {hero.excerpt}
                </p>
                <span className="mt-6 inline-block text-sm text-pink-200 underline underline-offset-4">
                  Read &rarr;
                </span>
              </article>
            </Link>
          )}

          <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/journal/${entry.slug}`}
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
                      Read &rarr;
                    </span>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8 md:flex md:items-center md:justify-between md:gap-10">
          <div className="md:max-w-md">
            <div className="chrome-label">Dispatch notes</div>
            <h2 className="mt-3 font-display text-2xl text-chrome-100">
              New entries, direct.
            </h2>
            <p className="mt-4 text-chrome-300">
              Subscribe to get journal entries by email as they land.
              Roughly monthly. Never advertising.
            </p>
          </div>
          <div className="mt-6 md:mt-0 md:w-full md:max-w-sm">
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <span className="lux-folio">p.01 &middot; JOURNAL &middot; MAY 2026</span>
        </div>
      </section>

      <Footer />
    </>
  );
}
