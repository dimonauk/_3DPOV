import Footer from "components/layout/footer";

import PatternPrototypeClient from "./pattern-prototype-client";

export const metadata = {
  title: "Pattern Prototype — Atelier",
  description:
    "AI-drafted surface patterns for wall art, fabric, and print. Pick a mode; draft a topology; download the SVG. Pairs with the studio's print bureau for wall-art runs and with the fabric calculator for cut-piece quotes.",
};

export default function PatternPrototypePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Pattern Prototype</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A sentence becomes
          <br />
          a repeat unit.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber over Google&rsquo;s Gemini text engine.
          Describe a garment block or a surface motif; the engine
          drafts a FreeSewing-style pattern function; the page
          executes it in a sandboxed Function constructor and shows
          you the resulting SVG path. Switch to Style/Dolly/Archive
          modes to preview the same outfit logic under different
          mannequin treatments.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Output is an SVG path string &mdash; download it, drop it
          into the print bureau as wall art, or feed the measurements
          into the fabric calculator. Generation runs browser&rarr;
          Google directly using your AI Studio key (paste it in
          settings); nothing is stored on the studio&rsquo;s server.
        </p>

        <div className="mt-12">
          <PatternPrototypeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
