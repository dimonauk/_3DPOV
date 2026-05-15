/**
 * app/search/ask/page.tsx — Aura reads the archive for you.
 *
 * Server-rendered page that takes ?q=<question>, builds a context
 * blurb from titles + excerpts across articles, journal, tutorials,
 * and the codex, and asks Aura (via Gemini) to synthesise an answer
 * grounded in that material. Below the answer: a list of the corpus
 * pieces that matched the keywords in the question, so the visitor
 * can read the originals.
 *
 * # Cost posture
 * Each request costs a per-call Gemini fee. The page is open to all
 * visitors. For now the studio eats the cost; rate-limit when /search
 * actually gets traffic.
 *
 * # Why Server Component, not streaming
 * First wire. SSR is simpler to ship and tsc-clean. Streaming via
 * Suspense + an API route can land later if first-paint latency
 * becomes a real complaint.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import { aura } from "lib/cast/aura";
import { articles } from "lib/articles";
import { codex } from "lib/codex";
import { respond } from "lib/capabilities/agent/dialogue";
import { isConfigured } from "lib/env";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";

export const metadata = {
  title: "Ask Aura — Search the archive",
  description:
    "Pose a question to Aura. She'll read the studio's archive — articles, journal, tutorials, codex — and synthesise an answer grounded in what she finds, with pointers to the originals.",
};

// Live-fetched at request time; per-call Gemini cost.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Corpus =
  | { kind: "Article"; slug: string; title: string; excerpt: string }
  | { kind: "Journal"; slug: string; title: string; excerpt: string }
  | { kind: "Tutorial"; slug: string; title: string; excerpt: string }
  | { kind: "Codex"; slug: string; title: string; excerpt: string };

function buildCorpus(): Corpus[] {
  return [
    ...articles.map((a) => ({
      kind: "Article" as const,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
    })),
    ...journal.map((j) => ({
      kind: "Journal" as const,
      slug: j.slug,
      title: j.title,
      excerpt: j.excerpt,
    })),
    ...tutorials.map((t) => ({
      kind: "Tutorial" as const,
      slug: t.slug,
      title: t.title,
      excerpt: t.excerpt,
    })),
    ...codex.map((c) => ({
      kind: "Codex" as const,
      slug: c.slug,
      title: c.title,
      excerpt: c.summary,
    })),
  ];
}

function corpusContext(items: Corpus[]): string {
  // Compact representation. Aura sees a list of {kind, slug, title,
  // excerpt} and can cite by slug. Truncated excerpts keep us well
  // under Gemini's context window.
  const lines = items.map((it) => {
    const excerpt = it.excerpt.length > 200
      ? `${it.excerpt.slice(0, 200)}…`
      : it.excerpt;
    return `- [${it.kind.toLowerCase()}:${it.slug}] ${it.title} — ${excerpt}`;
  });
  return [
    "You have access to the studio's published archive. The list below",
    "is every piece. When you answer, cite the pieces you draw on by",
    "their [kind:slug] tag (the visitor's UI turns these into links).",
    "Don't invent citations. If the archive doesn't have what they're",
    "asking about, say so plainly.",
    "",
    "ARCHIVE:",
    ...lines,
  ].join("\n");
}

function keywordHits(q: string, items: Corpus[]): Corpus[] {
  const needle = q.toLowerCase().trim();
  if (!needle) return [];
  return items.filter(
    (it) =>
      it.title.toLowerCase().includes(needle) ||
      it.excerpt.toLowerCase().includes(needle),
  );
}

function hrefFor(it: Corpus): string {
  switch (it.kind) {
    case "Article":
      return `/articles/${it.slug}`;
    case "Journal":
      return `/journal/${it.slug}`;
    case "Tutorial":
      return `/tutorials/${it.slug}`;
    case "Codex":
      return `/codex/${it.slug}`;
  }
}

/** Replace `[kind:slug]` tokens in Aura's answer with hyperlinks. */
function renderWithCitations(text: string, corpus: Corpus[]): React.ReactNode[] {
  const bySlug = new Map<string, Corpus>();
  for (const it of corpus) {
    bySlug.set(`${it.kind.toLowerCase()}:${it.slug}`, it);
  }
  const re = /\[(article|journal|tutorial|codex):([a-z0-9-]+)\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${match[1]}:${match[2]}`;
    const it = bySlug.get(key);
    if (it) {
      nodes.push(
        <Link
          key={`cite-${i++}`}
          href={hrefFor(it)}
          className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
        >
          {it.title}
        </Link>,
      );
    } else {
      // Unknown citation — render the tag as-is so it's visible
      nodes.push(match[0]);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default async function AskPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const rawQ = searchParams["q"];
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const corpus = buildCorpus();
  const hits = keywordHits(q, corpus);

  let answer: string | null = null;
  let answerError: string | null = null;

  if (q) {
    if (!isConfigured("GOOGLE_AI_API_KEY")) {
      answerError =
        "Aura's hosted brain isn't wired in this environment — the studio's GOOGLE_AI_API_KEY env var is missing.";
    } else {
      try {
        const result = await respond({
          speakerId: "aura.search-ask",
          bible: aura,
          userText: q,
          provider: "gemini",
          contextSuffix: corpusContext(corpus),
        });
        answer = result.text;
      } catch (err) {
        answerError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Search · Ask</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Ask Aura.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Pose a question. Aura reads the studio&rsquo;s archive
          &mdash; every article, journal entry, tutorial, and codex
          term &mdash; and synthesises an answer, citing the pieces
          she leans on. Underneath, the keyword matches are listed
          so you can read the originals yourself.
        </p>

        <form
          method="get"
          action="/search/ask"
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          role="search"
        >
          <label htmlFor="ask-q" className="sr-only">
            Ask Aura
          </label>
          <input
            id="ask-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="e.g. how do long-exposure photographs work? what's a poi rig?"
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-3 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            className="chrome-label rounded-sm border border-pink-200/40 bg-pink-200/10 px-6 py-3 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            Ask
          </button>
        </form>

        <p className="mt-4 text-sm text-chrome-400">
          Or stay with{" "}
          <Link
            href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"}
            className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
          >
            plain keyword search
          </Link>
          .
        </p>

        {q ? (
          <section className="mt-16">
            <div className="chrome-label">Aura&rsquo;s reading</div>
            {answer !== null && (
              <div className="mt-4 whitespace-pre-wrap text-chrome-100">
                {renderWithCitations(answer, corpus)}
              </div>
            )}
            {answerError !== null && (
              <div className="mt-4 rounded border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
                {answerError}
              </div>
            )}
          </section>
        ) : null}

        {q && hits.length > 0 ? (
          <section className="mt-12">
            <div className="chrome-label">Keyword matches</div>
            <p className="mt-2 text-sm text-chrome-400">
              {hits.length === 1
                ? "One piece in the archive mentions"
                : `${hits.length} pieces in the archive mention`}{" "}
              &ldquo;{q}&rdquo;.
            </p>
            <ul className="mt-4 space-y-3">
              {hits.map((it) => (
                <li
                  key={`${it.kind}-${it.slug}`}
                  className="border-l-2 border-warm-black-800 pl-4"
                >
                  <div className="chrome-label">{it.kind}</div>
                  <Link
                    href={hrefFor(it)}
                    className="mt-1 block text-lg text-chrome-100 hover:text-pink-200"
                  >
                    {it.title}
                  </Link>
                  <p className="mt-1 text-sm text-chrome-400">
                    {it.excerpt}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
      <Footer />
    </>
  );
}
