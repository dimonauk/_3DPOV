import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Practice — the history",
  description:
    "The development of Holo-Flow Studio's practice: from poi dancing through fire, to programmed LED tools, persistence-of-vision arrays, drone-mounted light, and the waveguide objects printed from the photographs.",
};

export default function PracticePage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A history of the practice</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          How light learned
          <br />
          to hold <span className="chrome-sheen">a shape.</span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          The tools changed. The question didn't. Each stage of the practice is
          a different answer to the same one: can a gesture last longer than the
          body that drew it?
        </p>

        <Stage roman="I" year="c. 2013" title="Poi.">
          <p>
            Poi is a movement discipline: two weights on two cords, drawn
            through planes by the body. It takes a long time to make fluent
            &mdash; years before the weights stop ruling you and you start
            ruling them. I came to it for the dance, not the photograph.
          </p>
          <p>
            The first few thousand hours were spent on the geometry itself.
            Cross-follow, antispin, weaves, arm combinations. Fire poi at the
            end of the first year. After that, the body knew what a planar
            gesture was. It just couldn't
            <em> keep </em> one.
          </p>
        </Stage>

        <Stage roman="II" year="c. 2015" title="Long exposure.">
          <p>
            Someone pointed a camera. A fifteen-second exposure of a fire kata
            &mdash; one single still of a minute&rsquo;s worth of spinning
            &mdash; and the thing the body had known became visible to everyone
            else. That was the hinge. Dance left a trace; the trace was worth
            keeping.
          </p>
          <p>
            For the next few years, <strong>traditional light painting</strong>{" "}
            was the main tool: fire, LED wands, handheld torches, staff.
            Organic, gestural. A record of the body in motion. Still the
            practice most of the landscape photographs are made with.
          </p>
        </Stage>

        <Stage roman="III" year="c. 2019" title="Pixel poi.">
          <p>
            The commercial LED pois began arriving &mdash; pixel poi,
            addressable strips on a chassis that would read an image file and
            replay it, column by column, as the poi swung. Suddenly a kata could
            carry a <em>picture</em>. You could swing a parrot; you could swing
            a word. Most of the scene used them as a party trick. A few of us
            started treating them as instruments.
          </p>
          <p>
            What I wanted was to get the image quality up and the drift down.
            Commercial pois are designed for performance durability, not for
            photographic sharpness. So I started building.
          </p>
        </Stage>

        <Stage roman="IV" year="c. 2021" title="POV LED arrays.">
          <p>
            A <strong>persistence-of-vision LED array</strong> is a display that
            doesn&rsquo;t look like a display until it moves. A strip of
            addressable LEDs, a microcontroller, a rotation or translation
            mechanism, a synchronisation signal. When it moves, it draws &mdash;
            one vertical slice of image per angular sample, a thousand times a
            second. The eye integrates. The camera integrates too.
          </p>
          <p>
            My own rigs are built around a Teensy microcontroller, a bank of
            TLC5927 LED drivers, and Hall-effect sensors for rotational sync.
            One-hundred updates per revolution, at revolution rates the arm can
            sustain, means the image lands with photographic precision. I
            program the frames ahead of time; the body walks a trajectory; the
            long exposure captures the 3D volume the rig swept through.
          </p>
          <p>
            That&rsquo;s the Holo-Flow signature: a photograph that is not of
            anything that ever stood still.
          </p>
        </Stage>

        <Stage roman="V" year="2025 &rarr;" title="Drones, modified.">
          <p>
            The next move is up. LED systems mounted on drones &mdash; the rig
            freed from the body, able to draw at altitude, over landscape,
            across architecture. Think: a ring of light held thirty metres above
            a moor at 04:30, tracing a kata too large for any performer.
          </p>
          <p>
            This stage is <em>in progress</em>. First test flights shortly.
            Early photographs when they&rsquo;re ready.
          </p>
        </Stage>

        <Stage roman="VI" year="2025 &rarr;" title="The objects.">
          <p>
            The photographs became the source for a new line: 3D-printed objects
            whose geometry is <em>derived</em> from the captured light. A
            gesture that was drawn in air becomes a sculpture cast in resin.
          </p>
          <p>
            Embedded in the body of every object: clear acrylic{" "}
            <strong>ambient-light waveguides</strong>, grown along the trace
            lines of the original gesture. A small LED seated at the waveguide
            root carries warm light through the print, edge-lighting the
            geometry from inside. The gesture that the body drew in the dark
            glows again from inside the object it made.
          </p>
          <p>
            Desktop pieces, wall arrays, and one-off sculptures &mdash; every
            one an object of the photograph it was grown from.
          </p>
        </Stage>

        <section className="mt-24">
          <div className="chrome-label mb-3">What it adds up to</div>
          <p className="prose-gallery text-chrome-200">
            Holo-Flow Studio is the apparatus for holding gestures. Poi trained
            the body. Long exposure trained the camera. Pixel-level programming
            trained the eye to what light can carry. The objects are what those
            trainings make possible together: a sculpture, in a room, lit from
            inside by the residue of a gesture performed on a specific date, in
            a specific place, at a specific hour, held long enough to leave a
            mark.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link
            href="/photographs"
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
            href="/about"
            className="self-center text-sm text-chrome-300 underline underline-offset-4 hover:text-pink-200"
          >
            About the studio
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}

function Stage({
  roman,
  year,
  title,
  children,
}: {
  roman: string;
  year: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 border-t border-warm-black-800 pt-10">
      <div className="chrome-label mb-2">
        {roman} &middot; {year}
      </div>
      <h2 className="text-3xl text-chrome-100">{title}</h2>
      <div className="prose-gallery mt-5 text-chrome-200">{children}</div>
    </section>
  );
}
