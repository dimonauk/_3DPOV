import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Policies — Holo-Flow Studio",
  description:
    "The studio's published policies. Privacy, terms, and the print-bureau & commission terms, named in catalogue mode and dated.",
};

type PolicyLink = {
  slug: string;
  title: string;
  summary: string;
};

const policies: PolicyLink[] = [
  {
    slug: "privacy",
    title: "Privacy",
    summary:
      "What the site collects, the named processors that touch it, and the rights a visitor holds under UK GDPR.",
  },
  {
    slug: "terms",
    title: "Terms of service",
    summary:
      "The terms under which the studio offers photography, video, commissions, prints, tutorials, and the Rookery — including the single-exposure stance and the editioning conventions.",
  },
  {
    slug: "print-bureau-terms",
    title: "Print bureau & commission terms",
    summary:
      "Materials, scales, finishes, quote validity, timelines, shipping, cancellation, and the briefs the studio will not accept.",
  },
];

export default function PoliciesIndexPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Policies</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Policies.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          Plain, named, dated. The studio prefers policies that read like
          archive entries rather than marketing copy &mdash; the
          processors are listed by name, the jurisdictions are stated,
          the dates of effect are on the page.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          Holo-Flow Studio operates from Salford, Greater Manchester,
          United Kingdom. The policies below apply to{" "}
          <span className="text-chrome-200">holoflow.co.uk</span> and to
          every commission routed through it. Questions or data requests
          go to{" "}
          <a
            href="mailto:contact@holoflow.co.uk"
            className="text-pink-200 underline underline-offset-4"
          >
            contact@holoflow.co.uk
          </a>
          .
        </p>

        <ul className="mt-16 divide-y divide-warm-black-800 border-y border-warm-black-800">
          {policies.map((policy) => (
            <li key={policy.slug} className="py-6">
              <Link
                href={`/policies/${policy.slug}`}
                className="text-2xl text-chrome-100 underline underline-offset-4 hover:text-pink-200"
              >
                {policy.title}
              </Link>
              <p className="mt-2 max-w-prose text-sm text-chrome-300">
                {policy.summary}
              </p>
            </li>
          ))}
        </ul>
      </article>
      <Footer />
    </>
  );
}
