import Footer from "components/layout/footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ZoneScene } from "components/neo-london/zone-scene";
import { getZoneBySlug, zones } from "lib/neo-london/zones";
import type { SplatZone } from "lib/neo-london/types";

/**
 * Per-zone page. The dynamic [slug] segment resolves to one entry in
 * data/neo-london/zones.json. Three render states:
 *
 *   - placeholder / frame-captured &rarr; pending page; no scene yet
 *   - splat-rendered / mesh-added   &rarr; mount the ZoneScene
 *   - playable                       &rarr; ZoneScene + "play here" stub
 *
 * Every zone slug is statically generated.
 */

export function generateStaticParams() {
  return zones.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) return { title: "Zone not found" };
  return {
    title: `${zone.name} — Neo-London`,
    description: zone.notes,
  };
}

const SOURCE_LABELS: Record<SplatZone["source"], string> = {
  "archive-360": "studio 360 archive",
  "cctv-tfl": "TFL JamCam",
  "cctv-other": "public CCTV feed",
  manual: "single frame",
};

export default async function ZonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) notFound();

  const hasSplat =
    zone.status === "splat-rendered" ||
    zone.status === "mesh-added" ||
    zone.status === "playable";

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          Neo-London &middot; zone
        </div>
        <h1 className="mt-4 text-4xl leading-[1] md:text-5xl">
          {zone.name}.
        </h1>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-xs">
          <span className="chrome-label text-chrome-500">Status</span>
          <span className="text-chrome-200">{zone.status}</span>
          <span className="text-chrome-700">&middot;</span>
          <span className="chrome-label text-chrome-500">Source</span>
          <span className="text-chrome-200">
            {SOURCE_LABELS[zone.source]}
          </span>
          <span className="text-chrome-700">&middot;</span>
          <span className="chrome-label text-chrome-500">
            Coordinates
          </span>
          <span className="font-mono text-chrome-300">
            {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
          </span>
        </div>

        <p className="mt-6 max-w-prose text-chrome-300">{zone.notes}</p>

        {hasSplat && zone.plyUrl ? (
          <section className="mt-10">
            <div className="chrome-label mb-3 text-pink-200">
              Walkable splat
            </div>
            <ZoneScene
              plyUrl={zone.plyUrl}
              meshUrl={zone.meshUrl}
              zoneName={zone.name}
            />
            {zone.splatGeneratedAt ? (
              <p className="mt-3 text-xs text-chrome-500">
                SHARP version{" "}
                <span className="font-mono text-chrome-300">
                  {zone.sharpVersion ?? "unspecified"}
                </span>
                {" "}&middot; generated{" "}
                <span className="font-mono text-chrome-300">
                  {zone.splatGeneratedAt}
                </span>
              </p>
            ) : null}
          </section>
        ) : (
          <PendingBlock zone={zone} />
        )}

        {zone.status === "playable" ? (
          <section className="mt-10 rounded-sm border border-cyber-cyan/30 bg-cyber-cyan/5 p-6">
            <div
              className="chrome-label mb-2"
              style={{ color: "#00f3ff" }}
            >
              Play in this zone
            </div>
            <p className="text-sm text-chrome-300">
              The gameplay layer for this zone is wired up. The stub
              button below opens the player session once the AR
              runtime is installed; for now it sits here as a
              honest placeholder &mdash; the route is reserved.
            </p>
            <button
              type="button"
              disabled
              className="chrome-label mt-4 cursor-not-allowed rounded-sm border border-cyber-cyan/40 bg-warm-black-900/60 px-4 py-2 text-xs text-chrome-400 opacity-60"
            >
              Enter zone &mdash; AR runtime pending
            </button>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="chrome-label mb-3 text-chrome-500">
            Capture metadata
          </div>
          <div className="divide-y divide-warm-black-800 border-y border-warm-black-800 text-sm">
            <MetaRow label="Captured" value={zone.capturedAt} />
            <MetaRow
              label="Splat generated"
              value={zone.splatGeneratedAt ?? "pending"}
            />
            <MetaRow
              label="SHARP version"
              value={zone.sharpVersion ?? "pending"}
            />
            <MetaRow
              label="PLY file"
              value={zone.plyUrl ?? "not yet rendered"}
              mono
            />
            <MetaRow
              label="Companion mesh"
              value={zone.meshUrl ?? "not generated"}
              mono
            />
            <MetaRow
              label="Source frame"
              value={zone.sourceFrame ?? "studio-local"}
              mono
            />
          </div>
        </section>

        <section className="mt-12">
          <Link
            href="/play/neo-london"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            &larr; Back to the map
          </Link>
        </section>
      </article>
      <Footer />
    </>
  );
}

function PendingBlock({ zone }: { zone: SplatZone }) {
  const isFrameCaptured = zone.status === "frame-captured";
  return (
    <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
      <div className="chrome-label mb-3 text-chrome-500">
        Zone in queue
      </div>
      <p className="text-chrome-300">
        {isFrameCaptured ? (
          <>
            A source frame is captured and waiting for SHARP. Once
            the splat lands at{" "}
            <code className="font-mono text-chrome-200">
              /splats/{zone.slug}.ply
            </code>{" "}
            this page renders it in three dimensions.
          </>
        ) : (
          <>
            This zone is a pin on the map without a frame yet. The
            studio walks here (or pulls a CCTV grab from here) and
            feeds the frame to SHARP; the runbook is at{" "}
            <Link
              href="/docs/SHARP_PIPELINE"
              className="text-pink-200 underline underline-offset-4"
            >
              SHARP_PIPELINE.md
            </Link>
            . Once the .ply file lands this page renders it.
          </>
        )}
      </p>
      {isFrameCaptured && zone.sourceFrame ? (
        <div className="mt-6">
          <div className="chrome-label mb-2 text-chrome-500">
            Source frame &mdash; preview
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zone.sourceFrame}
            alt={`Source frame captured at ${zone.name}`}
            className="block w-full rounded-sm border border-warm-black-800"
          />
        </div>
      ) : null}
    </section>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
      <div className="chrome-label min-w-[10rem] text-[0.65rem] text-chrome-500">
        {label}
      </div>
      <div
        className={
          mono
            ? "font-mono text-xs text-chrome-300"
            : "text-sm text-chrome-200"
        }
      >
        {value}
      </div>
    </div>
  );
}
