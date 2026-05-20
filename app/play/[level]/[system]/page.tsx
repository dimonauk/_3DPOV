import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { PlayBar } from "components/play/PlayBar";
import {
  getFamily,
  getSystem,
  isFamilySlug,
  summariseLaunches,
} from "lib/play/families";

/**
 * /play/[level]/[system] — per-system focused view.
 *
 * The dynamic segment is named `level` for the same historical reason
 * as the parent route — see the parent page.tsx for the full note.
 * Conceptually `level` is the family slug and `system` is the system
 * slug; the page enforces both must be valid AND the system must
 * belong to the named family before rendering.
 *
 * Layout: a large primitive-fallback display strip for the device, the
 * year + manufacturer + generation, the full PlayBar (every launch
 * path the system has, primary first), an "available via" subsection
 * naming the launcher per path, and codex cross-references where the
 * system has one.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; system: string }>;
}) {
  const { level, system } = await params;
  const entry = getSystem(system);
  if (!entry || entry.family !== level) return { title: "Play" };
  return {
    title: `${entry.name} — Play, ${entry.year}`,
    description: entry.blurb,
  };
}

const GEN_LABEL: Record<number, string> = {
  1: "First-generation",
  2: "Second-generation",
  3: "Third-generation (8-bit)",
  4: "Fourth-generation (16-bit)",
  5: "Fifth-generation (early 3D)",
  6: "Sixth-generation",
  7: "Seventh-generation",
  8: "Eighth-generation",
  9: "Ninth-generation",
};

export default async function PlaySystemPage({
  params,
}: {
  params: Promise<{ level: string; system: string }>;
}) {
  const { level, system } = await params;

  if (!isFamilySlug(level)) notFound();

  const entry = getSystem(system);
  if (!entry || entry.family !== level) notFound();

  const family = getFamily(entry.family);
  if (!family) notFound();

  const summary = summariseLaunches(entry);
  const accent = family.accent;

  return (
    <>
      <IssueBand
        label="PLAY"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher={entry.shortName.toUpperCase()}
      />

      <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <Link
          href={`/play/${family.slug}`}
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Back to {family.name}
        </Link>

        <header className="mt-10 flex flex-col gap-4">
          <div className="chrome-label flex flex-wrap items-baseline gap-2 text-pink-200">
            <span>{family.name}</span>
            <span className="text-chrome-500">&middot;</span>
            <span className="text-chrome-300">{entry.year}</span>
            {GEN_LABEL[entry.generation] && (
              <>
                <span className="text-chrome-500">&middot;</span>
                <span className="text-chrome-400">
                  {GEN_LABEL[entry.generation]}
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-6xl text-chrome-100">
            {entry.name}.
          </h1>
          <p className="max-w-2xl text-lg text-chrome-200">{entry.blurb}</p>
        </header>

        <div
          aria-hidden
          className="mt-10 h-72 w-full overflow-hidden rounded-sm border border-warm-black-800"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, rgba(12,10,18,0.96) 75%)`,
          }}
        >
          <div className="relative h-full w-full">
            <div
              className="absolute inset-x-0 bottom-0 h-24"
              style={{
                background:
                  "linear-gradient(to top, rgba(12,10,18,0.92), transparent)",
              }}
            />
            {!entry.modelUrl && (
              <div className="chrome-label absolute right-3 bottom-3 rounded-sm bg-warm-black-950/85 px-2 py-1 text-[0.6rem] text-chrome-300">
                Primitive fallback &middot; GLB pending
              </div>
            )}
          </div>
        </div>

        <section className="mt-10">
          <div className="chrome-label mb-2 text-pink-200">Play now</div>
          <p className="max-w-prose text-sm text-chrome-300">
            The primary path is the first one the studio recommends for
            this system. Every alternative below it is honest about
            what it gives up.
          </p>
          <PlayBar launches={entry.launch} />
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
          <div className="chrome-label mb-3 text-chrome-500">Available via</div>
          <ul className="space-y-3 text-sm text-chrome-200">
            {summary.browser.length > 0 && (
              <li>
                <span className="chrome-label text-pink-200">
                  EmulatorJS &middot; browser WASM
                </span>
                <p className="mt-1 text-chrome-300">
                  Runs the libretro WASM core in this browser tab. Picks
                  up your ROM from your own disk through the file
                  picker. Nothing uploads. Native speed on most systems
                  up to PS1.
                </p>
              </li>
            )}
            {summary.vr.length > 0 && (
              <li>
                <span className="chrome-label text-pink-200">
                  WebXR Room &middot; the same core, in a headset
                </span>
                <p className="mt-1 text-chrome-300">
                  Stand in front of a virtual CRT with the console on
                  the side table. The libretro WASM core renders to the
                  TV in stereo. Quest 3 browser + controller; desktop +
                  mouse also works.
                </p>
              </li>
            )}
            {summary.bench.length > 0 && (
              <li>
                <span className="chrome-label text-pink-200">
                  Bench bridge &middot; native emulator over Tailscale
                </span>
                <p className="mt-1 text-chrome-300">
                  The system needs a native emulator with a JIT — the
                  browser sandbox cannot run one. The bench bridge
                  routes the native app over Tailscale Funnel + bearer
                  token. The studio doesn&rsquo;t see your ROM; the
                  bridge bench reads it from your storage.
                </p>
                <ul className="mt-2 ml-4 list-disc text-xs text-chrome-400">
                  {summary.bench.map((b, i) => {
                    if (b.kind !== "bench-bridge") return null;
                    return (
                      <li key={i}>
                        <Link
                          href={b.doc}
                          className="text-pink-200 underline-offset-4 hover:underline"
                        >
                          {b.emulator}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}
            {summary.comingSoon && (
              <li>
                <span className="chrome-label text-chrome-500">
                  Coming soon
                </span>
                <p className="mt-1 text-chrome-400">
                  Catalogued, no launcher wired yet. The studio
                  isn&rsquo;t shipping a PS4 / PS5 / Xbox One / Series
                  emulator path until the legal and bench shape on each
                  is honest.
                </p>
              </li>
            )}
          </ul>
        </section>

        {entry.codexSlug && (
          <section className="mt-10">
            <div className="chrome-label mb-2 text-chrome-500">
              Read more &middot; codex
            </div>
            <Link
              href={`/codex/${entry.codexSlug}`}
              className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 hover:border-pink-200/30"
            >
              <span className="text-lg text-chrome-100 group-hover:text-pink-200">
                Codex entry: {entry.codexSlug}
              </span>
              <p className="mt-1 text-sm text-chrome-300">
                The studio&rsquo;s reference page on the emulator
                lineage behind this system &mdash; the active forks,
                the licence map, the 2024 takedown context.
              </p>
            </Link>
          </section>
        )}

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6 text-sm text-chrome-300">
          <div className="chrome-label text-pink-200">BYO ROM, always</div>
          <p className="mt-3">
            The studio doesn&rsquo;t host ROMs or BIOS files. Bring a
            dump from a console you own. The browser path keeps the
            bytes in your tab; the WebXR path keeps them in your
            session; the bench-bridge path keeps them on your bench. No
            uploads cross the studio&rsquo;s wire.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
