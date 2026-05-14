import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Terms of service — Holo-Flow Studio",
  description:
    "The terms under which Holo-Flow Studio offers photography, video, commissions, prints, tutorials, and the Rookery. Includes the single-exposure stance and the editioning conventions. Effective 14 May 2026.",
};

export default function TermsPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          Policies &middot; Terms of service
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Terms.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio&rsquo;s terms of service. The intent is honest
          plumbing rather than boilerplate &mdash; the offerings are
          named, the ethical positions that govern them are stated,
          and the jurisdiction is identified.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <p className="text-sm text-chrome-400">
            Effective 14 May 2026. Operator: Dimona Dougherty trading as
            Holo-Flow Studio, Salford, Greater Manchester, United
            Kingdom.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            What the studio offers
          </h2>
          <p>
            Holo-Flow Studio is a one-person practice. The commercial
            surface, in full, is:
          </p>
          <ul>
            <li>
              <strong>Editioned photographs</strong> &mdash;
              fine-art light-painting and aerial prints, sold under
              the editioning conventions named below.
            </li>
            <li>
              <strong>Video and aerial commissions</strong> &mdash;
              commissioned moving image, drone work, and field
              capture, quoted per brief.
            </li>
            <li>
              <strong>Light-painting and sculpture commissions</strong>{" "}
              &mdash; bespoke pieces grown from a recorded gesture
              and routed to the bureau for fabrication.
            </li>
            <li>
              <strong>3D-print commerce</strong> &mdash; the print
              bar that runs under every viewport on the site,
              operated under the separate{" "}
              <Link
                href="/policies/print-bureau-terms"
                className="text-pink-200 underline underline-offset-4"
              >
                print-bureau &amp; commission terms
              </Link>
              .
            </li>
            <li>
              <strong>Tutorials and workshops</strong> &mdash; the
              written tutorials on the site, and the workshops the
              studio runs from Salford.
            </li>
            <li>
              <strong>The Rookery</strong> &mdash; the
              studio&rsquo;s subscription community, with its own
              tier and conduct documentation.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Photographs are single-exposure
          </h2>
          <p>
            Every photograph the studio publishes or sells is a
            single-exposure capture. The light trails were physically
            in front of the lens; the body was there; the shutter was
            held open once. The studio does not composite multiple
            frames into a single image, does not stack exposures into
            a synthetic long-exposure, and does not generate
            photographic content from text prompts.
          </p>
          <p>
            This is an ethical commitment, not just a technical
            preference. The studio&rsquo;s argument for the value of
            its light work is that the trail was actually there in
            the world, held by an actual body, recorded once. A
            composite would invalidate that argument. The
            commitment applies to every editioned print, every
            tear-sheet, and every commissioned image.
          </p>
          <p>
            Aerial photographs follow the same rule. Panoramic
            stitches across adjacent frames of the same scene are
            disclosed as stitches; they are not represented as
            single frames.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Editioning conventions
          </h2>
          <p>
            Editioned photographs follow fine-art conventions. The
            full account of how edition sizes are chosen, how
            artist&rsquo;s proofs are tracked, and how each print
            is documented lives in the codex entry on{" "}
            <Link
              href="/codex/edition-size-conventions"
              className="text-pink-200 underline underline-offset-4"
            >
              edition size conventions
            </Link>
            . The headline points:
          </p>
          <ul>
            <li>
              Edition sizes are stated on the listing and are not
              quietly enlarged afterwards. A sold-out edition is
              sold out.
            </li>
            <li>
              Two artist&rsquo;s proofs are retained outside the
              numbered edition, marked AP 1/2 and AP 2/2.
            </li>
            <li>
              Every numbered print ships with a signed and dated
              certificate of authenticity (C2PA-signed from 2026
              forward).
            </li>
            <li>
              Open editions and unlimited digital downloads are
              flagged as such on the listing; they are not sold as
              editioned work.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Print bureau and commission terms
          </h2>
          <p>
            Drop-ship printing, bureau-routed sculpture, and bespoke
            commissions are governed by their own document:{" "}
            <Link
              href="/policies/print-bureau-terms"
              className="text-pink-200 underline underline-offset-4"
            >
              print-bureau &amp; commission terms
            </Link>
            . That document names the materials, the scales, the
            quote-validity window, the turnaround estimates, the
            shipping defaults, and the briefs the studio will not
            accept.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Intellectual property
          </h2>
          <p>
            The studio retains copyright in everything it makes
            &mdash; photographs, videos, sculpture, 3D models,
            tutorial text, codex entries, code that ships with the
            work. Where the studio releases a piece under a Creative
            Commons licence (typically CC BY-NC-SA 4.0), the licence
            is named on the page; the absence of a stated licence
            means default copyright applies.
          </p>
          <p>
            A purchase of an editioned print, a digital download, or
            a fabricated piece transfers ownership of the physical
            or digital file delivered. It does not transfer
            reproduction rights. Reproduction, broadcast, and
            commercial use rights are licensed separately and named
            in writing before the licence takes effect.
          </p>
          <p>
            Commissioned work follows the same default. The
            commissioning party owns the deliverable and the agreed
            use-rights named in the commission contract; the studio
            retains the underlying copyright unless a buy-out is
            agreed and priced.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Acceptable use of the Rookery
          </h2>
          <p>
            The Rookery is a small subscription community. Use of it
            is governed by the conduct document on the Rookery
            pages; in short: argue with the work, not the person;
            do not harass other members; do not post the
            studio&rsquo;s in-progress files outside the forum
            without permission; do not use the space to sell
            unrelated services. The studio reserves the right to
            suspend or remove accounts that breach the conduct
            terms, and to issue a pro-rata refund of the unused
            portion of the subscription.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Returns and refunds
          </h2>
          <p>
            Editioned prints and bespoke fabricated work are
            returnable if they arrive damaged or if the studio
            ships the wrong piece &mdash; in those cases the studio
            either re-prints, replaces, or refunds, at the
            buyer&rsquo;s choice. Editioned prints are not
            returnable for change of mind, in line with standard
            fine-art-market practice. Digital downloads are
            non-refundable once delivered. The print bureau&rsquo;s
            own cancellation and refund terms apply separately and
            are named in the bureau policy.
          </p>
          <p>
            Statutory consumer rights under the United Kingdom
            Consumer Rights Act 2015 are unaffected and override
            anything written here that would otherwise reduce them.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Limitation of liability
          </h2>
          <p>
            The studio takes care over what it publishes and what
            it ships. Where something nonetheless goes wrong, the
            studio&rsquo;s liability for any single piece of work
            is limited to the price the buyer paid for that piece,
            plus the cost of returning it. The studio is not liable
            for consequential or indirect loss &mdash; lost
            commissions, missed opportunities, decorative
            disappointment &mdash; arising from the use of any
            material on the site or any piece sold through it.
          </p>
          <p>
            Nothing in this clause excludes liability for death or
            personal injury caused by the studio&rsquo;s
            negligence, for fraud, or for any liability that
            English law does not permit to be excluded.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Jurisdiction and governing law
          </h2>
          <p>
            These terms are governed by the laws of England and
            Wales. The courts of England and Wales have exclusive
            jurisdiction over any dispute arising from them, save
            that consumers resident elsewhere in the United Kingdom
            retain the right to bring proceedings in the courts of
            their own jurisdiction.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Changes to these terms
          </h2>
          <p>
            Material changes are dated at the top of the page.
            Earlier versions are kept in the site&rsquo;s git
            history and are available on request.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">Contact</h2>
          <p>
            Holo-Flow Studio &mdash; Salford, Greater Manchester,
            United Kingdom &mdash;{" "}
            <a
              href="mailto:contact@holoflow.co.uk"
              className="text-pink-200 underline underline-offset-4"
            >
              contact@holoflow.co.uk
            </a>
            .
          </p>

          <p className="mt-12 text-sm text-chrome-400">
            Filed 14 May 2026. Holo-Flow Studio. See also{" "}
            <Link
              href="/policies/privacy"
              className="text-pink-200 underline underline-offset-4"
            >
              privacy
            </Link>{" "}
            and{" "}
            <Link
              href="/policies/print-bureau-terms"
              className="text-pink-200 underline underline-offset-4"
            >
              print-bureau &amp; commission terms
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
