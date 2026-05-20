import Footer from "components/layout/footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  playLevels,
  getPlayLevel,
  soloLevels,
  type PlayLevel,
  type SoloLevel,
  type BraidedLevel,
} from "lib/play";

import { PlayScene } from "components/play/play-scene";
import { ModuleScene } from "components/play/scenes/module-scene";
import { LoopScene } from "components/play/scenes/loop-scene";
import { WitnessScene } from "components/play/scenes/witness-scene";
import { SovereigntyScene } from "components/play/scenes/sovereignty-scene";
import { CurriculumScene } from "components/play/scenes/curriculum-scene";
import { PerchScene } from "components/play/scenes/perch-scene";
import { BezelScene } from "components/play/scenes/bezel-scene";
import { BraidScene } from "components/play/scenes/braid-scene";

/**
 * Per-level page for the AR proving-ground (the studio's own
 * eight-solo + four-braided ladder). Relocated from /play/[level] to
 * /play/proving-ground/[level] in May 2026 when /play became the
 * GameHub-style hardware-family index (Nintendo / PlayStation / Xbox
 * / Sega / Other). All twelve slugs and their static-param generation
 * are unchanged — only the URL prefix moves.
 *
 * Each page lands the level's data (proves, mechanic, goal,
 * argumentRoutes), a status block that names where the level sits in
 * its life, and a scene mount that is either the live PlayScene (Trail
 * only) or the level-specific stub component. Princess teaching
 * register throughout.
 */

