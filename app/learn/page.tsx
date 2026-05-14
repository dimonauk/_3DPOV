import Footer from "components/layout/footer";
import Link from "next/link";
import { ladders } from "lib/curriculum";

export const metadata = {
  title: "Learn — the studio's curriculum",
  description:
    "A learning ladder for the Holo-Flow Studio practice. Start here, read, watch, make, play, refer. Plus seven parallel curriculum ladders from absolute beginner to where the bench currently sits — photography, poi, POV LED rigs, drones, 3D printing, local AI, and WebXR.",
};

type HubSection = {
  label: string;
  title: string;
  blurb: string;
  links: { href: string; title: string; note?: string }[];
};

const HUB_SECTIONS: HubSection[] = [
  {
    label: "Start here",
    title: "One photograph, one rig.",
    blurb:
      "The two foundation tutorials. Together they cover the first long-exposure light painting and the first programmable persistence-of-vision rig — the entry to almost everything else on the bench.",
    links: [
      {
        href: "/tutorials/your-first-long-exposure",
        title: "Your First Long-Exposure Light Painting",
        note: "Camera, place, tool, frame, shutter, gesture.",
      },
      {
        href: "/tutorials/building-a-pov-led-rig",
        title: "Building a POV LED Rig",
        note: "Bill of materials, mechanical balance, firmware, the first-test debug ladder.",
      },
    ],
  },
  {
    label: "Read",
    title: "The arguments behind the bench.",
    blurb:
      "Four long pieces. Why the rigs are bench-built; what sits on the bench and why; the lineage the studio sits in; and the single-exposure-as-ethics position that underwrites every photograph.",
    links: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        title: "Why I Build My Own Rigs",
        note: "The bench-built argument, plainly.",
      },
      {
        href: "/articles/the-bench",
        title: "The Bench",
        note: "What sits on it, why it's organised this way.",
      },
      {
        href: "/articles/lineage-marey-to-now",
        title: "Lineage — Marey to Now",
        note: "Chronophotography forward; the studio's place in it.",
      },
      {
        href: "/articles/on-editioning-photographs",
        title: "On Editioning Photographs",
        note: "Single-exposure as an ethical position, not just an aesthetic.",
      },
    ],
  },
  {
    label: "Watch",
    title: "The moving record.",
    blurb:
      "Video pieces, FPV cinewhoop captures, and the HoloWalk outdoor sculpture trail — light sculptures reanchored to the spots they were photographed.",
    links: [
      { href: "/watch", title: "The watch index" },
      {
        href: "/holo-walk",
        title: "HoloWalk — outdoor sculpture trail",
        note: "Manchester and London, browsable on the map.",
      },
    ],
  },
  {
    label: "Make",
    title: "Browser tools at the bench.",
    blurb:
      "Run the studio's own apparatus in the browser. Simulate a POV rig before solder; voxelise a photograph through marching cubes; open the spatial viewers.",
    links: [
      {
        href: "/atelier/rig-simulator",
        title: "Rig simulator",
        note: "Build a POV rig in the browser before you build it on the bench.",
      },
      {
        href: "/visualiser/marching-cubes",
        title: "Marching cubes visualiser",
        note: "The algorithm that turns voxel grids into smooth surfaces, live.",
      },
      {
        href: "/spatial",
        title: "Spatial — the still viewers",
        note: "Looking Glass quilts, gaussian splats, photogrammetry meshes.",
      },
      {
        href: "/spatial/video",
        title: "Spatial — the moving viewers",
        note: "Volumetric capture playback in the browser.",
      },
    ],
  },
  {
    label: "Play",
    title: "The studio's pieces, playable.",
    blurb:
      "Interactive experiments that double as walkthroughs of the work. Some are toys; some are arguments. None of them need an account.",
    links: [
      {
        href: "/play",
        title: "The play index",
        note: "Everything the studio has put on the page that runs in the browser.",
      },
      {
        href: "/chrono-protocol",
        title: "Chrono-Protocol",
        note: "Neo London as a chronophotographic city — an essay you walk through.",
      },
    ],
  },
  {
    label: "Refer",
    title: "Look it up later.",
    blurb:
      "The two reference surfaces. The codex defines the studio's working vocabulary precisely; the stack lists every tool on the bench with vendor and version where it matters.",
    links: [
      {
        href: "/codex",
        title: "The codex",
        note: "Apparatus, capture, drone, production, print, commerce, community — the studio's defined vocabulary.",
      },
      {
        href: "/stack",
        title: "The stack",
        note: "Every tool the bench runs on, named honestly.",
      },
    ],
  },
];

