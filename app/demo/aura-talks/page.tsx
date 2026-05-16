import Footer from "components/layout/footer";
import Link from "next/link";
import AuraTalksClient from "./aura-talks-client";

export const metadata = {
  title: "Aura talks — the lipsync chain end-to-end",
  description:
    "Eight bricks composing live: vrm.load + vrm.bones.pose (auraDefault) + motion.idle + audio.tts + audio.visemes + vrm.expressions.blend + VRMAvatar. Aura stands in her brat stance, breathes, and her mouth moves as she speaks.",
};

const DEFAULT_URL = "/dimona.vrm";
const DEFAULT_LINE =
  "Hello there. I'm Aura. This is the studio I made. Welcome in.";

export default function AuraTalksPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demo &middot; lipsync chain</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Aura talks.
          <br />
          <span className="chrome-sheen">Eight bricks composing.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          A button below speaks a line. While the audio plays, the
          viseme estimator walks a cursor through the text and writes
          the active mouth-shape to{" "}
          <span className="font-mono text-chrome-100">audio.visemes</span>.
          The expression blender reads that + Aura&rsquo;s current
          mood and writes the merged weights to{" "}
          <span className="font-mono text-chrome-100">vrm.expressions</span>.
          The avatar reads the slice every frame and applies it to her
          rig. Eight separate bricks; not one of them imports another.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Drop{" "}
          <span className="font-mono text-chrome-200">dimona.vrm</span>{" "}
          into <span className="font-mono text-chrome-200">/public/</span>{" "}
          to see Aura. v0.1 routes TTS through the browser&rsquo;s
          Web Speech API &mdash; volume up, voice quality varies by OS.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/demo/vrm"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            vrm-only demo
          </Link>
          <Link
            href="/stack"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            stack
          </Link>
        </div>

        <AuraTalksClient url={DEFAULT_URL} defaultLine={DEFAULT_LINE} />

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">The brick chain</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              <span className="font-mono text-chrome-100">vrm.load</span>{" "}
              parses <span className="font-mono">/dimona.vrm</span>,
              registers a handle in the{" "}
              <span className="font-mono">vrm</span> slice.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                vrm.bones.pose
              </span>{" "}
              writes <span className="text-pink-200">auraDefault</span>{" "}
              (hostess-superheroine-brat held stance) to the slice.
            </li>
            <li>
              <span className="font-mono text-chrome-100">motion.idle</span>{" "}
              starts a rAF loop writing breath + micro-shift to{" "}
              <span className="font-mono">vrm.idleOffsets</span> and
              blink to <span className="font-mono">vrm.expressions</span>.
            </li>
            <li>
              <span className="font-mono text-chrome-100">audio.tts</span>{" "}
              speaks the line via Web Speech, threads request +
              result through the <span className="font-mono">audio</span>{" "}
              slice.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                audio.visemes
              </span>{" "}
              estimates a viseme timeline from text + duration,
              walks a cursor that writes the active viseme to{" "}
              <span className="font-mono">audio.visemes</span>.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                vrm.expressions.blend
              </span>{" "}
              reads the viseme + the mood, writes merged
              expression weights to{" "}
              <span className="font-mono">vrm.expressions</span>.
            </li>
            <li>
              <span className="font-mono text-chrome-100">VRMAvatar</span>{" "}
              reads pose + offset + expressions every frame and
              applies to the rig.
            </li>
            <li>
              You see Aura speak.
            </li>
          </ol>
        </section>
      </article>
      <Footer />
    </>
  );
}
