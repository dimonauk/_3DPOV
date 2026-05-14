import Footer from "components/layout/footer";
import Link from "next/link";
import { articles } from "lib/articles";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import { codex } from "lib/codex";

export const metadata = {
  title: "Search the archive",
  description:
    "Search Holo-Flow Studio's archive — articles, journal entries, tutorials, and codex entries — by title and excerpt. The catalogue search lives under /search/[collection].",
};

type ResultRow = {
  key: string;
  href: string;
  title: string;
  type: "Article" | "Journal" | "Tutorial" | "Codex";
  excerpt: string;
};

const ARTICLE_COUNT = articles.length;
const JOURNAL_COUNT = journal.length;
const TUTORIAL_COUNT = tutorials.length;
const CODEX_COUNT = codex.length;

function searchSet(
  set: ResultRow[],
  needle: string,
): ResultRow[] {
  if (!needle) return [];
  return set.filter(
    (r) =>
      r.title.toLowerCase().includes(needle) ||
      r.excerpt.toLowerCase().includes(needle),
  );
}

function articleRows(): ResultRow[] {
  return articles.map((a) => ({
    key: `article-${a.slug}`,
    href: `/articles/${a.slug}`,
    title: a.title,
    type: "Article",
    excerpt: a.excerpt,
  }));
}

function journalRows(): ResultRow[] {
  return journal.map((j) => ({
    key: `journal-${j.slug}`,
    href: `/journal/${j.slug}`,
    title: j.title,
    type: "Journal",
    excerpt: j.excerpt,
  }));
}

function tutorialRows(): ResultRow[] {
  return tutorials.map((t) => ({
    key: `tutorial-${t.slug}`,
    href: `/tutorials/${t.slug}`,
    title: t.title,
    type: "Tutorial",
    excerpt: t.excerpt,
  }));
}

