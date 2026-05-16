import Footer from "components/layout/footer";

import InverseKataClient from "./inverse-kata-client";

export const metadata = {
  title: "Inverse Kata — Atelier",
  description:
    "Draw a trail; the chamber tells you the kata sequence that would draw it. Phase-A heuristic match against the studio's named-kata library and the Laban Basic Effort canon.",
};

export default function InverseKataPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Inverse Kata</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          What motion
          <br />
          drew this line?
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Sketch a trail; the chamber matches segments of it against the
          studio&rsquo;s named kata library, with each segment classified
          into one of the eight Laban Basic Efforts. Output is a kata
          script you could physically perform to draw what you sketched.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Phase A: pure heuristic decomposition — no ML, no model.
          Segments at curvature peaks; classifies by straightness +
          curvature + suddenness + self-intersection. The closest
          kata in the matched corner wins. Phase B (LLM orchestrator)
          and Phase C (paired-data ML) layer on top of this matcher.
        </p>

        <div className="mt-12">
          <InverseKataClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
