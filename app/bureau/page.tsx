import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Print bureau — A2 archival editions on a Canon imagePROGRAF PRO-1100",
  description:
    "A small, calibrated, signed-edition fine-art print bureau in Salford. A2 archival editions on a Canon imagePROGRAF PRO-1100, calibrated against the studio's standard viewing light.",
};

export default function BureauPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A secondary line</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The Canon
          <br />
          imagePROGRAF
          <br />
          <span className="chrome-sheen">PRO-1100 is the bench.</span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          A2 archival editions of the studio&rsquo;s long-exposure
          light-painting photographs, signed, numbered, typically
          editions of twenty-five. Currently running on the Canon
          line &mdash; Pro Platinum, Pro Lustre, super-glossy and
          metallic, the surfaces that hold gloss and D-max for the
          deep-black light-trail work. When the calendar allows, the
          bureau prints other photographers&rsquo; work to the same
          standard.
        </p>
        <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
          What this is: a small, calibrated, signed-edition print
          bureau operating out of Salford.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            The PRO-1100 is a twelve-ink pigment printer; three of those
            inks are dilutions of black, which is why the monochrome
            work holds up. I calibrated it against the studio&rsquo;s
            standard viewing light following the discipline that Keith
            Cooper at{" "}
            <a
              href="https://www.northlight-images.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-200 underline underline-offset-4"
            >
              Northlight Images
            </a>{" "}
            documents publicly &mdash; the credit goes there, not to
            me. I read the writeups, I worked the procedure, the
            calibration holds. The studio&rsquo;s own editions are the
            primary use of the machine; external commissions are
            calendar-gated and I will say no to a brief that
            won&rsquo;t fit the queue rather than do it badly. I
            don&rsquo;t print on a paper I haven&rsquo;t personally
            profiled and pulled a test from, and I will not run a
            production batch on the back of an uncorrected proof.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Use this when&hellip;</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              You want an archival A2 print of a long-exposure or fine-
              art photograph, with the colour matched under reference
              light before the run.
            </li>
            <li>
              You&rsquo;re a photographer with a signed-edition project
              and you need a bureau small enough to actually see your
              file.
            </li>
            <li>
              You want a one-off test print to settle a paper-choice
              argument with yourself before you commit to an edition.
            </li>
          </ul>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">The machine</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            Canon imagePROGRAF PRO-1100
          </h2>
          <p>
            Twelve-ink pigment system. Monochrome range managed by three
            separate dilutions of black; colour gamut calibrated against
            the studio&rsquo;s standard viewing light. Maximum print
            width A2+ (17&Prime;). Borderless optional.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Papers in current rotation</div>
          <ul className="mt-2 list-disc pl-5 text-chrome-300">
            <li>
              Canon Photo Paper Pro Platinum (PT-101) &mdash; Canon&rsquo;s
              flagship gloss; the highest D-max in the line. The right
              surface when the brief is high-saturation light-trail
              work and the photograph leans into its own gloss.
            </li>
            <li>
              Canon Photo Paper Pro Lustre (LU-101) &mdash; pearl-finish
              satin. For figurative pieces where the highlight needs to
              feel like cloth instead of metal; handles gallery glare
              more gracefully than the Platinum.
            </li>
            <li>
              Super-glossy premium photo paper &mdash; cabinet stock for
              the prints where the trail has to read as wet light.
            </li>
            <li>
              Metallic photo paper (Canon-compatible) &mdash; pearlescent
              underlayer behind the print surface. The trail reads as
              glowing through chrome. A specific aesthetic for known
              gallery lighting, not a default.
            </li>
          </ul>
          <p className="mt-4 text-chrome-400 text-sm">
            The full reasoning for this paper line &mdash; and the
            archival-baryta upgrade path the bureau is moving toward
            after the studio move &mdash; is documented in{" "}
            <Link
              href="/articles/the-right-paper-for-a-light-painting"
              className="text-pink-200 underline underline-offset-4"
            >
              The Right Paper for a Light Painting
            </Link>
            .
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">How it works</div>
          <ol className="mt-2 list-decimal pl-5 space-y-3 text-chrome-300">
            <li>
              Send your file and notes via the contact form &mdash;
              select &ldquo;Print bureau&rdquo; from the subject
              dropdown. 300 DPI TIFF or high-quality JPEG / PSD, sRGB or
              AdobeRGB, no sharpening baked in.
            </li>
            <li>
              The studio will reply with a quote, a recommended paper,
              and an expected lead time. Typically within a day.
            </li>
            <li>
              On approval, a test print is made, photographed under
              reference light, and sent to you for sign-off before the
              final run.
            </li>
            <li>
              Final prints are rolled in archival tubes (or crated flat,
              by arrangement), shipped insured, anywhere.
            </li>
          </ol>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">FAQ</div>
          <dl className="mt-2 space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                Why gloss and not matte?
              </dt>
              <dd className="mt-1">
                The long-exposure work lives or dies on shadow
                separation and saturated-trail rendering. Gloss and
                pearl papers hold detail down into the deep blacks
                where matte papers start to flatten, and they render
                the trail&rsquo;s colour at the saturation the LED
                actually produced. The paper is a decision made per
                image &mdash; Pro Platinum for the saturated work,
                Lustre when the highlight needs to feel like cloth,
                metallic when the brief asks for the trail to read as
                wet light through chrome. The reasoning is documented
                in{" "}
                <Link
                  href="/articles/the-right-paper-for-a-light-painting"
                  className="text-pink-200 underline underline-offset-4"
                >
                  The Right Paper for a Light Painting
                </Link>
                .
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Will you print my photograph if I&rsquo;m not in the
                studio&rsquo;s edition list?
              </dt>
              <dd className="mt-1">
                Yes, when the calendar allows. The studio&rsquo;s own
                editions are the primary use of the bench; external
                commissions slot around them. The honest answer to
                &ldquo;how soon?&rdquo; is the lead time I quote in the
                reply email, and I will not promise faster than I can
                deliver under the proof-then-run discipline.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                Can you supply a custom ICC profile for my paper?
              </dt>
              <dd className="mt-1">
                If the paper is one of the three in stock, the bureau&rsquo;s
                profiles ship with the test print. For a paper the
                studio hasn&rsquo;t printed on before, factor in a small
                profiling fee and a few extra days to pull the target
                and measure it. The Northlight-Images write-ups are
                where I&rsquo;d send you to understand what that step
                actually involves.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Booking and price</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Open by brief.
          </h2>
          <p className="mt-4 text-chrome-300">
            Bookable via{" "}
            <Link
              href="/contact?intent=print"
              className="text-pink-200 underline underline-offset-4"
            >
              /contact?intent=print
            </Link>
            .{" "}
            <span data-pricing="proposed">
              A2 archival editions from &pound;180 per print on Canon
              Pro Platinum; A3 from &pound;110. Editioned signed prints
              (edition of twenty-five) from &pound;350/A2. Test prints
              &pound;45.
            </span>{" "}
            External commissions are calendar-gated; lead time quoted
            in the reply email.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/contact?intent=print"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Send a file &rarr;
            </Link>
          </div>
        </section>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/photographs"
                className="text-pink-200 underline underline-offset-4"
              >
                Photographs
              </Link>{" "}
              &mdash; the studio&rsquo;s editioned prints in the
              catalogue.
            </li>
            <li>
              <Link
                href="/tutorials/calibrating-the-imageprograf-pro-1100"
                className="text-pink-200 underline underline-offset-4"
              >
                Calibrating the imagePROGRAF PRO-1100
              </Link>{" "}
              &mdash; the procedure the bureau runs, written up.
            </li>
            <li>
              <Link
                href="/stack"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack
              </Link>{" "}
              &mdash; printer, papers, software by name.
            </li>
            <li>
              <Link
                href="/contact?intent=print"
                className="text-pink-200 underline underline-offset-4"
              >
                /contact?intent=print
              </Link>{" "}
              &mdash; send a file.
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
