import Footer from "components/layout/footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  codex,
  findLinkedItem,
  getCodexEntry,
  getCodexReferencedBy,
} from "lib/codex";

export function generateStaticParams() {
  return codex.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getCodexEntry(slug);
  if (!entry) return { title: "Codex" };
  return {
    title: `${entry.title} — Codex`,
    description: entry.summary,
  };
}

export default async function CodexEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getCodexEntry(slug);
  if (!entry) notFound();

  const Body = entry.Body;

  // Resolve forward see-also slugs to linked items (Codex / articles /
  // tutorials). Unresolved ones display as 'pending'.
  const seeAlsoResolved = (entry.seeAlso ?? []).map((s) => ({
    slug: s,
    resolved: findLinkedItem(s),
  }));
  const pending = seeAlsoResolved
    .filter((r) => !r.resolved)
    .map((r) => r.slug);

  // Reverse cross-references: other Codex entries that link here.
  const referencedBy = getCodexReferencedBy(entry.slug);

  // Prev / next within the Codex by current sort order.
  const i = codex.findIndex((e) => e.slug === entry.slug);
  const previous = i < codex.length - 1 ? codex[i + 1] : null;
  const next = i > 0 ? codex[i - 1] : null;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Link
          href="/codex"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Codex
        </Link>

        <header className="mt-10">
          <div className="chrome-label text-pink-200">
            {entry.category}
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05] text-chrome-100">
            {entry.title}
          </h1>
          {entry.status && (
            <p className="mt-4 chrome-label text-pink-200/80">
              {entry.status}
            </p>
          )}
        </header>

        <div className="mt-12 prose-gallery text-chrome-200 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:text-chrome-100 [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:text-chrome-100 [&_p]:leading-relaxed [&_strong]:text-pink-200 [&_a]:text-pink-200 [&_a]:underline [&_a]:underline-offset-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5 [&_sup]:text-pink-200 [&_sup]:font-mono">
          <Body />
        </div>

        {(seeAlsoResolved.length > 0 || referencedBy.length > 0) && (
          <section className="mt-16 border-t border-warm-black-800 pt-10">
            <div className="chrome-label mb-6">Cross-references</div>

            {seeAlsoResolved.length > 0 && (
              <div className="mb-8">
                <div className="chrome-label text-chrome-500 mb-3">
                  See also
                </div>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {seeAlsoResolved.map(({ slug, resolved }) =>
                    resolved ? (
                      <li key={slug}>
                        <Link
                          href={resolved.href}
                          prefetch={true}
                          className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 transition-colors hover:border-pink-200/40"
                        >
                          <div className="chrome-label text-chrome-500">
                            {resolved.kind === "codex"
                              ? "Codex"
                              : resolved.kind === "article"
                                ? "Article"
                                : resolved.kind === "tutorial"
                                  ? "Tutorial"
                                  : "Journal"}
                          </div>
                          <div className="mt-1 text-chrome-100 group-hover:text-pink-200">
                            {resolved.title}
                          </div>
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
                {pending.length > 0 && (
                  <p className="mt-4 chrome-label text-chrome-500">
                    Also referenced (entries pending):{" "}
                    {pending.join(" · ")}
                  </p>
                )}
              </div>
            )}

            {referencedBy.length > 0 && (
              <div>
                <div className="chrome-label text-chrome-500 mb-3">
                  Referenced by
                </div>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {referencedBy.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/codex/${r.slug}`}
                        prefetch={true}
                        className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 transition-colors hover:border-pink-200/40"
                      >
                        <div className="chrome-label text-chrome-500">
                          {r.category}
                        </div>
                        <div className="mt-1 text-chrome-100 group-hover:text-pink-200">
                          {r.title}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {entry.sources && entry.sources.length > 0 && (
          <section className="mt-12 border-t border-warm-black-800 pt-10">
            <div className="chrome-label mb-3">
              Sources &middot; learning resources
            </div>
            <p className="mb-5 text-sm text-chrome-400">
              Outward links to the documentation, communities, papers,
              and tools that back this entry up and that a learner can
              follow to get there themselves. Free and open where
              possible; paid where it&rsquo;s the studio&rsquo;s
              honest pick.
            </p>
            <ul className="space-y-2 text-sm text-chrome-300">
              {entry.sources.map((s, i) => (
                <li key={i} className="leading-relaxed">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
                    >
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-16 border-t border-warm-black-800 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between">
            {previous ? (
              <Link
                href={`/codex/${previous.slug}`}
                className="group max-w-xs"
              >
                <div className="chrome-label text-chrome-500">Earlier</div>
                <div className="mt-1 text-chrome-200 group-hover:text-pink-200">
                  &larr; {previous.title}
                </div>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/codex/${next.slug}`}
                className="group max-w-xs md:text-right"
              >
                <div className="chrome-label text-chrome-500">More recent</div>
                <div className="mt-1 text-chrome-200 group-hover:text-pink-200">
                  {next.title} &rarr;
                </div>
              </Link>
            )}
          </div>
        </footer>
      </article>
      <Footer />
    </>
  );
}
