import Footer from "components/layout/footer";

import MeshStudioClient from "./mesh-studio-client";

export const metadata = {
  title: "Mesh Studio — the bench's mesh workshop",
  description:
    "The bench-side multi-tool surface, brought online. Pixel art generator, Pixelorama bridge, gallery of installed tools — every input that feeds the sculpture pipeline, behind one Toolbox.",
};

export default function MeshStudioPage() {
  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Mesh Studio</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The bench&rsquo;s mesh workshop,
          <br />
          brought online.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          A multi-tool surface, not a single canvas. The studio runs a
          FastAPI sidecar at <code className="font-mono text-chrome-100">127.0.0.1:8765</code>{" "}
          that fronts the Python mesh / image / Ollama / Pixelorama
          toolchain. This chamber is the public face of that surface:
          the same tab layout, the same controls, the same generator
          forms &mdash; available here as the read-only catalogue when
          the sidecar isn&rsquo;t in reach, and as a live remote when it
          is.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-400">
          Source app lives at{" "}
          <code className="font-mono text-chrome-200">
            apps/holoflow-mesh-studio/
          </code>{" "}
          and runs on the bench at port 5138. The chamber here mirrors
          the Toolbox shell with the same sub-tabs as internal state:
          flip between Pixel art, Palette, Gallery, Tools, Captures,
          Firmware. Nothing leaves your browser unless the sidecar is
          reachable and you press a button that says so.
        </p>

        <div className="mt-12">
          <MeshStudioClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
