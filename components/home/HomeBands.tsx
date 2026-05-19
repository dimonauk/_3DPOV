/**
 * components/home/HomeBands.tsx — Homepage composition bands.
 *
 * Four server-rendered sections that the homepage drops in between
 * the existing narrative blocks (Hero, Statement, Pipeline) and the
 * Shopify-bound commerce blocks (FeaturedSection, Carousel). Lives
 * in its own module so `app/page.tsx` stays at composition scale
 * rather than ballooning past the 400-line ceiling.
 *
 *   - <AtelierShowcase />   — the eight reference rooms grid
 *   - <NowInTheMill />      — the five most-recent Mill tutorials
 *   - <ReadNext />          — three most-recent magazine articles
 *   - <FrameworkPlate />    — footer-style "what this is" plate
 *
 * Every band is a pure server component; the homepage's only client
 * components remain CursorReticle and AmbientField (both mounted in
 * the hero). Bands wear the magazine chrome (IssueBand) consistently
 * so the four reads as one issue rather than four leaflets.
 *
 * Princess teaching-register straplines. Workshop-Dimona comments.
 * British spelling.
 */
import Link from "next/link";

import { IssueBand } from "components/luxe/IssueBand";
import { articles } from "lib/articles";
import { tutorials } from "lib/tutorials";
import { formatEntryDate } from "lib/writing";

// The eight showcase routes that demonstrate the framework primitives
// the studio has accumulated this season. Order is teaching-register:
// scene shell first, then materials, then post, then the rooms that
// compose them. Each strapline is the Princess saying what the room
// will show you, in one breath.
const ATELIER_ROOMS: ReadonlyArray<{
  href: string;
  title: string;
  blurb: string;
  chip: string;
}> = [
  {
    href: "/atelier/scene-stage-demo",
    title: "Scene-Stage demo",
    blurb:
      "The dual-mode scene shell — drag-to-orbit on a monitor, step inside on a Quest, same scene either way.",
    chip: "Shell",
  },
  {
    href: "/atelier/material-library",
    title: "Material library",
    blurb:
      "Every TSL preset the bench ships, one spinning sphere per preset, frame-budget reported in the toolbar.",
    chip: "Materials",
  },
  {
    href: "/atelier/postprocess-lab",
    title: "Post-process lab",
    blurb:
      "Chip the post-stack on and off live — bloom, god-rays, depth-of-field, the WebXR-safe filter included.",
    chip: "Post",
  },
  {
    href: "/atelier/sculpture-gallery",
    title: "Sculpture gallery",
    blurb:
      "A small rotunda of plinths under tinted spots; orbit a piece on the monitor or walk the wing in VR.",
    chip: "Room",
  },
  {
    href: "/atelier/splat-walk",
    title: "Splat walk",
    blurb:
      "Drop a .ply or .splat in and step inside the capture; the bytes stay on the device.",
    chip: "Splats",
  },
  {
    href: "/atelier/webxr-retroarch",
    title: "WebXR RetroArch",
    blurb:
      "A virtual living room — CRT on the table, console next to it, libretro core in your browser.",
    chip: "Room",
  },
  {
    href: "/atelier/devices",
    title: "Devices",
    blurb:
      "OSS GLBs of the consoles, controllers, and headsets that have changed the studio's mind about what a console is.",
    chip: "Catalogue",
  },
  {
    href: "/atelier/audio-bus-demo",
    title: "Audio-bus demo",
    blurb:
      "The spatial-audio bus rendering a synthesised tone at a random point in 3D space each click. Headphones recommended.",
    chip: "Audio",
  },
];

