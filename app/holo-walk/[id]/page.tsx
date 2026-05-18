import { notFound } from "next/navigation";
import Link from "next/link";

import Footer from "components/layout/footer";
import LocationBanter from "components/holo-walk/location-banter";
import {
  getAttractorParams,
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
              {(() => {
                const params = getAttractorParams(loc.sculpture);
                if (params) return params.engine;
                return loc.sculpture.kind === "splat" ? "splat" : "—";
              })()}
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
          <Link
            href={`/holo-walk/${loc.id}/ar`}
            className="flex-1 rounded-sm border border-pink-200/60 bg-pink-200/10 px-6 py-4 text-center chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            open in AR &rarr;
          </Link>
          {loc.originalPhoto && (
            <Link
              href={loc.originalPhoto}
              className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-6 py-4 chrome-label text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              source photograph
            </Link>
          )}
        </section>
        {/* When no photoreal splat is attached, the AR view falls back to
            the algorithmic attractor sculpture — same anchor point, same
            sight lines, different aesthetic. Telling visitors up-front
            avoids the "this isn't what the photograph shows" surprise. */}
        {!loc.splat && (
          <p className="mt-3 text-xs text-chrome-400">
            The photoreal splat for this spot hasn&rsquo;t been trained
            yet; AR will render the algorithmic sculpture in its place.
            Same anchor, same compass bearing &mdash; different surface.
          </p>
        )}

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
          <div className="chrome-label">The bar inside the viewport</div>
          <p className="mt-3">
            The 3D preview above ships with the print-bar mounted{" "}
            <em>inside</em> the scene — the same world the sculpture
            lives in. Hover the plates on the lower row (palm / desktop
            / shelf / wall &middot; resin / nylon / steel &middot; raw
            / sanded / polished / painted) to nudge the quote, then tap
            the action plate for{" "}
            <span className="text-chrome-200">print to order</span>{" "}
            (drop-ship from the studio&rsquo;s Manchester partner).
            Touch-only devices fall back to an HTML overlay anchored in
            3D space. Pay-to-download (signed STL/GLB delivery via
            Cloudflare R2 with a C2PA provenance manifest) lands when
            the C2PA wave ships. Live partner-API quoting + Stripe
            checkout land in the Stripe wave; v0.1 prices are
            plausible-but-mocked.
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

        <LocationBanter locationId={id} />
      </article>
      <Footer />
    </>
  );
}
