/**
 * /agents/[slug] — Agentic representation of a person OR cast member.
 *
 * Two valid lookup paths:
 *  - `lib/cast` — named studio characters (Aura, Marcel, Penny, ...).
 *    These carry a CharacterBible (voice, draws, posture).
 *  - `lib/people/registry` — real-world practitioners with public
 *    output, agent built from their site/posts.
 *
 * If the slug matches neither, the page 404s rather than rendering an
 * empty agent surface.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import AgentChat from "components/agents/AgentChat";
import Footer from "components/layout/footer";
import { getProfile } from "lib/people/registry";

// Render-on-request — see /people/[slug] for the rationale. The agent
// stub doesn't justify the build-time pre-render cost.
export const dynamic = "force-dynamic";

// Defensive cast lookup. The cast module is being built alongside this
// page; if the import fails the slug page still renders against the
// people-registry path. Returns `null` for both "module missing" and
// "slug not in cast" — callers fall through to the people-registry
// lookup.
type CastBible = {
  id: string;
  name: string;
  role: string;
  voice: string;
  draws: string[];
  defaultMode: string;
};

async function getCastBible(slug: string): Promise<CastBible | null> {
  try {
    const mod = await import("lib/cast");
    type CastId = ReturnType<typeof mod.listCastIds>[number];
    const ids = mod.listCastIds();
    if (!(ids as readonly string[]).includes(slug)) return null;
    return mod.getBible(slug as CastId) as CastBible;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfile(slug);
  const bible = await getCastBible(slug);
  const name = profile?.name ?? bible?.name ?? slug;
  return {
    title: profile ? `${name}'s agent` : `${name} — agent`,
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
  const bible = await getCastBible(slug);

  // 404 if the slug isn't claimed by either registry. Avoids rendering
  // an empty agent surface for typos and stale links.
  if (!profile && !bible) {
    notFound();
  }

  const display = profile?.name ?? bible?.name ?? slug;

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

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1fr_220px]">
          <div>
            {profile ? (
              <AgentChat slug={slug} profileName={profile.name} />
            ) : (
              <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-6 text-sm text-chrome-300">
                {display}&rsquo;s chat is wired against the cast
                bible, not the rolodex &mdash; the Ollama runtime
                lands here once the people-registry side of the
                handshake catches up. The bible (voice, things they
                draw to) is in the sidebar.
              </section>
            )}
          </div>

          {bible ? (
            <aside className="space-y-6 text-sm">
              <section>
                <div className="chrome-label">Voice register</div>
                <p className="mt-2 text-xs leading-relaxed text-chrome-300">
                  {bible.voice}
                </p>
                <div
                  className="mt-3 inline-block rounded-full border border-pink-200/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-pink-200"
                >
                  {bible.defaultMode}
                </div>
              </section>

              {bible.draws.length > 0 ? (
                <section>
                  <div className="chrome-label">Speaks about</div>
                  <ul className="mt-2 space-y-1.5">
                    {bible.draws.map((topic, i) => (
                      <li
                        key={`${bible.id}-draws-${i}`}
                        className="text-xs text-chrome-300"
                      >
                        &middot; {topic}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <div className="chrome-label">Boundary</div>
                <p className="mt-2 text-xs text-chrome-400">
                  Won&rsquo;t pretend on topics outside the bible.
                  If a question lands outside what {display} draws
                  to, the agent says so plainly.
                </p>
              </section>
            </aside>
          ) : null}
        </div>

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
