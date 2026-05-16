import Link from "next/link";

import Footer from "components/layout/footer";

import WaveguideForgeClient from "./waveguide-forge-client";

export const metadata = {
  title: "Waveguide Forge — Atelier",
  description:
    "Designer for triply-periodic minimal-surface (TPMS) waveguides. Tune a gyroid lattice and watch the caustic it would throw under a point light. The bench-side prototype for the studio's resin-printed light sculpture series.",
};

export default function WaveguideForgePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Waveguide Forge</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A lattice becomes
          <br />
          a light.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A{" "}
          <Link
            href="/codex/signed-distance-fields"
            className="text-pink-200 underline underline-offset-4"
          >
            triply-periodic minimal surface
          </Link>{" "}
          like the gyroid tiles space without ever crossing itself.
          Print one in clear resin and it stops being a curiosity &mdash;
          every facet refracts, every channel funnels light, the object
          throws a caustic the way a real waveguide would. This chamber
          is the bench tool for designing those: tweak the lattice,
          point lights at it, watch the projected pattern shift.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Two backends. The default raymarches a parametric gyroid (or
          a loaded SDF) from each pixel back to the light &mdash; cheap,
          stable, runs on any WebGL2 browser. The WebGPU mode forward-
          traces photons through the SDF and atomic-splats them onto a
          photon-map texture; closer to how light actually works but
          needs a WebGPU adapter and a loaded mesh-derived SDF. Source
          SDFs are produced bench-side by{" "}
          <code className="font-mono text-chrome-200">
            tools/mesh-to-sdf/build_sdf.py
          </code>
          ; drop a <code className="font-mono text-chrome-200">.sdf.bin</code>{" "}
          here to swap the gyroid placeholder for a real geometry.
        </p>

        <div className="mt-12">
          <WaveguideForgeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
