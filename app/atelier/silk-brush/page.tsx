import Footer from "components/layout/footer";

import SilkBrushClient from "./silk-brush-client";

export const metadata = {
  title: "Silk Brush — Atelier",
  description:
    "Draw in three dimensions. A tilt-brush-style canvas in the browser: pick a brush, drag to trail a glowing tube through space. WebXR-ready: enter VR on a headset and paint inside the room.",
};

export default function SilkBrushPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Silk Brush</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A brushstroke
          <br />
          through the air.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A 3D drawing surface. Pick a brush, hold the pointer down,
          drag &mdash; the studio extrudes a tube along the path. Three
          brushes ship: a flat neon line, a particle thread, and a
          keijiro-glitch shader that pulses on its own time. Strokes
          accumulate; the orbit controls let you walk around them.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          WebXR is wired in. On a Quest or any headset that exposes
          immersive-VR through the browser, hit <em>enter vr</em>; the
          same scene becomes a room you can paint inside of. On desktop,
          drag with the mouse against an invisible plane one metre out.
          Ported from the bench prototype at{" "}
          <code className="font-mono text-chrome-200">
            apps/silk-brush-canvas/
          </code>
          .
        </p>

        <div className="mt-12">
          <SilkBrushClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
