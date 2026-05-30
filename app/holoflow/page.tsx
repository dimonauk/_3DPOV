/**
 * app/holoflow/page.tsx — studio landing.
 *
 * Composes the entire holoflow component vocabulary into one page so
 * the system end-to-end is provable. Hero → marquee → pillars →
 * verticals → stats → contact teaser. Layout wraps with nav + bg +
 * footer (see layout.tsx).
 */

import Link from "next/link";

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Chip,
  CircuitTraces,
  CoordStrip,
  HeroSideStats,
  Marquee,
  MetricCard,
  PillarCard,
  PillarGrid,
  ScrollIndicator,
  SectionHeader,
  ThreeCol,
} from "components/holoflow";

export const metadata = {
  title: "Holo-Flow Studio · Light · Structure · Evolution",
  description:
    "Long-exposure 360° light painting. 3D-printed Phygital Twins. Live generative sculpture. Heritage documentation. Aura AI. Dimona Dougherty's London studio.",
};

const MARQUEE_ITEMS = [
  "Heritage Documentation",
  "VR Development",
  "Parametric Manufacturing",
  "Jewel Array — 144 cells",
  "Poi Flow Arts",
  "Aura AI Avatar",
  "BY-GEN Evolution Engine",
  "Light Trail Videography",
  "Neo-London Universe",
  "Soul Bridge ws:8770",
  "Charming Academy",
  "Darwinian Geometry",
  "WebGPU TSL Compute",
];

const STATS = [
  { value: "84", label: "Packages" },
  { value: "8", label: "Live ports" },
  { value: "144", label: "Jewel cells" },
  { value: "14", label: "Genome genes" },
  { value: "358", label: "Blender objects" },
];

