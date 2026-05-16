import Footer from "components/layout/footer";

import ImageToMeshClient from "./image-to-mesh-client";

export const metadata = {
  title: "Image → Mesh — Atelier",
  description:
    "Take a photograph (or an Imagen output) and turn it into a 3D printable mesh. Four providers — TripoSR, HY-WU, Unique3D, InstantMesh — each on a different point of the speed vs quality vs single-vs-multi-input curve.",
};

export default function ImageToMeshPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Image &rarr; Mesh</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A photograph becomes
          <br />
          a 3D object.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Drag in an image &mdash; or pipe in something from{" "}
          <code className="font-mono text-chrome-100">/atelier/imagen</code>
          &mdash; and one of four bench-side reconstructors gives you a
          mesh you can rotate, download as GLB, and slice for the
          print bureau. Each provider sits at a different point of the
          speed-quality trade.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Bench-side wiring lives at{" "}
          <code className="font-mono text-chrome-200">services/triposr/</code>,{" "}
          <code className="font-mono text-chrome-200">services/hy-wu/</code>,{" "}
          <code className="font-mono text-chrome-200">services/unique3d/</code>,{" "}
          <code className="font-mono text-chrome-200">services/instantmesh/</code>.
          The Vercel-side contract lives at{" "}
          <code className="font-mono text-chrome-200">
            lib/capabilities/viz/image-to-mesh.ts
          </code>
          . All four GPU-bound; the chamber UI is here today, the
          bench wrapper that actually runs them is the next bench-side
          push.
        </p>

        <div className="mt-12">
          <ImageToMeshClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
