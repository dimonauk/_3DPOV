import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  description:
    "Holo-Flow Studio — long-exposure light-painting photographs translated into 3D-printed objects with embedded ambient-light waveguides. Poi practice, persistence-of-vision LED arrays, drone-mounted LED systems. Manchester, UK.",
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(900px 480px at 78% 18%, rgba(255,120,165,0.28), transparent 62%), radial-gradient(780px 520px at 8% 82%, rgba(154,109,255,0.28), transparent 62%), radial-gradient(600px 380px at 50% 100%, rgba(118,222,166,0.18), transparent 65%)",
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-20 pb-28 md:px-8 md:pt-28 md:pb-36">
        <div className="chrome-label">
          Holo-Flow Studio &middot; Manchester, UK
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Light painted in the air,
          <br />
          <span className="chrome-sheen">printed into objects.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-chrome-200">
          Long-exposure photographs of gestures &mdash; drawn with fire,
          persistence-of-vision LED arrays, and drone-mounted lights &mdash;
          translated into 3D geometry and cast as objects with ambient
          waveguides grown through their bodies. The photograph is what
          the room saw. The object is what the gesture left behind.
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
            Holo-Flow Studio began as twelve years of poi &mdash; the spun
            weight, the practised arc, fire held against the dark. The
            camera came later, to keep the gestures that would otherwise
            disappear at dawn. Then the gestures got programmed, precise,
            rendered in LED arrays built to draw whatever the hand could
            lift.
          </p>
          <p>
            The <strong>photographs</strong> are the record: single long
            exposures of image data written into physical space by
            moving light, captured whole. No compositing.
          </p>
          <p>
            The <strong>objects</strong> are what happens when those
            photographs go back into the physical. 3D-printed bodies
            whose geometry is derived from the captured trace, shot
            through with clear acrylic waveguides that carry internal
            light through the print. The gesture glows again from
            inside the body it drew.
          </p>
          <p>
            Each piece is editioned, signed, and ships with the field
            record &mdash; where the gesture was performed, what hour,
            what date.
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
      body: "A kata held in a place that matters &mdash; fire poi, programmed LED arrays, drone-mounted lights. One exposure.",
    },
    {
      label: "II",
      title: "Capture",
      body: "The photograph holds what the eye and the room saw. Sometimes it's the final object. Sometimes it's the seed.",
    },
    {
      label: "III",
      title: "Translate",
      body: "The photograph becomes a mesh. Voxel tracing, extrusion, boolean passes. The gesture becomes geometry.",
    },
    {
      label: "IV",
      title: "Print",
      body: "SLA-printed in resin. Clear acrylic waveguides grown through the body. LEDs seated at the waveguide roots.",
    },
    {
      label: "V",
      title: "Finish",
      body: "Sanded, tinted, polished. Seated on its base. Powered, addressed, numbered. Packed with its field record.",
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
          <h2 className="mt-2 text-3xl md:text-4xl">Featured work.</h2>
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
