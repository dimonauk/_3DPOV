import Footer from "components/layout/footer";

import PixelAcademyClient from "./pixel-academy-client";

export const metadata = {
  title: "Pixel Academy — pixel-art training ground",
  description:
    "A pixel-art office where the Headmistress sits at her desk, watches her agents move through their rooms, and trains the next sprite cohort. Tile-based renderer, BFS pathfinding, hand-drawn furniture. Pairs with the atelier's sprite-designer, pixelify, and pixeldetector chambers.",
};

export default function PixelAcademyPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Play &middot; Pixel Academy</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Pixel Academy.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          a pixel-art office. the headmistress sits at her desk on the
          right; agents that join the room get a seat, a palette, and a
          tool to type with. the renderer is canvas2d on a tiled grid,
          characters path with a 4-connected bfs, furniture z-sorts by
          its bottom edge. no server &mdash; the room runs in the
          browser.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          pairs with{" "}
          <code className="font-mono text-chrome-200">
            /atelier/sprite-designer
          </code>{" "}
          (draw the next palette),{" "}
          <code className="font-mono text-chrome-200">
            /atelier/pixelify
          </code>{" "}
          (drop-an-image pixelator), and{" "}
          <code className="font-mono text-chrome-200">
            /atelier/pixeldetector
          </code>{" "}
          (find the native grid of an upscaled sprite). vendored from
          the vite bench app at{" "}
          <code className="font-mono text-chrome-200">
            D:/The_Hangar/apps/pixel-academy/
          </code>
          ; engine under{" "}
          <code className="font-mono text-chrome-200">
            lib/pixel-academy/
          </code>
          .
        </p>

        <div className="mt-12 overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <PixelAcademyClient />
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
          ctrl + scroll to zoom &middot; middle-drag to pan &middot;
          click the headmistress to select her
        </p>
      </article>
      <Footer />
    </>
  );
}