function codexRows(): ResultRow[] {
  return codex.map((c) => ({
    key: `codex-${c.slug}`,
    href: `/codex/${c.slug}`,
    title: c.title,
    type: "Codex",
    excerpt: c.summary,
  }));
}

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const rawQ = searchParams["q"];
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const needle = q.toLowerCase();

  const articleHits = searchSet(articleRows(), needle);
  const journalHits = searchSet(journalRows(), needle);
  const tutorialHits = searchSet(tutorialRows(), needle);
  const codexHits = searchSet(codexRows(), needle);
  const totalHits =
    articleHits.length +
    journalHits.length +
    tutorialHits.length +
    codexHits.length;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Search the archive</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Search.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio&rsquo;s website is a twelve-year archive landing
          all at once. This page searches across every piece of
          writing: articles, journal field-notes, tutorials, and the
          codex of defined terms.
        </p>

        <form
          method="get"
          action="/search"
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          role="search"
        >
          <label htmlFor="search-q" className="sr-only">
            Search the archive
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="e.g. poi, marching cubes, fire, drone, 360"
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-3 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            className="chrome-label rounded-sm border border-pink-200/40 bg-pink-200/10 px-6 py-3 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            Search
          </button>
        </form>

        {q ? (
          <section className="mt-16">
            <div className="chrome-label">Results</div>
            <h2 className="mt-2 text-2xl text-chrome-100">
              {totalHits === 0
                ? "No matches"
                : totalHits === 1
                  ? "One match"
                  : `${totalHits} matches`}{" "}
              for &ldquo;{q}&rdquo;.
            </h2>
            <p className="mt-3 max-w-prose text-chrome-300">
              Plain-text match on title and excerpt. The catalogue
              search lives at{" "}
              <Link
                href="/search/all"
                className="text-pink-200 underline underline-offset-4"
              >
                /search/all
              </Link>
              .
            </p>

            <div className="mt-10 space-y-12">
              <ResultGroup
                label="Articles"
                rows={articleHits}
                emptyHint={`Nothing in the ${ARTICLE_COUNT} articles matched.`}
              />
              <ResultGroup
                label="Journal"
                rows={journalHits}
                emptyHint={`Nothing in the ${JOURNAL_COUNT} journal entries matched.`}
              />
              <ResultGroup
                label="Tutorials"
                rows={tutorialHits}
                emptyHint={`Nothing in the ${TUTORIAL_COUNT} tutorials matched.`}
              />
              <ResultGroup
                label="Codex"
                rows={codexHits}
                emptyHint={`Nothing in the ${CODEX_COUNT} codex entries matched.`}
              />
            </div>
          </section>
        ) : (
          <section className="mt-16">
            <div className="chrome-label">What&rsquo;s searchable</div>
            <h2 className="mt-2 text-2xl text-chrome-100">
              The archive, four ways.
            </h2>
            <p className="mt-3 max-w-prose text-chrome-300">
              The studio&rsquo;s archive contains {ARTICLE_COUNT}{" "}
              articles, {JOURNAL_COUNT} journal entries, {TUTORIAL_COUNT}{" "}
              tutorials, {CODEX_COUNT} codex entries, and a product
              catalogue. Type a phrase above and the page returns plain
              matches grouped by source.
            </p>
            <p className="mt-3 max-w-prose text-chrome-400">
              A few starting points: <em>poi</em>, <em>long exposure</em>
              , <em>marching cubes</em>, <em>drone</em>, <em>360</em>,{" "}
              <em>print bureau</em>, <em>edition</em>, <em>WebXR</em>.
            </p>

            <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <CountTile label="Articles" count={ARTICLE_COUNT} href="/articles" />
              <CountTile label="Journal" count={JOURNAL_COUNT} href="/journal" />
              <CountTile
                label="Tutorials"
                count={TUTORIAL_COUNT}
                href="/tutorials"
              />
              <CountTile label="Codex" count={CODEX_COUNT} href="/codex" />
            </ul>

            <p className="mt-12 max-w-prose text-sm text-chrome-400">
              Looking for a print, a wall relief, or a Looking Glass
              quilt? The product catalogue search lives at{" "}
              <Link
                href="/search/all"
                className="text-pink-200 underline underline-offset-4"
              >
                /search/all
              </Link>
              . The collection routes under <code>/search/[collection]</code>{" "}
              carry the Shopify-backed product browse with sort and
              filter chrome.
            </p>
          </section>
        )}

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where to go next</div>
          <p className="mt-3 text-chrome-300">
            The four indexes above each have their own curated front
            door. The{" "}
            <Link
              href="/learn"
              className="text-pink-200 underline underline-offset-4"
            >
              learn
            </Link>{" "}
            page reorganises the writing into a learning ladder; the{" "}
            <Link
              href="/codex"
              className="text-pink-200 underline underline-offset-4"
            >
              codex
            </Link>{" "}
            is the dictionary of terms the studio uses precisely.
          </p>
        </section>
      </article>
    </>
  );
}

function ResultGroup({
  label,
  rows,
  emptyHint,
}: {
  label: string;
  rows: ResultRow[];
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return (
      <section>
        <div className="chrome-label text-pink-200 mb-2">{label}</div>
        <p className="text-xs italic text-chrome-500">{emptyHint}</p>
      </section>
    );
  }
  return (
    <section>
      <div className="chrome-label text-pink-200 mb-2">
        {label} ({rows.length})
      </div>
      <ul className="space-y-5 border-l-2 border-warm-black-800 pl-6">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href} prefetch={false} className="group block">
              <div className="chrome-label mb-1 text-[0.6rem] text-chrome-500">
                {r.type}
              </div>
              <h3 className="text-lg text-chrome-100 group-hover:text-pink-200">
                {r.title}
              </h3>
              <p className="mt-1 max-w-prose text-sm text-chrome-300">
                {r.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CountTile({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 transition-colors hover:border-pink-200/40 hover:bg-pink-200/5"
      >
        <div className="chrome-label text-[0.6rem] text-chrome-400">
          {label}
        </div>
        <div className="mt-1 text-2xl text-chrome-100">{count}</div>
      </Link>
    </li>
  );
}
