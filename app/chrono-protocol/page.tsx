import Link from "next/link";

import Footer from "components/layout/footer";
import { ZoneCard } from "components/chrono-protocol/zone-card";
import { zones } from "lib/chrono-protocol/zones";

export const metadata = {
  title: "Neo-London: Chrono-Protocol — the city",
  description:
    "The proving ground graduates the body into a city. Wireframe London, three zones, the five-mode wheel, three constructs &mdash; Aura, Yow, Purp &mdash; on the player&rsquo;s side. Prototype on disk; site-side scaffolding live.",
};

export default function ChronoProtocolLandingPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Neo-London: Chrono-Protocol</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The city.
        </h1>

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>
            The game the ladder graduates into. The proving ground at{" "}
            <Link
              href="/play"
              className="text-pink-200 underline underline-offset-4"
            >
              /play
            </Link>{" "}
            isolates and proves each thread of the studio&rsquo;s
            practice; the runner here is what the body does once the
            full weave holds for a minute. Wireframe London at twelve
            units a second &mdash; arch-ribbed tunnels rushing toward
            the camera, dual-thumb poi controls, magenta bloom catching
            every tenth rib. The bridge article at{" "}
            <Link
              href="/articles/neo-london-chrono-protocol"
              className="text-pink-200 underline underline-offset-4"
            >
              Neo-London: Chrono-Protocol
            </Link>{" "}
            names what this is, in full prose. This page is where the
            game itself lives.
          </p>
          <p>
            The runner runs on a five-mode wheel &mdash; AMBER, AZURE,
            AMETHYST, CRIMSON, VERIDIAN &mdash; inheriting the
            structural logic of the Magic: the Gathering colour pie.
            Every mode has two allies on the wheel and two enemies
            opposite it; the player switches modes mid-run to match the
            enemy in front of them. The full canon for the wheel lives
            in{" "}
            <Link
              href="/articles/the-practice-in-eight-threads"
              className="text-pink-200 underline underline-offset-4"
            >
              the practice article
            </Link>
            ; the constructs holding each slot &mdash; Aura at AZURE,
            Yow at VERIDIAN, Purp at AMETHYST, AMBER and CRIMSON
            pending &mdash; are named alongside.
          </p>
          <p>
            Three zones in order of difficulty: Leake Street Arches
            (the Safehouse, tutorial), the Royal Mile (Trafalgar to
            Regent St, normal), Soho Grid (Carnaby Data Stream, hard).
            Each carries its own enemy roster, its own boss, its own
            chorus of narrating constructs. The zones are also the
            first three capture targets of the studio&rsquo;s SHARP
            splat pipeline; the splat library at{" "}
            <Link
              href="/play/neo-london"
              className="text-pink-200 underline underline-offset-4"
            >
              /play/neo-london
            </Link>{" "}
            is the volumetric pass under the runner&rsquo;s wireframe.
            Same city. Two passes. One body.
          </p>
        </section>

        <section className="mt-10 rounded-sm border border-pink-200/40 bg-pink-200/5 p-5">
          <div className="chrome-label text-pink-200">
            Prototype &middot; site-side scaffolding live
          </div>
          <p className="mt-2 text-sm text-chrome-300">
            The runner&rsquo;s code lives in the Hangar at{" "}
            <code className="text-pink-200">
              apps/prototypes/neo-london-chrono-protocol
            </code>
            . The site holds the route, the data, the state machine,
            and the load-bearing UI &mdash; the mode wheel, the HUD,
            the dialogue overlay, the zone cards. Gameplay
            implementation lands in waves: motion + ribs, then poi
            physics, then combat, then splat backdrops, then LLM
            dialogue. The build plan at{" "}
            <code className="text-pink-200">
              docs/CHRONO_PROTOCOL_BUILD_PLAN.md
            </code>{" "}
            names the wave ladder honestly.
          </p>
        </section>

        <section className="mt-14">
          <div className="chrome-label mb-3 text-pink-200">
            The three zones
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {zones.map((z) => (
              <ZoneCard
                key={z.slug}
                zone={z}
                unlocked={z.slug === "leake-st-arches"}
                lockReason={
                  z.slug === "royal-mile"
                    ? "Clear the Safehouse"
                    : z.slug === "soho-grid"
                      ? "Clear the Royal Mile"
                      : undefined
                }
              />
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/chrono-protocol/hub"
            className="inline-flex items-center gap-2 rounded-sm border border-pink-200/40 bg-pink-200/5 px-4 py-2 text-sm text-pink-200 transition-colors hover:bg-pink-200/10"
          >
            Enter the HUB &rarr;
          </Link>
          <Link
            href="/chrono-protocol/creative"
            className="inline-flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-2 text-sm text-chrome-200 transition-colors hover:border-pink-200/40 hover:text-pink-200"
          >
            Free mode (Creative)
          </Link>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
          <div className="chrome-label mb-3 text-chrome-500">
            How the runner reads the wheel
          </div>
          <ul className="space-y-2 border-l-2 border-warm-black-800 pl-5 text-sm text-chrome-200">
            <li>
              Match the enemy&rsquo;s weakness: 2x score, full damage.
            </li>
            <li>
              Use a mode adjacent to the weakness on the wheel
              (sympathetic): 1.25x score.
            </li>
            <li>
              Use a mode opposite the weakness (off-angle): 0.5x score,
              reduced damage out.
            </li>
            <li>
              Every five-clear combo bumps the next clear by an extra
              ten percent, capped at +1.0.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <div className="chrome-label mb-3 text-chrome-500">
            Where this sits
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            <li className="py-4">
              <Link
                href="/articles/neo-london-chrono-protocol"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Neo-London: Chrono-Protocol &mdash; the bridge
                  article
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The full Aura-register exposition. What the runner is,
                  how the zones map to the splat library, the four-then-
                  five modes story, the three constructs as
                  cognitive-coded chorus.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/play"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  /play &mdash; the proving ground
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The eight solo levels and four braided weaves the
                  runner asks the player to have already passed.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/play/neo-london"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  /play/neo-london &mdash; the splat library
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The volumetric pass under the runner&rsquo;s
                  wireframe. Where each SHARP-generated splat lands as
                  it&rsquo;s built.
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
