import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Aerial — photography, cinematography, light painting from above",
  description:
    "Aerial cinematography and photography from Holo-Flow Studio, Salford. DJI Mavic 2 Pro, Neo, Neo 2, and Avata 360 — flown FPV, with LED-modified airframes for aerial light painting.",
};

export default function AerialPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A working line</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Aerial.
          <br />
          <span className="chrome-sheen">
            Photography, cinematography, light painting from above.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          Four airframes, one FPV pipeline, available for commission.
          Aerial stills, motion, FPV cinewhoop fly-throughs, 360&deg;
          immersive capture, and &mdash; new this season &mdash;
          aerial light painting flown with LED-modified airframes. The
          fleet is up; the technique is settling.
        </p>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">The fleet</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            Four airframes, one pipeline.
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <strong>DJI Mavic 2 Pro</strong> &mdash; Hasselblad L1D-20c,
              1&Prime; sensor, adjustable aperture. The photography
              platform: stills and motion at editorial quality.
            </li>
            <li>
              <strong>DJI Neo &amp; Neo 2</strong> &mdash; lightweight
              follow-cam and proximity work; useful indoors and around
              people.
            </li>
            <li>
              <strong>DJI Avata 360</strong> &mdash; FPV cinewhoop with an
              integrated 8K 360&deg; camera (twin 64MP 1/1.1&Prime;
              sensors, 200&deg; lenses). Single-lens mode for traditional
              FPV at 4K, dual-lens for full omnidirectional capture.
            </li>
            <li>
              <strong>LED-modified airframes</strong> &mdash; programmable
              persistence-of-vision LED arrays mounted to drone bodies,
              for aerial light painting kata. Currently in first-flight
              testing.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Flown FPV, properly</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            The control pipeline.
          </h2>
          <p>
            DJI Goggles + RC 2 controller, head-tracked through an InAir
            pod, with the live feed mirrored to Xreal One Pro AR glasses.
            The result: simultaneous gimbal control, AR-overlaid
            telemetry, and external situational awareness without losing
            line of sight to the airframe. Real flights, not
            hover-and-shoot.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">What it&rsquo;s good for</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            What the studio takes on.
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <strong>Editorial / portraiture aerial.</strong> Mavic 2 Pro,
              single-shot or short series, framed and graded for print.
            </li>
            <li>
              <strong>FPV cinewhoop fly-throughs.</strong> Avata 360 in
              360 mode for venue interiors, processions, gigs &mdash;
              shot once, reframed in post.
            </li>
            <li>
              <strong>Aerial light painting commissions.</strong>
              LED-modified airframes performing programmed light kata
              over your site at night. Output is a print or an editioned
              photograph.
            </li>
            <li>
              <strong>360&deg; immersive capture.</strong> Avata 360 for
              VR and virtual-tour applications.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">How it works</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            Brief, fly, deliver.
          </h2>
          <ol className="mt-2 list-decimal pl-5 space-y-3 text-chrome-300">
            <li>
              <strong>Brief via the contact form.</strong> Location,
              intent, deliverables, dates. Pick &ldquo;Aerial / drone
              work&rdquo; from the form&rsquo;s intent dropdown.
            </li>
            <li>
              <strong>Quote and recce.</strong> The studio replies with a
              quote, a recommended airframe for the job, and a proposed
              shoot window. Sometimes a recce visit; sometimes just a
              satellite read.
            </li>
            <li>
              <strong>Fly.</strong> Salford base, willing to travel. All
              flights operated to UK CAA rules and local site conditions.
              Insurance and op-id available on request.
            </li>
            <li>
              <strong>Deliver.</strong> Graded stills as TIFF/JPEG, edited
              motion as ProRes/H.265, 360&deg; clips as equirectangular.
              Or, for light-painting commissions, a signed editioned
              print.
            </li>
          </ol>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Booking</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Available now.
          </h2>
          <p className="mt-4 text-chrome-300">
            Standard aerial work is bookable today; aerial light painting
            is in first-flight testing this season and will open to
            commissions once the technique is consistent. Either way,
            write in.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/contact?intent=aerial"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Brief the studio &rarr;
            </Link>
          </div>
        </section>

        <p className="mt-10 text-sm text-chrome-400">
          The first LED-modified flight is recorded in the journal:{" "}
          <Link
            href="/journal/first-light"
            className="text-pink-200 underline underline-offset-4"
          >
            First Light
          </Link>
          .
        </p>
      </article>
      <Footer />
    </>
  );
}
