import type { Metadata } from "next";
import { HolofoilDice } from "components/holofoil-dice";
import { GallerySection } from "components/gallery/gallery-section";
import { FeaturedCarousel } from "components/gallery/featured-carousel";

export const metadata: Metadata = {
  title: "Studio open — Holo-Flow Studio",
  description:
    "Artistic engineer running Holo-Flow Studio from Salford. AI agent orchestration across software, VR, and parametric manufacturing; drone swarm capture for heritage and worksites with gaussian splat mapping. Open to AI, phygital pipelines, immersive media.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-warm-black-950 text-warm-black-50">
      {/* shader hero — absolute (not fixed) positive z-index so it can't be
          hidden by the parent's bg in any stacking-context edge case */}
      <div className="pointer-events-auto absolute inset-0 z-0">
        <HolofoilDice />
      </div>

      {/* subtle vignette so the central text reads cleanly over the shader,
          but light enough that the shader stays visible at edges + corners */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at center, rgba(12,10,18,0.55) 0%, rgba(12,10,18,0.3) 45%, rgba(12,10,18,0.05) 75%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-9 px-6 py-20 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-chrome-400">
          Holo-Flow Studio · Field records
        </span>

        <h1
          className="font-display text-5xl leading-[1.02] md:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The studio is open.
          <br />
          <span className="text-chrome-300">The website isn&rsquo;t.</span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-chrome-200 md:text-lg">
          Artistic engineer running Holo-Flow Studio from Salford.
          Orchestrating AI agents across software engineering, VR development,
          and parametric manufacturing. Drone swarm pilot &mdash; heritage and
          worksite capture, gaussian splat mapping. Twelve years of kinetic
          arts underwrites the maths.
        </p>

        <FeaturedCarousel />

        <div className="flex w-full flex-col items-center gap-4 border-t border-warm-black-800 pt-8">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
            Open to talking
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-warm-black-700 bg-warm-black-900/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-chrome-200">
              AI
            </span>
            <span className="rounded-full border border-warm-black-700 bg-warm-black-900/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-chrome-200">
              Phygital pipelines
            </span>
            <span className="rounded-full border border-warm-black-700 bg-warm-black-900/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-chrome-200">
              Immersive media
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-5 border-t border-warm-black-800 pt-8">
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
              Built and shipping
            </span>
            <p className="max-w-md text-xs leading-relaxed text-chrome-400 md:text-sm">
              Studio infrastructure built end-to-end &mdash; the tools the
              consultancy delivers from. Local-first AI, real hardware,
              every layer in-house.
            </p>
          </div>
          <ul className="flex w-full flex-col gap-3 text-left text-sm leading-relaxed text-chrome-200 md:text-base">
            <li>
              <span className="font-display text-pink-200">Dolly_OS</span>{" "}
              &mdash; faux-OS PWA shell. WebGPU + TSL scenes, layered Z-stack
              viewport, parallax depth, embedded ComfyUI client, agent
              compositor. React 18 + Vite + Three.js / R3F.
            </li>
            <li>
              <span className="font-display text-pink-200">Aura</span>{" "}
              &mdash; multimodal VRM agent. Voice (Kokoro / RunPod TTS),
              memory (Qdrant), OCEAN-state somatic mapping to attractor
              geometries, MQTT bridge to Telegram &amp; Discord.
            </li>
            <li>
              <span className="font-display text-pink-200">Light_Weiver</span>{" "}
              &mdash; VR poi-combat training game. Real-world flowarts muscle
              memory; Camden L1 tutorial, sister co-op, Optimizer
              Compliance AI antagonist.
            </li>
            <li>
              <span className="font-display text-pink-200">
                Mesh studio &amp; fabrication
              </span>{" "}
              &mdash; sculpture genome with evolutionary breeding, Blender
              automation, waveguide TIR caustic fitness scoring, OctoPrint
              farm orchestration, STL / 3MF export.
            </li>
            <li>
              <span className="font-display text-pink-200">
                Spatial capture
              </span>{" "}
              &mdash; Leap Motion + Azure Kinect motion capture into
              manifold mesh, ZoeDepth &amp; MiDaS depth-to-3D, gaussian
              splat rendering in WebGPU. 360 Studio for parallax
              backgrounds.
            </li>
            <li>
              <span className="font-display text-pink-200">
                Studio tooling
              </span>{" "}
              &mdash; 20+ Claude skills (Blender automation, slot-in porting,
              skill index), Hangar console (scan / fix / extract / build),
              unified launcher orchestrating Ollama, Qdrant, Mosquitto,
              FastAPI.
            </li>
          </ul>
        </div>

        <div className="flex w-full flex-col items-center gap-5 border-t border-warm-black-800 pt-8">
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
              Proof of work
            </span>
            <p className="max-w-md text-xs leading-relaxed text-chrome-400 md:text-sm">
              Designed, manufactured, and shipped in-studio &mdash; the same
              stack the consultancy delivers, end-to-end. Light captured,
              translated into geometry, embedded with ambient-light
              waveguides, fabricated, finished, sold.
            </p>
          </div>
          <ul className="flex w-full flex-col gap-3 text-left text-sm leading-relaxed text-chrome-200 md:text-base">
            <li>
              <span className="font-display text-pink-200">
                Editioned objects
              </span>{" "}
              &mdash; signed, small batch waveguide sculptures from the
              twelve-year poi practice. Light-paintings translated into 3D
              geometry, embedded with{" "}
              <span className="text-chrome-100">ambient-light waveguides</span>
              {" "}&mdash; tech lifted from AR glasses, repurposed for
              artistic intent. Each piece pulls room light through curved
              channels in the printed form. Printed, finished by hand.
            </li>
            <li>
              <span className="font-display text-pink-200">Photographs</span>{" "}
              &mdash; limited editions of the source light-paintings on
              Hahnem&uuml;hle and Canson Baryta papers.
            </li>
            <li>
              <span className="font-display text-pink-200">
                Brand &amp; promotional capture
              </span>{" "}
              &mdash; persistence-of-vision LED arrays in long exposure,
              on-site. Bespoke light-painted imagery for brand campaigns,
              product launches, and event documentation.
            </li>
            <li>
              <span className="font-display text-pink-200">Print bureau</span>{" "}
              &mdash; A2 archival prints from the studio&rsquo;s Canon
              imagePROGRAF PRO-1100, paper choice your call.
            </li>
            <li>
              <span className="font-display text-pink-200">Commissions</span>{" "}
              &mdash; one-off pieces, configurable wall arrays, brand and
              corporate work.
            </li>
          </ul>
        </div>

        <GallerySection
          category="holographic"
          title="Holographic photography"
          caption="Persistence-of-vision LED arrays in long exposure. The source data for every editioned waveguide object."
        />

        <GallerySection
          category="printed"
          title="Printed objects"
          caption="Editioned waveguide sculptures, 3D-printed and hand-finished. Each piece embeds ambient-light optics — AR-glasses tech, repurposed for art."
        />

        <GallerySection
          category="drone"
          title="Drone photography"
          caption="Heritage and worksite capture. Long-exposure stills, swarm-flown light-painting, and source plates for gaussian splat reconstruction."
        />

        <div className="mt-2 flex flex-col items-center gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
            Direct line &mdash; projects, commissions, conversation
          </span>
          <a
            href="mailto:contact@holoflow.co.uk"
            className="font-display text-2xl tracking-tight text-pink-200 underline-offset-[6px] hover:underline md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            contact@holoflow.co.uk
          </a>
        </div>

        <div className="mt-6 text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-chrome-500">
          Holoflow.co.uk &middot; Salford, UK &middot; Open for business
        </div>
      </div>
    </div>
  );
}
