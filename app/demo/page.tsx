import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Demos — Holo-Flow Studio",
  description:
    "Every live, runnable demo on the site, indexed in one place. Photograph-to-3D conversion, the POV-rig simulator, the visualiser series, the play levels, and the maps and graphs underneath the catalogue.",
};

type DemoRow = {
  href: string;
  title: string;
  description: string;
  requires?: string[];
};

type DemoFamily = {
  slug: string;
  label: string;
  title: string;
  intro: string;
  demos: DemoRow[];
};

const families: DemoFamily[] = [
  {
    slug: "photograph-to-3d",
    label: "Photograph to 3D",
    title: "Photograph to 3D.",
    intro:
      "Browser-side depth estimation, stereo-pair generation, and side-by-side output. Per-frame work happens on the device; nothing leaves the page.",
    demos: [
      {
        href: "/spatial",
        title: "Spatial photograph",
        description:
          "Drops a 2D photograph through Depth Anything V2, returns AR Quick Look or a side-by-side spatial photo.",
        requires: ["WebGPU recommended", "iOS for AR Quick Look"],
      },
      {
        href: "/spatial/video",
        title: "Spatial video",
        description:
          "Per-frame depth on a short clip; stitches a side-by-side MP4 for Quest 3 and Apple Vision Pro playback.",
        requires: ["WebGPU recommended", "short clips only"],
      },
    ],
  },
  {
    slug: "pov-rig",
    label: "POV-rig path",
    title: "The POV-rig path.",
    intro:
      "The bench builds spinning LED rigs that draw images into long-exposure photographs. These two surface the rig and the camera network around it.",
    demos: [
      {
        href: "/atelier/rig-simulator",
        title: "Rig simulator",
        description:
          "WebGPU TSL simulation of the SK9822 + Teensy 4.1 POV array. Upload an image, watch the rig draw it.",
        requires: ["WebGPU"],
      },
      {
        href: "/atelier/cctv-cross-reference",
        title: "CCTV cross-reference",
        description:
          "Live TfL JamCams catalogue matched against HoloWalk locations, with distance, IDs, and stream URLs.",
        requires: ["live TfL feed"],
      },
    ],
  },
  {
    slug: "visualisers",
    label: "Visualisers",
    title: "The visualiser series.",
    intro:
      "Interactive explainers for the physics and algorithms underneath the bench. One shipped, more pending; each one is the companion to its article.",
    demos: [
      {
        href: "/visualiser/total-internal-reflection",
        title: "Total internal reflection",
        description:
          "Ray-traced TIR demo. Drag the incident angle, swap refractive indices, watch the refracted ray vanish above the critical angle.",
      },
      {
        href: "/visualiser/marching-cubes",
        title: "Marching cubes",
        description:
          "Step through the 256 cases, scrub the iso-value, watch the algorithm pull triangles out of a scalar field.",
      },
    ],
  },
  {
    slug: "play-levels",
    label: "Play levels",
    title: "Play levels.",
    intro:
      "The studio&rsquo;s proving ground: the AR game that runs the philosophy as solo levels and braided weaves. Position six of the Loop, made playable.",
    demos: [
      {
        href: "/play",
        title: "Play index",
        description:
          "The full ladder of levels — Module, Trail, Loop, Witness, Sphere, and the braided weaves built on top.",
        requires: ["WebXR for AR levels"],
      },
      {
        href: "/chrono-protocol",
        title: "Chrono-Protocol",
        description:
          "The five-mode chrono wheel and three city zones the proving ground graduates into. Concept page; prototype on disk.",
      },
    ],
  },
  {
    slug: "maps-and-graphs",
    label: "Maps & graphs",
    title: "Maps and graphs.",
    intro:
      "The site&rsquo;s structural layer. Cross-references rendered as a sphere, sculptures rendered as outdoor pins, splat zones rendered onto a stylised London.",
    demos: [
      {
        href: "/sphere",
        title: "The sphere",
        description:
          "Every page on the site as a node, every cross-reference as an edge, laid out as a 3D site graph.",
        requires: ["WebGL"],
      },
      {
        href: "/holo-walk",
        title: "HoloWalk",
        description:
          "The outdoor sculpture trail across Manchester and London. Light sculptures reanchored at the spots they were photographed.",
        requires: ["WebXR for AR view"],
      },
      {
        href: "/play/neo-london",
        title: "Neo-London",
        description:
          "Gaussian splat zones plotted on a stylised London map &mdash; the playground for the chrono-protocol game.",
      },
      {
        href: "/the-loop",
        title: "The Loop",
        description:
          "The six positions of the studio&rsquo;s method, laid out as one closed circuit from body to body. Conceptual rather than interactive.",
      },
    ],
  },
];

export default function DemoIndexPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demos</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Things you can play with.
        </h1>

        <p className="mt-6 max-w-xl text-chrome-200">
          The site holds a handful of interactive pieces, scattered
          across the catalogue. They&rsquo;re proofs of the studio&rsquo;s
          pipeline rather than products in themselves &mdash; the
          photograph-to-3D pipeline running in your browser, the
          POV-rig simulating itself before the soldering iron comes
          out, the algorithms drawn out as moving diagrams. This page
          gathers them in one place so the working layer is visible
          without scavenging the navigation.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          Each demo links to its own page. Where a piece needs WebGPU
          or WebXR, the row says so. Where a piece is conceptual
          rather than interactive, the row says that too.
        </p>

        <nav className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-3">
          {families.map((family) => (
            <a
              key={family.slug}
              href={`#${family.slug}`}
              className="block rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-3 py-2 text-xs text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              {family.label}
            </a>
          ))}
        </nav>

        <div className="mt-16 space-y-20">
          {families.map((family) => (
            <DemoFamilyBlock key={family.slug} family={family} />
          ))}
        </div>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">A note from the bench</div>
          <p className="mt-3 text-chrome-300">
            None of these are polished. They&rsquo;re working drawings &mdash;
            the kind a maker pins to the wall above the bench to check
            the maths is doing what it&rsquo;s supposed to do. The TIR
            visualiser exists because I needed to convince myself the
            critical-angle formula matched the resin sample on the
            bench. The rig simulator exists because I wanted to know
            what the photograph would look like before I lit the
            LEDs. They&rsquo;re honest about what they are. If any of
            them break, that&rsquo;s also honest.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function DemoFamilyBlock({ family }: { family: DemoFamily }) {
  return (
    <section id={family.slug} className="scroll-mt-24">
      <div className="chrome-label text-pink-200 mb-2">{family.label}</div>
      <h2 className="text-3xl text-chrome-100">{family.title}</h2>
      <p className="mt-3 max-w-prose text-chrome-300">{family.intro}</p>
      <ul className="mt-6 divide-y divide-warm-black-800 border-y border-warm-black-800">
        {family.demos.map((demo) => (
          <DemoRowItem key={demo.href} demo={demo} />
        ))}
      </ul>
    </section>
  );
}

function DemoRowItem({ demo }: { demo: DemoRow }) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link
          href={demo.href}
          className="text-lg text-chrome-100 underline underline-offset-4 hover:text-pink-200"
        >
          {demo.title}
        </Link>
        {demo.requires?.map((req) => (
          <span
            key={req}
            className="chrome-label text-[0.6rem] text-chrome-500"
          >
            {req}
          </span>
        ))}
      </div>
      <p className="mt-1 max-w-prose text-sm text-chrome-300">
        {demo.description}
      </p>
    </li>
  );
}