export function generateStaticParams() {
  return playLevels.map((l) => ({ level: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const entry = getPlayLevel(level);
  if (!entry) return { title: "Not found" };
  const phaseLabel = entry.phase === "solo" ? "Solo" : "Braid";
  return {
    title: `${entry.name} — Proving ground, ${phaseLabel} ${entry.level}`,
    description: entry.proves,
  };
}

const STATUS_NOTES: Record<PlayLevel["status"], string> = {
  live:
    "Live. The level is shipping its v1 mechanic; you can play it through and the structure is enforced.",
  preview:
    "In preview. The scene is playable today, but the level structure is not yet enforced — there is no pass/fail gate, just the move on its own.",
  next:
    "Next on the bench. The design has landed; the build is queued and is what the bench is moving toward.",
  planned:
    "Planned. The design exists; the build is queued behind the next-up level. Honest about the gap.",
  future:
    "Future. Designed, queued behind the planned level. Not under active build yet.",
};

const STATUS_TINT: Record<PlayLevel["status"], string> = {
  live: "text-pink-200 border-pink-200/60 bg-pink-200/5",
  preview: "text-pink-200 border-pink-200/40 bg-pink-200/[0.04]",
  next: "text-chrome-100 border-chrome-400/40 bg-warm-black-900/60",
  planned: "text-chrome-300 border-warm-black-700 bg-warm-black-900/50",
  future: "text-chrome-400 border-warm-black-800 bg-warm-black-900/40",
};

function SceneMount({ level }: { level: PlayLevel }) {
  if (level.phase === "braided") {
    return (
      <Suspense fallback={<SceneFallback />}>
        <BraidScene threadCount={level.threadCount} name={level.name} />
      </Suspense>
    );
  }

  switch (level.slug) {
    case "trail":
      return (
        <Suspense fallback={<SceneFallback />}>
          <PlayScene />
        </Suspense>
      );
    case "module":
      return (
        <Suspense fallback={<SceneFallback />}>
          <ModuleScene />
        </Suspense>
      );
    case "loop":
      return (
        <Suspense fallback={<SceneFallback />}>
          <LoopScene />
        </Suspense>
      );
    case "witness":
      return (
        <Suspense fallback={<SceneFallback />}>
          <WitnessScene />
        </Suspense>
      );
    case "sovereignty":
      return (
        <Suspense fallback={<SceneFallback />}>
          <SovereigntyScene />
        </Suspense>
      );
    case "curriculum":
      return (
        <Suspense fallback={<SceneFallback />}>
          <CurriculumScene />
        </Suspense>
      );
    case "perch":
      return (
        <Suspense fallback={<SceneFallback />}>
          <PerchScene />
        </Suspense>
      );
    case "bezel":
      return (
        <Suspense fallback={<SceneFallback />}>
          <BezelScene />
        </Suspense>
      );
    default:
      return null;
  }
}

function SceneFallback() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-sm border border-warm-black-800 bg-[#0c0a12] text-xs text-chrome-500">
      Loading the scene&hellip;
    </div>
  );
}

function PrerequisitesBlock({ level }: { level: BraidedLevel }) {
  const required =
    level.requires.length > 0
      ? level.requires
          .map((slug) => soloLevels.find((s) => s.slug === slug))
          .filter((s): s is SoloLevel => Boolean(s))
      : [];

  return (
    <section className="mt-12">
      <div className="chrome-label mb-3 text-chrome-500">Requires</div>
      {required.length > 0 ? (
        <>
          <p className="mb-4 max-w-prose text-sm text-chrome-300">
            This weave needs every named solo level cleared first. The
            list is the pass-set, not a suggestion.
          </p>
          <ul className="space-y-1.5 border-l-2 border-warm-black-800 pl-5">
            {required.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/play/proving-ground/${s.slug}`}
                  className="text-chrome-100 underline underline-offset-4 hover:text-pink-200"
                >
                  Solo {s.level} &middot; {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="max-w-prose text-sm text-chrome-300">
          Any{" "}
          <span className="text-pink-200">{level.threadCount}</span>{" "}
          solo passes unlock this weave &mdash; you pick which threads
          to braid. The unlock check counts your passed solo levels
          against the weave&rsquo;s thread count at runtime.
        </p>
      )}
    </section>
  );
}

export default async function PlayLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: slug } = await params;
  const level = getPlayLevel(slug);
  if (!level) notFound();

  const isSolo = level.phase === "solo";
  const phaseLabel = isSolo ? `Solo ${level.level}` : `Braid ${level.level}`;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Link
          href="/play/proving-ground"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Back to the ladder
        </Link>

        <div className="mt-10 chrome-label flex flex-wrap items-baseline gap-3 text-pink-200">
          <span>{phaseLabel}</span>
          {!isSolo ? (
            <>
              <span className="text-chrome-500">&middot;</span>
              <span className="text-chrome-300">
                {level.threadCount === 8
                  ? "all eight threads"
                  : `${level.threadCount} threads`}
              </span>
            </>
          ) : null}
        </div>
        <h1 className="mt-3 text-4xl md:text-5xl leading-[1.05] text-chrome-100">
          {level.name}.
        </h1>
        <p className="mt-6 max-w-prose text-lg text-chrome-200 leading-relaxed">
          {level.proves}
        </p>

        <section className="mt-12">
          <div className="chrome-label mb-2 text-chrome-500">
            What this level proves
          </div>
          <p className="max-w-prose text-chrome-300">{level.proves}</p>
        </section>

        <section className="mt-10">
          <div className="chrome-label mb-2 text-chrome-500">
            How it plays
          </div>
          <p className="max-w-prose text-chrome-300">{level.mechanic}</p>
        </section>

        <section className="mt-10">
          <div className="chrome-label mb-2 text-chrome-500">
            Pass condition
          </div>
          <p className="max-w-prose text-chrome-300">{level.goal}</p>
        </section>

        <section
          className={`mt-10 rounded-sm border p-5 ${STATUS_TINT[level.status]}`}
        >
          <div className="chrome-label">
            Status &middot; {level.status}
          </div>
          <p className="mt-2 max-w-prose text-sm">
            {STATUS_NOTES[level.status]}
          </p>
        </section>

        {!isSolo ? <PrerequisitesBlock level={level as BraidedLevel} /> : null}

        <section className="mt-12">
          <SceneMount level={level} />
        </section>

        {level.argumentRoutes.length > 0 ? (
          <section className="mt-14">
            <div className="chrome-label mb-3 text-pink-200">
              Arguments for this thread
            </div>
            <p className="mb-4 max-w-prose text-sm text-chrome-300">
              The pieces below make this level&rsquo;s argument in
              prose. The level is the proof; these are the warrant.
            </p>
            <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
              {level.argumentRoutes.map((r) => (
                <li key={r.href} className="py-4">
                  <Link
                    href={r.href}
                    className="group block"
                    prefetch={true}
                  >
                    <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                      {r.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16">
          <div className="chrome-label mb-3 text-chrome-500">
            Where this sits
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            <li className="py-4">
              <Link href="/play/proving-ground" className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The ladder
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Twelve levels, one ladder. Back to the proving
                  ground&rsquo;s table of contents.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link href="/play" className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  All games &middot; the hardware index
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Five families, every system, click a tile to play.
                  This proving ground is one of the things the index
                  links to.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link href="/the-loop" className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The Holoflow Loop
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Where the proving ground sits in the studio&rsquo;s
                  organising shape. Position six made playable.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link href="/learn" className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  Learn &mdash; the curriculum
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Seven ladders that argue the same threads as the
                  game, in prose, with rungs the body can climb.
                </p>
              </Link>
            </li>
            <li className="py-4">
              <Link href="/rookery" className="group block">
                <span className="text-lg text-chrome-100 underline underline-offset-4 group-hover:text-pink-200">
                  The Rookery
                </span>
                <p className="mt-1 max-w-prose text-sm text-chrome-300">
                  Where the trail goes once the publish pipe lands.
                  The Perch level is the route through the door.
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
