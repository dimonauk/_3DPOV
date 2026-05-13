import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import { GameCanvas } from "components/chrono-protocol/game-canvas";
import { getZoneBySlug } from "lib/chrono-protocol/zones";

export const metadata = {
  title: "Chrono-Protocol &middot; Free mode",
  description:
    "The runner without enemies. Fly the tunnel, switch modes on the wheel, feel the controls. v0.1 demo of the input surface.",
};

/**
 * Creative / free-mode page.
 *
 * v0.1: mounts the GameCanvas in creative mode against the Safehouse
 * tunnel. No enemies, no win condition, no dialogue triggers (the
 * canvas suppresses the dialogue cycle when mode === "creative"). The
 * route exists so the visitor can try the wheel and the canvas before
 * the proper run is implemented.
 *
 * TODO &mdash; Wave 7 (sandbox tools):
 *   - Tunnel-skin picker — let the visitor try each zone's accent.
 *   - Trail brush picker — same options as /play/module.
 *   - Long-take camera dolly — the meditative pass for screenshots.
 */
export default function CreativePage() {
  // Default to the Safehouse for the free-mode preview.
  const zone = getZoneBySlug("leake-st-arches");
  if (!zone) {
    return (
      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-chrome-300">
          The Safehouse zone is missing from the registry. This should
          not happen.
        </p>
      </article>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="chrome-label">
          Chrono-Protocol &middot; Free mode (Creative)
        </div>
        <h1 className="mt-2 text-3xl text-chrome-100 md:text-4xl">
          Fly the tunnel.
        </h1>
        <p className="mt-2 max-w-prose text-sm text-chrome-300">
          The runner with no enemies. The dialogue cycle pauses; the
          wheel still switches; the canvas still mounts. A still demo
          of the controls before the run is real.
        </p>

        <section className="mt-6">
          <Suspense
            fallback={
              <div className="flex h-[70vh] w-full items-center justify-center rounded-sm border border-warm-black-800 bg-[#0c0a12] text-xs text-chrome-500">
                Mounting the canvas&hellip;
              </div>
            }
          >
            <GameCanvas zone={zone} mode="creative" />
          </Suspense>
        </section>

        <section className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/chrono-protocol/hub"
            className="inline-flex items-center gap-2 rounded-sm border border-pink-200/40 bg-pink-200/5 px-4 py-2 text-sm text-pink-200 transition-colors hover:bg-pink-200/10"
          >
            Enter the HUB &rarr;
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
