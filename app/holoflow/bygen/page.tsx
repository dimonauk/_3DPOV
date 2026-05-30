/**
 * app/holoflow/bygen/page.tsx — BY-GEN Evolution Engine.
 *
 * Darwinian loop: genesis → Blender bake via TCP:9876 → VLM audit →
 * selection → STL export → simulated-annealing breeding. 14-gene
 * genome. Page composes PopulationGrid + GenomeConsole + ProcessSteps
 * + Slider for live parameter tweaking.
 *
 * The actual engine is a Python service on Chonky; this page is the
 * catalogue + an interactive UI mock-up where the user can perturb
 * genes and see the genome panel update.
 */

"use client";

import { useState } from "react";

import {
  BtnGhost,
  BtnPrimary,
  ChromeLabel,
  Card,
  Chip,
  DemoCanvas,
  DemoLayout,
  GenomeConsole,
  Ladder,
  LadderRung,
  PopulationGrid,
  type PopulationMember,
  ProcessSteps,
  type ProcessStep,
  SectionHeader,
  Slider,
  Specs,
  Spec,
} from "components/holoflow";

const GENE_NAMES = [
  "spine_curl", "branch_density", "surface_rough", "twist_rate",
  "poi_amplitude", "poi_frequency", "poi_phase", "radial_sym",
  "taper_ratio", "noise_scale", "noise_strength", "crosssection",
  "length_scale", "organic_bias",
];

const PIPELINE: ProcessStep[] = [
  { title: "Genesis",        body: "Random 14-float genome · population seeded." },
  { title: "Blender bake",   body: "bld_remote_mcp · TCP:9876 · bpy modifier stack." },
  { title: "Headless render",body: "bpy.ops.render.render() · PNG output." },
  { title: "VLM audit",      body: "Vision-language aesthetic score · threshold 0.72." },
  { title: "Selection",      body: "Tournament · elitism top 2 · culling." },
  { title: "STL → print",    body: "D:/print-queue · Saturn 4 · resin." },
];

const SEED_POPULATION: PopulationMember[] = Array.from({ length: 10 }).map((_, i) => ({
  key: `cand-${i}`,
  score: 0.4 + Math.random() * 0.55,
  cell: (
    <div className="flex h-full w-full items-center justify-center">
      <span className="font-display text-2xl text-teal-400/70">
        {["⌬","⬡","⊕","✦","⊛","⌭","⊗","▣","◬","⟁"][i % 10]}
      </span>
    </div>
  ),
}));

