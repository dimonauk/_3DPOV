import Link from "next/link";

import Footer from "components/layout/footer";
import { articles } from "lib/articles";
import { allAssets } from "lib/assets/resolve";
import type { Asset } from "lib/assets/types";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import { formatEntryDate } from "lib/writing";
import type { Entry } from "lib/writing";

const ABSOLUTE_URL = "https://holoflow.co.uk/magazine";

export const metadata = {
  title: "The Magazine — Holo-Flow Studio",
  description:
    "An editorial cover for the studio's writing. Lead article, latest journal entries, the new tutorial, the latest who's-who, the most recent gallery album.",
  alternates: { canonical: ABSOLUTE_URL },
  openGraph: {
    title: "The Magazine — Holo-Flow Studio",
    description:
      "An editorial cover for the studio's writing. Lead article, latest journal entries, the new tutorial, the latest who's-who, the most recent gallery album.",
    url: ABSOLUTE_URL,
    siteName: "Holo-Flow Studio",
    type: "website",
    locale: "en_GB",
  },
};

const WHOS_WHO_PREFIX = "whos-who-uk-";

function getLeadArticle(): Entry | undefined {
  return articles.find((a) => !a.slug.startsWith(WHOS_WHO_PREFIX));
}

function getRecentJournal(n: number): Entry[] {
  return journal.slice(0, n);
}

function getLatestTutorial(): Entry | undefined {
  return tutorials[0];
}

function getLatestWhosWho(): Entry | undefined {
  return articles.find((a) => a.slug.startsWith(WHOS_WHO_PREFIX));
}

function albumDateValue(a: Asset): number {
  if (!a.publishedAt) return 0;
  const t = Date.parse(a.publishedAt);
  return Number.isNaN(t) ? 0 : t;
}

function getLatestAlbum(): Asset | undefined {
  const albums = allAssets()
    .filter((a) => a.host === "google-photos")
    .sort((a, b) => albumDateValue(b) - albumDateValue(a));
  return albums[0];
}

