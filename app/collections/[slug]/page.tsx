import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getCollection, getCollectionSlugs, getCollections } from "@/lib/collections";
import { PlatePlaceholder } from "@/components/plate-placeholder";
import { WorkPreview } from "@/components/work-preview";
import { WorkSpec } from "@/components/work-spec";
import { WORK_TYPE_LABEL } from "@/lib/works";

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  return { title: c ? `${c.title} — Chrono-Protocol` : "Collection — Chrono-Protocol" };
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  if (!c) notFound();

  const all = getCollections();
  const idx = all.findIndex((x) => x.slug === c.slug);
  const next = all[(idx + 1) % all.length];

  const artefactNoun =
    c.work.type === "plate" ? `Plate ${c.plateRef}` : `Object ${c.plateRef}`;

  return (
    <article>
      <header
        className="border-b border-ink/10"
        style={{
          backgroundImage: `linear-gradient(180deg, ${c.tint}22, transparent 70%)`,
        }}
      >
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10">
          <div className="protocol-label">{c.code} · Field Record · {WORK_TYPE_LABEL[c.work.type]}</div>
          <h1 className="display text-5xl md:text-6xl mt-5 leading-[1]">{c.title}</h1>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="protocol-label">Kata</div>
              <div className="mt-1">{c.kata}</div>
            </div>
            <div>
              <div className="protocol-label">Location</div>
              <div className="mt-1">{c.location}</div>
              <div className="text-ink/60 font-mono text-xs mt-1">{c.coordinates}</div>
            </div>
            <div>
              <div className="protocol-label">Hour</div>
              <div className="mt-1">{c.hour}</div>
              <div className="text-ink/60 text-xs mt-1">Performed {c.performedOn}</div>
            </div>
          </div>
        </div>
      </header>

      <figure className="mx-auto max-w-5xl px-6 pt-10">
        <PlatePlaceholder tint={c.tint} aspect="16/10" hatch="vertical" tintStop="80%" />
        <figcaption className="protocol-label mt-3">{c.heroCaption}</figcaption>
      </figure>

      <section className="mx-auto max-w-2xl px-6 py-16 prose-chrono">
        <MDXRemote source={c.body} />
      </section>

      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="protocol-label">The Artefact</div>
          <h2 className="display text-3xl md:text-4xl mt-2">{artefactNoun}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
            <WorkPreview work={c.work} tint={c.tint} aspect="3/4" />
            <div className="space-y-5 text-sm">
              <WorkSpec work={c.work} />
              <div className="flex gap-3 pt-3">
                <Link
                  href={`/shop/${c.slug}`}
                  className="inline-block border border-ink px-5 py-3 tracking-protocol text-xs hover:bg-ink hover:text-bone transition-colors"
                >
                  ACQUIRE
                </Link>
                <Link
                  href="/shop/certificate"
                  className="inline-block px-5 py-3 text-xs underline underline-offset-4"
                >
                  On the certificate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-10 flex items-center justify-between">
          <Link href="/collections" className="text-sm underline underline-offset-4">
            ← All collections
          </Link>
          <Link
            href={`/collections/${next.slug}`}
            className="text-sm text-right"
          >
            <div className="protocol-label">Next record</div>
            <div className="display text-xl mt-1">{next.title} →</div>
          </Link>
        </div>
      </nav>
    </article>
  );
}
