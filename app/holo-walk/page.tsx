import Footer from "components/layout/footer";
import Link from "next/link";
import { getAttractorParams, listLocations } from "lib/holo-walk/locations";
import { listDynamicSculptures } from "lib/holo-walk/dynamic-sculptures";
import { createLogger } from "lib/log";
import HoloWalkMapClient from "./holo-walk-map-client";

export const metadata = {
  title:
    "HoloWalk — the studio's outdoor sculpture trail (Manchester + London)",
  description:
    "Light sculptures reanchored at the spots they were photographed. Manchester and London as outdoor galleries. Open the AR view at the spot; the sculpture reappears in your phone. Photograph it, record it, share it.",
};

const log = createLogger("route:/holo-walk");

export default async function HoloWalkIndexPage() {
  const all = listLocations();
  const dynamic = await listDynamicSculptures();
  log.info("rendering gallery", {
    staticCount: all.length,
    dynamicCount: dynamic.length,
  });
  const byCity = new Map<string, typeof all>();
  for (const loc of all) {
    const bucket = byCity.get(loc.city) ?? [];
    bucket.push(loc);
    byCity.set(loc.city, bucket);
  }

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">HoloWalk</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The cities,
          <br />
          turned into galleries.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every long-exposure light-sculpture the studio has shot lives at
          a specific spot &mdash; a corner in Salford, a riverside in
          London, a Northern-Quarter doorway in Manchester at 11pm. HoloWalk
          puts the sculpture back there, in AR, anchored to GPS. Walk to
          the spot, hold up your phone, the light reappears. Photograph it.
          Record it. Share it. The whole gallery is the city; the work is
          there if you go.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Web-only &mdash; no app to download. Works on Android Chrome and
          iOS Safari. Photograph + video capture built in. Each sculpture
          is also for sale as a 3D-printed object via the print bar on its
          detail page.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/photographs"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            photographs
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
          <Link
            href="/articles/london-360-walking"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article: London 360 walking
          </Link>
          <Link
            href="/holo-walk/new"
            className="rounded-sm border border-pink-200/40 px-3 py-1 text-pink-200 hover:border-pink-200 hover:bg-pink-200/10"
          >
            + add a sculpture
          </Link>
        </div>

        <div className="mt-12 aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <HoloWalkMapClient locations={all} />
        </div>

        {[...byCity.entries()].map(([city, entries]) => (
          <section key={city} className="mt-16">
            <div className="chrome-label">{city}</div>
            <h2 className="mt-3 text-2xl text-chrome-100">
              {entries.length}{" "}
              sculpture{entries.length === 1 ? "" : "s"}
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map((loc) => (
                <li key={loc.id}>
                  <Link
                    href={`/holo-walk/${loc.id}`}
                    className="group block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 transition-colors hover:border-pink-200/40"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg text-chrome-100 group-hover:text-pink-100">
                        {loc.name}
                      </h3>
                      <span className="font-mono text-[10px] text-chrome-500">
                        {getAttractorParams(loc.sculpture)?.engine ??
                          (loc.sculpture.kind === "splat" ? "splat" : "—")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-chrome-300">
                      {loc.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-chrome-400">
                      <span className="font-mono">
                        {loc.coords.lat.toFixed(4)},{" "}
                        {loc.coords.lon.toFixed(4)}
                      </span>
                      <span className="text-chrome-400 group-hover:text-pink-200">
                        open &rarr;
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {dynamic.length > 0 && (
          <section className="mt-16">
            <div className="chrome-label">Operator additions</div>
            <h2 className="mt-3 text-2xl text-chrome-100">
              {dynamic.length} splat sculpture{dynamic.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-chrome-300">
              Trained from operator-uploaded 360 video via the
              hangar-gsplat pipeline. Newest first.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {dynamic.map((s) => (
                <li key={s.id}>
                  <div className="block rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg text-chrome-100">{s.label}</h3>
                      <span className="font-mono text-[10px] text-chrome-500">
                        {s.status === "done"
                          ? "splat · done"
                          : s.status === "error"
                            ? "splat · error"
                            : `splat · ${s.status}`}
                      </span>
                    </div>
                    {s.status === "done" && typeof s.gaussianCount === "number" && (
                      <p className="mt-2 text-sm text-chrome-300">
                        {s.gaussianCount.toLocaleString()} gaussians,{" "}
                        {typeof s.plyBytes === "number"
                          ? `${(s.plyBytes / (1024 * 1024)).toFixed(1)} MB`
                          : "—"}
                      </p>
                    )}
                    {s.status === "error" && s.errorMessage && (
                      <p className="mt-2 text-sm text-pink-300">
                        {s.errorMessage}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-[11px] text-chrome-400">
                      <span className="font-mono">
                        {s.lat !== undefined && s.lon !== undefined
                          ? `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`
                          : "no GPS"}
                      </span>
                      {s.plyUrl ? (
                        <a
                          href={s.plyUrl}
                          className="text-chrome-400 hover:text-pink-200"
                        >
                          open .ply &rarr;
                        </a>
                      ) : (
                        <span className="text-chrome-500">{s.jobId ?? "—"}</span>
                      )}
                    </div>
                    {s.jobId && (
                      <div className="mt-1 font-mono text-[10px] text-chrome-500">
                        bench job: {s.jobId}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">How it works</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Tap a sculpture above to open its detail page.</li>
            <li>
              At the spot, tap &ldquo;open in AR&rdquo;. Your phone asks
              for camera + location + orientation permission &mdash;
              everything in a single user gesture.
            </li>
            <li>
              The sculpture appears in the camera view, animating as
              long-exposure light over time. The pose is GPS + compass
              locked to the original capture orientation.
            </li>
            <li>
              Photograph or record. Share to anywhere with the Share
              button. The 3D object is also purchasable as a printed
              edition via the print bar.
            </li>
          </ol>
        </section>
      </article>
      <Footer />
    </>
  );
}
