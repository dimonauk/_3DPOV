import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollectionSlugs } from "@/lib/collections";
import { faceMountPrice } from "@/lib/pricing";
import { DISPATCH_WINDOW } from "@/lib/constants";
import { WorkPreview } from "@/components/work-preview";
import { WorkSpec } from "@/components/work-spec";
import { ArrayConfigurator } from "@/components/array-configurator";
import { WORK_TYPE_LABEL } from "@/lib/works";

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  return { title: c ? `Acquire ${c.title}` : "Acquire" };
}

export default function ShopItem({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  if (!c) notFound();

  const plateNoun = c.work.type === "plate" ? `Plate ${c.plateRef}` : `Object ${c.plateRef}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <WorkPreview work={c.work} tint={c.tint} aspect="3/4" />
        <div className="protocol-label mt-3">{plateNoun} · {c.code} · {WORK_TYPE_LABEL[c.work.type]}</div>
      </div>

      <div>
        <Link href={`/collections/${c.slug}`} className="text-xs underline underline-offset-4">
          ← Back to record
        </Link>
        <h1 className="display text-4xl mt-5 leading-tight">{c.title}</h1>
        <p className="mt-3 text-ink/70">{c.kata} · {c.location}</p>

        <div className="mt-8 border-t border-ink/10 pt-6">
          <WorkSpec work={c.work} />
          <div className="mt-3 text-sm flex gap-6 text-ink/70">
            <span>Dispatch {DISPATCH_WINDOW}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-ink/10 pt-6">
          {c.work.type === "array" ? (
            <ArrayConfigurator slug={c.slug} work={c.work} tint={c.tint} />
          ) : (
            <FixedPriceCheckout
              slug={c.slug}
              priceGBP={c.work.priceGBP}
              showFaceMount={c.work.type === "plate"}
            />
          )}

          <p className="mt-4 text-xs text-ink/60">
            Checkout is handled by Stripe. You will receive the work,
            certificate of authenticity, and a short letter from the
            studio. Editions close without notice.
          </p>
        </div>
      </div>
    </div>
  );
}

function FixedPriceCheckout({
  slug,
  priceGBP,
  showFaceMount,
}: {
  slug: string;
  priceGBP: number;
  showFaceMount: boolean;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="protocol-label">Price</div>
          <div className="display text-3xl mt-1 font-mono">£{priceGBP}</div>
        </div>
        <div className="text-xs text-ink/60">Tax &amp; shipping at checkout</div>
      </div>

      <form action="/api/checkout" method="post" className="mt-6">
        <input type="hidden" name="slug" value={slug} />

        {showFaceMount && (
          <fieldset className="mb-6">
            <legend className="protocol-label mb-2">Finish</legend>
            <label className="flex items-center gap-3 border border-ink/15 p-3 text-sm">
              <input type="radio" name="finish" value="unframed" defaultChecked /> Archival paper, unframed — included
            </label>
            <label className="flex items-center gap-3 border border-ink/15 p-3 text-sm mt-2">
              <input type="radio" name="finish" value="face-mount" /> Face-mount on 3mm acrylic — +£{faceMountPrice(priceGBP)}
            </label>
          </fieldset>
        )}

        <button
          type="submit"
          className="w-full border border-ink bg-ink text-bone py-4 tracking-protocol text-sm hover:bg-bone hover:text-ink transition-colors"
        >
          PROCEED TO CHECKOUT
        </button>
      </form>
    </>
  );
}
