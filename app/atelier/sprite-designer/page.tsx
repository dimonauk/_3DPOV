import Footer from "components/layout/footer";

import SpriteDesignerClient from "./sprite-designer-client";

export const metadata = {
  title: "Sprite Designer — pixel-art sprites for the cast",
  description:
    "Draw, animate, and export pixel-art sprites in the browser. Curated Lospec palettes, K-Centroid photo-to-sprite, onion-skin frame timeline, PNG and BMP-sequence export, .holosprite save/load.",
};

export default function SpriteDesignerPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Sprite Designer</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A small grid.
          <br />
          A palette. A timeline.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A pixel-art sprite editor for the cast and for the kit. Pick a
          grid size and a palette, draw with the pen, scrub the timeline,
          export. Photo-to-sprite collapses any image down to the chosen
          grid via K-Centroid then snaps every pixel to the active
          palette &mdash; useful for turning a reference image into a
          first frame.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Pairs with{" "}
          <code className="font-mono text-chrome-200">/atelier/pixelify</code>{" "}
          (drop-an-image pixelator) and{" "}
          <code className="font-mono text-chrome-200">
            /atelier/pixeldetector
          </code>{" "}
          (find the native grid of an upscaled sprite). Everything runs in
          the browser; the image never leaves your machine. BMP-sequence
          export feeds the drone POV firmware at{" "}
          <code className="font-mono text-chrome-200">
            jbreizh/ImagePainting
          </code>
          ; <code className="font-mono text-chrome-200">.holosprite</code>{" "}
          is a tiny JSON envelope around the frames so the project saves
          and loads round-trip.
        </p>

        <div className="mt-12">
          <SpriteDesignerClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
