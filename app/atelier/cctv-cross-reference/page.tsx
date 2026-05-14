import Footer from "components/layout/footer";
import Link from "next/link";

import { listLocations } from "lib/holo-walk/locations";
import { fetchJamCams } from "lib/cctv/tfl";
import { groupByLocation, matchCamerasToLocations } from "lib/cctv/match";

export const metadata = {
  title:
    "CCTV cross-reference — TfL JamCams matched to HoloWalk locations",
  description:
    "Cross-references the live TfL JamCams catalogue against the studio's HoloWalk light-sculpture locations. Every London spot that has a public traffic camera within 300m of it gets a row: the camera's name, ID, distance, and live video / still-image URLs.",
};

const DEFAULT_RADIUS_METERS = 300;

export default async function CctvCrossReferencePage() {
  let matches = [] as ReturnType<typeof matchCamerasToLocations>;
  let cameraCount = 0;
  let error: string | null = null;
  try {
    const cams = await fetchJamCams();
    cameraCount = cams.length;
    const locations = listLocations();
    matches = matchCamerasToLocations(cams, locations, DEFAULT_RADIUS_METERS);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const locations = listLocations();
  const londonCount = locations.filter((l) => l.city === "london").length;
  const manchesterCount = locations.filter((l) => l.city === "manchester").length;
  const grouped = groupByLocation(matches);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · CCTV cross-reference</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The camera was
          <br />
          already there.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          For every London HoloWalk location the studio has surveyed, the
          city already has at least one of its own cameras watching the
          same patch of pavement. This page cross-references the live
          TfL JamCams catalogue against the studio&rsquo;s
          light-sculpture locations and prints the matches.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Public infrastructure under the Mayor of London&rsquo;s
          Transport for London API. Free, anonymous, refreshed on the
          TfL side every five minutes. The studio uses the matches to
          stage source frames for SHARP testing &mdash; same scene the
          kata happened in, captured by the city&rsquo;s own machinery.
          Dignity-of-capture rules apply (see the pipeline doc): every
          staged frame is reviewed by a human before SHARP runs.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/holo-walk"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            holowalk
          </Link>
          <Link
            href="/spatial"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            spatial
          </Link>
          <Link
            href="https://api.tfl.gov.uk/swagger/ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            TfL API ↗
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="HoloWalk locations" value={`${locations.length}`} />
          <Stat label="London" value={`${londonCount}`} />
          <Stat label="Manchester" value={`${manchesterCount}`} />
          <Stat
            label="TfL JamCams in catalogue"
            value={cameraCount ? cameraCount.toLocaleString() : "—"}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Matches at 300m"
            value={`${matches.length}`}
            accent
          />
          <Stat
            label="London locations covered"
            value={`${grouped.size} / ${londonCount}`}
            accent
          />
          <Stat
            label="Coverage"
            value={londonCount ? `${Math.round((grouped.size / londonCount) * 100)}%` : "—"}
            accent
          />
          <Stat
            label="Manchester coverage"
            value="0% (no public API)"
            secondary
          />
        </div>

        {error && (
          <div className="mt-8 rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
            <div className="chrome-label">TfL fetch failed</div>
            <p className="mt-2 font-mono">{error}</p>
            <p className="mt-2">
              The TfL JamCams API can rate-limit or briefly 502. Refresh
              in a minute. No API key is required.
            </p>
          </div>
        )}

        <section className="mt-12">
          <div className="chrome-label">Matched (camera × location)</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            {grouped.size} London locations have a JamCam within{" "}
            {DEFAULT_RADIUS_METERS}m
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {Array.from(grouped.entries()).map(([locId, list]) => {
              const loc = list[0]!.location;
              return (
                <article
                  key={locId}
                  className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-lg text-chrome-100">
                      <Link
                        href={`/holo-walk/${locId}`}
                        className="hover:text-pink-200"
                      >
                        {loc.name}
                      </Link>
                    </h3>
                    <div className="font-mono text-xs text-chrome-400">
                      {loc.lat.toFixed(5)}, {loc.lon.toFixed(5)}
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {list.map((m) => (
                      <li
                        key={m.camera.id}
                        className="flex flex-wrap items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-3 font-mono text-xs"
                      >
                        <span className="rounded-sm border border-pink-200/40 bg-pink-200/10 px-2 py-0.5 text-pink-200">
                          {Math.round(m.distanceMeters)}m
                        </span>
                        <span className="text-chrome-200">{m.camera.name}</span>
                        <span className="text-chrome-500">{m.camera.id}</span>
                        {m.camera.imageUrl && (
                          <a
                            href={m.camera.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-pink-200 underline underline-offset-4"
                          >
                            still ↗
                          </a>
                        )}
                        {m.camera.videoUrl && (
                          <a
                            href={m.camera.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-200 underline underline-offset-4"
                          >
                            video ↗
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Manchester coverage</div>
          <p className="mt-3">
            The Manchester half of the catalogue ({manchesterCount}{" "}
            locations) has no public CCTV API available. Greater
            Manchester Police and Transport for Greater Manchester
            cameras are not exposed via an open feed comparable to TfL
            JamCams. Bringing Manchester locations into this pipeline
            would require either a local-authority partnership, the
            BBC Weather rooftop-cam set (sparse coverage), or
            non-public-feed sources outside the studio&rsquo;s
            dignity-of-capture rules. Held as future work pending a
            reasonable source.
          </p>
        </section>

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Pipeline</div>
          <p className="mt-3">
            The matched-camera list above is the input to the
            studio&rsquo;s SHARP staging pipeline. From the desktop bench:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4 font-mono text-xs text-chrome-200">
{`# 1. Match (this page, but as a script)
pnpm exec tsx scripts/cctv-match-holowalk.ts --radius 300

# 2. Fetch the matched cameras (calls cctv-fetch.ts under the hood)
pnpm exec tsx scripts/cctv-match-holowalk.ts --radius 300 --fetch

# 3. Review the staged frames manually (dignity-of-capture rules)
ls scripts/cctv-fetch-staging/

# 4. Run SHARP on the reviewed frames
uvicorn sharp_service:app --host 0.0.0.0 --port 7842
# then submit images via the /spatial route's commission button`}
          </pre>
        </section>
      </article>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  accent,
  secondary,
}: {
  label: string;
  value: string;
  accent?: boolean;
  secondary?: boolean;
}) {
  const colour = accent
    ? "text-pink-200"
    : secondary
      ? "text-chrome-400"
      : "text-chrome-100";
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
      <div className="chrome-label text-chrome-400">{label}</div>
      <div className={`mt-2 font-mono text-lg ${colour}`}>{value}</div>
    </div>
  );
}
