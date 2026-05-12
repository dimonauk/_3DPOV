import Footer from "components/layout/footer";
import Link from "next/link";
import { articles } from "lib/articles";
import { formatEntryDate } from "lib/writing";

export const metadata = {
  title: "Articles",
  description:
    "Longer pieces from Holo-Flow Studio. On building rigs, on photographing light, on the tradeoffs that shape the practice.",
};

export default function ArticlesPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Long form</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Articles.
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          Longer pieces, less timely than journal entries. On the
          studio&rsquo;s tradeoffs &mdash; what gets built, what gets
          bought, what gets photographed, and what gets left in the
          ground because the world doesn&rsquo;t need another version
          of it.
        </p>

        <ul className="mt-16 divide-y divide-warm-black-800 border-t border-warm-black-800">
          {articles.map((entry) => (
            <li key={entry.slug} className="py-8">
              <div className="chrome-label text-pink-200 mb-2">
                {formatEntryDate(entry.date)}
              </div>
              <Link
                href={`/articles/${entry.slug}`}
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
