/**
 * /agents/[slug] — Agentic representation of a person.
 *
 * Reads from `lib/people/registry.ts` to know who the agent is *of*.
 * Today the chat surface is in-flight (the Ollama-backed runtime
 * lands in a future session); the page surfaces the person + sets
 * up the slot the chat will land in.
 *
 * Slug matches the rolodex / profile id.
 */

import Link from "next/link";

import AgentChat from "components/agents/AgentChat";
import Footer from "components/layout/footer";
import { getProfile } from "lib/people/registry";

// Render-on-request — see /people/[slug] for the rationale. The agent
// stub doesn't justify the build-time pre-render cost.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfile(slug);
  return {
    title: profile
      ? `${profile.name}'s agent`
      : `${slug} — agent`,
    robots: { index: false, follow: false },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfile(slug);
  const display = profile?.name ?? slug;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Simulation layer · Agent</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
          {display}&rsquo;s agent.
        </h1>

        {profile ? (
          <p className="mt-3 text-sm text-chrome-300">
            {profile.scenes.join(" · ")} · {profile.location}
          </p>
        ) : null}

        <section className="mt-10 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-8">
          <div className="chrome-label text-pink-200">Skeleton — wired to your local Ollama</div>
          <p className="mt-3 text-sm leading-relaxed text-chrome-200">
            Every person the studio names is, in time, getting an
            agent here. An interactive twin built from public output
            &mdash; their site, posts, press, the work they&rsquo;ve
            published under their own name.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-chrome-200">
            This one runs on a local Ollama runtime &mdash; nothing
            routes through hosted inference, nothing leaves your
            machine. If the chat below says &ldquo;ollama
            offline&rdquo;, start one with{" "}
            <code className="text-pink-200">ollama serve</code> and
            pull the default model. The setup notes are in{" "}
            <code className="text-pink-200">docs/AGENT-CHAT.md</code>.
          </p>
        </section>

        {profile ? (
          <div className="mt-8">
            <AgentChat slug={slug} profileName={profile.name} />
          </div>
        ) : (
          <section className="mt-8 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-6 text-sm text-chrome-300">
            No public profile under <code>{slug}</code>. The agent
            surface is built per-profile &mdash; once {display} has an
            entry in the rolodex, the chat lands here.
          </section>
        )}

        <section className="mt-10">
          <div className="chrome-label">What you can do now</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                href={`/people/${slug}`}
                className="text-pink-200 hover:underline"
              >
                See {display}&rsquo;s profile &rarr;
              </Link>
            </li>
            {profile ? (
              <li>
                <a
                  href={profile.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-200 hover:underline"
                >
                  Visit their own site &rarr;
                </a>
              </li>
            ) : null}
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
            representation when {display} claims the page. Subscriber-
            gated for chat depth. Never speaks for the person beyond
            what their own public archive supports. Citation
            discipline applies &mdash; every agent reply links back
            to the public source.
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
