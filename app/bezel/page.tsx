import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Bezel — a controller-mounted POV LED ring for VR",
  description:
    "A small programmable LED ring that clips to a Quest 3 or Steam Frame controller and paints in the air, synchronised by angle. Interest list open from Holo-Flow Studio, Salford.",
};

export default function BezelPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A new line, interest list open</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A bezel that
          <br />
          <span className="chrome-sheen">
            remembers where it has been.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          Clip it to the Quest 3 controller or the Steam Frame
          controller. Swing your arm. The same persistence-of-vision
          logic the studio&rsquo;s photographic rigs use, miniaturised
          onto the thing already in your hand.
        </p>
        <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
          What this is: a small programmable LED ring that paints in
          the air outside the headset and inside it, synchronised by
          angle, not by clock.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            The studio rigs angular-sync against a Hall-effect sensor
            and a magnet on the chuck &mdash; the rig writes the next
            column when the rotation says to, not when the clock says
            to. The bezel applies the same architecture to a controller
            you already own. A ring of addressable LEDs around the
            tracking ring, a small Teensy-class microcontroller in the
            clip body, an IMU for the angle, a battery for the evening.
            On the camera side it&rsquo;s a long-exposure light-painting
            rig you can hold in one hand. On the headset side, the
            controller&rsquo;s cameras see the ring and feed the
            mirrored gesture into the WebXR scene &mdash; the same
            trace you painted outside the headset is the trace you see
            inside it. The mechanical work and the headset-SDK plumbing
            are the load-bearing parts I&rsquo;m still finishing.
            Pre-orders fund the controller-mount mechanical work and
            the headset-SDK plumbing that finish the build.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Use this when&hellip;</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              You want a single-handed POV LED rig for light-painting
              photography that doesn&rsquo;t require a dedicated poi
              practice to use.
            </li>
            <li>
              You&rsquo;re a WebXR developer who wants a physical input
              that paints the same gesture inside and outside the
              headset.
            </li>
            <li>
              You teach immersive media or movement and you want a
              demonstrable bridge from camera-side practice to
              headset-side practice.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">FAQ</div>
          <dl className="mt-2 space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                When does it ship?
              </dt>
              <dd className="mt-1">
                Honestly, I don&rsquo;t know yet. The interest list is
                what decides whether the first batch happens this year
                or next. The electronics side is settled &mdash; same
                Teensy + FastLED + Hall-effect line the studio rigs
                run; the controller-mount mechanical and the
                headset-SDK side are the parts still on the bench.
                Interest-list signups get the honest answer at the
                point I have one.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Does it work without a headset?
              </dt>
              <dd className="mt-1">
                Yes. The camera-side use case is a complete product:
                clip it to a controller you happen to own, hold the
                shutter open, paint. The headset-side mirrored gesture
                is the second pass; you don&rsquo;t need WebXR to make
                a photograph with the bezel.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Will it work on my (insert headset)?
              </dt>
              <dd className="mt-1">
                Quest 3 and Steam Frame at first batch. Both of those
                expose controller-mounted cameras that the headset can
                see, which is what the mirrored-gesture trick needs.
                Other headsets are a maybe and depend on whether their
                SDKs expose the same surface; I won&rsquo;t promise
                until I&rsquo;ve tested.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Interest list and price</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Interest list open.
          </h2>
          <p className="mt-4 text-chrome-300">
            First-batch pre-order target:{" "}
            <span data-pricing="proposed">
              &pound;249 per bezel (Quest 3 or Steam Frame), &pound;449
              for a matched pair
            </span>
            , both inclusive of UK shipping and a small spares pack. No
            money taken on signup; the interest list decides batch
            size, batch decides ship date. Signup via{" "}
            <Link
              href="/contact?intent=bezel"
              className="text-pink-200 underline underline-offset-4"
            >
              /contact?intent=bezel
            </Link>
            .
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/contact?intent=bezel"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Join the interest list &rarr;
            </Link>
          </div>
        </section>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/articles/vr-pov-controllers-the-product"
                className="text-pink-200 underline underline-offset-4"
              >
                VR POV controllers &mdash; the product
              </Link>{" "}
              &mdash; the long-form argument for the bezel as a line
              the studio takes seriously.
            </li>
            <li>
              <Link
                href="/articles/sellotape-and-tilt-brush"
                className="text-pink-200 underline underline-offset-4"
              >
                Sellotape and Tilt Brush
              </Link>{" "}
              &mdash; the origin story of the controller-mounted LED
              idea.
            </li>
            <li>
              <Link
                href="/articles/why-i-build-my-own-rigs"
                className="text-pink-200 underline underline-offset-4"
              >
                Why I build my own rigs
              </Link>{" "}
              &mdash; the architectural argument for angular sync over
              clock sync.
            </li>
            <li>
              <Link
                href="/stack"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack
              </Link>{" "}
              &mdash; Teensy, FastLED, Hall-effect, Quest 3, Steam
              Frame, WebXR, all named.
            </li>
            <li>
              <Link
                href="/services"
                className="text-pink-200 underline underline-offset-4"
              >
                Services
              </Link>{" "}
              &mdash; see the full commercial surface, every service in
              one place.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
