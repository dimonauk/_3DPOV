/**
 * /people/[slug] — Public profile page per rolodex entry.
 *
 * Skeleton route. Reads the consent-marked subset of the private
 * rolodex (when the rolodex moves to a shared data layer). Today
 * the page tells visitors what this surface will be and offers
 * the practitioner's own URL + the studio's outreach path.
 *
 * Slug matches the rolodex entry id which is also the slug used
 * by /agents/<slug>.
 */

import Link from "next/link";

import Footer from "components/layout/footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `${slug} — profile`,
    robots: { index: false, follow: false },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Knowledge base · Person</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
          {slug}.
        </h1>

        <section className="mt-10 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-8">
          <div className="chrome-label text-pink-200">In flight</div>
          <p className="mt-3 text-sm leading-relaxed text-chrome-200">
            Every person the studio names in its who&rsquo;s-who lists
            is getting a profile page here. Public-information only,
            cited, linked back to their own site. Subscriber tier
            opens fuller fields. The practitioner can claim the page
            when they join the platform and from that point it
            represents them on their terms.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-chrome-200">
            This particular profile isn&rsquo;t built yet. The studio
            is building these in the same order the rolodex grows
            &mdash; scene by scene, slowly.
          </p>
        </section>

        <section className="mt-10">
          <div className="chrome-label">What you can do now</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                href={`/agents/${slug}`}
                className="text-pink-200 hover:underline"
              >
                Ask their agent &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/whoswho"
                className="text-pink-200 hover:underline"
              >
                Find them in the who&rsquo;s-who index &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-pink-200 hover:underline"
              >
                Write to the studio &rarr;
              </Link>
            </li>
          </ul>
        </section>

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">House rules</div>
          <p className="mt-4 text-sm leading-relaxed text-chrome-300">
            Public sources only. Cited and linked. No identity
            classification, no aggregated dossiers. Each profile is
            here to celebrate the work, not to profile the person.
          </p>
          <p className="mt-3 text-xs text-chrome-500">
            See <code>docs/ROADMAP.md</code> for the longer story.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
