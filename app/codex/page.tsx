import Footer from "components/layout/footer";
import Link from "next/link";
import {
  CODEX_CATEGORY_ORDER,
  codex,
  getCodexByCategory,
  slugifyCategory,
} from "lib/codex";

export const metadata = {
  title: "Codex",
  description:
    "Holo-Flow Studio's open reference for light painting, persistence-of-vision tools, drone work, 360° capture, waveguide optics, and the practices these things sit inside. Cross-linked. Sourced. Designed so a learner can follow the path from outside.",
};

export default function CodexPage() {
  const byCategory = getCodexByCategory();
  const total = codex.length;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Open reference</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The Codex.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A growing reference for the things the studio works on
          &mdash; light painting, persistence-of-vision tools, drone
          capture, 360&deg; photography, waveguide optics, and the
          practices and regulations these things sit inside.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Cross-linked, sourced, and laid out as a learning path: every
          entry points outward to free or affordable tools, official
          manuals, communities, and the writing that came before it.
          Anyone willing to sit and read can get from a tripod to a
          working rig from this site.
        </p>
        <p className="mt-3 text-sm text-chrome-500">
          {total} {total === 1 ? "entry" : "entries"}, and counting.
        </p>

        <nav className="mt-12 flex flex-wrap gap-2 text-sm">
          {CODEX_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => (
            <a
              key={c}
              href={`#${slugifyCategory(c)}`}
              className="chrome-label rounded-full border border-warm-black-700 px-3 py-1.5 hover:border-pink-200/60 hover:text-pink-100"
            >
              {c}
            </a>
          ))}
        </nav>

        {CODEX_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => {
          const entries = byCategory.get(c) ?? [];
          return (
            <section
              key={c}
              id={slugifyCategory(c)}
              className="mt-16 border-t border-warm-black-800 pt-10"
            >
              <div className="chrome-label">{c}</div>
              <ul className="mt-6 space-y-8">
                {entries.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/codex/${e.slug}`}
                      prefetch={true}
                      className="group block"
                    >
                      <h2 className="text-2xl text-chrome-100 group-hover:text-pink-200">
                        {e.title}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-chrome-300">
                        {e.summary}
                      </p>
                      {e.status && (
                        <p className="mt-2 chrome-label text-pink-200/80">
                          {e.status}
                        </p>
                      )}
                      <span className="mt-3 inline-block chrome-label text-pink-200">
                        Read &rarr;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">A note on the Codex</div>
          <p className="mt-3 text-chrome-300">
            The Codex is open. Every entry cites its sources. Many
            point at free tools or the official documentation a
            beginner needs to get started without a paywall.
          </p>
          <p className="mt-3 text-chrome-300">
            Found something wrong? Want a topic added? Write in &mdash;{" "}
            <Link
              href="/contact"
              className="text-pink-200 underline underline-offset-4"
            >
              contact
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
