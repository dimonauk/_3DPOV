import Link from "next/link";

import Footer from "components/layout/footer";
import { getPipeline } from "lib/pipelines";
// The demo loads three.js + @pixiv/three-vrm + R3F — heavy client-only
// deps. The loader is a thin "use client" shim that does the
// `next/dynamic` import with `ssr: false`; Next 15.6 canary disallows
// `ssr: false` inside a Server Component, hence the shim.
import LipsyncLoader from "./lipsync-loader";

export const metadata = {
  title: "Lipsync — pipelines composition",
  description:
    "vrm.load → audio.tts → audio.visemes → vrm.expressions.blend composed live. Type something for Aura to say; her mouth moves on the active viseme.",
};

export default function LipsyncPipelinePage() {
  const pipeline = getPipeline("lipsync");

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
          Lipsync.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The first canonical multi-capability composition. Four atoms
          end-to-end &mdash; load Aura, speak some text, generate the
          viseme timeline, animate her mouth on the active viseme. Type
          anything into the box; she&rsquo;ll say it.
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
          <LipsyncLoader />
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-xs text-chrome-300">
          <div className="chrome-label">Notes</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Web Speech is the demo provider — zero API keys. ElevenLabs /
              Kokoro / F5 share the same{" "}
              <code className="text-chrome-100">speak()</code> contract and
              swap in via the <code>provider</code> option when their env
              vars are set.
            </li>
            <li>
              The viseme estimator is text-driven (60ms/char default). When
              a provider returns a real audio buffer the same{" "}
              <code className="text-chrome-100">audio.visemes</code>{" "}
              capability gains a buffer-analysis path under the same
              public signature.
            </li>
            <li>
              The blend loop merges mouth weights from{" "}
              <code className="text-chrome-100">audio.visemes</code> with
              face weights from <code className="text-chrome-100">aura.mood</code>
              {" "}— change <code>aura.mood</code> in another tab and
              you&rsquo;ll see the face shift while she speaks.
            </li>
            <li>
              Browser autoplay policy: the first speak may need a click
              gesture. The Speak button counts.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
