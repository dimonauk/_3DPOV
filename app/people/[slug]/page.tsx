/**
 * /people/[slug] — Public profile page per person in the rolodex.
 *
 * Reads from `lib/people/registry.ts` (publishable fields only). The
 * fuller private profile lives in the `holoflow-private` repo at
 * `rolodex/people/<slug>.md` and is surfaced through the subscriber
 * tier (auth-gated, future).
 *
 * Slug matches the rolodex id, which is also the slug used for
 * `/agents/<slug>`. Slot for "claim this profile" (the practitioner
 * joins the platform) is left open in the prose.
 */

import Link from "next/link";

import Footer from "components/layout/footer";
import { getProfile } from "lib/people/registry";
import type { ProfileSocials } from "lib/people/types";

// Render-on-request to keep the build memory budget intact. With 274
// profiles + 274 agents pre-rendering at build time, the 8 GB Vercel
// build machine OOMs. Profiles are cheap to render dynamically and
// the Edge caches them anyway.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfile(slug);
  if (!profile) {
    return { title: `${slug} — profile`, robots: { index: false } };
  }
  return {
    title: `${profile.name} — ${profile.scenes.join(" · ")}`,
    description: profile.bioShort,
    robots: { index: true, follow: true },
  };
}

const SOCIAL_PREFIXES: Record<keyof ProfileSocials, string> = {
  instagram: "https://instagram.com/",
  x: "https://x.com/",
  bluesky: "https://bsky.app/profile/",
  mastodon: "https://",
  flickr: "https://flickr.com/photos/",
  youtube: "https://youtube.com/",
  tiktok: "https://tiktok.com/@",
  facebook: "https://facebook.com/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
};

const SOCIAL_LABELS: Record<keyof ProfileSocials, string> = {
  instagram: "Instagram",
  x: "X",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  flickr: "Flickr",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  github: "GitHub",
};

function socialUrl(
  platform: keyof ProfileSocials,
  handle: string,
): string {
  const h = handle.replace(/^@/, "");
  if (platform === "mastodon" && h.includes("@")) {
    const [user, instance] = h.split("@");
    return `https://${instance}/@${user}`;
  }
  return `${SOCIAL_PREFIXES[platform]}${h}`;
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfile(slug);

  if (!profile) {
    return (
      <>
        <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <div className="chrome-label">Knowledge base · Person</div>
          <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
            {slug}.
          </h1>

          <section className="mt-10 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-8">
            <div className="chrome-label text-pink-200">
              Not in the rolodex yet
            </div>
            <p className="mt-3 text-sm leading-relaxed text-chrome-200">
              The studio publishes profiles in the same order the
              rolodex grows. If you&rsquo;re looking for someone
              specific and they&rsquo;re missing,{" "}
              <Link
                href="/contact"
                className="text-pink-200 hover:underline"
              >
                write to the studio
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/people"
                  className="text-pink-200 hover:underline"
                >
                  All profiles &rarr;
                </Link>
              </li>
              <li>
                <Link
                  href="/whoswho"
                  className="text-pink-200 hover:underline"
                >
                  Who&rsquo;s-who index &rarr;
                </Link>
              </li>
            </ul>
          </section>
        </article>
        <Footer />
      </>
    );
  }

  const socials = profile.socials ?? {};
  const socialKeys = Object.keys(socials) as Array<keyof ProfileSocials>;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Knowledge base · Person</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
          {profile.name}.
        </h1>
        {profile.publicBrand && profile.publicBrand !== profile.name ? (
          <p className="mt-2 text-sm text-chrome-400">
            also publishes as <em>{profile.publicBrand}</em>
          </p>
        ) : null}

        <p className="mt-8 text-base leading-relaxed text-chrome-200">
          {profile.bioShort}
        </p>

        <section className="mt-10 grid grid-cols-2 gap-6 border-t border-warm-black-800 pt-6 text-sm sm:grid-cols-4">
          <div>
            <div className="chrome-label">Location</div>
            <div className="mt-1 text-chrome-200">{profile.location}</div>
          </div>
          <div>
            <div className="chrome-label">Role</div>
            <div className="mt-1 text-chrome-200">{profile.role}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="chrome-label">Scenes</div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-chrome-200">
              {profile.scenes.map((s) => (
                <Link
                  key={s}
                  href={`/scenes/${s}`}
                  className="rounded-full border border-warm-black-700 px-2 py-0.5 text-xs hover:border-pink-200 hover:text-pink-200"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="chrome-label">Where to find them</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={profile.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:underline"
              >
                {profile.publicUrl.replace(/^https?:\/\//, "")} &rarr;
              </a>
            </li>
            {socialKeys.map((k) => {
              const handle = socials[k];
              if (!handle) return null;
              return (
                <li key={k}>
                  <a
                    href={socialUrl(k, handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-200 hover:underline"
                  >
                    {SOCIAL_LABELS[k]}: {handle} &rarr;
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10">
          <div className="chrome-label">Appears in</div>
          <ul className="mt-4 space-y-2 text-sm">
            {profile.appearsIn.map((articleSlug) => (
              <li key={articleSlug}>
                <Link
                  href={`/articles/${articleSlug}`}
                  className="text-pink-200 hover:underline"
                >
                  {articleSlug.replace(/-/g, " ")} &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-warm-black-800 pt-6">
          <div className="chrome-label">Studio surfaces</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href={`/agents/${profile.id}`}
                className="text-pink-200 hover:underline"
              >
                Ask {profile.name}&rsquo;s agent &rarr;
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

        <section className="mt-10 border-t border-warm-black-800 pt-6">
          <div className="chrome-label">House rules</div>
          <p className="mt-4 text-sm leading-relaxed text-chrome-300">
            Public sources only, cited and linked. No identity
            classification, no aggregated dossiers. This profile
            celebrates the work; the practitioner&rsquo;s own site
            is canonical. If {profile.name} would like to claim this
            page or update its content, they&rsquo;re welcome to{" "}
            <Link
              href="/contact"
              className="text-pink-200 hover:underline"
            >
              write to the studio
            </Link>
            .
          </p>
          <p className="mt-3 text-xs text-chrome-500">
            Last verified {profile.lastVerified}.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
