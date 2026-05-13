import Link from "next/link";

import Footer from "components/layout/footer";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title: "Visualiser series &mdash; interactive explainers from the bench",
  description:
    "Interactive R3F visualisers for the physics and algorithms the studio depends on: total internal reflection, marching cubes, Laban Effort. The maths from the bench, made tangible.",
};

type Entry = {
  href: string;
  number: string;
  title: string;
  blurb: string;
  pairs: string;
};

const ENTRIES: Entry[] = [
  {
    href: "/visualiser/total-internal-reflection",
    number: "01",
    title: "Total Internal Reflection",
    blurb:
      "Drag the incident angle; watch the refracted ray vanish above the critical angle; swap the materials to move the threshold. Snell&rsquo;s Law plus the full Fresnel reflectance, drawn live.",
    pairs:
      "Companion to Why the Pendant Glows From the Inside and Colour Without Pigment.",
  },
  {
    href: "/visualiser/marching-cubes",
    number: "02",
    title: "Marching cubes",
    blurb:
      "Scrub the iso-value across a 3D field; switch on step mode to watch one cube&rsquo;s eight corners light up and its triangles emerge. The 256-case lookup, opened.",
    pairs:
      "Companion to Nine Seconds from Prompt to Printable, How the Studio Breeds Sculptures, and the Holoflow Loop.",
  },
  {
    href: "/visualiser/laban-dial",
    number: "03",
    title: "Laban Effort dial",
    blurb:
      "Move the live point through the Space&times;Time&times;Weight cube; watch the named Basic Efforts (Float, Wring, Punch, Dab, Press, Glide, Slash, Flick) light up at the corners. Flow conditions the trail.",
    pairs:
      "Companion to The Living Stage and How the Studio Breeds Sculptures.",
  },
  {
    href: "/visualiser/strange-attractor",
    number: "04",
    title: "Strange attractors",
    blurb:
      "Four canonical strange attractors &mdash; Clifford, Thomas, Lorenz, Dequan Li &mdash; iterated live. Swap Aura&rsquo;s mood and watch the engine flip per the Pipeline Epsilon canon: she <em>is</em> the attractor she&rsquo;s feeling.",
    pairs:
      "Companion to Aura the Body and the capability registry brick viz.attractor.",
  },
];

export default function VisualiserIndexPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Interactive explainers</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Visualiser.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            Every studio piece &mdash; every pendant, every belt-printed
            wall relief, every recorded gesture &mdash; rests on a small
            number of formulas the bench has been turning over for years.
            Most of those formulas are explained on the site in prose. A
            few are clearer with a slider in front of them. This is where
            the sliders live.
          </p>
          <p>
            Each entry is a single-purpose interactive: a pure-function
            maths file, an R3F scene, a controls panel, a readout. The
            scene itself stays silent &mdash; everything explanatory lives
            in the surrounding chrome and in the companion articles
            linked from each page.
          </p>
        </section>

        <div className="mt-16 space-y-10">
          {ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 transition hover:border-pink-200"
            >
              <div className="chrome-label text-pink-200">
                Series &middot; {entry.number}
              </div>
              <h2 className="mt-3 text-3xl text-chrome-100 transition group-hover:text-pink-200 md:text-4xl">
                {entry.title}
              </h2>
              <p className="mt-4 text-chrome-300">{entry.blurb}</p>
              <p className="mt-3 text-xs text-chrome-500">{entry.pairs}</p>
              <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-chrome-500 group-hover:text-pink-200">
                Open visualiser &rarr;
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-16 text-xs leading-relaxed text-chrome-500">
          <p>
            Source layout: each visualiser is a Server Component page
            plus a client-shell that dynamic-imports its R3F scene, plus
            a pure-function maths module. The shared primitives are in{" "}
            <code className="font-mono">
              components/visualiser/_helpers.tsx
            </code>{" "}
            and{" "}
            <code className="font-mono">lib/visualiser/state.ts</code>.
            Future entries follow the same skeleton.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
