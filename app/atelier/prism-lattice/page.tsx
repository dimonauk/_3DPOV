import Link from "next/link";

import Footer from "components/layout/footer";

import PrismLatticeClient from "./prism-lattice-client";

export const metadata = {
  title: "Prism Lattice — a geodesic sphere of glowing acrylic struts",
  description:
    "WebGPU + TSL, no textures. A subdivided icosahedron rebuilt as instanced acrylic struts that breathe in and out of their own midpoints while the internal colour sweeps the spectrum. Drag to rotate; the sliders reach the uniforms directly.",
};

export default function PrismLatticePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Prism Lattice</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A sphere built
          <br />
          from breathing glass.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Take an icosahedron, subdivide it into a geodesic sphere, and replace
          every edge with a short acrylic strut. That&rsquo;s the whole object
          &mdash; a few hundred struts and the joints where they meet. Nothing
          else is drawn: no shell, no background geometry, no texture anywhere
          in the scene.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Each strut breathes on its own clock, growing out from its midpoint
          and shrinking back, and each one carries a hue that drifts through the
          spectrum as it travels across the sphere &mdash; the colour you see is
          never painted on, it&rsquo;s computed fresh every frame from the
          strut&rsquo;s position and the time uniform. Additive blending with no
          depth write means the far side of the lattice shows through the near
          side, so the pulsing never fully closes the object off.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/waveguide-forge"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · waveguide forge
          </Link>
          <Link
            href="/atelier/shape-of-it"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · shape of it
          </Link>
          <Link
            href="/codex/signed-distance-fields"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · signed distance fields
          </Link>
        </div>

        <div className="mt-12">
          <PrismLatticeClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/20 p-8 text-xs text-chrome-400">
          <div className="chrome-label">What this is, technically</div>
          <p className="mt-3">
            WebGPU + Three.js TSL, unlit and instance-driven.{" "}
            <code className="font-mono text-chrome-200">scene-geometry.ts</code>{" "}
            walks a subdivided{" "}
            <code className="font-mono text-chrome-200">
              THREE.IcosahedronGeometry
            </code>{" "}
            once on the CPU, de-duplicates its shared vertices, and packs one
            row per edge (midpoint, direction, an orthonormal basis,
            half-length, base radius, a random phase, a spatial hue seed) into
            flat Float32Arrays. Those become instanced buffer attributes on a
            single{" "}
            <code className="font-mono text-chrome-200">InstancedMesh</code> of
            unit cylinders &mdash; no{" "}
            <code className="font-mono text-chrome-200">setMatrixAt</code>{" "}
            anywhere. Every instance&rsquo;s position, length, and radius is
            reconstructed inside{" "}
            <code className="font-mono text-chrome-200">
              material.positionNode
            </code>{" "}
            from those attributes and a shared time uniform, and the colour
            comes out of a six-line rainbow-ramp TSL{" "}
            <code className="font-mono text-chrome-200">Fn</code> &mdash; no
            gradient texture, no lookup table. The joints run the same shape of
            node graph on a second instanced mesh of small icosahedra. Bloom is
            the shared{" "}
            <code className="font-mono text-chrome-200">lib/tsl-post</code>{" "}
            composer&rsquo;s TSL pass, not a bespoke shader.
          </p>
          <p className="mt-3">
            The sliders write straight into the five uniforms that drive the
            whole system (hue sweep speed, pulse speed, pulse depth, brightness,
            spin speed) &mdash; there is no other state to keep in sync. Density
            rebuilds the instance data at a coarser or finer subdivision and
            swaps the meshes; everything else stays untouched.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
