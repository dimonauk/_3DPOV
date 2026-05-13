import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Aerial — photography, cinematography, light painting from above",
  description:
    "Aerial cinematography and photography from Holo-Flow Studio, Salford. Five airframes, one FPV pipeline, CAA-registered. Editorial stills, follow-cam B-roll, 360° fly-throughs, and LED-modified airframes for aerial light painting.",
};

export default function AerialPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A working line</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The studio flies
          <br />
          <span className="chrome-sheen">its own line.</span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          A five-airframe fleet, one FPV pipeline, CAA-registered,
          Salford-based. Editorial stills, follow-cam B-roll, immersive
          360&deg; fly-throughs, and &mdash; first-flight this season
          &mdash; LED-modified airframes for aerial light painting.
        </p>
        <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
          What this is: a one-person aerial cinematography and
          photography line accepting commissions across the UK.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            I fly the fleet myself. Mavic 2 Pro for stills and editorial
            motion, Neo and Neo 2 for follow-cam and indoor proximity
            work, Avata 360 for cinewhoop FPV and 8K equirectangular,
            Mini 5 Pro as the sub-250g travel airframe. Five airframes,
            one operator, one CAA registration. The light-painting
            airframes are a parallel build &mdash; programmable LED
            arrays gorilla-glued and Vifly-mounted to the spines, flown
            on slow programmed paths after sundown. That side of the
            line is in first-flight testing and I&rsquo;m not pretending
            it&rsquo;s production-ready. The standard work is. Insurance
            and op-id are in the bag; I&rsquo;ll fly in the rain if
            the airframe rating permits and the brief is honest about
            the look that gives you.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Use this when&hellip;</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              You need an editorial aerial photograph or short motion
              piece, graded for print or web.
            </li>
            <li>
              You want a 360&deg; fly-through of a venue, procession,
              or interior &mdash; reframed in post.
            </li>
            <li>
              You want indoor or close-quarters follow-cam at a
              rehearsal, gig, or studio shoot.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">The fleet</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            Five airframes, one pipeline.
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
              <strong>DJI Mini 5 Pro</strong> &mdash; sub-250g travel
              airframe, 1&Prime; sensor. Carries Bluetooth-controllable
              LED bars for the unsynced-swarm aerial light-painting
              pieces.
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

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">FAQ</div>
          <dl className="mt-2 space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                Are you insured and CAA-registered?
              </dt>
              <dd className="mt-1">
                Yes. Operator ID and flyer ID in hand, public liability
                in force, A2 Certificate of Competency on file. Paperwork
                forwarded on request before the recce.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Can you fly indoors?
              </dt>
              <dd className="mt-1">
                Yes &mdash; the Neo and Neo 2 are sized for it, the
                Avata 360 in cinewhoop trim handles tighter interiors
                when the brief justifies the noise. CAA rules treat
                indoor flight as outside the open-category framework,
                so the constraint is the venue&rsquo;s, not mine.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Will you fly my wedding?
              </dt>
              <dd className="mt-1">
                Probably not. The studio&rsquo;s aerial line is
                editorial, architectural, and performance-led; the
                wedding-photography pipeline is its own discipline and
                I&rsquo;m not the right person for it. If you want a
                single editioned aerial portrait of the venue, that
                I&rsquo;ll do.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Booking and price</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Available now.
          </h2>
          <p className="mt-4 text-chrome-300">
            Bookable today via{" "}
            <Link
              href="/contact?intent=aerial"
              className="text-pink-200 underline underline-offset-4"
            >
              /contact?intent=aerial
            </Link>
            .{" "}
            <span data-pricing="proposed">
              Half-day shoots from &pound;450; full-day from &pound;750;
              editioned aerial light-painting prints from &pound;350/A2
            </span>{" "}
            once the technique opens for commission. Travel from Salford
            at HMRC mileage rates. Standard work is confirmed within a
            week; aerial light painting is open to brief but not yet
            guaranteed.
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

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/articles/the-fleet-four-airframes"
                className="text-pink-200 underline underline-offset-4"
              >
                The Fleet &mdash; Four Airframes
              </Link>{" "}
              &mdash; the original four, the architectural argument for
              each.
            </li>
            <li>
              <Link
                href="/stack"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack
              </Link>{" "}
              &mdash; every airframe, controller, and bridge by name.
            </li>
            <li>
              <Link
                href="/journal/first-light"
                className="text-pink-200 underline underline-offset-4"
              >
                First Light
              </Link>{" "}
              &mdash; the first LED-modified flight, recorded in the
              journal.
            </li>
            <li>
              <Link
                href="/contact?intent=aerial"
                className="text-pink-200 underline underline-offset-4"
              >
                /contact?intent=aerial
              </Link>{" "}
              &mdash; book the line.
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
