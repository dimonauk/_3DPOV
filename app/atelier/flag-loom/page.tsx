import Footer from "components/layout/footer";

import FlagLoomClient from "./flag-loom-client";

export const metadata = {
  title: "Flag Loom — Atelier",
  description:
    "The studio's default image display surface. Drop any image; it hangs as a silk cloth flag, draping under gravity with a gentle breeze. Grab any vertex and drag to reshape. Equirectangulars get the alternative sphere wrap.",
};

export default function FlagLoomPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Flag Loom</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Every image
          <br />
          hangs as silk.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The default display surface for any image uploaded to the
          studio. The image is mapped onto a Verlet-integrated cloth
          mesh — pinned at the top, falling under gentle gravity, moved
          by an animated breeze. Grab any vertex and the cloth bends
          with you. Pure WebGL2 + r3f; a WebGPU TSL swap-in is queued.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The "sphere" mode wraps confirmed equirectangulars onto an
          inside-out sphere for 360 viewing — the alternative wrap when
          a flag isn&rsquo;t the right surface. Switch modes top-right.
        </p>

        <div className="mt-12">
          <FlagLoomClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