export default function LearnPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The studio&rsquo;s curriculum</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Learn.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio&rsquo;s position is that this work is learnable.
          What follows is a short orientation map &mdash; six honest
          ways into the bench &mdash; then the longer parallel
          curriculum below, in seven ladders.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          Nothing here is paywalled. The tutorials, articles, and
          codex entries are the studio&rsquo;s written record of how
          the work is done; the apparatus pages name the kit;
          everything else is a place to read about why.
        </p>

        <section className="mt-16">
          <div className="chrome-label">Six ways in</div>
          <h2 className="mt-2 text-3xl text-chrome-100">
            The learning ladder, top down.
          </h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Each rung is a small set of links into the existing
            archive. Walk them in order or jump straight to the section
            that matches what brought you here.
          </p>

          <div className="mt-10 space-y-12 border-l-2 border-warm-black-800 pl-6">
            {HUB_SECTIONS.map((section) => (
              <HubBlock key={section.label} section={section} />
            ))}
          </div>
        </section>

        <section className="mt-24">
          <div className="chrome-label">The curriculum, in depth</div>
          <h2 className="mt-2 text-3xl text-chrome-100">
            Seven parallel ladders.
          </h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            From absolute beginner to where the practice currently
            sits. Photography, poi, POV LED rigs, drones, 3D
            printing, local AI pipelines, and WebXR. Some rungs are
            still in preparation &mdash; marked clearly, not pretending
            otherwise. As they get written, they get linked.
          </p>

          <div className="mt-16 space-y-16">
            {ladders.map((ladder) => (
              <LadderBlock key={ladder.slug} ladder={ladder} />
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Two parallel browsing surfaces</div>
          <p className="mt-3 text-chrome-300">
            This page organises the writing by learning path. The{" "}
            <Link
              href="/tutorials"
              className="text-pink-200 underline underline-offset-4"
            >
              tutorials index
            </Link>{" "}
            shows the same pieces in reverse-chronological order if
            you just want to browse what&rsquo;s landed recently. The{" "}
            <Link
              href="/articles"
              className="text-pink-200 underline underline-offset-4"
            >
              articles index
            </Link>{" "}
            holds the longer-form pieces that sit alongside the
            ladders. The{" "}
            <Link
              href="/search"
              className="text-pink-200 underline underline-offset-4"
            >
              search page
            </Link>{" "}
            cuts across all of them.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function HubBlock({ section }: { section: HubSection }) {
  return (
    <section>
      <div className="chrome-label text-pink-200 mb-2">
        {section.label}
      </div>
      <h3 className="text-2xl text-chrome-100">{section.title}</h3>
      <p className="mt-2 max-w-prose text-chrome-300">{section.blurb}</p>
      <ul className="mt-5 space-y-3">
        {section.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group block">
              <span className="text-base text-chrome-100 group-hover:text-pink-200">
                {l.title}
              </span>
              {l.note ? (
                <span className="mt-1 block text-sm text-chrome-400">
                  {l.note}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LadderBlock({
  ladder,
}: {
  ladder: (typeof ladders)[number];
}) {
  return (
    <section>
      <div className="chrome-label text-pink-200 mb-2">
        {ladder.subtitle}
      </div>
      <h3 className="text-2xl text-chrome-100">{ladder.title}</h3>
      <p className="mt-3 max-w-prose text-chrome-300">{ladder.intro}</p>
      <ol className="mt-6 space-y-5 border-l-2 border-warm-black-800 pl-6">
        {ladder.rungs.map((rung, i) => (
          <RungRow key={`${ladder.slug}-${i}`} rung={rung} index={i} />
        ))}
      </ol>
    </section>
  );
}

function RungRow({
  rung,
  index,
}: {
  rung: (typeof ladders)[number]["rungs"][number];
  index: number;
}) {
  const pending = rung.href === null;
  return (
    <li>
      <div className="chrome-label mb-2 text-chrome-500">
        Rung {index + 1}
        {pending ? " · in preparation" : ""}
      </div>
      {pending ? (
        <div>
          <h4 className="text-xl text-chrome-300">{rung.title}</h4>
          <p className="mt-1 max-w-prose text-sm text-chrome-400">
            {rung.blurb}
          </p>
        </div>
      ) : (
        <Link href={rung.href!} prefetch={true} className="group block">
          <h4 className="text-xl text-chrome-100 group-hover:text-pink-200">
            {rung.title}
          </h4>
          <p className="mt-1 max-w-prose text-sm text-chrome-300">
            {rung.blurb}
          </p>
        </Link>
      )}
    </li>
  );
}
