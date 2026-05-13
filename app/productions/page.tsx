import Footer from "components/layout/footer";
import Link from "next/link";

import { getBible, type CastMemberId } from "lib/cast";
import {
  episodesByArc,
  listEpisodes,
  type Episode,
  type EpisodeArc,
  type EpisodeStatus,
} from "lib/productions/episodes";

export const metadata = {
  title:
    "Productions — the studio's planned narrative episodes",
  description:
    "The placeholder shells Pipeline Gamma (Narrative Sitcom) will fill. Lavender arc, Iron Ribbon arc, ad-hoc Aura-hosted episodes. Synopses provisional until the Director Agent writes them.",
};

const ARC_ORDER: EpisodeArc[] = ["lavender", "iron-ribbon", "ad-hoc"];

const ARC_LABEL: Record<EpisodeArc, string> = {
  lavender: "The Insubordinate Lavender",
  "iron-ribbon": "The Iron Ribbon",
  "ad-hoc": "Ad-hoc",
};

const ARC_BLURB: Record<EpisodeArc, string> = {
  lavender:
    "Marcel and Betsy fighting about the lavender. Mon → Wed → Fri.",
  "iron-ribbon":
    "Trixie and Millie working a handoff to resolution. Mon → Tue → Wed → Thu → Fri.",
  "ad-hoc":
    "Aura hosting. Penny on logistics. The Academy and Selfridges connective tissue.",
};

const SCENE_LABEL: Record<Episode["scene"], string> = {
  academy: "The Academy",
  selfridges: "Selfridges",
  "the-walk": "The 20-minute walk",
  studio: "The Studio",
};

function statusClass(status: EpisodeStatus): string {
  if (status === "shipped") return "border-pink-400/80 text-pink-300";
  if (status === "in-flight") return "border-pink-200/60 text-pink-200";
  if (status === "drafted") return "border-warm-black-700 text-chrome-300";
  return "border-warm-black-700 text-chrome-400 italic";
}

function CastChip({ id }: { id: CastMemberId }) {
  const bible = getBible(id);
  return (
    <span className="rounded-full border border-warm-black-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chrome-300">
      {bible.name}
    </span>
  );
}

function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-400">{episode.id}</div>
          <h3 className="mt-1 text-lg text-chrome-100">{episode.title}</h3>
        </div>
        <div
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusClass(
            episode.status,
          )}`}
        >
          {episode.status}
        </div>
      </div>

      <p className="mt-3 text-sm text-chrome-200 italic">{episode.tagline}</p>

      <p className="mt-3 text-sm text-chrome-300">{episode.synopsis}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {episode.cast.map((id) => (
          <CastChip key={id} id={id} />
        ))}
        <span className="ml-2 rounded-sm border border-warm-black-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chrome-400">
          {SCENE_LABEL[episode.scene]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-chrome-400">
        {episode.targetWeek && (
          <span className="font-mono">target {episode.targetWeek}</span>
        )}
        {episode.sourcePath && (
          <span className="font-mono">source {episode.sourcePath}</span>
        )}
      </div>
    </div>
  );
}

export default function ProductionsPage() {
  const all = listEpisodes();
  const planned = all.filter((e) => e.status === "planned").length;
  const inFlight = all.filter((e) => e.status === "in-flight").length;
  const drafted = all.filter((e) => e.status === "drafted").length;
  const shipped = all.filter((e) => e.status === "shipped").length;

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The substrate &middot; episodes</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Planned episodes.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The placeholder shells{" "}
          <span className="text-pink-200">Pipeline Gamma</span> (Narrative
          Sitcom) will fill. The Hangar names the chain &mdash; ambient
          capture, Whisper transcription, narrative clustering, Director
          Agent screenplay, staging, render &mdash; but the episodes
          themselves had not been persisted. This catalogue is the
          typed shape; the Director Agent writes the synopses later.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          <span className="text-pink-200">{inFlight} in-flight</span>{" "}
          &middot; <span className="text-chrome-300">{planned} planned</span>{" "}
          &middot; <span className="text-chrome-300">{drafted} drafted</span>{" "}
          &middot; <span className="text-pink-300">{shipped} shipped</span>{" "}
          &middot; total <span className="text-chrome-200">{all.length}</span>.
          Synopses on non-shipped entries are{" "}
          <span className="italic">provisional</span> &mdash; the
          Director Agent rewrites them at production time.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/cast"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            cast
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
          <Link
            href="/pipelines"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            pipelines
          </Link>
        </div>

        {ARC_ORDER.map((arc) => {
          const items = episodesByArc(arc);
          if (items.length === 0) return null;
          return (
            <section key={arc} className="mt-16">
              <div className="chrome-label">{ARC_LABEL[arc]}</div>
              <h2 className="mt-3 text-2xl text-chrome-100">
                {items.length} episode{items.length === 1 ? "" : "s"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-chrome-400">
                {ARC_BLURB[arc]}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((e) => (
                  <EpisodeCard key={e.id} episode={e} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Reading order</div>
          <p className="mt-3">
            The catalogue lives at{" "}
            <span className="font-mono text-chrome-200">
              lib/productions/episodes.ts
            </span>{" "}
            with its purpose twin alongside. Each episode types its cast
            against{" "}
            <span className="font-mono text-chrome-200">
              CastMemberId
            </span>{" "}
            from{" "}
            <span className="font-mono text-chrome-200">lib/cast</span>;
            the {" "}
            <Link
              href="/pipelines"
              className="text-pink-200 underline underline-offset-4"
            >
              Pipeline Banter
            </Link>{" "}
            composition is the engine that fills the lines.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
