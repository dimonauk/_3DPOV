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
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Field records</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Journal.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Notes from the studio. Location records from the poi practice
          &mdash; where, when, what the weather was doing, what the
          rigs were doing. Build logs and field reports. The occasional
          essay about holding a gesture long enough to leave residue
          someone else can look at.
        </p>

        <ul className="mt-16 divide-y divide-warm-black-800 border-t border-warm-black-800">
          {journal.map((entry) => (
            <li key={entry.slug} className="py-8">
              <div className="chrome-label text-pink-200 mb-2">
                {formatEntryDate(entry.date)}
              </div>
              <Link
                href={`/journal/${entry.slug}`}
                className="group block"
                prefetch={true}
              >
                <h2 className="text-2xl text-chrome-100 group-hover:text-pink-200">
                  {entry.title}
                </h2>
                <p className="mt-3 text-chrome-300">{entry.excerpt}</p>
                <span className="mt-3 inline-block text-sm text-pink-200 underline underline-offset-4">
                  Read &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Dispatch notes</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            New entries, direct.
          </h2>
          <p className="mt-4 text-chrome-300">
            Subscribe to get journal entries by email as they land.
            Roughly monthly. Never advertising.
          </p>
          <div className="mt-6 max-w-sm">
            <NewsletterForm />
          </div>
        </section>
      </article>
      <Footer />
    </>
  );
}
