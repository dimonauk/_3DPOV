import Footer from "components/layout/footer";
import Link from "next/link";
import { articles } from "lib/articles";
import { formatEntryDate } from "lib/writing";

export const metadata = {
  title: "Who's who",
  description:
    "A working rolodex of the UK creative scenes the studio overlaps with — photographers, VR + AR practitioners, motion capture houses, light painters, and the people who hold them together.",
};

// The who's-who series uses a slug convention: `whos-who-uk-<scene>`.
// This page filters the existing articles registry — no parallel
// data source. New scenes show up here the moment their article is
// registered in `lib/articles.tsx`.
const WHOS_WHO_PREFIX = "whos-who-uk-";

function sceneFromSlug(slug: string): string {
  return slug
    .replace(WHOS_WHO_PREFIX, "")
    .replace(/-/g, " ");
}

export default function WhosWhoIndexPage() {
  const entries = articles.filter((e) => e.slug.startsWith(WHOS_WHO_PREFIX));

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The rolodex</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Who&rsquo;s who.
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          A walking index of the UK creative scenes the studio touches.
          Real people, real public URLs, no aggregated dossiers. The
          studio adds one scene at a time; the list grows as the
          practice does.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-300">
          Every who&rsquo;s-who below uses a different editorial shape
          on purpose. The voice is the studio&rsquo;s; the structure
          varies so a reader who lands on three of them in a row still
          finds something fresh. For the people-side view, jump to{" "}
          <Link href="/scenes" className="text-pink-200 hover:underline">
            Scenes
          </Link>{" "}
          or{" "}
          <Link href="/people" className="text-pink-200 hover:underline">
            People
          </Link>
          .
        </p>

        {entries.length === 0 ? (
          <p className="mt-12 text-chrome-300">
            None published yet. The first ones are forthcoming.
          </p>
        ) : (
          <ul className="mt-16 divide-y divide-warm-black-800 border-t border-warm-black-800">
            {entries.map((entry) => (
              <li key={entry.slug} className="py-8">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="chrome-label text-pink-200">
                    {sceneFromSlug(entry.slug)}
                  </div>
                  <div className="chrome-label text-chrome-500">
                    {formatEntryDate(entry.date)}
                  </div>
                </div>
                <Link
                  href={`/articles/${entry.slug}`}
                  className="group mt-3 block"
                  prefetch={true}
                >
                  <h2 className="text-2xl text-chrome-100 group-hover:text-pink-200">
                    {entry.title}
                  </h2>
                  {entry.excerpt ? (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-chrome-300">
                      {entry.excerpt}
                    </p>
                  ) : null}
                  <span className="chrome-label mt-4 inline-block text-chrome-500 group-hover:text-pink-200">
                    Read &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-20 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">House rules</div>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-chrome-300">
            <li>
              Real names + real public URLs only. No emails on the
              public side, ever.
            </li>
            <li>
              Every claim about a real person carries a citation. If
              the studio can&rsquo;t link it, the studio doesn&rsquo;t
              say it.
            </li>
            <li>
              No portraits of named people. Each entry links to the
              practitioner&rsquo;s own site, where their image lives
              under their own control.
            </li>
            <li>
              No identity classification. The studio celebrates by
              name without labelling.
            </li>
            <li>
              The shape of each piece is editorial &mdash; the
              motion-capture article walks through six rooms, the
              light-painting article goes by light source, the AR
              piece by tool history. Same voice; different skeleton.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <div className="chrome-label">Method behind it</div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-chrome-300">
            How the studio finds its people, ethically, with public
            sources only:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/articles/osint-for-finding-your-people"
                className="text-pink-200 hover:underline"
              >
                OSINT for finding your people &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/the-osint-stack-for-creative-research"
                className="text-pink-200 hover:underline"
              >
                The OSINT stack for creative research &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