export function AtelierShowcase() {
  return (
    <section className="border-t border-warm-black-800 bg-warm-black-950/40">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-20">
        <IssueBand label="ATELIER" issue="EIGHT ROOMS" date="OPEN NOW" />
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="chrome-label">The showcase rooms</div>
            <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
              Eight reference rooms, each a working piece of the framework.
            </h2>
          </div>
          <p className="max-w-md text-sm text-chrome-300">
            Step inside any of them on a monitor or, where it&rsquo;s
            wired, from a headset. Each room is the studio teaching
            itself one thing at a time.
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ATELIER_ROOMS.map((room) => (
            <li key={room.href}>
              <Link
                href={room.href}
                prefetch={false}
                className="group block h-full rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 transition-colors hover:border-pink-200/60 hover:bg-warm-black-900/70"
              >
                <div className="chrome-label text-pink-200">{room.chip}</div>
                <h3 className="mt-2 font-display text-xl text-chrome-100 group-hover:text-pink-100">
                  {room.title}
                </h3>
                <p className="mt-2 text-sm text-chrome-300">{room.blurb}</p>
                <span className="mt-4 inline-block text-xs text-chrome-400 group-hover:text-pink-200">
                  Step inside &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function NowInTheMill() {
  // Tutorials are already sorted date-descending by lib/tutorials.tsx.
  // Filter to kind="tutorial" for safety (every entry is a tutorial,
  // but the type allows other kinds) and take the top five. The
  // Content Mill writes these in voice end-to-end; surfacing the
  // most-recent five is how a visitor sees the bench moving.
  const recent = tutorials
    .filter((t) => t.kind === "tutorial")
    .slice(0, 5);
  if (recent.length === 0) return null;
  return (
    <section className="border-t border-warm-black-800">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-20">
        <IssueBand label="THE MILL" issue="LAST FIVE OUT" date="LIVE" />
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="chrome-label">Now playing in the mill</div>
            <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
              Walkthroughs as they come off the bench.
            </h2>
          </div>
          <Link
            href="/tutorials"
            className="text-sm text-chrome-300 underline underline-offset-4 hover:text-pink-200"
          >
            The full tutorials issue &rarr;
          </Link>
        </div>
        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {recent.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/tutorials/${t.slug}`}
                prefetch={false}
                className="group block h-full rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-4 transition-colors hover:border-pink-200/60 hover:bg-warm-black-900/60"
              >
                <div className="chrome-label text-pink-200">
                  {formatEntryDate(t.date)}
                </div>
                <h3 className="mt-2 font-display text-base leading-snug text-chrome-100 group-hover:text-pink-100">
                  {t.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs text-chrome-300">
                  {t.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ReadNext() {
  // Three most-recent articles. `lib/articles.tsx` is already sorted
  // date-descending. The Carousel below shows commerce; this band
  // shows the magazine.
  const recent = articles.slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <section className="border-t border-warm-black-800 bg-warm-black-900/30">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-20">
        <IssueBand
          label="ARTICLES"
          issue="READ NEXT"
          date={formatEntryDate(recent[0]!.date).toUpperCase()}
        />
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="chrome-label">From the magazine</div>
            <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
              Three pieces to read on the way out.
            </h2>
          </div>
          <Link
            href="/articles"
            className="text-sm text-chrome-300 underline underline-offset-4 hover:text-pink-200"
          >
            The full articles issue &rarr;
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {recent.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                prefetch={false}
                className="group block h-full rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-6 transition-colors hover:border-pink-200/60 hover:bg-warm-black-900/60"
              >
                <div className="chrome-label text-pink-200">
                  {formatEntryDate(a.date)}
                </div>
                <h3 className="mt-3 font-display text-xl leading-snug text-chrome-100 group-hover:text-pink-100">
                  {a.title}
                </h3>
                <p className="mt-3 line-clamp-4 text-sm text-chrome-300">
                  {a.excerpt}
                </p>
                <span className="mt-5 inline-block text-xs text-chrome-400 group-hover:text-pink-200">
                  Read the piece &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FrameworkPlate() {
  // Footer-style plate, sits between the carousel and the Footer
  // proper. Names the studio plainly: WebXR game framework + magazine.
  // The doc link points at the canonical architecture record on
  // GitHub until the on-site /docs route lands.
  return (
    <section className="border-t border-warm-black-800 bg-[#0c0a12]">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-16 md:px-8 md:py-20">
        <IssueBand label="WHAT THIS IS" issue="ONE LINE" />
        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="chrome-label">The studio, plainly</div>
            <h2 className="mt-3 text-3xl md:text-4xl">
              A WebXR game framework, wearing a magazine.
            </h2>
          </div>
          <div className="prose-gallery md:col-span-3">
            <p>
              Under the magazine&rsquo;s typesetting is a working set of
              spatial primitives &mdash; a dual-mode scene shell, a TSL
              material library, a TSL post-process pack, mesh display
              type, a spatial-audio bus, dual-mode camera rigs, an AR
              chrome layer. The atelier rooms above are the reference
              compositions; the tutorials are the bench teaching itself
              out loud; the articles are why any of this is being built.
            </p>
            <p>
              The architecture record is kept{" "}
              <a
                href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/docs/WEBXR-GAME-FRAMEWORK.md"
                target="_blank"
                rel="noreferrer"
                className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
              >
                in the framework doc on GitHub
              </a>
              . Names what&rsquo;s shipped, names what&rsquo;s missing,
              gives the next pair of hands one document to read before
              adding a scene.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