export default function MagazinePage() {
  const lead = getLeadArticle();
  const recent = getRecentJournal(3);
  const tut = getLatestTutorial();
  const ww = getLatestWhosWho();
  const album = getLatestAlbum();

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <header className="border-b border-warm-black-800 pb-10">
          <div className="chrome-label">Issue · ongoing</div>
          <h1 className="mt-4 font-display text-6xl leading-[0.9] md:text-7xl">
            The Magazine.
          </h1>
          <p className="mt-6 max-w-2xl text-chrome-200">
            The studio writes a slow continuous archive: long-form
            essays, a journal kept by hand, tutorials that take a
            reader from beginner to bench, who&rsquo;s-who letters
            naming the practitioners the work sits with, and gallery
            albums of what came off the rig. This page is the cover.
          </p>
        </header>

        {lead ? (
          <section className="mt-14">
            <div className="chrome-label text-pink-200">Lead article</div>
            <Link
              href={`/articles/${lead.slug}`}
              className="group mt-5 block"
              prefetch={true}
            >
              <h2 className="text-4xl leading-tight text-chrome-100 group-hover:text-pink-200 md:text-5xl">
                {lead.title}
              </h2>
              {lead.excerpt ? (
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-chrome-300">
                  <span className="float-left mr-3 mt-1 text-5xl font-display leading-none text-pink-200">
                    {lead.excerpt.charAt(0)}
                  </span>
                  {lead.excerpt.slice(1)}
                </p>
              ) : null}
              <div className="chrome-label mt-5 text-chrome-500 group-hover:text-pink-200">
                Read &rarr; {formatEntryDate(lead.date)}
              </div>
            </Link>
          </section>
        ) : null}

        <div className="mt-16 grid grid-cols-1 gap-12 border-t border-warm-black-800 pt-12 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="chrome-label text-pink-200">From the journal</div>
            <ul className="mt-5 divide-y divide-warm-black-800">
              {recent.map((entry) => (
                <li key={entry.slug} className="py-5">
                  <Link
                    href={`/journal/${entry.slug}`}
                    className="group block"
                    prefetch={true}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-xl text-chrome-100 group-hover:text-pink-200">
                        {entry.title}
                      </h3>
                      <span className="chrome-label text-chrome-500">
                        {formatEntryDate(entry.date)}
                      </span>
                    </div>
                    {entry.excerpt ? (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-chrome-400">
                        {entry.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="/journal"
                className="chrome-label text-chrome-500 hover:text-pink-200"
              >
                Whole journal &rarr;
              </Link>
            </div>
          </section>

          <aside className="space-y-12 lg:border-l lg:border-warm-black-800 lg:pl-10">
            {tut ? (
              <section>
                <div className="chrome-label text-pink-200">New tutorial</div>
                <Link
                  href={`/tutorials/${tut.slug}`}
                  className="group mt-4 block"
                  prefetch={true}
                >
                  <h3 className="text-xl text-chrome-100 group-hover:text-pink-200">
                    {tut.title}
                  </h3>
                  {tut.excerpt ? (
                    <p className="mt-3 text-sm leading-relaxed text-chrome-400">
                      {tut.excerpt}
                    </p>
                  ) : null}
                  <span className="chrome-label mt-3 inline-block text-chrome-500 group-hover:text-pink-200">
                    {formatEntryDate(tut.date)}
                  </span>
                </Link>
                <div className="mt-4">
                  <Link
                    href="/tutorials"
                    className="chrome-label text-chrome-500 hover:text-pink-200"
                  >
                    All tutorials &rarr;
                  </Link>
                </div>
              </section>
            ) : null}

            {ww ? (
              <section className="border-t border-warm-black-800 pt-8">
                <div className="chrome-label text-pink-200">
                  Who&rsquo;s-who
                </div>
                <Link
                  href={`/articles/${ww.slug}`}
                  className="group mt-4 block"
                  prefetch={true}
                >
                  <h3 className="text-xl text-chrome-100 group-hover:text-pink-200">
                    {ww.title}
                  </h3>
                  {ww.excerpt ? (
                    <p className="mt-3 text-sm leading-relaxed text-chrome-400">
                      {ww.excerpt}
                    </p>
                  ) : null}
                  <span className="chrome-label mt-3 inline-block text-chrome-500 group-hover:text-pink-200">
                    {formatEntryDate(ww.date)}
                  </span>
                </Link>
                <div className="mt-4 space-x-4">
                  <Link
                    href="/whoswho"
                    className="chrome-label text-chrome-500 hover:text-pink-200"
                  >
                    Series &rarr;
                  </Link>
                  <Link
                    href="/scenes"
                    className="chrome-label text-chrome-500 hover:text-pink-200"
                  >
                    Scenes &rarr;
                  </Link>
                </div>
              </section>
            ) : null}

            {album ? (
              <section className="border-t border-warm-black-800 pt-8">
                <div className="chrome-label text-pink-200">From the gallery</div>
                <Link
                  href={`/gallery/${album.id}`}
                  className="group mt-4 block"
                  prefetch={true}
                >
                  <h3 className="text-xl text-chrome-100 group-hover:text-pink-200">
                    {album.name}
                  </h3>
                  {album.attribution ? (
                    <p className="mt-3 text-sm leading-relaxed text-chrome-400">
                      {album.attribution}
                    </p>
                  ) : null}
                </Link>
                <div className="mt-4">
                  <Link
                    href="/gallery"
                    className="chrome-label text-chrome-500 hover:text-pink-200"
                  >
                    Whole gallery &rarr;
                  </Link>
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">Subscribe</div>
          <p className="mt-3 max-w-xl text-sm text-chrome-300">
            The studio publishes new articles, journal entries, and
            tutorials on a slow continuous rhythm. RSS feeds:
          </p>
          <ul className="mt-4 space-y-1 text-sm">
            <li>
              <a
                href="/feed.xml"
                className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
              >
                /feed.xml &rarr; everything
              </a>
            </li>
            <li>
              <a
                href="/articles/feed.xml"
                className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
              >
                /articles/feed.xml &rarr; articles only
              </a>
            </li>
            <li>
              <a
                href="/journal/feed.xml"
                className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
              >
                /journal/feed.xml &rarr; journal only
              </a>
            </li>
            <li>
              <a
                href="/tutorials/feed.xml"
                className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
              >
                /tutorials/feed.xml &rarr; tutorials only
              </a>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
