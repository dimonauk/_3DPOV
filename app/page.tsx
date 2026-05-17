import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import Footer from "components/layout/footer";
import { HolofoilHypercube } from "components/holofoil-hypercube";
import Link from "next/link";

// Force dynamic rendering — the Shopify product fetch in Carousel / 
// ThreeItemGrid was intermittently failing during static prerender 
// (see digest 265885447). Rendering at request time avoids it 
// without forcing us to handle Shopify outage edge cases at build.
export const dynamic = "force-dynamic";

export const metadata = {
  description:
    "Holo-Flow Studio — long-exposure light-painting photographs translated into 3D-printed objects with embedded ambient-light waveguides. Poi practice, persistence-of-vision LED arrays, drone-mounted LED systems. Salford, UK.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <PipelineSection />
      <FeaturedSection />
      <Carousel />
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-warm-black-800">
      {/* The hypercube: the site's bullet point. Sits behind the content
          on a deep-midnight plate and bleeds outward through a vignette
          so the typography reads cleanly without losing the glyph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[#0c0a12]"
      >
        <div className="absolute inset-0 opacity-60">
          <HolofoilHypercube />
        </div>
        <div className="absolute inset-0 hero-vignette" />
      </div>
      <div className="relative mx-auto max-w-(--breakpoint-2xl) px-4 pt-20 pb-28 md:px-8 md:pt-28 md:pb-36 [perspective:1400px]">
        <div className="chrome-label [transform:translateZ(20px)]">
          Holo-Flow Studio &middot; Salford, UK
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] tracking-tight md:text-7xl [transform:translateZ(40px)]">
          Light painted in the air,
          <br />
          <span className="chrome-sheen">printed into objects.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-chrome-200">
          Long-exposure photographs of gestures drawn in fire, in
          programmable LED, in light flown on drones. Captured in a
          single frame, no compositing &mdash; there isn&rsquo;t any
          need and there isn&rsquo;t any reason. Then translated into
          3D-printed objects with acrylic waveguides grown along the
          original trace, lit from inside. The photograph is what the
          room saw. The object is what the gesture left behind.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-5 text-sm">
          <Link
            href="/photographs"
            prefetch={true}
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            The photographs
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-chrome-400/30 px-6 py-3 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
          >
            The objects
          </Link>
          <Link
            href="/practice"
            className="text-chrome-300 underline underline-offset-4 hover:text-pink-200"
          >
            The practice, the method &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

function Statement() {
  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-20 md:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="chrome-label">Statement</div>
          <h2 className="mt-3 text-3xl md:text-4xl">
            Gesture, captured.
            <br />
            Gesture, cast.
          </h2>
        </div>
        <div className="prose-gallery md:col-span-3">
          <p>
            Twelve years of poi got the body fluent. Two weights, two
            cords, fire held against the dark, the practised arc. The
            camera turned up around year three to keep the gestures
            that would otherwise disappear at dawn. The rigs turned up
            around year nine to write whatever the body could lift.
          </p>
          <p>
            The <strong>photographs</strong> are the record. Single long
            exposures. Image data written into physical space by moving
            light, captured in one frame. No compositing &mdash; there
            isn&rsquo;t any need.
          </p>
          <p>
            The <strong>objects</strong> are what happens when the
            photographs go back into the physical. Their geometry comes
            out of the captured trace &mdash; voxel-traced, surfaced,
            refined &mdash; and gets 3D-printed in resin. Clear acrylic
            waveguides run along the original gesture lines, lit from
            inside. The gesture glows again from inside the body it
            drew.
          </p>
          <p>
            Each piece is editioned, signed, and ships with the field
            record: where the gesture was performed, what hour, what
            date, what music if music mattered.
          </p>
        </div>
      </div>
    </section>
  );
}

function PipelineSection() {
  const stages = [
    {
      label: "I",
      title: "Perform",
      body: "A kata, in a place that matters. Fire poi, programmable LED, drone-mounted light. One exposure.",
    },
    {
      label: "II",
      title: "Capture",
      body: "The photograph holds what the eye and the room saw. Sometimes it is the work. Sometimes it is the seed for what comes next.",
    },
    {
      label: "III",
      title: "Translate",
      body: "Photograph becomes mesh. Voxel-trace, extrude, boolean. The gesture becomes geometry.",
    },
    {
      label: "IV",
      title: "Print",
      body: "SLA print in resin. Acrylic waveguides grown through the body. LEDs seated at the waveguide roots.",
    },
    {
      label: "V",
      title: "Finish",
      body: "Sanded, tinted, polished. Seated on its base. Powered, addressed, numbered. Field record in the box.",
    },
  ];
  return (
    <section className="border-t border-warm-black-800 bg-warm-black-900/40">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-24">
        <div className="chrome-label">The pipeline</div>
        <h2 className="mt-3 max-w-3xl text-3xl md:text-4xl">
          From a gesture in a field to an object on your shelf.
        </h2>
        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-5">
          {stages.map((s) => (
            <li
              key={s.label}
              className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-5"
            >
              <div className="chrome-label text-pink-200">
                Stage {s.label}
              </div>
              <div className="mt-2 font-display text-xl text-chrome-100">
                {s.title}
              </div>
              <p className="mt-2 text-sm text-chrome-300">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FeaturedSection() {
  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="chrome-label">Current release</div>
          <h2 className="mt-2 text-3xl md:text-4xl">
            What is on the shelf right now.
          </h2>
        </div>
        <Link
          href="/search"
          className="text-sm text-chrome-300 underline underline-offset-4 hover:text-pink-200"
        >
          The full catalogue &rarr;
        </Link>
      </div>
      <ThreeItemGrid />
    </section>
  );
}
