import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getCollection, getCollectionSlugs, getCollections } from "@/lib/collections";

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const c = getCollection(params.slug);
    return { title: `${c.title} — Chrono-Protocol` };
  } catch {
    return { title: "Collection — Chrono-Protocol" };
  }
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  let collection;
  try {
    collection = getCollection(params.slug);
  } catch {
    notFound();
  }
  if (!collection) notFound();
  const c = collection;

  const all = getCollections();
  const idx = all.findIndex((x) => x.slug === c.slug);
  const next = all[(idx + 1) % all.length];

  return (
    <article>
      <header
        className="border-b border-ink/10"
        style={{
          backgroundImage: `linear-gradient(180deg, ${c.tint}22, transparent 70%)`,
        }}
      >
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10">
          <div className="protocol-label">{c.code} · Field Record</div>
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
        <div
          className="aspect-[16/10] w-full border border-ink/15"
          style={{
            backgroundImage: `linear-gradient(135deg, ${c.tint}, transparent 80%), repeating-linear-gradient(90deg, rgba(11,11,13,0.05) 0 1px, transparent 1px 8px)`,
          }}
        />
        <figcaption className="protocol-label mt-3">{c.heroCaption}</figcaption>
      </figure>

      <section className="mx-auto max-w-2xl px-6 py-16 prose-chrono">
        <MDXRemote source={c.body} />
      </section>

      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="protocol-label">The Artefact</div>
          <h2 className="display text-3xl md:text-4xl mt-2">Plate {c.plateRef}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
            <div
              className="aspect-[3/4] w-full border border-ink/15"
              style={{
                backgroundImage: `linear-gradient(135deg, ${c.tint}, transparent 70%), repeating-linear-gradient(45deg, rgba(11,11,13,0.05) 0 1px, transparent 1px 6px)`,
              }}
            />
            <div className="space-y-5 text-sm">
              <dl className="grid grid-cols-2 gap-y-3">
                <dt className="text-ink/60">Edition</dt>
                <dd className="font-mono">{c.editionSize} + 2 AP</dd>
                <dt className="text-ink/60">Dimensions</dt>
                <dd>{c.dimensions}</dd>
                <dt className="text-ink/60">Paper</dt>
                <dd>{c.paper}</dd>
                <dt className="text-ink/60">Certificate</dt>
                <dd>Signed, numbered, embossed</dd>
                <dt className="text-ink/60">Ships from</dt>
                <dd>London, UK</dd>
                <dt className="text-ink/60">Price</dt>
                <dd className="font-mono">£{c.priceGBP}</dd>
              </dl>
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
