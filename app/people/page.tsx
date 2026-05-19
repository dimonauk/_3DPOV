import Link from "next/link";

import Footer from "components/layout/footer";
import { allProfiles } from "lib/people/registry";

export const metadata = {
  title: "People",
  description:
    "Every person named in the studio's who's-who lists has a profile page here. Real names, real public URLs, the work celebrated by name.",
};

// Group profiles by primary scene for the index. A person in many
// scenes appears under each — the entry is the same, the surface
// is multiple.
const SCENE_ORDER = [
  "fire-art",
  "light-painting",
  "vr",
  "ar",
  "motion-capture",
  "pixel-art",
  "splat-360",
  "3d-printing",
  "pov",
  "led-programming",
  "projection",
  "holography",
  "jewellery",
  "drones",
  "generative-ai",
  "vrm",
  "performance",
] as const;

const SCENE_LABELS: Record<string, string> = {
  "fire-art": "Fire art + flow",
  "light-painting": "Light painting + long exposure",
  vr: "VR",
  ar: "AR",
  "motion-capture": "Motion capture",
  "pixel-art": "Pixel art",
  "splat-360": "Splat + 360 capture",
  "3d-printing": "3D printing",
  pov: "POV + spinning LED",
  "led-programming": "LED programming",
  projection: "Projection + VJ",
  holography: "Holography",
  jewellery: "Jewellery",
  drones: "Drones",
  "generative-ai": "Generative AI",
  vrm: "VRM + avatars",
  performance: "Live performance",
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
          articles. The fuller version &mdash; emails, deeper
          biographies, outreach notes &mdash; lives in the
          subscriber-only side. Public profiles are gloss + link.
        </p>

        {SCENE_ORDER.map((scene) => {
          const profiles = all.filter((p) => p.scenes.includes(scene));
          if (profiles.length === 0) return null;
          return (
            <section key={scene} className="mt-14">
              <div className="chrome-label text-pink-200">
                {SCENE_LABELS[scene]}
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profiles
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <li key={`${scene}-${p.id}`}>
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
