import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "The practice, the method, the studio — Holo-Flow Studio, Salford. Twelve years of poi, condensed into editioned objects.",
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
            Poi is a movement discipline. Two weights on two cords, held
            in the hands, drawn through the air by the body. The
            geometry is ancient &mdash; Māori in origin &mdash; and it
            takes years to become fluent in. I came to it for the dance.
            That was twelve years ago.
          </p>
          <p>
            The thing you realise, eventually, is that a gesture
            sustained long enough stops being a gesture and starts
            being an object. Long-exposure photography proved it for
            the rest of us: the trails hold.
          </p>
          <p>
            Holo-Flow Studio is what happens when those trails are
            pulled out of the photograph and cast into something you
            can put on a shelf.
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">II · The methods</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Three ways to paint light, one way to hold it.
          </h2>
          <p>
            The photographs come from three light-painting practices
            that the studio runs in parallel. Each makes a different
            kind of picture.
          </p>
          <p>
            <strong>Traditional light painting.</strong> Torches, LED
            wands, fire poi, staff. Organic, gestural, human-scale.
            Right for landscape pieces and for any image where the body
            being there is part of the subject.
          </p>
          <p>
            <strong>Persistence-of-vision LED arrays.</strong>{" "}
            Addressable LEDs on a moving chassis: programmed frame by
            frame, synced against a rotation sensor, able to render
            arbitrary image data <em>as light, in physical space.</em>
            The rigs are built in-studio around a Teensy microcontroller
            and TLC5927 drivers. The frames are written in software
            before the performance; the body walks the spatial
            trajectory; the camera captures the volume the rig
            sweeps through. What the photograph holds is not the body.
            The body was a blur. The photograph holds the image data,
            in its briefly-real physical form.
          </p>
          <p>
            <strong>Drone-mounted LED systems.</strong> The studio&rsquo;s
            drone fleet (Mavic 2 Pro, Neo, Neo 2, Avata 360) is in service
            for aerial photography today, flown FPV through DJI Goggles,
            an RC 2 controller, an InAir head-tracking pod, and Xreal One
            Pro AR glasses. The airframes have now been modified with
            programmable LED arrays for aerial light painting &mdash;
            rings at altitude, traces over landscape, arcs across
            architecture, geometries too large for any body. The platform
            is flying. First test captures recording this season.
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
            The photographs are finished work, editioned and printed.
            They are also source material. Each capture can be
            translated into 3D geometry &mdash; voxel-traced, surfaced,
            cleaned up &mdash; then SLA-printed in resin as an object.
          </p>
          <p>
            Inside the body of every object: clear acrylic{" "}
            <strong>ambient-light waveguides</strong>, grown along the
            trace lines of the original gesture. A small warm LED at
            the waveguide root carries light through the print,
            edge-lighting the geometry from inside. The gesture that
            was drawn in the dark glows again, from inside the body it
            drew. There&rsquo;s no metaphor in that sentence; it is
            literally what happens.
          </p>
          <p>
            Three product lines: <strong>desktop waveguides</strong>{" "}
            (palm-scale, lit), <strong>sculptures</strong>{" "}
            (object-scale, lit or unlit), and{" "}
            <strong>wall arrays</strong> (configurable, on commission).
          </p>
        </section>

        <section className="mt-20 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">IV · The studio</div>
          <h2 className="mb-6 text-3xl text-chrome-100">
            Salford, Greater Manchester.
          </h2>
          <p>
            Holo-Flow Studio sits in Salford, in Greater Manchester.
            Dimona Dougherty runs the practice as a Manchester&ndash;
            London-based freelance consultant artist. One pair of
            hands, one workshop, small editions, and an unreasonable
            amount of patience.
          </p>
          <p>
            Everything is made to order, in runs. Nothing is
            stockpiled; nothing is lying around waiting to be sold.
            Editions close on sell-through and never reopen. Each
            object ships with its provenance &mdash; a card inside the
            shipping box naming the kata, the location, the hour, the
            date, and the music if music mattered to the gesture. Yes,
            we name the track. It mattered at the time.
          </p>
          <p>
            Field records and longer pieces live in the{" "}
            <Link
              href="/journal"
              className="text-pink-200 underline underline-offset-4"
            >
              journal
            </Link>
            , the{" "}
            <Link
              href="/articles"
              className="text-pink-200 underline underline-offset-4"
            >
              articles
            </Link>
            , and the{" "}
            <Link
              href="/tutorials"
              className="text-pink-200 underline underline-offset-4"
            >
              tutorials
            </Link>
            . The studio&rsquo;s position is that everything visible
            here is learnable; the writing is the ladder up.
          </p>
        </section>

        <section className="mt-20">
          <div className="chrome-label mb-3">Contact</div>
          <p className="text-chrome-200">
            Studio: <a href="mailto:contact@holoflow.co.uk" className="text-pink-200 underline underline-offset-4">contact@holoflow.co.uk</a>
            <br />
            Instagram: <a href="https://instagram.com/holoflow.studio" className="text-pink-200 underline underline-offset-4" target="_blank" rel="noopener noreferrer">@holoflow.studio</a>
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
