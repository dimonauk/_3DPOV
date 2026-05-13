import Footer from "components/layout/footer";
import Link from "next/link";
import { LondonMap } from "components/neo-london/london-map";
import {
  zones,
  ZONE_COUNT_BY_STATUS,
} from "lib/neo-london/zones";

export const metadata = {
  title: "Neo-London — the studio’s playground, in pieces",
  description:
    "Gaussian splats generated from CCTV grabs and the studio's ten-year 360 walking archive, plotted on a stylised London map. Each pin is a location the bench has produced or will produce a splat for. Walkable in three dimensions once the .ply lands.",
};

export default function NeoLondonPage() {
  const totalZones = zones.length;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          The studio&rsquo;s playground, in pieces
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Neo-London.
        </h1>

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>
            Apple open-sourced{" "}
            <a
              href="https://github.com/apple/ml-sharp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-200 underline underline-offset-4"
            >
              SHARP
            </a>{" "}
            in December 2025: a single-image to gaussian-splat model
            that runs on a laptop and converts a flat frame into a
            three-dimensional scene in roughly ten seconds. The
            studio is feeding it two source pools &mdash; the
            ten-year 360 walking archive (her own routes, named in{" "}
            <Link
              href="/articles/london-360-walking"
              className="text-pink-200 underline underline-offset-4"
            >
              the camera-evolution piece
            </Link>
            ) and a steadily-growing pile of London CCTV grabs (TFL
            JamCams and other public feeds). Each generated splat
            gets pinned here at the latitude and longitude of its
            source frame and rendered as a three-dimensional scene on
            its own page.
          </p>
          <p>
            This page is the destination. The pipeline that produces
            the splats runs locally on the bench; the runbook is in{" "}
            <Link
              href="/docs/SHARP_PIPELINE"
              className="text-pink-200 underline underline-offset-4"
            >
              SHARP_PIPELINE.md
            </Link>
            . The map below is built; the splats are generating one
            at a time. Most zones are pending. The pipeline is here;
            the bench is filling it.
          </p>
          <p>
            The neo-London being assembled is being assembled out of
            two kinds of footage: footage the studio captured herself
            on a walking pole, and footage the city captured on her
            without asking. That is the political shape of the
            project, named on this page so it does not have to be
            named anywhere else. The two source streams sit in the
            same data model and end up on the same map.
          </p>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
          <div className="chrome-label mb-3 text-chrome-500">
            Where the build is
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
            <StatusTally
              label="Placeholder"
              count={ZONE_COUNT_BY_STATUS.placeholder}
              tone="text-chrome-400"
            />
            <StatusTally
              label="Frame captured"
              count={ZONE_COUNT_BY_STATUS["frame-captured"]}
              tone="text-chrome-200"
            />
            <StatusTally
              label="Splat rendered"
              count={ZONE_COUNT_BY_STATUS["splat-rendered"]}
              tone="text-pink-200"
            />
            <StatusTally
              label="Mesh added"
              count={ZONE_COUNT_BY_STATUS["mesh-added"]}
              tone="text-arcane-gold"
              toneFallback="#ffd700"
            />
            <StatusTally
              label="Playable"
              count={ZONE_COUNT_BY_STATUS.playable}
              tone="text-cyber-cyan"
              toneFallback="#00f3ff"
            />
          </div>
          <p className="mt-4 text-xs text-chrome-500">
            {totalZones} zone{totalZones === 1 ? "" : "s"} on the map.
            The tally is honest. A zone only moves forward when the
            file lands.
          </p>
        </section>

        <section className="mt-12">
          <LondonMap zones={zones} />
          <p className="mt-3 text-xs text-chrome-500">
            Hand-traced Thames + canal spines, not survey data.
            Regent&rsquo;s Canal, Limehouse Cut, and the River Lea are
            the three corridors the eventual gameplay treats as
            canal-fast-travel. Click a pin to open the zone page.
          </p>
        </section>

        <section className="mt-12">
          <div className="chrome-label mb-3 text-pink-200">
            All zones
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {zones.map((zone) => (
              <li key={zone.slug}>
                <Link
                  href={`/play/neo-london/zone/${zone.slug}`}
                  prefetch={true}
                  className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 transition-colors hover:border-pink-200/40"
                >
                  <div className="chrome-label flex flex-wrap items-baseline gap-2 text-chrome-500">
                    <span>{zone.source}</span>
                    <span>&middot;</span>
                    <span className="text-chrome-400">
                      {zone.status}
                    </span>
                  </div>
                  <div className="mt-1 text-base text-chrome-100 group-hover:text-pink-200">
                    {zone.name}
                  </div>
                  <p className="mt-1 text-xs text-chrome-400">
                    {zone.notes}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-chrome-500">
                    {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label mb-3 text-chrome-500">
            What this is for
          </div>
          <p className="text-chrome-300">
            Two reasons. First, the obvious one &mdash; the studio
            wants a walkable model of the bits of London she has
            walked. Each splat is a frame she stood in front of. Once
            the renderer lands, the page is a small standing record
            of the walk. Second, the less-obvious one &mdash; the
            same scaffold accepts CCTV grabs. The city is being
            captured by its own infrastructure all the time. The
            splat pipeline turns those grabs into walkable scenes too,
            which is what the eventual game runs on top of. Same data
            model, same map, two sources.
          </p>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3 text-chrome-500">
            Cross-references
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            <li className="py-4">
              <Link
                href="/articles/london-360-walking"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  London 360 Walking &mdash; the camera evolution
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The article that names the routes seeded into this
                  map. Bankside, Limehouse Cut, Smithfield,
                  Regent&rsquo;s Canal, the tideway, Rotherhithe. The
                  source archive end of the pipeline.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/the-loop"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The Holoflow Loop
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Position four of the loop is the trail cast into a
                  body that holds. A walkable splat is one of those
                  bodies; the map is the surface that surfaces them.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link href="/play" prefetch={true} className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Play
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Where the AR side of the studio&rsquo;s game sits.
                  Neo-London is the world the eventual long-form
                  version walks the player through; the solo levels at
                  /play are its grammar lessons.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/articles/ungrounded"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Ungrounded
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The companion piece on disembodied capture &mdash;
                  why having a model of a place you have walked is not
                  the same as having walked it. The footnote this
                  page is built against.
                </p>
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

function StatusTally({
  label,
  count,
  tone,
  toneFallback,
}: {
  label: string;
  count: number;
  tone: string;
  toneFallback?: string;
}) {
  // The tone classes assume tailwind 4 with the studio&rsquo;s palette
  // tokens; if a token is unknown we fall back to an inline colour so
  // the digit still reads as itself.
  const style = toneFallback ? { color: toneFallback } : undefined;
  return (
    <div>
      <div className="chrome-label text-[0.6rem] text-chrome-500">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl ${tone}`}
        style={style}
      >
        {count.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
