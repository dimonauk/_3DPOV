import Link from "next/link";

import Footer from "components/layout/footer";
import { allProfiles } from "lib/people/registry";
import { scenes } from "lib/scenes";

export const metadata = {
  title: "People",
  description:
    "Every person named in the studio's who's-who lists has a profile page here. Real names, real public URLs, the work celebrated by name.",
};

export default function PeopleIndexPage() {
  const all = allProfiles();
  const total = all.length;

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="chrome-label">Knowledge base · People</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          People.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">
          {total} verified practitioners across the UK creative
          scenes the studio touches. Every name links to a profile
          page; every profile links back to their own site. The
          studio celebrates by name without classifying.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          The list grows as the studio publishes new who&rsquo;s-who
          articles. Section headings below link to a{" "}
          <Link href="/scenes" className="text-pink-200 hover:underline">
            scene page
          </Link>{" "}
          that aggregates the people + the writing for that scene.
          The fuller version &mdash; emails, deeper biographies,
          outreach notes &mdash; lives in the subscriber-only side.
          Public profiles are gloss + link.
        </p>

        {scenes.map((scene) => {
          const profiles = all.filter((p) => p.scenes.includes(scene.slug));
          if (profiles.length === 0) return null;
          return (
            <section key={scene.slug} className="mt-14">
              <Link
                href={`/scenes/${scene.slug}`}
                className="chrome-label text-pink-200 hover:underline"
              >
                {scene.label}
              </Link>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profiles
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <li key={`${scene.slug}-${p.id}`}>
                      <Link
                        href={`/people/${p.id}`}
                        className="block rounded-sm border border-warm-black-700 bg-warm-black-900/30 px-4 py-3 transition-colors hover:border-pink-200"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-chrome-100">{p.name}</span>
                          <span className="chrome-label text-chrome-500">
                            {p.location}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-chrome-400 line-clamp-2">
                          {p.bioShort}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">House rules</div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-chrome-300">
            <li>
              Public sources only. Every claim about a person comes
              from their own site, their own social bio, or a
              who&rsquo;s-who article that already cited them.
            </li>
            <li>
              No identity classification, no aggregated dossiers.
              Each profile is a gloss + a link, not a profile in
              the surveillance sense.
            </li>
            <li>
              The practitioner can claim their page by writing to
              the studio. Claiming opens fuller representation +
              the agent surface at <code>/agents/&lt;slug&gt;</code>.
            </li>
          </ul>
        </section>

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/scenes" className="text-pink-200 hover:underline">
                Scenes &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/whoswho"
                className="text-pink-200 hover:underline"
              >
                Who&rsquo;s-who articles &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/osint-for-finding-your-people"
                className="text-pink-200 hover:underline"
              >
                OSINT for finding your people &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
