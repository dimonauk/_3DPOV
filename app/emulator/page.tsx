import Link from "next/link";

import Footer from "components/layout/footer";
import {
  GROUP_LABELS,
  SYSTEMS,
  systemsByGroup,
} from "lib/emulator/systems";

export const metadata = {
  title: "Emulator — bring your own ROM",
  description:
    "An in-browser emulator surface for every major retro system. You bring the ROM; the studio runs the runtime in your browser, locally. Nothing uploads.",
};

export default function EmulatorIndexPage() {
  const grouped = systemsByGroup();

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="chrome-label">Simulation layer · Emulator</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Bring your own ROM.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">
          A browser-side emulator surface for {SYSTEMS.length} retro
          systems. Pick the console; the next page picks your ROM
          file from your own disk and boots the WASM core in this
          browser tab. Nothing uploads. Save state stays in your
          browser&rsquo;s own storage.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          Built on{" "}
          <a
            href="https://emulatorjs.org/"
            className="text-pink-200 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            EmulatorJS
          </a>
          {" "}— the canonical in-browser multi-system runtime, a web
          frontend for the libretro WASM cores. The studio
          doesn&rsquo;t host ROMs or BIOS files; you bring those
          from your own hardware dumps.
        </p>

        {(Object.keys(grouped) as Array<keyof typeof grouped>).map(
          (group) => {
            const systems = grouped[group] ?? [];
            if (systems.length === 0) return null;
            return (
              <section key={group} className="mt-14">
                <div className="chrome-label text-pink-200">
                  {GROUP_LABELS[group]}
                </div>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {systems.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/emulator/${s.slug}`}
                        className="block rounded-sm border border-warm-black-700 bg-warm-black-900/30 px-4 py-3 transition-colors hover:border-pink-200"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-chrome-100">
                            {s.label}
                          </span>
                          {s.biosRequired ? (
                            <span className="chrome-label text-pink-200">
                              BIOS
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-chrome-400">
                          {s.manufacturer}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          },
        )}

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">House rules</div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-chrome-300">
            <li>
              You own the cart. The studio doesn&rsquo;t host ROMs,
              doesn&rsquo;t link to ROM sites, doesn&rsquo;t mirror
              firmware.
            </li>
            <li>
              Systems marked <span className="text-pink-200">BIOS</span>
              {" "}need a BIOS file from your own console. The picker
              accepts it the same way it accepts the ROM — locally,
              never uploaded.
            </li>
            <li>
              The point is studying constraints, not playing through.
              Frame-stepping, palette analysis, sprite-sheet reference.
              There are better places to play games.
            </li>
          </ul>
        </section>

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/articles/emulation-as-a-creative-tool"
                className="text-pink-200 hover:underline"
              >
                Emulation as a creative tool &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/the-emulation-stack-for-creative-research"
                className="text-pink-200 hover:underline"
              >
                The emulation stack for creative research &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/byo-rom-browser-emulators"
                className="text-pink-200 hover:underline"
              >
                BYO-ROM browser emulators &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/what-the-studio-wont-do"
                className="text-pink-200 hover:underline"
              >
                What the studio won&rsquo;t do &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
