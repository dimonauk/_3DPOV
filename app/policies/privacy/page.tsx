import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy — Holo-Flow Studio",
  description:
    "What holoflow.co.uk collects, the named processors that touch it, and the rights a visitor holds under UK GDPR. Effective 14 May 2026.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          Policies &middot; Privacy
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Privacy.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio collects as little as the site needs to function,
          names every third party that touches the data, and keeps the
          retention defaults short. The text below is the operating
          record &mdash; not a marketing position.
        </p>

        <section className="mt-12 prose-gallery text-chrome-200">
          <p className="text-sm text-chrome-400">
            Effective 14 May 2026. Operator: Dimona Dougherty trading as
            Holo-Flow Studio, Salford, Greater Manchester, United
            Kingdom.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            What the site collects
          </h2>
          <p>
            Three categories, and nothing else by default.
          </p>
          <ul>
            <li>
              <strong>Account identity (Rookery only).</strong> When a
              visitor signs in to the Rookery community, the studio
              receives the identity record issued by Firebase
              Authentication &mdash; typically an email address, a
              display name, and the provider identifier. The studio does
              not see the visitor&rsquo;s password; that stays inside
              Firebase.
            </li>
            <li>
              <strong>Commerce details (catalogue purchases).</strong>{" "}
              When a visitor buys an editioned print, a digital
              download, or a bureau print, the order is processed by
              Shopify on Shopify-hosted infrastructure. Shopify
              collects the name, billing address, shipping address, and
              payment details required to fulfil the order; the studio
              receives the order record minus the payment instrument.
            </li>
            <li>
              <strong>Anonymous site analytics.</strong> Where Plausible
              Analytics is configured, the site records cookie-less
              page views with no personal identifier attached. There is
              no cross-site tracking, no advertising profile, and no
              fingerprinting.
            </li>
          </ul>
          <p>
            The site does not run third-party advertising scripts, does
            not embed third-party social pixels, and does not sell or
            share visitor data with brokers.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Cookies and local storage
          </h2>
          <p>
            Holoflow.co.uk uses browser local storage for preferences
            that belong to the visitor&rsquo;s own device &mdash; brush
            choice on the visualiser, last-played level on the play
            pages (the <code>holoflow.play.*</code> keys), the cart
            handle, and the chosen colour mode. These values stay on
            the visitor&rsquo;s machine; the site does not transmit
            them.
          </p>
          <p>
            Cookies are limited to two functions: the Shopify cart
            session during a checkout flow, and the Firebase
            authentication session for signed-in Rookery visitors.
            Analytics is cookie-less.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Newsletter and contact form
          </h2>
          <p>
            The newsletter and the contact form route to addresses the
            studio reads directly. Messages sit in the studio&rsquo;s
            email; they are not handed to a sales platform, an outreach
            tool, or a contact-enrichment service. The newsletter list
            is used to send dispatches from the studio &mdash; the
            studio writing about the studio&rsquo;s own work &mdash;
            and nothing else. Unsubscribing removes the address from
            the list.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Named third-party processors
          </h2>
          <p>
            The following processors hold visitor data on the
            studio&rsquo;s behalf. Each link goes to the
            processor&rsquo;s own privacy statement.
          </p>
          <ul>
            <li>
              <strong>Firebase Authentication</strong> (Google Ireland
              Limited) &mdash; identity for the Rookery community.
            </li>
            <li>
              <strong>Shopify</strong> (Shopify International Limited)
              &mdash; the storefront, the cart, and the order pipeline
              for catalogue purchases.
            </li>
            <li>
              <strong>Vercel</strong> (Vercel Inc.) &mdash; hosting and
              edge delivery for holoflow.co.uk; processes request logs
              for service operation.
            </li>
            <li>
              <strong>Plausible Analytics</strong> (Plausible Insights
              OÜ) &mdash; cookie-less page-view counts where
              configured.
            </li>
          </ul>
          <p>
            International transfers, where they happen, ride the
            processors&rsquo; own UK and EU adequacy mechanisms. The
            studio adds no further routes.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Retention defaults
          </h2>
          <ul>
            <li>
              Rookery account records are kept for as long as the
              account is active. A closure request deletes the
              identity record from Firebase within thirty days.
            </li>
            <li>
              Order records are retained for seven years &mdash; the
              UK statutory requirement for VAT and accounting
              evidence.
            </li>
            <li>
              Newsletter addresses are kept until the visitor
              unsubscribes; unsubscribing removes the address within
              seven days.
            </li>
            <li>
              Contact-form messages are retained for as long as the
              correspondence is alive, then archived or deleted. The
              studio doesn&rsquo;t keep a permanent index of past
              enquiries.
            </li>
            <li>
              Server logs (Vercel) follow the platform&rsquo;s own
              short-window defaults and are not held by the studio
              separately.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl text-chrome-100">
            A note on AI training data
          </h2>
          <p>
            The studio&rsquo;s own published work &mdash; the
            photographs, the writing, the videos &mdash; is not
            licensed for inclusion in machine-learning training
            datasets without explicit consent. The studio&rsquo;s
            full position on training data is a separate document;
            this policy notes the position because it is also a data
            position. Visitor data is never offered to training
            datasets under any circumstance.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Rights under UK GDPR
          </h2>
          <p>
            A visitor whose data the studio holds has the right to:
          </p>
          <ul>
            <li>
              <strong>Access</strong> &mdash; ask for a copy of what
              the studio holds.
            </li>
            <li>
              <strong>Correction</strong> &mdash; ask the studio to
              fix anything inaccurate.
            </li>
            <li>
              <strong>Deletion</strong> &mdash; ask the studio to
              remove the record, subject to the retention obligations
              named above (orders held for seven years can be
              anonymised but not erased).
            </li>
            <li>
              <strong>Portability</strong> &mdash; receive the record
              in a structured, machine-readable form.
            </li>
            <li>
              <strong>Objection</strong> &mdash; object to a specific
              use of the data.
            </li>
          </ul>
          <p>
            Requests go to{" "}
            <a
              href="mailto:contact@holoflow.co.uk"
              className="text-pink-200 underline underline-offset-4"
            >
              contact@holoflow.co.uk
            </a>
            . The studio replies within thirty days; usually sooner.
          </p>
          <p>
            A visitor who is dissatisfied with the studio&rsquo;s
            handling of a request may complain to the United Kingdom
            Information Commissioner&rsquo;s Office at{" "}
            <a
              href="https://ico.org.uk/"
              className="text-pink-200 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            .
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Changes to this policy
          </h2>
          <p>
            Material changes are dated at the top of the page and
            announced in the studio&rsquo;s newsletter. Earlier
            versions are kept in the site&rsquo;s git history; a
            specific prior version is available on request.
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
              href="/policies/terms"
              className="text-pink-200 underline underline-offset-4"
            >
              terms
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
