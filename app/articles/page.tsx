import Footer from "components/layout/footer";
import Link from "next/link";
import { articles } from "lib/articles";
import { formatEntryDate } from "lib/writing";

export const metadata = {
  title: "Articles",
  description:
    "Longer pieces from Holo-Flow Studio. On building rigs, on photographing light, on the tradeoffs that shape the practice.",
};

// Magazine furniture — the band, the folio, the dateline. Hard-coded
// until the site grows an issue ledger; bump these by hand for now.
const ISSUE_LABEL = "ISSUE 06";
const ISSUE_DATE = "MAY 2026";

export default function ArticlesPage() {
  const [feature, ...rest] = articles;
  const total = articles.length;
  // Two-digit display numeral so the outlined display serif reads as a
  // proper magazine front-of-section marker rather than a fluctuating
  // single digit at low counts.
  const editionNumeral = String(total).padStart(2, "0");

  return (
    <>
      <div className="lux-issue-band">
        <span>{ISSUE_LABEL}</span>
        <span>{ISSUE_DATE}</span>
        <span>HOLOFLOW STUDIO</span>
        <span>ARTICLES</span>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="md:flex md:items-end md:gap-12">
          <div className="md:flex-none">
            <div className="chrome-label text-pink-200">
              Articles in issue
            </div>
            <div
              className="lux-edition-numeral mt-3"
              aria-label={`${total} articles in this issue`}
            >
              {editionNumeral}
            </div>
          </div>
          <div className="mt-8 md:mt-0 md:flex-1 md:pb-3 md:max-w-xl">
            <h1 className="text-4xl md:text-5xl leading-[1] text-chrome-100">
              Articles.
            </h1>
            <p className="mt-5 text-chrome-200">
              Long-form pieces from the studio bench. Workshop
              write-ups, scene atlases, technical primers, and the
              occasional manifesto. Read with a cup of something hot
              &mdash; most of these are longer than they look, and the
              good bits are usually halfway down.
            </p>
            <p className="mt-3 text-chrome-300">
              What gets built, what gets bought, what gets photographed,
              and what gets left in the ground because the world
              doesn&rsquo;t need another version of it.
            </p>
          </div>
        </div>
        <div className="lux-hairline-strong mt-12" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="lux-stage">
          {feature ? (
            <FeatureCard entry={feature} />
          ) : null}

          <ul className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((entry) => (
              <li key={entry.slug}>
                <ArticleCard entry={entry} />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-20 flex items-center justify-between">
          <span className="lux-folio">
            p.01 &middot; Articles &middot; {ISSUE_DATE}
          </span>
          <span className="chrome-label text-chrome-400">
            {total} pieces filed
          </span>
        </div>
      </section>

      <Footer />
    </>
  );
}

type Entry = (typeof articles)[number];

function FeatureCard({ entry }: { entry: Entry }) {
  return (
    <Link
      href={`/articles/${entry.slug}`}
      prefetch={true}
      className="group block lux-card lux-tilt-on-hover lux-shadow-lg lux-paper-stack rounded-sm border border-warm-black-800 bg-warm-black-900/55 p-8 md:p-12"
    >
      <div className="flex items-center gap-4">
        <span className="chrome-label text-pink-200">Lead piece</span>
        <span className="lux-hairline flex-1" aria-hidden />
        <span className="chrome-label text-chrome-400">
          {formatEntryDate(entry.date)}
        </span>
      </div>
      <h2 className="mt-6 text-3xl md:text-5xl leading-[1.02] text-chrome-100 group-hover:text-pink-200">
        {entry.title}
      </h2>
      <p className="mt-6 max-w-3xl text-chrome-200 text-lg">
        {entry.excerpt}
      </p>
      <span className="mt-8 inline-block text-sm text-pink-200 underline underline-offset-4">
        Read the lead &rarr;
      </span>
    </Link>
  );
}

function ArticleCard({ entry }: { entry: Entry }) {
  return (
    <Link
      href={`/articles/${entry.slug}`}
      prefetch={true}
      className="group flex h-full flex-col lux-card lux-tilt-on-hover lux-shadow-md lux-paper-stack rounded-sm border border-warm-black-800 bg-warm-black-900/45 p-6"
    >
      <div className="chrome-label text-pink-200">
        {formatEntryDate(entry.date)}
      </div>
      <h3 className="mt-3 text-xl leading-snug text-chrome-100 group-hover:text-pink-200">
        {entry.title}
      </h3>
      <p className="mt-3 text-chrome-300 text-sm flex-1">
        {entry.excerpt}
      </p>
      <span className="mt-5 inline-block text-xs text-pink-200 underline underline-offset-4">
        Read &rarr;
      </span>
    </Link>
  );
}
