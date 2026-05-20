import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { SectionOpener } from "components/luxe/SectionOpener";
import { FamilyShelf } from "components/play/FamilyShelf";
import { getPlayLevel } from "lib/play";
import {
  FAMILIES,
  getFamily,
  isFamilySlug,
  systemsByFamily,
} from "lib/play/families";

/**
 * /play/[level] — dual-purpose route.
 *
 * The dynamic segment is named `level` for historical reasons (the
 * folder pre-existed and the operator sandbox blocks deleting directory
 * names that contain square brackets). Conceptually it carries either:
 *
 *   - a family slug from `lib/play/families.ts` — nintendo, playstation,
 *     xbox, sega, other — in which case we render the per-family page;
 *
 *   - a legacy proving-ground level slug — module, trail, loop, etc.
 *     — in which case we 308-redirect to the canonical location at
 *     /play/proving-ground/<slug>.
 *
 * Anything else 404s.
 *
 * Direction (Dimona, 2026-05-19): "all nintendo, playstation, xbox
 * systems with gamehub light and such at the top, its all in games".
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const family = getFamily(level);
  if (!family) return { title: "Play" };
  return {
    title: `${family.name} — every system in the catalogue`,
    description: `${family.tagline} ${systemsByFamily(family.slug).length} systems, every one with its preferred launch path. BYO ROM.`,
  };
}

export default async function PlayFamilyPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;

  // Legacy AR proving-ground levels — redirect to the relocated route.
  if (getPlayLevel(level)) {
    redirect(`/play/proving-ground/${level}`);
  }

  if (!isFamilySlug(level)) notFound();

  const family = getFamily(level);
  if (!family) notFound();

  const systems = systemsByFamily(family.slug);

  return (
    <>
      <IssueBand
        label="PLAY"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher={family.name.toUpperCase()}
      />

      <article className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <Link
          href="/play"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; All games
        </Link>

        <div className="mt-8">
          <SectionOpener
            numeral={String(systems.length).padStart(2, "0")}
            sectionLabel={family.name.toUpperCase()}
            strapline={family.tagline}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-1.5 w-24 rounded-sm"
            style={{ background: family.accent }}
          />
          <p className="chrome-label text-chrome-400">
            {family.name} family &middot; {systems.length} system
            {systems.length === 1 ? "" : "s"}
          </p>
        </div>

        <FamilyShelf family={family} systems={systems} tileSize="lg" />

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
          <div className="chrome-label text-pink-200">
            Other families on the shelf
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {FAMILIES.filter((f) => f.slug !== family.slug).map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/play/${f.slug}`}
                  className="group flex items-baseline gap-2 hover:text-pink-200"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-4"
                    style={{ background: f.accent }}
                  />
                  <span className="font-display text-lg text-chrome-100 group-hover:text-pink-200">
                    {f.name}
                  </span>
                  <span className="text-chrome-500">&middot;</span>
                  <span className="text-xs text-chrome-500">{f.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-chrome-500">
            View all systems on the{" "}
            <Link
              href="/play"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              /play
            </Link>{" "}
            index, or jump straight to the{" "}
            <Link
              href="/emulator"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              EmulatorJS picker
            </Link>{" "}
            and the{" "}
            <Link
              href="/atelier/webxr-retroarch"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              WebXR room
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
