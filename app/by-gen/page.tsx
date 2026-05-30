"use client";

/**
 * app/by-gen/page.tsx — BY-GEN evolution engine vertical.
 *
 * Darwinian loop: genesis → Blender bake via TCP:9876 → VLM audit →
 * selection → STL export → simulated annealing. 14-gene genome.
 * Cribbed from the v5 `#p-bygen` section.
 *
 * Four tabs: Mutation Console, 3D Organism (Phase E canvas),
 * Skills Ladder, Pipeline. Console + organism share state via
 * Zustand once the canvas lands.
 */

import {
  Card,
  Chip,
  ChromeLabel,
  Ladder,
  LadderRung,
  MetricCard,
  ProcessSteps,
  type ProcessStep,
  SectionHeader,
  Spec,
  Specs,
  StubBoxEgg,
  TabBar,
  TabPanel,
  Terminal,
  useTabs,
} from "components/holoflow";

const GENES = [
  "spine_curl", "branch_density", "surface_rough", "twist_rate",
  "poi_amplitude", "poi_frequency", "poi_phase", "radial_sym",
  "taper_ratio", "noise_scale", "noise_strength", "crosssection",
  "length_scale", "organic_bias",
];

const PIPELINE_STEPS: ProcessStep[] = [
  {
    title: "Genesis",
    body: "14-float gene vector · seed phrase or category template · clamp to legal ranges.",
  },
  {
    title: "Blender bake (TCP:9876)",
    body: "soulSlice MCP bridge · GN tree applies genome → mesh · LOD pair baked.",
  },
  {
    title: "VLM aesthetic audit",
    body: "Local vision model scores against the category bible · prose feedback logged.",
  },
  {
    title: "Tournament selection",
    body: "Top-k by score breed pairwise · 2-point crossover + Gaussian mutation @ 0.12.",
  },
  {
    title: "STL export & anneal",
    body: "Print-grade export · annealed schedule cools mutation rate as score plateaus.",
  },
];

export default function ByGenPage() {
  const t = useTabs([
    "Mutation console",
    "3D organism",
    "Skills ladder",
    "Pipeline",
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <ChromeLabel withRule accent="lavender">
        Vertical 06
      </ChromeLabel>
      <SectionHeader
        eyebrow="BY-GEN Evolution Engine"
        title={
          <>
            BY-<em>GEN</em> Evolution Engine
          </>
        }
        body="Darwinian loop: genesis → Blender bake via TCP:9876 → VLM audit → selection → STL export → simulated annealing. 14-gene genome."
        accent="lavender"
      />

      <TabBar tabs={t.tabs} active={t.active} onChange={t.setActive} />

      {/* ──────── Mutation console ──── */}
      <TabPanel active={t.active === 0}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-chrome-100">
                Genome mutation console
              </h3>
              <span className="rounded-sm border border-lavender-400 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-lavender-300">
                Mutate ⟳
              </span>
            </div>
            <div className="mt-3 rounded-md bg-warm-black-925/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-chrome-500">
                Live generation score
              </div>
              <div className="mt-1 text-2xl font-medium text-lavender-300">
                0.847
              </div>
              <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-warm-black-900">
                <div className="h-full w-[84.7%] rounded-full bg-lavender-300 transition-[width] duration-1000" />
              </div>
              <div className="mt-1 font-mono text-[10px] text-chrome-500">
                VLM aesthetic audit · simulated annealing breed
              </div>
            </div>
            <div className="mt-3">
              <Terminal
                prompt="by_gen --evolve --port 9876"
                lines={[
                  { tag: "ok", text: "mutation engine standing by" },
                  { tag: "info", text: "14-float gene vector loaded" },
                  { tag: "soul", text: "tournament selection armed" },
                  { tag: "emo", text: "annealing schedule cooling at gen 14" },
                ]}
              />
            </div>
          </Card>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Generation" value="Gen 1" />
              <MetricCard label="Mutation rate" value="0.12" />
            </div>
            <Card>
              <h3 className="text-sm font-medium text-chrome-100">14 genes</h3>
              <div className="mt-2 -ml-1">
                {GENES.map((g) => (
                  <Chip key={g}>{g}</Chip>
                ))}
              </div>
            </Card>
            <StubBoxEgg title="Genome easter egg" eggKey="genes">
              Click to reveal why there are exactly 14 genes and what they
              have in common with the human hand.
            </StubBoxEgg>
          </div>
        </div>
      </TabPanel>

      {/* ──────── 3D organism ──── */}
      <TabPanel active={t.active === 1}>
        <Card className="grid place-items-center bg-warm-black-925/40 py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-lavender-300">
              R3F + TSL organism preview
            </div>
            <p className="mt-2 font-mono text-[11px] text-chrome-500">
              Genome → mesh lands in the TSL pass (Phase E).
              <br />
              Live mutation slider drives the GN tree over the WebGPU
              wire.
            </p>
          </div>
        </Card>
      </TabPanel>

      {/* ──────── Skills ladder ──── */}
      <TabPanel active={t.active === 2}>
        <Ladder title="BY-GEN skills ladder" badge="5 rungs">
          <LadderRung
            n={1}
            level="entry"
            name="Gene vector design"
            desc="14-float layout · ranges · clamping · serialisation."
          />
          <LadderRung
            n={2}
            level="mid"
            name="Blender GN tree authoring"
            desc="Genome-driven geometry nodes · radial sym · taper · noise displacement."
          />
          <LadderRung
            n={3}
            level="mid"
            name="MCP TCP:9876 bridge"
            desc="soulSlice harness · headless bake · STL/glb export · idempotent runs."
          />
          <LadderRung
            n={4}
            level="adv"
            name="VLM audit loop"
            desc="Local vision-model scoring · category bibles · breeding selection."
          />
          <LadderRung
            n={5}
            level="master"
            name="Annealing schedule + provenance"
            desc="Mutation rate decay · score plateau detection · genome → edition lineage."
          />
        </Ladder>
      </TabPanel>

      {/* ──────── Pipeline ──── */}
      <TabPanel active={t.active === 3}>
        <Card>
          <h3 className="text-sm font-medium text-chrome-100">
            Evolution pipeline
          </h3>
          <div className="mt-4">
            <ProcessSteps steps={PIPELINE_STEPS} accent="lavender" />
          </div>
          <Specs className="mt-4">
            <Spec k="Bridge" v="MCP soulSlice · TCP:9876" />
            <Spec k="VLM" v="Local Ollama vision model · category bibles" />
            <Spec k="Selection" v="Tournament k=4 · 2-point crossover" />
            <Spec k="Mutation" v="Gaussian @ 0.12 · annealed by score plateau" />
          </Specs>
        </Card>
      </TabPanel>
    </main>
  );
}
