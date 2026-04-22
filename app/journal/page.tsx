import Footer from "components/layout/footer";
import { NewsletterForm } from "components/layout/newsletter-form";
import Link from "next/link";

export const metadata = {
  title: "Journal",
  description:
    "Field records, studio notes, and dispatches from the making of the work.",
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
          &mdash; where, when, what the weather was doing. Build logs for
          the rigs. The occasional essay about holding a gesture long
          enough to leave residue.
        </p>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">In preparation</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            First entries going out this season.
          </h2>
          <p className="mt-4 text-chrome-300">
            The journal is being written. Rather than pad this page with
            lorem-copy until it's ready, the studio would rather let it
            arrive in proper time.
          </p>
          <p className="mt-4 text-chrome-300">
            When entries land, they'll appear here. Subscribe below to
            get them directly &mdash; roughly monthly, never advertising.
          </p>

          <div className="mt-8 max-w-sm">
            <NewsletterForm />
          </div>
        </section>

        <section className="mt-14">
          <div className="chrome-label mb-3">While you wait</div>
          <ul className="space-y-2 text-chrome-200">
            <li>
              <Link
                href="/about"
                className="underline underline-offset-4 hover:text-pink-200"
              >
                The practice, the method, the studio
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className="underline underline-offset-4 hover:text-pink-200"
              >
                The catalogue
              </Link>
            </li>
            <li>
              <Link
                href="/bureau"
                className="underline underline-offset-4 hover:text-pink-200"
              >
                Print bureau services
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
