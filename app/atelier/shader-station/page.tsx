/**
 * app/atelier/shader-station/page.tsx — chamber landing.
 *
 * Exercises viz.shader-editor + viz.shader-export + audio.spectrum +
 * media.qr-transfer + lib/algorithms/shaders (presets + snippets) +
 * lib/math/glsl (injectLibs).
 *
 * Lifted from D:/.github/Shadrerapp ShaderEditor app (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md, but stripped to a minimum-viable
 * chamber — preset picker + GLSL textarea + R3F sphere preview +
 * compile-on-change + audio toggle + share-via-QR. The original
 * AI-Studio four-column power-user UI is left as future work.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import ShaderStationClient from "./shader-station-client";

export const metadata = {
  title: "Shader Station — author + preview GLSL on a sphere",
  description:
    "An atelier chamber for authoring GLSL fragment shaders against a textured sphere preview. Twenty-eight seed presets, seven insertable snippets, audio-reactive uniforms, and QR-driven hand-off between devices. The studio's working bench for procedural surface authoring.",
};

export default function ShaderStationPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Shader Station</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A bench for
          <br />
          procedural surface.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Twenty-eight seeded shaders, a textarea, a sphere, and the
          arithmetic to make them dance together. Toggle the mic and the{" "}
          <code className="font-mono text-chrome-200">u_audio_*</code>{" "}
          uniforms breathe with the room. Share a working state to your
          phone via QR and continue the bench session there.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities · the substrate
          </Link>
          <Link
            href="/atelier/waveguide-forge"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · waveguide forge
          </Link>
          <Link
            href="/atelier/aura-tron"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · aura-tron
          </Link>
        </div>

        <div className="mt-12">
          <ShaderStationClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What this chamber composes</div>
          <p className="mt-3">
            Six bricks click together here. The editor is{" "}
            <span className="font-mono text-chrome-200">viz.shader-editor</span>;
            the equirect snapshot is{" "}
            <span className="font-mono text-chrome-200">viz.shader-export</span>;
            the mic is{" "}
            <span className="font-mono text-chrome-200">audio.spectrum</span>;
            the QR share is{" "}
            <span className="font-mono text-chrome-200">media.qr-transfer</span>.
            Presets + snippets are static data at{" "}
            <span className="font-mono text-chrome-200">
              lib/algorithms/shaders/
            </span>
            ; the helper-injection pass is{" "}
            <span className="font-mono text-chrome-200">
              lib/math/glsl/injectLibs
            </span>
            . Each is browsable on the registry.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
