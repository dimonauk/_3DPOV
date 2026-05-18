/**
 * /agents/[slug] — Agentic representation of a person.
 *
 * Skeleton route. Each rolodex entry will eventually have an AI
 * agent built from their public output (and fuller representation
 * when opt-in). Visitors and subscribers can interact with the
 * agent here — ask a question, see a digest, find connection
 * moments.
 *
 * Today this page is a placeholder. It tells the visitor what the
 * agent surface *will be*, links to the person's public-profile
 * page, and offers the studio's outreach path until the agent is
 * built.
 *
 * The slug matches the rolodex entry id (see private/rolodex/
 * rolodex.json) which is also the slug used in /people/<slug>.
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
    title: `${slug} — agent`,
    robots: { index: false, follow: false },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Simulation layer · Agent</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
          {slug}&rsquo;s agent.
        </h1>

        <section className="mt-10 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-8">
          <div className="chrome-label text-pink-200">In flight</div>
          <p className="mt-3 text-sm leading-relaxed text-chrome-200">
            Every person the studio names in its who&rsquo;s-who lists
            is, in time, getting an agent here. An interactive twin
            built from their public output — their site, their posts,
            their press, the work they&rsquo;ve published under their
            own name. The agent answers questions on their behalf,
            surfaces a digest of what they&rsquo;ve been making, and
            opens a clean path to actually getting in touch.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-chrome-200">
            This particular agent isn&rsquo;t built yet. It will be.
            The studio is building these in the same order the
            rolodex grew &mdash; scene by scene, person by person,
            slowly.
          </p>
        </section>

        <section className="mt-10">
          <div className="chrome-label">What you can do now</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                href={`/people/${slug}`}
                className="text-pink-200 hover:underline"
              >
                See {slug}&rsquo;s public profile &rarr;
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
          <div className="chrome-label">How the agent will work</div>
          <p className="mt-4 text-sm leading-relaxed text-chrome-300">
            Built from public output only. Opt-in for deeper
            representation when the person joins the platform.
            Subscriber-gated for chat depth. Never claims to speak
            for the person beyond what their own public archive
            supports. Citation discipline applies &mdash; every
            agent reply links back to the public source it&rsquo;s
            drawing from.
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
