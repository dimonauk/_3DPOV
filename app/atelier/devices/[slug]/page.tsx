/**
 * app/atelier/devices/[slug]/page.tsx — Single-device focused view.
 *
 * The same gallery scene as the index, restricted to a single
 * catalogue entry so the visitor stands across from one piece on its
 * plinth. Useful as a direct-link target from cards, codex entries,
 * and articles.
 *
 * Server component. Resolves the slug at request time and 404s when
 * unknown; generates static params for every seeded entry so the
 * route is statically optimised.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { DeviceCard, AttributionChip } from "components/devices/DeviceCard";
import { DeviceGalleryScene } from "components/devices/DeviceGalleryScene";
import { IssueBand } from "components/luxe/IssueBand";
import {
  DEVICE_CATALOGUE,
  categoryLabel,
  findDevice,
} from "lib/devices/catalogue";

type PageParams = { slug: string };

export function generateStaticParams(): PageParams[] {
  return DEVICE_CATALOGUE.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const entry = findDevice(slug);
  if (!entry) {
    return { title: "Device gallery — entry not found" };
  }
  return {
    title: `${entry.name} (${entry.year}) — device gallery`,
    description: entry.note,
  };
}

export default async function DeviceSinglePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const entry = findDevice(slug);
  if (!entry) {
    notFound();
  }

  // The single-piece scene runs the same gallery scene with just this
  // entry. Layout puts the lone device on the +x line; we point the
  // camera at it so the visitor lands facing it.
  const focusCamera = {
    position: [0, 1.6, 2.6] as [number, number, number],
    target: [0, 1.2, -1.4] as [number, number, number],
  };

  const cousins = DEVICE_CATALOGUE.filter(
    (other) => other.category === entry.category && other.slug !== entry.slug,
  ).slice(0, 3);

  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <IssueBand
          label="ATELIER"
          issue="ISSUE 06"
          date={`${entry.year}`}
          publisher="HOLOFLOW STUDIO"
        />

        <nav className="mt-6 text-xs text-chrome-500">
          <Link href="/atelier/devices" className="hover:text-pink-200">
            &larr; back to the gallery
          </Link>
        </nav>

        <header className="mt-6 mb-10 flex flex-col gap-3">
          <div className="chrome-label">
            Atelier &middot; Device gallery &middot;{" "}
            {categoryLabel(entry.category)}
          </div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-6xl">
            {entry.name}
          </h1>
          <div className="chrome-label flex items-center gap-3 text-chrome-300">
            <span
              aria-hidden
              className="inline-block h-2 w-8"
              style={{ background: entry.presentation.accent }}
            />
            <span>
              {entry.manufacturer} &middot; {entry.year}
            </span>
          </div>
          <p className="max-w-2xl text-lg text-chrome-200 italic">
            {entry.note}
          </p>
          <div className="mt-2 max-w-fit">
            <AttributionChip entry={entry} />
          </div>
        </header>

        <section className="w-full">
          <DeviceGalleryScene
            catalogue={[entry]}
            initialCamera={focusCamera}
            height="68vh"
          />
        </section>

        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
            <h2 className="font-display text-2xl">Sourcing</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-chrome-300 sm:grid-cols-2">
              <div>
                <dt className="chrome-label text-chrome-400">Author</dt>
                <dd className="mt-1 text-chrome-100">
                  {entry.attribution.author}
                </dd>
              </div>
              <div>
                <dt className="chrome-label text-chrome-400">Licence</dt>
                <dd className="mt-1 text-chrome-100">
                  {entry.attribution.licence}
                </dd>
              </div>
              <div>
                <dt className="chrome-label text-chrome-400">Source</dt>
                <dd className="mt-1 text-chrome-100">
                  {entry.attribution.source}
                </dd>
              </div>
              <div>
                <dt className="chrome-label text-chrome-400">Asset state</dt>
                <dd className="mt-1 text-chrome-100">
                  {entry.modelPresent
                    ? "GLB loaded"
                    : "Primitive fallback (GLB pending)"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="chrome-label text-chrome-400">URL</dt>
                <dd className="mt-1 break-all text-sm">
                  <a
                    href={entry.attribution.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-pink-200 underline underline-offset-4"
                  >
                    {entry.attribution.url}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <DeviceCard entry={entry} linked={false} />
          </div>
        </section>

        {cousins.length > 0 && (
          <section className="mt-16">
            <h2 className="chrome-label text-chrome-300">
              Other {categoryLabel(entry.category).toLowerCase()}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {cousins.map((other) => (
                <DeviceCard
                  key={other.slug}
                  entry={other}
                  variant="inline"
                />
              ))}
            </div>
          </section>
        )}
      </article>
      <Footer />
    </>
  );
}
