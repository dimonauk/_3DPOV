import Link from "next/link";
import { getCollections } from "@/lib/collections";
import { WORK_TYPE_LABEL, basePriceGBP } from "@/lib/works";

export const metadata = {
  title: "Collections",
};

export default function CollectionsIndex() {
  const collections = getCollections();
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="protocol-label">Index</div>
      <h1 className="display text-4xl md:text-5xl mt-3">Collections</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Each collection documents a single kata and the space it was held
        against. The artefact &mdash; a plate, a waveguide object, a
        sculpture, an array &mdash; is what the fieldwork leaves behind.
      </p>

      <ul className="mt-14 divide-y divide-ink/10 border-t border-b border-ink/10">
        {collections.map((c) => {
          const price = basePriceGBP(c.work);
          const priceLabel = c.work.type === "array" ? `From £${price}` : `£${price}`;
          return (
            <li key={c.slug}>
              <Link
                href={`/collections/${c.slug}`}
                className="grid grid-cols-12 gap-6 py-8 items-center hover:bg-ink/[0.03] transition-colors"
              >
                <div className="col-span-2 protocol-label">{c.code}</div>
                <div className="col-span-5">
                  <div className="display text-2xl">{c.title}</div>
                  <div className="text-sm text-ink/60 mt-1">{c.kata}</div>
                  <div className="text-xs text-ink/50 mt-1">{WORK_TYPE_LABEL[c.work.type]}</div>
                </div>
                <div className="col-span-3 text-sm">
                  <div>{c.location}</div>
                  <div className="text-ink/60">{c.coordinates}</div>
                </div>
                <div className="col-span-2 text-right text-sm">
                  <div className="font-mono">Ed. {c.work.editionSize}</div>
                  <div className="text-ink/60 font-mono">{priceLabel}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
