import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { aggregateScene, allSceneSlugs, getScene } from "lib/scenes";
import type { SceneSlug } from "lib/scenes";
import { formatEntryDate } from "lib/writing";

export function generateStaticParams() {
  return allSceneSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scene = getScene(slug);
  if (!scene) return { title: "Scene not found" };
  return {
    title: `${scene.label} — Scenes`,
    description: scene.blurb,
  };
}

export default async function SceneDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const knownScene = getScene(slug);
  if (!knownScene) notFound();

  const { scene, profiles, whosWhoArticle, relatedArticles } =
    aggregateScene(slug as SceneSlug);
  if (!scene) notFound();

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          <Link href="/scenes" className="hover:text-pink-200">
            Knowledge base · Scenes
          </Link>
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          {scene.label}.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">{scene.blurb}</p>

        {whosWhoArticle ? (
          <section className="mt-12">
            <div className="chrome-label text-pink-200">Who&rsquo;s-who</div>
            <Link
              href={`/articles/${whosWhoArticle.slug}`}
              className="group mt-4 block"
              prefetch={true}
            >
              <h2 className="text-2xl text-chrome-100 group-hover:text-pink-200">
                {whosWhoArticle.title}
              </h2>
              {whosWhoArticle.excerpt ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-chrome-300">
                  {whosWhoArticle.excerpt}
                </p>
              ) : null}
              <span className="chrome-label mt-3 inline-block text-chrome-500 group-hover:text-pink-200">
                Read &rarr; {formatEntryDate(whosWhoArticle.date)}
              </span>
            </Link>
          </section>
        ) : (
          <section className="mt-12">
            <div className="chrome-label text-chrome-500">Who&rsquo;s-who</div>
            <p className="mt-3 text-sm text-chrome-400">
              Forthcoming. One scene ships per session.
            </p>
          </section>
        )}

        <section className="mt-12 border-t border-warm-black-800 pt-10">
          <div className="chrome-label text-pink-200">
            People · {profiles.length}{" "}
            {profiles.length === 1 ? "practitioner" : "practitioners"}
          </div>
          {profiles.length === 0 ? (
            <p className="mt-4 text-sm text-chrome-400">
              None catalogued yet. The rolodex grows as the
              who&rsquo;s-who articles publish.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profiles.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/people/${p.id}`}
                    className="block rounded-sm border border-warm-black-700 bg-warm-black-900/30 px-4 py-3 transition-colors hover:border-pink-200"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-chrome-100">{p.name}</span>
                      <span className="chrome-label text-chrome-500">
                        {p.location}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-chrome-400 line-clamp-2">
                      {p.bioShort}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {relatedArticles.length > 0 ? (
          <section className="mt-12 border-t border-warm-black-800 pt-10">
            <div className="chrome-label text-pink-200">
              Other writing that touches the scene
            </div>
            <ul className="mt-5 divide-y divide-warm-black-800">
              {relatedArticles.map((entry) => (
                <li key={entry.slug} className="py-5">
                  <Link
                    href={`/articles/${entry.slug}`}
                    className="group block"
                    prefetch={true}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg text-chrome-100 group-hover:text-pink-200">
                        {entry.title}
                      </h3>
                      <span className="chrome-label text-chrome-500">
                        {formatEntryDate(entry.date)}
                      </span>
                    </div>
                    {entry.excerpt ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-chrome-400">
                        {entry.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Elsewhere</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/scenes" className="text-pink-200 hover:underline">
                All scenes &rarr;
              </Link>
            </li>
            <li>
              <Link href="/people" className="text-pink-200 hover:underline">
                People index &rarr;
              </Link>
            </li>
            <li>
              <Link href="/whoswho" className="text-pink-200 hover:underline">
                Who&rsquo;s-who articles &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