export default function ByGenPage() {
  const [selected, setSelected] = useState(SEED_POPULATION[0]!.key);
  const [genes, setGenes] = useState<Record<string, number>>(() =>
    Object.fromEntries(GENE_NAMES.map((n) => [n, Math.random()])),
  );
  const [gen, setGen] = useState(1);
  const [log, setLog] = useState<string[]>([
    "[ READY ] mutation engine standing by",
    "[ GENE ] 14-float vector loaded",
    "[ BREED ] tournament selection armed",
  ]);

  const mutate = () => {
    setGenes((g) => {
      const next: Record<string, number> = {};
      for (const k of GENE_NAMES) {
        const cur = g[k] ?? 0.5;
        const delta = (Math.random() - 0.5) * 0.24;
        next[k] = Math.max(0, Math.min(1, cur + delta));
      }
      return next;
    });
    setGen((n) => n + 1);
    setLog((l) =>
      [
        `[ MUT  ] gen ${gen + 1} · 14 genes perturbed ±0.12`,
        `[ BAKE ] dispatched to bld_remote_mcp · TCP:9876`,
        `[ VLM  ] awaiting aesthetic score…`,
        ...l,
      ].slice(0, 8),
    );
  };

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="lavender" withRule>
        Vertical 06 — Deep Dive
      </ChromeLabel>
      <SectionHeader
        accent="lavender"
        eyebrow="BY-GEN Evolution Engine"
        title={<>BY-<em className="text-gold-300">GEN</em> Evolution Engine</>}
        body="Darwinian loop: genesis → Blender bake via TCP:9876 → VLM audit → selection → STL export → simulated-annealing breeding. 14-gene genome."
      />

      <section className="mt-8">
        <ChromeLabel accent="teal">Population</ChromeLabel>
        <p className="mt-2 max-w-2xl font-mono text-[11px] leading-loose text-chrome-400">
          10 candidates per generation. Click any cell to select it; score
          shown bottom-right is the VLM aesthetic-audit value (0–100).
        </p>
        <div className="mt-4">
          <PopulationGrid
            members={SEED_POPULATION}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </section>

      <DemoLayout>
        <div className="flex flex-col gap-4">
          <DemoCanvas
            status="EVOLVING"
            statusTone="lavender"
            hud={[
              { text: "BY-GEN ENGINE · TCP:9876",          tone: "teal" },
              { text: `GENERATION: ${String(gen).padStart(3, "0")}`, tone: "lavender" },
              { text: `SELECTED: ${selected}`,             tone: "gold" },
            ]}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-display text-5xl italic text-lavender-200">
                ⊗
              </div>
            </div>
          </DemoCanvas>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={mutate}
              className="border border-teal-400 bg-teal-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.13em] text-teal-400 hover:bg-teal-400 hover:text-warm-black-950"
            >
              ⟳ Evolve generation
            </button>
            <BtnGhost href="/contact?service=parametric">Commission a piece →</BtnGhost>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <GenomeConsole
            title="Genome Mutation Console"
            genes={GENE_NAMES.map((k) => ({ k, v: genes[k] ?? 0.5 }))}
            log={log}
            onMutate={mutate}
          />

          {/* macro sliders — composite parameters above the raw 14 genes */}
          <Card>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-300">
              Macro parameters
            </div>
            <div className="flex flex-col gap-3">
              <Slider label="Complexity"        value={genes.spine_curl     ?? 0.5} onChange={(v) => setGenes((g) => ({ ...g, spine_curl: v }))}     />
              <Slider label="Organic flow"      value={genes.organic_bias   ?? 0.5} onChange={(v) => setGenes((g) => ({ ...g, organic_bias: v }))}   />
              <Slider label="Waveguide density" value={genes.branch_density ?? 0.5} onChange={(v) => setGenes((g) => ({ ...g, branch_density: v }))} />
              <Slider label="Poi energy"        value={genes.poi_amplitude  ?? 0.5} onChange={(v) => setGenes((g) => ({ ...g, poi_amplitude: v }))}  />
              <Slider label="Branch factor"     value={genes.taper_ratio    ?? 0.5} onChange={(v) => setGenes((g) => ({ ...g, taper_ratio: v }))}    />
            </div>
          </Card>

          <Specs>
            <Spec k="Modifiers"  v="Displace → Smooth → SubD" />
            <Spec k="TCP bridge" v="bld_remote_mcp · localhost:9876" />
            <Spec k="Render"     v="bpy.ops.render.render() · headless" />
            <Spec k="Scorer"     v="LLaVA · aesthetic audit · ≥0.72" />
            <Spec k="Selection"  v="Tournament · elitism top 2" />
            <Spec k="Export"     v="STL → D:/print-queue → Saturn 4" />
          </Specs>
        </div>
      </DemoLayout>

      <section className="mt-12">
        <ChromeLabel accent="gold">The loop</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          Genesis → bake → score → <em className="text-gold-300">breed</em>
        </h2>
        <ProcessSteps steps={PIPELINE} accent="lavender" />
      </section>

      <section className="mt-10">
        <ChromeLabel accent="teal">Skills ladder</ChromeLabel>
        <Ladder title="BY-GEN Skills Ladder" badge="6 rungs">
          <LadderRung n={1} level="entry" name="Blender Python fundamentals"
            desc="bpy API · modifier stacks · headless batch render · output paths." />
          <LadderRung n={2} level="entry" name="Genome design"
            desc="14 genes · float vector · mutation rates · gene semantics." />
          <LadderRung n={3} level="mid" name="TCP bridge architecture"
            desc="bld_remote_mcp · JSON socket · port 9876 · command protocol." />
          <LadderRung n={4} level="adv" name="VLM audit pipeline"
            desc="Vision-language scoring · aesthetic criteria · selection threshold 0.72." />
          <LadderRung n={5} level="adv" name="Simulated annealing breeding"
            desc="Tournament selection · crossover · annealing schedule · elitism." />
          <LadderRung n={6} level="master" name="Full Darwinian loop"
            desc="genesis → bake → VLM → selection → STL → D:/print-queue → breed." />
        </Ladder>
      </section>

      <Card className="mt-10 border-l-2 border-l-lavender-400">
        <div className="font-display text-2xl italic text-lavender-200">
          The whole loop is live.
        </div>
        <p className="mt-2 font-mono text-[11px] leading-loose text-chrome-300">
          Discovered during the April 2026 audit: the full Darwinian pipeline
          was already running &mdash; &ldquo;it was already there, it just
          needed finding.&rdquo; 5 species. Population of 10. Tournament
          selection with elitism. LLaVA aesthetic scoring on RTX 3080 Ti.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>5 species</Chip><Chip>14 genes</Chip>
          <Chip>RTX 3080 Ti</Chip><Chip>Elegoo Saturn 4</Chip>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <BtnPrimary href="/contact?service=parametric">Commission a piece</BtnPrimary>
          <BtnGhost href="/holoflow/jewel">Jewel Array →</BtnGhost>
          <BtnGhost href="/holoflow/poi">Poi vocabulary →</BtnGhost>
        </div>
      </Card>
    </article>
  );
}
