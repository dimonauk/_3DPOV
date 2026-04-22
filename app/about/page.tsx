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
          <div className="chrome-label mb-3">II · The method</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Capture. Processing. Casting. Finishing.
          </h2>
          <p>
            <strong>Capture.</strong> A rotating LED rig recorded against a
            long exposure. The rig is a persistence-of-vision display of my
            own design &mdash; 96 addressable LEDs on a spinning bar, timed
            by a Teensy microcontroller against a Hall-effect reference.
            The result isn't a photograph of a body; it's a photograph of a
            gesture's volume.
          </p>
          <p>
            <strong>Processing.</strong> The capture becomes a point cloud.
            The point cloud becomes a mesh. The mesh is refined in Blender
            until the geometry holds without losing the gesture's hand.
          </p>
          <p>
            <strong>Casting.</strong> For waveguides: laminated acrylic
            internals, cast into a tinted resin body. For sculptures:
            SLA-printed, hand-finished, cold-cast in bronze-resin or
            polished to a graphite sheen. Every piece is numbered on the
            underside.
          </p>
          <p>
            <strong>Finishing.</strong> Each object ships with a card
            documenting the performance that made it &mdash; where, what
            hour, what date. The field record is part of the work.
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">III · The studio</div>
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
            Everything is made to order, in runs. We don't stockpile.
            Editions close on sell-through and never reopen.
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">IV · The objects</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Editioned. Signed. Field-recorded.
          </h2>
          <p>
            Three object lines: <strong>desktop waveguides</strong>
            (small, lit), <strong>sculptures</strong> (object-scale,
            unlit), <strong>wall arrays</strong> (configurable,
            commission). Every piece is part of an edition whose size is
            declared on the catalogue page.
          </p>
          <p>
            Each object carries its provenance: a card inside the shipping
            box naming the kata, the location, the hour, the date. If a
            track of music matters to the gesture, it's named too.
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
