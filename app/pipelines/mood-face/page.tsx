import Link from "next/link";

import Footer from "components/layout/footer";
import { getPipeline } from "lib/pipelines";
// Same shape as the lipsync demo — heavy R3F + VRM client-only deps,
// loaded via a client-side shim that does the `next/dynamic` import
// with `ssr: false`. Next 15.6 canary disallows `ssr: false` inside
// Server Components, hence the shim.
import MoodFaceLoader from "./mood-face-loader";

export default function MoodFacePipelinePage() {
  const pipeline = getPipeline("mood-face");

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="chrome-label">
          <Link
            href="/pipelines"
            className="text-chrome-400 hover:text-pink-200"
          >
            pipelines
          </Link>{" "}
          / composition
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Mood face.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Aura&rsquo;s face mirrors her mood without a word. One
          capability deep &mdash;{" "}
          <code className="text-pink-200">vrm.expressions.blend</code>
          {" "}reads <code className="text-pink-200">aura.mood</code>
          {" "}each frame and writes the matching face weights into
          the VRM. Pick a mood; watch her shift.
        </p>

        {pipeline && (
          <div className="mt-8 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 text-xs text-chrome-300">
            <div className="chrome-label text-chrome-400">Stages</div>
            <ol className="mt-3 space-y-2">
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="chrome-label">Slices</span>
              <span className="font-mono text-chrome-300">
                {pipeline.slices.join(", ")}
              </span>
            </div>
          </div>
        )}

        <section className="mt-12">
          <MoodFaceLoader />
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-xs text-chrome-300">
          <div className="chrome-label">Notes</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <code className="text-chrome-100">aura.mood</code> is a
              cross-cutting slice — anything that nudges OCEAN or
              calls <code>setMood()</code> directly will be reflected
              here on the next frame. This is how the dialogue loop
              eventually closes the chain (intent →
              <code className="text-chrome-100">nudgeOcean</code> →
              new mood → face).
            </li>
            <li>
              The blend loop preserves expression keys it doesn&rsquo;t
              own — <code className="text-chrome-100">motion.idle</code>{" "}
              writes <code>blink</code> on a separate cadence and that
              keeps animating even when the mouth and face slots are
              idle.
            </li>
            <li>
              Try <code>/pipelines/lipsync</code> next — same VRM, same
              blend loop, plus the viseme stream driving the mouth in
              parallel with the mood-driven face.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
