/**
 * app/atelier/breeding-preview/page.tsx — the merge moment.
 *
 * Server component shell. Renders the chrome-label header, intro paras, mounts
 * the client visualiser (kingdom picker + three ray-marched SDF canvases +
 * softness slider), closes with an explainer on smooth-minimum blending.
 *
 * The interactive bit lives in preview-client.tsx; the shader source is in
 * lib/breeding/sdf-shaders.ts.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import BreedingPreviewClient from "./preview-client";

export const metadata = {
  title: "Breeding preview — smooth-minimum blends two parents in real time",
  description:
    "An atelier preview of the breeding moment: pick two of the five kingdoms (gyroid, turing, wgm, ctenophore, slime), drag the softness slider, and watch a fragment-shader ray-march the smooth-minimum (smin) of their SDFs at sixty frames a second.",
};

export default function BreedingPreviewPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Breeding preview</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The merge moment.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The breeding engine joins two parent genomes by joining two
          parent fields. This preview shows the field-level operation
          directly: two signed-distance functions picked from the five
          kingdoms, blended with a smooth-minimum, ray-marched in a
          fragment shader so the softness can move in real time.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The slider drives <span className="font-mono text-chrome-200">k</span>{" "}
          &mdash; the width, in world units, of the blend band. At
          <span className="font-mono text-chrome-200"> k &rarr; 0 </span>
          it reduces to a hard union; at{" "}
          <span className="font-mono text-chrome-200"> k = 1 </span>
          the parents bleed into each other across most of the volume.
          The interesting region sits between roughly 0.05 and 0.4.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; back to the atelier
          </Link>
          <Link
            href="/atelier/evolution"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier &middot; evolution suite
          </Link>
          <Link
            href="/articles/how-the-studio-breeds-sculptures"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &middot; how the studio breeds sculptures
          </Link>
        </div>

        <section className="mt-12">
          <BreedingPreviewClient />
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What smooth-minimum is doing</div>
          <p className="mt-3">
            A signed-distance function returns, at every point in space,
            the signed distance to the nearest surface &mdash; negative
            inside, positive outside. A union of two SDFs is just{" "}
            <span className="font-mono text-chrome-200">min(a, b)</span>.
            The smooth variant from Inigo Quilez replaces the hard{" "}
            <span className="font-mono text-chrome-200">min</span> with
            a quadratic that interpolates between the two fields over a
            band of width{" "}
            <span className="font-mono text-chrome-200">k</span>:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950/70 p-4 font-mono text-[0.75rem] text-chrome-200">
{`float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}`}
          </pre>
          <p className="mt-4">
            That is the entire operation. The rest of the shader is the
            usual ray-march scaffolding &mdash; sphere-trace from a
            fixed camera, gradient normals via central differences,
            ambient plus one directional light. The five kingdom SDFs
            are deliberately cheap stand-ins; the production engine
            evaluates richer fields on the GPU through{" "}
            <span className="font-mono text-chrome-200">
              lib/algorithms/
            </span>{" "}
            and persists genomes at S7 of the evolution suite.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
