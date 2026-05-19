import Link from "next/link";
import { notFound } from "next/navigation";

import EmulatorJsEmbed from "components/emulator/EmulatorJsEmbed";
import Footer from "components/layout/footer";
import { SYSTEMS, getSystem } from "lib/emulator/systems";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return SYSTEMS.map((s) => ({ system: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system: slug } = await params;
  const sys = getSystem(slug);
  if (!sys) return { title: "Emulator — system not found" };
  return {
    title: `${sys.label} — bring your own ROM`,
    description: `Browser-side emulator for the ${sys.label} (${sys.manufacturer}). Pick a ROM you own from your disk; it boots in this tab.`,
    robots: { index: true, follow: true },
  };
}

export default async function EmulatorSystemPage({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system: slug } = await params;
  const sys = getSystem(slug);
  if (!sys) notFound();

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="chrome-label">Simulation layer · Emulator</div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h1 className="text-4xl md:text-5xl leading-[1.05]">
            {sys.label}
          </h1>
          <Link
            href="/emulator"
            className="chrome-label text-chrome-400 hover:text-pink-200"
          >
            &larr; All systems
          </Link>
        </div>
        <p className="mt-3 text-sm text-chrome-400">{sys.manufacturer}</p>

        <section className="mt-8">
          <EmulatorJsEmbed system={sys} />
        </section>

        {sys.biosRequired ? (
          <section className="mt-8 rounded-sm border border-pink-200/40 bg-pink-200/5 px-5 py-4 text-sm text-chrome-200">
            <strong className="text-pink-200">BIOS required.</strong>{" "}
            The {sys.label} needs a BIOS dump from your own console.
            The studio doesn&rsquo;t host one and won&rsquo;t link to
            one. Read{" "}
            <Link
              href="/articles/what-the-studio-wont-do"
              className="text-pink-200 hover:underline"
            >
              what the studio won&rsquo;t do
            </Link>
            {" "}for the ethical framing.
          </section>
        ) : null}

        <section className="mt-10 border-t border-warm-black-800 pt-6">
          <div className="chrome-label">Accepted ROM file types</div>
          <p className="mt-3 text-sm text-chrome-300">
            {sys.acceptExtensions.join(" · ")}
          </p>
        </section>

        <section className="mt-8 border-t border-warm-black-800 pt-6">
          <div className="chrome-label">House rules</div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-chrome-300">
            <li>Bring your own ROM, dumped from your own cart.</li>
            <li>
              Everything runs in this browser tab. The studio
              doesn&rsquo;t see your files. Save state lives in
              your browser&rsquo;s IndexedDB.
            </li>
            <li>
              Powered by{" "}
              <a
                href="https://emulatorjs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:underline"
              >
                EmulatorJS
              </a>{" "}
              + libretro WASM cores. Open-source upstream;
              ad-blocker-friendly; no telemetry beyond the core
              fetch.
            </li>
          </ul>
        </section>

        <section className="mt-8 border-t border-warm-black-800 pt-6">
          <div className="chrome-label">Read first</div>
          <ul className="mt-3 space-y-2 text-sm">
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
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
