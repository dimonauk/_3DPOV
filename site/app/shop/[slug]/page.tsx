import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollectionSlugs } from "@/lib/collections";

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const c = getCollection(params.slug);
    return { title: `Acquire ${c.title} — Chrono-Protocol` };
  } catch {
    return { title: "Acquire — Chrono-Protocol" };
  }
}

export default function ShopItem({ params }: { params: { slug: string } }) {
  let c;
  try {
    c = getCollection(params.slug);
  } catch {
    notFound();
  }
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <div
          className="aspect-[3/4] border border-ink/15"
          style={{
            backgroundImage: `linear-gradient(135deg, ${c.tint}, transparent 70%), repeating-linear-gradient(45deg, rgba(11,11,13,0.05) 0 1px, transparent 1px 6px)`,
          }}
        />
        <div className="protocol-label mt-3">Plate {c.plateRef} · {c.code}</div>
      </div>

      <div>
        <Link href={`/collections/${c.slug}`} className="text-xs underline underline-offset-4">
          ← Back to record
        </Link>
        <h1 className="display text-4xl mt-5 leading-tight">{c.title}</h1>
        <p className="mt-3 text-ink/70">{c.kata} · {c.location}</p>

        <dl className="mt-8 grid grid-cols-2 gap-y-3 text-sm border-t border-ink/10 pt-6">
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
          <dt className="text-ink/60">Dispatch</dt>
          <dd>3&ndash;5 working days</dd>
        </dl>

        <div className="mt-8 border-t border-ink/10 pt-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="protocol-label">Price</div>
              <div className="display text-3xl mt-1 font-mono">£{c.priceGBP}</div>
            </div>
            <div className="text-xs text-ink/60">Tax &amp; shipping at checkout</div>
          </div>

          <fieldset className="mt-6">
            <legend className="protocol-label mb-2">Finish</legend>
            <label className="flex items-center gap-3 border border-ink/15 p-3 text-sm">
              <input type="radio" name="finish" defaultChecked /> Archival paper, unframed — included
            </label>
            <label className="flex items-center gap-3 border border-ink/15 p-3 text-sm mt-2">
              <input type="radio" name="finish" /> Face-mount on 3mm acrylic — +£{Math.round(c.priceGBP * 0.55)}
            </label>
          </fieldset>

          <form
            action="/api/checkout"
            method="post"
            className="mt-6"
          >
            <input type="hidden" name="slug" value={c.slug} />
            <button
              type="submit"
              className="w-full border border-ink bg-ink text-bone py-4 tracking-protocol text-sm hover:bg-bone hover:text-ink transition-colors"
            >
              PROCEED TO CHECKOUT
            </button>
          </form>

          <p className="mt-4 text-xs text-ink/60">
            Checkout is handled by Stripe. You will receive the signed
            plate, certificate of authenticity, and a short letter from
            the studio. Editions close without notice.
          </p>
        </div>
      </div>
    </div>
  );
}
