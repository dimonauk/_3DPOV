import Link from "next/link";

import Footer from "components/layout/footer";
import { ZoneCard } from "components/chrono-protocol/zone-card";
import { defaultSaveSlot, isZoneUnlocked } from "lib/chrono-protocol/state";
import { zones } from "lib/chrono-protocol/zones";

export const metadata = {
  title: "Chrono-Protocol HUB",
  description:
    "The still room between runs. Pick a zone, switch loadout, look at the splat library being built underneath.",
};

/**
 * HUB page.
 *
 * The prototype's HUB game-state, rendered as a server route. v0.1
 * reads the default save-slot synchronously (Leake St unlocked, the
 * others gated). Wave 2 wires the client-side loader from
 * /api/chrono-protocol/save (when that route lands) so the unlock
 * cascade and best-scores reflect actual play.
 */
export default function HubPage() {
  const slot = defaultSaveSlot();
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Chrono-Protocol</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The HUB.
        </h1>
        <p className="mt-4 max-w-prose text-chrome-300">
          The still room between runs. Pick a zone. The runner reads
          your loadout from the wheel at the bottom of the screen
          before the tunnel opens. The canal fast-travel between zones
          lands in a later wave; v0.1 is the menu version of the same
          decision.
        </p>

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
          <div className="chrome-label mb-3 text-chrome-500">
            Save slot
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-chrome-200 md:grid-cols-3">
            <div>
              <div className="chrome-label text-chrome-500">
                Total runs
              </div>
              <div className="mt-1 font-mono text-2xl text-chrome-100">
                {slot.totalRuns.toString().padStart(4, "0")}
              </div>
            </div>
            <div>
              <div className="chrome-label text-chrome-500">
                Victories
              </div>
              <div className="mt-1 font-mono text-2xl text-chrome-100">
                {slot.totalVictories.toString().padStart(4, "0")}
              </div>
            </div>
            <div>
              <div className="chrome-label text-chrome-500">
                Last played
              </div>
              <div className="mt-1 font-mono text-xs text-chrome-300">
                {new Date(slot.lastPlayedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="chrome-label mb-3 text-pink-200">
            Zones &middot; unlock cascade
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {zones.map((z) => {
              const unlocked = isZoneUnlocked(z.slug, slot);
              const bestScore = slot.bestScores[z.slug] ?? 0;
              const lockReason =
                z.slug === "royal-mile"
                  ? "Clear the Safehouse"
                  : z.slug === "soho-grid"
                    ? "Clear the Royal Mile"
                    : undefined;
              return (
                <ZoneCard
                  key={z.slug}
                  zone={z}
                  unlocked={unlocked}
                  lockReason={lockReason}
                  bestScore={bestScore}
                />
              );
            })}
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/chrono-protocol/creative"
            className="inline-flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-2 text-sm text-chrome-200 transition-colors hover:border-pink-200/40 hover:text-pink-200"
          >
            Free mode &rarr;
          </Link>
          <Link
            href="/chrono-protocol"
            className="inline-flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-2 text-sm text-chrome-200 transition-colors hover:text-pink-200"
          >
            &larr; Back to landing
          </Link>
        </section>
      </article>
      <Footer />
    </>
  );
}
