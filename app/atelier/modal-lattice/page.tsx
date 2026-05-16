import Footer from "components/layout/footer";

import ModalLatticeClient from "./modal-lattice-client";

export const metadata = {
  title: "Modal lattice — Atelier",
  description:
    "A lattice deformer with scrubbable U/V/W resolution and four interpolation kernels. The studio's Blender bench operator, lifted into the browser as a generative wall-art toy.",
};

export default function ModalLatticePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Modal lattice</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A cage of control points,
          <br />
          and a shape that listens.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A lattice is a cage. Drop a shape inside it, move a corner,
          the shape moves with the corner. Add more corners along an
          axis and the deformation gets finer; switch the kernel and
          the same control-point displacement reads as crisp, billowy,
          or like cloth pulled over a frame. Four kernels here:
          linear, b-spline, cardinal, catmull-rom &mdash; the same four
          the studio&rsquo;s Blender bench exposes.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Originally a modal operator for the 3D viewport, written by
          Tyo-79, that the studio kept reaching for while sculpting
          lattice-based pieces. Ported here as a public wall-art toy:
          scrub U/V/W with the sliders, click a kernel, drag the
          marked control points to feel each one. Nothing leaves the
          browser.
        </p>

        <div className="mt-12">
          <ModalLatticeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