export default function HoloflowLanding() {
  return (
    <main>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col justify-end overflow-hidden px-6 pb-14 pt-12 md:px-10">
        <CircuitTraces />
        <aside className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 md:right-10 md:block">
          <HeroSideStats stats={STATS} />
        </aside>

        <div className="relative z-10 max-w-3xl">
          <CoordStrip
            items={[
              "51.5798°N",
              "0.1837°E",
              "Romford, Greater London",
            ]}
          />
          <ChromeLabel accent="teal" withRule>
            Heritage · VR · Parametric · Living AI · Flow Arts
          </ChromeLabel>
          <h1 className="mt-5 font-display text-5xl font-light leading-[0.93] tracking-[-0.02em] md:text-7xl">
            Where <em className="text-gold-300">light</em>
            <br />
            becomes <span className="text-teal-300">structure</span>
            <br />
            &amp; <span className="text-lavender-200">structure</span> evolves
          </h1>
          <p className="mt-5 max-w-lg font-mono text-[12px] leading-loose tracking-wide text-chrome-400">
            Holo-Flow Studio captures what exists, builds what hasn&rsquo;t been
            imagined, and fabricates what was previously impossible to make by
            hand &mdash; woven from flow arts, procedural design, and living AI.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <BtnPrimary href="#work">Explore Services</BtnPrimary>
            <BtnGhost href="/holoflow/aura">Meet Aura →</BtnGhost>
            <BtnGhost href="/splatter">Splatter →</BtnGhost>
            <BtnGhost href="/holoflow/bygen">BY-GEN →</BtnGhost>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
          <ScrollIndicator />
        </div>
      </section>

      <Marquee items={MARQUEE_ITEMS} />

      {/* ─── PILLARS ─────────────────────────────────────────── */}
      <section id="work" className="px-6 py-16 md:px-10">
        <SectionHeader
          accent="lavender"
          eyebrow="Service Pillars"
          title={<>Three ways we <em className="text-gold-300">work</em></>}
          body="At the boundary of the physical and rendered — capturing what exists, building what hasn't been imagined, fabricating what was previously impossible by hand."
        />
        <PillarGrid>
          <PillarCard
            n={1} total={3}
            glyph="⟁"
            title="Heritage Documentation"
            desc="Photogrammetry, LiDAR scanning, and immersive archiving of built heritage. We make the irreplaceable persistent."
            tags={["Photogrammetry", "LiDAR", "Insta360", "WebXR", "Resolve"]}
            accent="gold"
            href="/holoflow/heritage"
          />
          <PillarCard
            n={2} total={3}
            glyph="◬"
            title="VR Development & Consulting"
            desc="End-to-end immersive experience design — narrative VR environments and AI-driven avatar systems. VRM, R3F, soul-bridged characters."
            tags={["VRM", "Three.js", "Aura AI", "WebXR", "KokoroTTS"]}
            accent="lavender"
            href="/holoflow/aura"
          />
          <PillarCard
            n={3} total={3}
            glyph="⬡"
            title="Parametric Manufacturing"
            desc="Algorithmically-generated forms into physical reality. Jewellery, sculpture, and functional objects grown from Darwinian loops."
            tags={["BY-GEN", "Jewel Array", "FDM", "Resin", "Geometry Nodes"]}
            accent="teal"
            href="/holoflow/bygen"
          />
        </PillarGrid>
      </section>

      {/* ─── ACTIVE VERTICALS ───────────────────────────────── */}
      <section className="border-y border-warm-black-700 bg-warm-black-925/40 px-6 py-16 md:px-10">
        <SectionHeader
          accent="teal"
          eyebrow="Active deep-dives"
          title={<>Verticals you can <em className="text-gold-300">walk into now</em></>}
          body="Each vertical is a working surface — interactive demos, live data, real handoff to the underlying engines."
        />
        <ThreeCol gap="gap-3">
          <Link href="/splatter" className="group block border border-warm-black-700 bg-warm-black-925 p-5 transition-colors hover:border-teal-400">
            <ChromeLabel accent="teal">Splatter</ChromeLabel>
            <h3 className="mt-3 font-display text-2xl font-light">360° → Gaussian Splat</h3>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-chrome-400">
              The missing step between your 360° camera and your Gaussian Splat.
              AI Scout, Coverage Globe, AR export, WebXR viewer.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>Scout</Chip><Chip>Preflight</Chip><Chip>Coverage</Chip>
              <Chip>AR export</Chip><Chip>WebXR</Chip>
            </div>
          </Link>

          <Link href="/holoflow/aura" className="group block border border-warm-black-700 bg-warm-black-925 p-5 transition-colors hover:border-lavender-400">
            <ChromeLabel accent="lavender">Aura / DollyOS</ChromeLabel>
            <h3 className="mt-3 font-display text-2xl font-light">Living AI Avatar</h3>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-chrome-400">
              VRM character with Python soul server. Streaming emotion + lip
              sync, vision routing, somatic conditioning.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>VRM</Chip><Chip>Ollama</Chip><Chip>KokoroTTS</Chip>
              <Chip>ws:8770</Chip>
            </div>
          </Link>

          <Link href="/holoflow/hangar" className="group block border border-warm-black-700 bg-warm-black-925 p-5 transition-colors hover:border-gold-400">
            <ChromeLabel accent="gold">The Hangar</ChromeLabel>
            <h3 className="mt-3 font-display text-2xl font-light">Studio infrastructure</h3>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-chrome-400">
              pnpm monorepo, ~84 workspace packages on &ldquo;Chonky&rdquo;.
              Live ports, dev queues, the print pipeline.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>pnpm</Chip><Chip>turbo</Chip><Chip>Tailscale</Chip>
              <Chip>MQTT</Chip>
            </div>
          </Link>
        </ThreeCol>
      </section>

      {/* ─── STATS ─────────────────────────────────────────── */}
      <section className="px-6 py-16 md:px-10">
        <SectionHeader
          accent="gold"
          eyebrow="At a glance"
          title={<>The studio in <em className="text-gold-300">numbers</em></>}
        />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Years flow arts" value="12+" sub="Spinning since 2014" />
          <MetricCard label="VR development" value="20 yr" sub="From CRT-era to WebGPU" />
          <MetricCard label="Live ports" value="8" sub="aura · by-gen · jewel · …" />
          <MetricCard label="Workspace packages" value="84" sub="pnpm monorepo · Chonky" />
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="border-t border-warm-black-700 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <ChromeLabel accent="pink">Commission · enquire</ChromeLabel>
          <h2 className="mt-3 font-display text-3xl font-light md:text-5xl">
            Start a <em className="italic text-gold-300">conversation</em>
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-mono text-[11px] leading-loose text-chrome-400">
            Heritage projects, VR commissions, parametric pieces, Aura
            deployments, Charming Academy pilot — get in touch.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BtnPrimary href="/contact">Contact the studio</BtnPrimary>
            <BtnGhost href="/pricing">See pricing →</BtnGhost>
          </div>
        </div>
      </section>
    </main>
  );
}
