import Link from "next/link";
import { getCollections } from "@/lib/collections";
import { PlatePlaceholder } from "@/components/plate-placeholder";
import { EDITION_AP_SUFFIX } from "@/lib/constants";
import { WORK_TYPE_LABEL, basePriceGBP } from "@/lib/works";

export const metadata = { title: "Acquire — Chrono-Protocol" };

export default function ShopIndex() {
  const collections = getCollections();
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="protocol-label">Acquire</div>
      <h1 className="display text-4xl md:text-5xl mt-3">Available works</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Plates, waveguide objects, desktop sculptures, and wall arrays.
        Every work ships signed, numbered, and with a certificate of
        authenticity. Editions close on sell-through and are never
        re-opened.
      </p>

      <ul className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {collections.map((c) => {
          const price = basePriceGBP(c.work);
          const priceLabel = c.work.type === "array" ? `From £${price}` : `£${price}`;
          return (
            <li key={c.slug} className="border border-ink/15 p-6">
              <PlatePlaceholder tint={c.tint} aspect="4/5" hatch="horizontal" className="mb-5" />
              <div className="protocol-label">
                {c.code} · {WORK_TYPE_LABEL[c.work.type]}
              </div>
              <div className="display text-2xl mt-1">{c.title}</div>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink/60">Edition</dt>
                <dd className="font-mono">{c.work.editionSize} {EDITION_AP_SUFFIX}</dd>
                <dt className="text-ink/60">Size</dt>
                <dd>{c.work.dimensions}</dd>
                <dt className="text-ink/60">Price</dt>
                <dd className="font-mono">{priceLabel}</dd>
              </dl>
              <div className="mt-5 flex gap-3">
                <Link
                  href={`/shop/${c.slug}`}
                  className="inline-block border border-ink px-4 py-2 text-xs tracking-protocol hover:bg-ink hover:text-bone"
                >
                  ACQUIRE
                </Link>
                <Link
                  href={`/collections/${c.slug}`}
                  className="text-xs underline underline-offset-4 self-center"
                >
                  Read the record
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="protocol-label">Certificate</div>
          <p className="mt-2 text-ink/70">
            Every work is accompanied by a signed, embossed certificate
            recording edition number, coordinates, hour, and date of the
            original kata.
          </p>
          <Link href="/shop/certificate" className="underline underline-offset-4 mt-2 inline-block">Details</Link>
        </div>
        <div>
          <div className="protocol-label">Lit objects &amp; arrays</div>
          <p className="mt-2 text-ink/70">
            Waveguide objects ship with a 12V / USB-C power supply and
            firmware pre-loaded. Arrays include a unified low-voltage bus,
            mounting hardware, and a sequencing guide.
          </p>
        </div>
        <div>
          <div className="protocol-label">Shipping</div>
          <p className="mt-2 text-ink/70">
            UK &amp; EU: 5&ndash;7 working days, insured. US &amp; rest of world:
            10&ndash;14 days. Import duties paid by recipient.
          </p>
          <Link href="/shop/shipping" className="underline underline-offset-4 mt-2 inline-block">Details</Link>
        </div>
      </div>
    </div>
  );
}
