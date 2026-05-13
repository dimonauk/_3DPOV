import { notFound } from "next/navigation";
import Link from "next/link";

import Footer from "components/layout/footer";
import {
  getLocation,
  listLocations,
} from "lib/holo-walk/locations";
import SculpturePreviewClient from "./sculpture-preview-client";

export async function generateStaticParams() {
  return listLocations().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocation(id);
  if (!loc) return { title: "Not found" };
  return {
    title: `${loc.name} — HoloWalk`,
    description: `${loc.description.slice(0, 160)}...`,
  };
}

export default async function HoloWalkLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocation(id);
  if (!loc) notFound();

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          HoloWalk &middot; {loc.city}
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          {loc.name}
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          {loc.description}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
            <div className="chrome-label">Where</div>
            <div className="mt-2 font-mono text-chrome-200">
              {loc.coords.lat.toFixed(5)}, {loc.coords.lon.toFixed(5)}
            </div>
            <div className="mt-1 text-chrome-400">
              heading {loc.headingAtCapture}° at capture
            </div>
          </div>
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
            <div className="chrome-label">When</div>
            <div className="mt-2 font-mono text-chrome-200">
              {loc.captureDate}
            </div>
          </div>
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
            <div className="chrome-label">Engine</div>
            <div className="mt-2 font-mono text-chrome-200">
              {loc.sculpture.engine}
            </div>
            <div className="mt-1 text-chrome-400">
              visible {loc.range.renderFromM}&ndash;{loc.range.renderToM}m
            </div>
          </div>
        </div>

        <div className="mt-12 aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <SculpturePreviewClient location={loc} />
        </div>

        <section className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-sm border border-pink-200/40 bg-pink-200/10 px-6 py-4 chrome-label text-pink-100 opacity-60"
            title="The /holo-walk/<id>/ar route arrives in the next wave."
          >
            open in AR &rarr; coming next wave
          </button>
          {loc.originalPhoto && (
            <Link
              href={loc.originalPhoto}
              className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-6 py-4 chrome-label text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              source photograph
            </Link>
          )}
        </section>

        {loc.narrationScript && (
          <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8">
            <div className="chrome-label">Aura at the spot</div>
            <p className="mt-3 text-sm italic text-chrome-200">
              &ldquo;{loc.narrationScript}&rdquo;
            </p>
            <p className="mt-3 text-xs text-chrome-400">
              Voiced via the agent.dialogue + audio.tts capability chain
              when the AR view opens. The script is the bible-grounded
              start; Aura riffs from there.
            </p>
          </section>
        )}

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Print bar &mdash; coming next wave</div>
          <p className="mt-3">
            The 3D viewport above will ship with a YouTube-style strip
            underneath: pick material (resin / nylon / steel), scale
            (palm / desktop / shelf), finish, then either{" "}
            <span className="text-chrome-200">press-to-print</span>{" "}
            (drop-ship from the studio&rsquo;s UK partner) or{" "}
            <span className="text-chrome-200">pay-to-download</span>{" "}
            (signed STL/GLB delivery via Cloudflare R2 with a C2PA
            provenance manifest). Same bar, every 3D viewport on the
            site. Architecture lives in{" "}
            <span className="font-mono text-chrome-100">
              memory:project_print_bar_commerce
            </span>
            ; build wave: post-Stripe.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/holo-walk"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; trail index
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}
