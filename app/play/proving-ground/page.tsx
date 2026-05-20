import Footer from "components/layout/footer";
import Link from "next/link";
import { Suspense } from "react";
import { PlayScene } from "components/play/play-scene";
import { ProgressBlock } from "components/play/progress-block";
import {
  soloLevels,
  braidedLevels,
  playLevels,
  type SoloLevel,
  type BraidedLevel,
} from "lib/play";

/**
 * The AR proving-ground ladder — relocated from /play to
 * /play/proving-ground in May 2026 when /play became the GameHub-style
 * hardware-family index. The eight solo + four braided structure is
 * unchanged; only the URL prefix moves. Every internal link below
 * already carries the new /play/proving-ground/<slug> shape.
 */

export const metadata = {
  title: "The proving ground — the studio's AR ladder",
  description:
    "The AR game is the proving ground for the studio's philosophy. Solo levels prove each thread individually; braided levels — the 2-braid, 3-beat weave, 5-beat, and full weave — teach the player to weave them together. Position six of the Holoflow Loop, made playable.",
};

export default function ProvingGroundIndexPage() {
  const liveSolo = soloLevels.filter(
    (l) => l.status === "live" || l.status === "preview",
  );
  const upcomingSolo = soloLevels.filter(
    (l) => l.status !== "live" && l.status !== "preview",
  );

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Link
          href="/play"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Back to all games
        </Link>

        <div className="mt-10 chrome-label">
          The studio&rsquo;s proving ground
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The ladder.
        </h1>

        <ProgressBlock />

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>
            The AR game is not a single product. It is a two-phase
            ladder. The first phase is eight solo levels: each
            isolates and proves one thread of the studio&rsquo;s
            philosophy by being that thread. The second phase is
            braided levels &mdash; the 2-braid, the 3-beat weave, the
            5-beat, the full weave &mdash; where the player learns to
            combine threads the way the body learns to combine poi
            moves. The structure is the studio&rsquo;s own movement
            pedagogy applied to philosophical thought.
          </p>
          <p>
            The proof is recursive. The game proves modularity by
            being modular. It proves persistence-of-vision by
            rendering angular-sync. It proves the Loop by closing it
            inside one session. And the solo-then-braided structure
            proves the pedagogy itself by being the pedagogy &mdash;
            poi is taught the same way.
          </p>
          <p>
            This page is also position six of{" "}
            <Link
              href="/the-loop"
              className="text-pink-200 underline underline-offset-4"
            >
              the Holoflow Loop
            </Link>{" "}
            &mdash; the position the studio cannot fill alone, where
            someone else picks up the gesture. The proving ground is
            the loop&rsquo;s closing rung made playable.
          </p>
        </section>

        <section className="mt-14">
          <div className="chrome-label mb-3 text-pink-200">
            Phase one &middot; solo &middot; playable now
          </div>
          <div className="space-y-3">
            {liveSolo.map((level) => (
              <SoloRow key={level.slug} level={level} highlighted />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
          <div className="chrome-label mb-3 text-chrome-500">
            How to play the Trail
          </div>
          <ul className="space-y-2 border-l-2 border-warm-black-800 pl-5 text-sm text-chrome-200">
            <li>
              Hold the phone level for a moment to anchor the room
              &mdash; the room is the canvas.
            </li>
            <li>
              Swing through the air. The trail draws itself behind the
              pointer.
            </li>
            <li>
              Release to publish. On a Quest, pull the trigger to
              start the line and release it to commit.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <Suspense
            fallback={
              <div className="flex h-[60vh] w-full items-center justify-center rounded-sm border border-warm-black-800 bg-[#0c0a12] text-xs text-chrome-500">
                Loading the scene&hellip;
              </div>
            }
          >
            <PlayScene />
          </Suspense>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label mb-3 text-chrome-500">
            What this is
          </div>
          <p className="text-chrome-300">
            A WebXR prototype. The Trail level is playable as a
            preview today &mdash; the angular-sync render works on
            desktop with a mouse, on Android Chrome with touch, and
            on a Quest 3 in the headset browser with the controller
            (XR session button still stubbed pending the @react-three/xr
            install). The other seven solo levels and the four
            braided weaves ship as the bench delivers them. Aura
            will narrate every level&rsquo;s pass in her own voice
            once the audio synth is wired in.
          </p>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3 text-pink-200">
            Phase one &middot; the remaining seven solo levels
          </div>
          <p className="mb-6 max-w-prose text-sm text-chrome-300">
            Each level below isolates one thread of the
            studio&rsquo;s philosophy. The player can attempt them in
            any order &mdash; solo levels have no prerequisites
            between them. The status flag is honest.
          </p>
          <ol className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {upcomingSolo.map((level) => (
              <li key={level.slug} className="py-5">
                <SoloDetail level={level} />
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3 text-pink-200">
            Phase two &middot; the braided weaves
          </div>
          <p className="mb-6 max-w-prose text-sm text-chrome-300">
            Once the player has cleared enough solo levels, the
            braided weaves unlock. Each weave teaches what no single
            thread teaches: that the threads inform each other. Named
            after the poi vocabulary the studio learned them in.
          </p>
          <ol className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {braidedLevels.map((level) => (
              <li key={level.slug} className="py-5">
                <BraidedDetail level={level} />
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3 text-pink-200">
            Browse levels
          </div>
          <p className="mb-6 max-w-prose text-sm text-chrome-300">
            Every level has its own page. Each one names what it
            proves, how it plays, and what has to land before the
            scene can be played in full.
          </p>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {playLevels.map((level) => (
              <li key={level.slug}>
                <Link
                  href={`/play/proving-ground/${level.slug}`}
                  prefetch={true}
                  className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 transition-colors hover:border-pink-200/40"
                >
                  <div className="chrome-label flex flex-wrap items-baseline gap-2 text-chrome-500">
                    <span>
                      {level.phase === "solo"
                        ? `Solo ${level.level}`
                        : `Braid ${level.level}`}
                    </span>
                    <span>&middot;</span>
                    <span className="text-chrome-400">{level.status}</span>
                  </div>
                  <div className="mt-1 text-base text-chrome-100 group-hover:text-pink-200">
                    {level.name}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <div className="chrome-label mb-3 text-chrome-500">
            Where this sits in the loop
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
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
                  The full diagram &mdash; six positions, one closed
                  circuit. This page is position six made playable.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/articles/why-i-build-modular"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Why I Build Modular
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The philosophy this ladder demonstrates in prose;
                  the article the game is the proof of.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/rookery"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The Rookery
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Where the trail goes once the publish pipe is
                  wired in. The append-only feed for the next pair of
                  hands.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link
                href="/articles/sellotape-and-tilt-brush"
                prefetch={true}
                className="group block"
              >
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Sellotape and Tilt Brush
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  The origin story for drawing-in-air-with-a-controller.
                  Where this page&rsquo;s ambition came from.
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

function SoloRow({
  level,
  highlighted = false,
}: {
  level: SoloLevel;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-sm border border-pink-200/40 bg-pink-200/5 p-5"
          : "rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5"
      }
    >
      <div className="chrome-label mb-1 flex flex-wrap items-baseline gap-3 text-chrome-500">
        <span>Solo {level.level}</span>
        <span>&middot;</span>
        <span className="text-chrome-400">{level.status}</span>
      </div>
      <h2 className="text-2xl text-chrome-100">
        <Link
          href={`/play/proving-ground/${level.slug}`}
          className="underline-offset-4 hover:text-pink-200 hover:underline"
        >
          {level.name}
        </Link>
      </h2>
      <p className="mt-1 max-w-prose text-chrome-300">{level.mechanic}</p>
      <p className="mt-2 max-w-prose text-sm text-chrome-400 italic">
        Proves: {level.proves}
      </p>
      <p className="mt-2 max-w-prose text-sm text-chrome-500">
        Goal: {level.goal}
      </p>
      {level.argumentRoutes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {level.argumentRoutes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="chrome-label text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              {r.label} &rarr;
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SoloDetail({ level }: { level: SoloLevel }) {
  return (
    <>
      <div className="chrome-label mb-1 flex flex-wrap items-baseline gap-3 text-chrome-500">
        <span>Solo {level.level}</span>
        <span>&middot;</span>
        <span className="text-chrome-400">{level.status}</span>
      </div>
      <h3 className="text-xl text-chrome-100">
        <Link
          href={`/play/proving-ground/${level.slug}`}
          className="underline-offset-4 hover:text-pink-200 hover:underline"
        >
          {level.name}
        </Link>
      </h3>
      <p className="mt-1 max-w-prose text-sm text-chrome-300">
        {level.mechanic}
      </p>
      <p className="mt-2 max-w-prose text-sm text-chrome-400 italic">
        Proves: {level.proves}
      </p>
      {level.argumentRoutes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {level.argumentRoutes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="chrome-label text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              {r.label} &rarr;
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

function BraidedDetail({ level }: { level: BraidedLevel }) {
  return (
    <>
      <div className="chrome-label mb-1 flex flex-wrap items-baseline gap-3 text-chrome-500">
        <span>Braid {level.level}</span>
        <span>&middot;</span>
        <span className="text-pink-200">
          {level.threadCount === 8
            ? "all eight threads"
            : `${level.threadCount} threads`}
        </span>
        <span>&middot;</span>
        <span className="text-chrome-400">{level.status}</span>
      </div>
      <h3 className="text-xl text-chrome-100">
        <Link
          href={`/play/proving-ground/${level.slug}`}
          className="underline-offset-4 hover:text-pink-200 hover:underline"
        >
          {level.name}
        </Link>
      </h3>
      <p className="mt-1 max-w-prose text-sm text-chrome-300">
        {level.mechanic}
      </p>
      <p className="mt-2 max-w-prose text-sm text-chrome-400 italic">
        Proves: {level.proves}
      </p>
      <p className="mt-2 max-w-prose text-sm text-chrome-500">
        Goal: {level.goal}
      </p>
      {level.argumentRoutes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {level.argumentRoutes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="chrome-label text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              {r.label} &rarr;
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
