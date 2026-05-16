import Footer from "components/layout/footer";

import ComfyLayeredClient from "./comfy-layered-client";

export const metadata = {
  title: "Comfy Layered — ComfyUI workflows with named layers",
  description:
    "The studio's front-end for queueing ComfyUI image jobs from the browser. Pick a prompt chain, dial named layer parameters, hand the rendered description to the bench's ComfyUI service, watch the queue drain.",
};

export default function ComfyLayeredPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Comfy Layered</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A prompt with
          <br />
          named layers.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A regular ComfyUI prompt is a single blob of text. Here the
          prompt is built from named layers &mdash; basic concepts,
          relationships, rendering strategy, optimisation &mdash; each
          with its own parameters. Pick a chain, dial the layers, the
          chamber renders the full description and hands it to the
          studio&rsquo;s ComfyUI service for queueing.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by the Hangar&rsquo;s ComfyUI bench at{" "}
          <code className="font-mono text-chrome-200">localhost:8188</code>{" "}
          (or whatever{" "}
          <code className="font-mono text-chrome-200">COMFYUI_URL</code>{" "}
          resolves to, forwarded via the chamber&rsquo;s server-side
          proxy at{" "}
          <code className="font-mono text-chrome-200">/api/comfy-layered/*</code>
          ). The bench owns the heavy weights; the chamber posts a job,
          polls until the queue is done, shows the result.
        </p>

        <div className="mt-12">
          <ComfyLayeredClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
