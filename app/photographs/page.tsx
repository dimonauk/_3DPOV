import Link from "next/link";
import Footer from "components/layout/footer";
import { PhotographTile } from "components/grid/photograph-tile";
import { getCollection, getCollectionProducts } from "lib/shopify/cached";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photographs",
  description:
    "Editioned long-exposure photographs: persistence-of-vision LED arrays performing programmed image data in physical space, captured in a single frame. Printed on archival paper, signed, numbered.",
};

const COLLECTION_HANDLE = "photographs";

export default async function PhotographsPage() {
  const collection = await getCollection(COLLECTION_HANDLE).catch(() => null);
  const products = await getCollectionProducts({
    collection: COLLECTION_HANDLE,
  }).catch(() => []);

  return (
    <>
      <article className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-16 pb-8 md:px-8 md:pt-24">
        <div className="chrome-label">Editioned photographs</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-7xl">
          Light, <span className="chrome-sheen">written in the air.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every image in this series is a single long exposure. No
          compositing &mdash; that&rsquo;s the rule, and the rule
          isn&rsquo;t aesthetic. Inside the exposure: a
          persistence-of-vision LED array moving through real space,
          writing programmed image data into the air column by column.
          The picture was physically in the room before the camera saw
          it. The camera held the room open long enough to catch it.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          All prints are signed, numbered, and ship with a field record
          naming the kata, the location, the hour, the date, and the
          music if music mattered to the gesture.
        </p>
        <p className="mt-6 max-w-2xl text-sm text-chrome-400">
          Curious how these are made? The studio writes a{" "}
          <Link
            href="/tutorials/your-first-long-exposure"
            className="text-pink-200 underline underline-offset-4"
          >
            beginner tutorial on long-exposure light painting
          </Link>{" "}
          and a deeper{" "}
          <Link
            href="/articles/why-i-build-my-own-rigs"
            className="text-pink-200 underline underline-offset-4"
          >
            article on why the rigs are custom-built
          </Link>
          . The full history lives on{" "}
          <Link
            href="/practice"
            className="text-pink-200 underline underline-offset-4"
          >
            the practice page
          </Link>
          .
        </p>
      </article>

      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-20 md:px-8">
        {products.length === 0 ? (
          <EmptyState hasCollection={Boolean(collection)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {products.map((p) => (
              <PhotographTile key={p.handle} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 md:px-8">
        <div className="grid grid-cols-1 gap-8 border-t border-warm-black-800 pt-12 text-sm text-chrome-300 md:grid-cols-3">
          <div>
            <div className="chrome-label mb-2">Papers</div>
            <p>
              Hahnem&uuml;hle Photo Rag 308&thinsp;gsm, Hahnem&uuml;hle
              German Etching 310&thinsp;gsm, Canson Infinity Baryta
              Prestige II 340&thinsp;gsm. Other stocks on request.
            </p>
          </div>
          <div>
            <div className="chrome-label mb-2">Sizes</div>
            <p>
              A3 (297 &times; 420&thinsp;mm) and A2 (420 &times; 594&thinsp;mm)
              from the catalogue. Commission sizes (A1, A0,
              non-standard) on enquiry.
            </p>
          </div>
          <div>
            <div className="chrome-label mb-2">Certificate</div>
            <p>
              Each print ships with a signed certificate naming edition
              number, kata, coordinates, hour, and date of capture.
              Editions close on sell-through and do not re-open.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-28 md:px-8">
        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-8">
          <div className="chrome-label">Commissions</div>
          <h2 className="mt-2 text-2xl text-chrome-100">
            A gesture for your room.
          </h2>
          <p className="mt-3 text-chrome-300">
            A kata performed on commission. Your choice of location,
            colour programme, duration. One-off print, or runs of two
            or three if the family wants matching impressions. Write
            in and tell me the room.
          </p>
          <div className="mt-5">
            <Link
              href="/contact?intent=commission"
              className="chrome-label rounded-full border border-pink-200/40 bg-pink-200/10 px-5 py-2.5 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Enquire &rarr;
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function EmptyState({ hasCollection }: { hasCollection: boolean }) {
  return (
    <div className="rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 p-12 text-center">
      <div className="chrome-label">In preparation</div>
      <h2 className="mt-3 text-2xl text-chrome-100">
        First editions landing shortly.
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm text-chrome-300">
        Nothing on the shelf yet &mdash; the prints are being made,
        signed, and packed. The first editions go up here as soon as
        they&rsquo;re ready. If you want to be told first, leave your
        address in the dispatch notes at the bottom of any page.
      </p>
      <div className="mt-6">
        <Link
          href="/contact?intent=general"
          className="text-sm text-pink-200 underline underline-offset-4"
        >
          Or write directly &rarr;
        </Link>
      </div>
    </div>
  );
}
