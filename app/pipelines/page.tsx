import Footer from "components/layout/footer";
import Link from "next/link";

import { listPipelines, type Pipeline } from "lib/pipelines";

export const metadata = {
  title:
    "Pipelines — the studio's named compositions",
  description:
    "Every named composition of capabilities the studio knows about. Lipsync, mood face, held stance, Pipeline Epsilon, ten-shell parallax. The molecules above the atoms in /capabilities.",
};

function statusClass(status: Pipeline["status"]): string {
  if (status === "registered") return "border-pink-200/60 text-pink-200";
  if (status === "stub") return "border-warm-black-700 text-chrome-400";
  return "border-warm-black-700 text-chrome-400 italic";
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-400">{pipeline.id}</div>
          <h3 className="mt-1 text-lg text-chrome-100">
            {pipeline.name}
            {pipeline.codename && (
              <span className="ml-2 text-sm text-chrome-400 italic">
                — {pipeline.codename}
              </span>
            )}
          </h3>
        </div>
        <div
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusClass(
            pipeline.status,
          )}`}
        >
          {pipeline.status}
        </div>
      </div>

      <p className="mt-3 text-sm text-chrome-300">{pipeline.summary}</p>

      <div className="chrome-label mt-5">Stages</div>
      <ol className="mt-2 space-y-2 text-xs text-chrome-300">
        {pipeline.stages.map((stage, idx) => (
          <li key={stage.capability} className="flex gap-3">
            <span className="font-mono text-chrome-500">{idx + 1}.</span>
            <div>
              <span className="font-mono text-chrome-100">
                {stage.capability}
              </span>{" "}
              <span className="text-chrome-400">— {stage.note}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="chrome-label">Slices</span>
        <span className="font-mono text-chrome-300">
          {pipeline.slices.join(", ")}
        </span>
        {pipeline.surface &&
          (pipeline.surface.includes("[")
            ? (
              // Pattern surface (e.g. /holo-walk/[id]/ar) — render as text;
              // App Router rejects dynamic brackets inside next/link href.
              <span
                className="ml-auto rounded-sm border border-warm-black-800 px-3 py-1 font-mono text-chrome-400"
                title="Pattern route — surface depends on a record id"
              >
                {pipeline.surface}
              </span>
            )
            : (
              <Link
                href={pipeline.surface}
                className="ml-auto rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
              >
                surface &rarr;
              </Link>
            ))}
      </div>
    </div>
  );
}

export default function PipelinesPage() {
  const all = listPipelines();
  const registered = all.filter((p) => p.status === "registered");
  const speculative = all.filter((p) => p.status === "speculative");
  const stub = all.filter((p) => p.status === "stub");

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The substrate &middot; molecules</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Named compositions.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The{" "}
          <Link
            href="/capabilities"
            className="text-pink-200 underline underline-offset-4"
          >
            capability registry
          </Link>{" "}
          is the alphabet. This page is the spelling &mdash; the
          studio&rsquo;s named compositions, what each chain does,
          which slices it touches, and where you can see it running.
          Each composition is meant to be readable end-to-end without
          opening a single source file.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          <span className="text-pink-200">{registered.length} registered</span>{" "}
          &middot; <span className="text-chrome-400">{speculative.length} speculative</span>{" "}
          &middot; total{" "}
          <span className="text-chrome-200">{all.length}</span>.
          Speculative pipelines are architectural sketches: every stage
          is registered as a capability, but the end-to-end chain
          isn&rsquo;t demonstrated yet.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atoms (capabilities)
          </Link>
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier
          </Link>
          <Link
            href="/stack"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            stack
          </Link>
        </div>

        {registered.length > 0 && (
          <section className="mt-16">
            <div className="chrome-label">Registered</div>
            <h2 className="mt-3 text-2xl text-chrome-100">
              {registered.length} live compositions
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {registered.map((p) => (
                <PipelineCard key={p.id} pipeline={p} />
              ))}
            </div>
          </section>
        )}

        {speculative.length > 0 && (
          <section className="mt-16">
            <div className="chrome-label">Speculative</div>
            <h2 className="mt-3 text-2xl text-chrome-100">
              {speculative.length} architectural sketch
              {speculative.length === 1 ? "" : "es"}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {speculative.map((p) => (
                <PipelineCard key={p.id} pipeline={p} />
              ))}
            </div>
          </section>
        )}

        {stub.length > 0 && (
          <section className="mt-16">
            <div className="chrome-label">Stub</div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {stub.map((p) => (
                <PipelineCard key={p.id} pipeline={p} />
              ))}
            </div>
          </section>
        )}
      </article>
      <Footer />
    </>
  );
}
