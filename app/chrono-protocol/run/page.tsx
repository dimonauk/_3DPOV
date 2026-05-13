import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import { GameCanvas } from "components/chrono-protocol/game-canvas";
import { getZoneBySlug, isZoneSlug, zones } from "lib/chrono-protocol/zones";

export const metadata = {
  title: "Chrono-Protocol &middot; Run",
  description:
    "The runner. v0.1 stub &mdash; tunnel mounts, wheel is interactive, dialogue cycles the canon bank. Combat and motion land in subsequent waves.",
};

type SearchParams = { zone?: string };

/**
 * Run page.
 *
 * v0.1 stub: mounts the GameCanvas with the requested zone. Combat,
 * enemy spawn, win conditions, and motion are all TODO and named to
 * the corresponding waves of the build plan.
 *
 * The page reads ?zone=[slug] from the query string. Missing or invalid
 * slug falls back to leake-st-arches (the tutorial).
 */
export default async function RunPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requested = params.zone ?? "leake-st-arches";

  if (!isZoneSlug(requested)) {
    redirect("/chrono-protocol/hub");
  }
  const zone = getZoneBySlug(requested);
  if (!zone) {
    redirect("/chrono-protocol/hub");
  }

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="chrome-label">
          Chrono-Protocol &middot; Run &middot; {zone.name}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-3xl text-chrome-100 md:text-4xl">
            {zone.name}
          </h1>
          <div className="flex gap-2 text-xs">
            <Link
              href={`/chrono-protocol/zone/${zone.slug}`}
              className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-1.5 text-chrome-300 hover:border-pink-200/40 hover:text-pink-200"
            >
              &larr; Briefing
            </Link>
            <Link
              href="/chrono-protocol/hub"
              className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-1.5 text-chrome-300 hover:border-pink-200/40 hover:text-pink-200"
            >
              HUB
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <Suspense
            fallback={
              <div className="flex h-[70vh] w-full items-center justify-center rounded-sm border border-warm-black-800 bg-[#0c0a12] text-xs text-chrome-500">
                Mounting the canvas&hellip;
              </div>
            }
          >
            <GameCanvas zone={zone} mode="run" />
          </Suspense>
        </section>

        <section className="mt-8 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
          <div className="chrome-label mb-2 text-chrome-500">
            v0.1 honest scope
          </div>
          <ul className="space-y-2 border-l-2 border-warm-black-800 pl-5 text-sm text-chrome-200">
            <li>
              The tunnel geometry mounts. Ten arched ribs receding into
              the distance.
            </li>
            <li>
              The mode wheel is interactive. Click any node to switch
              modes; the HUD chip and tunnel tint update.
            </li>
            <li>
              The dialogue overlay runs on a cycle through the canon
              bank for this zone, so the voice register is live before
              any combat is.
            </li>
            <li>
              The poi anchors render as visible stubs. Pointer / touch /
              gamepad gesture lands in Wave 3.
            </li>
            <li>
              Enemy spawn, combat, win conditions, score persistence:
              Waves 4 and 6. See{" "}
              <Link
                href="/articles/neo-london-chrono-protocol"
                className="text-pink-200 underline underline-offset-4"
              >
                the bridge article
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="mt-6 text-xs text-chrome-500">
          <p>
            Total zones registered: {zones.length}. Active zone slug:{" "}
            <code className="text-pink-200">{zone.slug}</code>.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
