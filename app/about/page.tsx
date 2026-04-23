import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "The practice, the method, the studio — Holo-Flow Studio, Manchester. Twelve years of poi, condensed into editioned objects.",
};

export default function AboutPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Document 000</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The practice,
          <br />
          the method,
          <br />
          <span className="chrome-sheen">the studio.</span>
        </h1>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">I · The practice</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Twelve years of poi.
          </h2>
          <p>
            Poi is a movement discipline. Two weights on two cords, held in
            the hands, drawn through the air by the body. The geometry is
            ancient &mdash; Māori in origin &mdash; and it takes years to
            become fluent in it. I've been practicing for twelve.
          </p>
          <p>
            The thing you realise, eventually, is that a gesture sustained
            long enough stops being a gesture and becomes an object.
            Long-exposure photography proved it to the rest of us: the
            trails hold.
          </p>
          <p>
            Holo-Flow Studio is what happens when those trails are pulled
            out of the photograph and cast into something you can put on a
            shelf.
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">II · The methods</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Three ways to paint light, one way to hold it.
          </h2>
          <p>
            The photographs come from three different light-painting
            practices, each contributing different qualities to the
            archive.
          </p>
          <p>
            <strong>Traditional light painting.</strong> Torches, LED
            wands, fire poi, handheld sticks. Organic, gestural,
            human-scale. Good for landscape pieces and for work where
            the body&rsquo;s presence in the gesture is part of the
            subject.
          </p>
          <p>
            <strong>Persistence-of-vision LED arrays.</strong> Addressable
            LEDs on a moving chassis &mdash; programmed frame by frame,
            synced against a rotation sensor, able to render arbitrary
            image data <em>as light, in physical space.</em> The rigs
            are built in-studio around a Teensy microcontroller and
            TLC5927 drivers; the frames are designed ahead in software;
            the body walks the spatial trajectory. What the camera
            captures is not the body &mdash; it is the image data in
            its briefly-real physical form.
          </p>
          <p>
            <strong>Drone-mounted LED systems.</strong> New. The rig
            goes into the air, able to sustain geometries too large
            for any body: rings at altitude, traces over landscape,
            arcs across architecture. First captures landing shortly.
          </p>
          <p className="pt-2">
            <Link
              href="/practice"
              className="text-pink-200 underline underline-offset-4"
            >
              The full history of how these stacked up &rarr;
            </Link>
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">III · The objects</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Photograph becomes geometry. Geometry becomes object.
          </h2>
          <p>
            The photographs are finished work in their own right,
            editioned and printed. But they are also source material.
            Each capture can be translated into 3D geometry &mdash;
            voxel-traced, extruded, refined as a mesh &mdash; and then
            SLA-printed in resin as an object.
          </p>
          <p>
            Embedded in the body of every object: clear acrylic{" "}
            <strong>ambient-light waveguides</strong>, grown along the
            trace lines of the original gesture. A small warm LED
            seated at the waveguide root carries light through the
            print, edge-lighting the geometry from inside. The gesture
            that was drawn in the dark glows again, from inside the
            body it drew.
          </p>
          <p>
            Three product lines: <strong>desktop waveguides</strong>
            (palm-scale, lit), <strong>sculptures</strong> (object-scale,
            lit or unlit), and <strong>wall arrays</strong>
            (configurable, commission).
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">IV · The studio</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Manchester, UK.
          </h2>
          <p>
            Holo-Flow Studio is based in Manchester. Dimona Dougherty
            &mdash; founder, technologist, twelve years into poi &mdash;
            runs the practice. The studio is a small one: one pair of
            hands, one workshop, small editions.
          </p>
          <p>
            Everything is made to order, in runs. Nothing is
            stockpiled. Editions close on sell-through and never
            reopen. Each object carries its provenance: a card inside
            the shipping box naming the kata, the location, the hour,
            the date. If a track of music mattered to the gesture,
            it&rsquo;s named too.
          </p>
        </section>

        <section className="mt-20">
          <div className="chrome-label mb-3">Contact</div>
          <p className="text-chrome-200">
            Studio: <a href="mailto:contact@holoflow.co.uk" className="text-pink-200 underline underline-offset-4">contact@holoflow.co.uk</a>
            <br />
            Instagram: <a href="https://instagram.com/holoflow.studio" className="text-pink-200 underline underline-offset-4" target="_blank" rel="noreferrer">@holoflow.studio</a>
          </p>
        </section>

        <div className="mt-20 flex gap-4">
          <Link
            href="/search"
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            See the catalogue
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}
