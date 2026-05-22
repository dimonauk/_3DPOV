import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { SectionOpener } from "components/luxe/SectionOpener";
import { FamilyShelf } from "components/play/FamilyShelf";
import {
  FAMILIES,
  systemsByFamily,
  totalSystemCount,
} from "lib/play/families";

/**
 * /play — the GameHub-style hardware-family index.
 *
 * Direction (Dimona, 2026-05-19): "all nintendo, playstation, xbox
 * systems with gamehub light and such at the top, its all in games".
 *
 * The studio's play surface leads here. Five family shelves, one per
 * platform family (Nintendo / PlayStation / Xbox / Sega / Other),
 * every notable system as a tile, every tile knowing its preferred
 * launch path — EmulatorJS for browser-WASM (NES → PS1-era), WebXR
 * RetroArch for the same systems in VR, bench-bridge for the post-PS2
 * generations that need a JIT, "coming soon" for the platforms whose
 * emulator story is not yet written.
 *
 * The AR proving-ground (the studio's own modular-pedagogy game) lives
 * at /play/proving-ground — linked from the footer plate so visitors
 * who arrived for it still find it.
 *
 * The catalogue draws from `lib/play/families.ts`. The runtime-launch
 * shape (which path a tile picks) is the load-bearing decision; see
 * `primaryLaunch` in that file.
 */

// No `dynamic = "force-dynamic"` — the page renders from a fully static
// data registry (lib/play/families.ts). Under Next 15.6 canary + PPR,
// force-dynamic on a sync page with no per-request inputs causes the
// runtime to return 200 headers + zero body. Removing the directive
// lets PPR prerender the shell statically.

export const metadata = {
  title: "Play — every console, every launcher, one index",
  description:
    "A GameHub-style index of Nintendo, PlayStation, Xbox, Sega, and the rest of the canon. Click a tile to play in a browser tab, walk it in a VR room, or open the bench-bridge for the systems that need a native emulator. BYO ROM throughout.",
};

const issueLabel = () => {
  const now = new Date();
  const month = now
    .toLocaleString("en-GB", { month: "long" })
    .toUpperCase();
  return `${month} ${now.getUTCFullYear()}`;
};

export default function PlayIndexPage() {
  const totalCount = totalSystemCount();
  const issue = issueLabel();

  return (
    <>
      <IssueBand
        label="PLAY"
        issue="ISSUE 06"
        date={issue}
        publisher="HOLOFLOW STUDIO"
      />

      <article className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <SectionOpener
          numeral={String(totalCount).padStart(2, "0")}
          sectionLabel="PLAY"
          strapline="Every system in the studio's catalogue, organised by family and by year. Pick a tile to play — in a tab, in a headset, or through the bench."
        />

        <p className="mt-10 max-w-2xl text-chrome-200">
          Five families. {totalCount} systems. Every tile knows its
          preferred launch path. The NES through PS1 generations run as
          WebAssembly cores in this tab; the same library opens inside a
          virtual living room on the WebXR side. The post-PS2 consoles
          need a native emulator with a JIT &mdash; those tiles point at
          the bench-bridge doc and at the project that does the real
          work. The PS4 / PS5 / Xbox One / Series tiles are honest:
          catalogued, not playable yet.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-chrome-400">
          Bring your own ROM. The studio doesn&rsquo;t host ROMs or
          BIOS files. Save state stays in your browser&rsquo;s own
          storage; bench-bridge sessions stay on your bench.
        </p>

        {FAMILIES.map((family) => {
          const systems = systemsByFamily(family.slug);
          if (systems.length === 0) return null;
          return (
            <FamilyShelf
              key={family.slug}
              family={family}
              systems={systems}
              tileSize="md"
            />
          );
        })}

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
          <div className="chrome-label text-pink-200">What this is</div>
          <p className="mt-3">
            This is the studio&rsquo;s GameHub. One index for every
            console family, every system inside each, every launcher
            the studio can wire up &mdash; in the open, in the same
            chrome as the rest of the site. The browser-WASM cores
            land at{" "}
            <Link
              href="/emulator"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              /emulator
            </Link>
            . The WebXR room is at{" "}
            <Link
              href="/atelier/webxr-retroarch"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              /atelier/webxr-retroarch
            </Link>
            . The catalogue of native emulators (and why they&rsquo;re
            native, and how the bench bridge fits) is{" "}
            <Link
              href="/docs/emulation-native"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              docs/EMULATION-NATIVE.md
            </Link>
            . The licence and BYO-ROM rules are the same as the
            emulator index &mdash; nothing uploads, nothing is hosted.
          </p>
          <p className="mt-3">
            The studio&rsquo;s own game &mdash; the AR proving-ground
            with the eight-thread modular pedagogy &mdash; is one of
            the things this surface links out to. It lives at{" "}
            <Link
              href="/play/proving-ground"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              /play/proving-ground
            </Link>
            . The same hand that built this index is building the
            ladder; both belong on the same shelf.
          </p>
          <p className="mt-3 text-chrome-500">
            Back to the{" "}
            <Link
              href="/"
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              homepage
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
