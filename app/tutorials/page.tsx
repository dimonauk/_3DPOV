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
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Walkthroughs</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Tutorials.
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          How to do it yourself. The studio&rsquo;s position is that
          this work is learnable; these are starting points and full
          walkthroughs for long-exposure light painting and the
          adjacent practices the studio runs through. Anyone willing
          to sit and learn can get here.
        </p>

        <ul className="mt-16 divide-y divide-warm-black-800 border-t border-warm-black-800">
          {tutorials.map((entry) => (
            <li key={entry.slug} className="py-8">
              <div className="chrome-label text-pink-200 mb-2">
                {formatEntryDate(entry.date)}
              </div>
              <Link
                href={`/tutorials/${entry.slug}`}
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
      </article>
      <Footer />
    </>
  );
}
