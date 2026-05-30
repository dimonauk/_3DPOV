/**
 * app/holoflow/hangar/page.tsx — studio infrastructure.
 *
 * The Hangar is the monorepo + machine + service-mesh that runs the
 * whole studio. This page surfaces it: tree-view terminal, live port
 * grid, status panel, metric cards. Composition only.
 */

import {
  Card,
  ChromeLabel,
  Chip,
  DevDot,
  LiveDot,
  MetricCard,
  SectionHeader,
  Specs,
  Spec,
  StatusPanel,
  StubBox,
  Terminal,
  ThreeCol,
  TwoCol,
  type ChatTurn,
} from "components/holoflow";

export const metadata = {
  title: "The Hangar · Studio infrastructure · Holoflow",
  description:
    "pnpm monorepo, ~84 workspace packages on Chonky. Live ports, service mesh, print queue, the bench.",
};

export default function HangarPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="gold" withRule>
        Infrastructure
      </ChromeLabel>
      <SectionHeader
        accent="gold"
        eyebrow="The Hangar"
        title={<>The <em className="text-gold-300">Hangar</em></>}
        body="pnpm monorepo ~84 workspace packages on Windows machine Chonky. Two consolidation targets — Holoflow Mesh Studio and Charming Academy."
      />

      {/* tree-view terminal */}
      <div className="mt-8">
        <Terminal
          prompt={'tree D:\\The_Hangar\\ --depth=2'}
          lines={treeLines}
          stepMs={140}
        />
      </div>

      {/* live port grid */}
      <section className="mt-10">
        <ChromeLabel accent="teal">Live ports</ChromeLabel>
        <h2 className="mt-2 font-display text-2xl font-light md:text-3xl">
          What&rsquo;s <em className="text-teal-300">running</em> right now
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-warm-black-700 bg-warm-black-700 sm:grid-cols-3 lg:grid-cols-4">
          {PORTS.map((p) => (
            <div key={p.name} className="bg-warm-black-925 px-3 py-3">
              <div className="text-[12px] text-chrome-100">{p.name}</div>
              <div className="mt-1 font-mono text-[10px] text-chrome-500">{p.where}</div>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px]">
                {p.status === "live" ? <LiveDot /> : <DevDot />}
                <span className={p.status === "live" ? "text-teal-400" : "text-gold-400"}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* metric row */}
      <section className="mt-10">
        <ChromeLabel accent="lavender">By the numbers</ChromeLabel>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Workspace packages" value="84+" sub="pnpm · Turborepo" />
          <MetricCard label="Live ports"        value="8"   sub="aura · by-gen · jewel · …" />
          <MetricCard label="Machines on tailnet" value="3" sub="Chonky · Swift · Sovereign" />
          <MetricCard label="GPU VRAM available" value="12 GB" sub="RTX 3080 Ti · CUDA 12" />
        </div>
      </section>

      {/* two-col: specs + status */}
      <section className="mt-10">
        <TwoCol gap="gap-6">
          <div>
            <ChromeLabel accent="teal">Stack</ChromeLabel>
            <Specs className="mt-4">
              <Spec k="Monorepo" v="pnpm + Turborepo" />
              <Spec k="Frontend" v="Next.js 15 · App Router · Tailwind v4" />
              <Spec k="Engine" v="splat360 + splatter_engine · FastAPI" />
              <Spec k="AI runtime" v="Ollama (Gemma4 26b) · LLaVA" />
              <Spec k="3D" v="Three.js · R3F · WebGPU TSL" />
              <Spec k="Avatar" v="@pixiv/three-vrm · KokoroTTS" />
              <Spec k="Print pipeline" v="Blender → STL → D:/print-queue" />
              <Spec k="Mesh" v="Tailscale · MagicDNS · Funnel" />
              <Spec k="Bench bridge" v="splatter-sidecar · ar.compile-target" />
            </Specs>
          </div>
          <div className="flex flex-col gap-4">
            <StatusPanel
              title="Mesh status"
              rows={[
                { label: "Aura soul",     value: "ws:8770",  tone: "live" },
                { label: "MQTT broker",   value: "port 1883", tone: "live" },
                { label: "BY-GEN engine", value: "TCP:9876",  tone: "live" },
                { label: "Jewel Array",   value: "R3F · live", tone: "live" },
                { label: "VLM scorer",    value: "ready",    tone: "live" },
                { label: "Saturn 4",      value: "idle",     tone: "off" },
                { label: "Ollama",        value: "Gemma4 26b", tone: "live" },
              ]}
            />
            <StubBox title="Consolidation roadmap — stub">
              Migration phase: <code className="text-chrome-100">aura-upgraded-but-broken-main</code> →{" "}
              <code className="text-chrome-100">Dolly_OS</code>.{" "}
              <code>services/agent/</code> prerequisite copy before{" "}
              <code>aura_vtuber/</code> components compile. Mesh Studio and
              Charming Academy consolidation target Q3 2026.
            </StubBox>
          </div>
        </TwoCol>
      </section>

      {/* services / verticals overview */}
      <section className="mt-10">
        <ChromeLabel accent="gold">Verticals served</ChromeLabel>
        <ThreeCol gap="gap-3" >
          <Card>
            <div className="text-[12px] font-semibold text-chrome-100">Apps</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>aura-vrm</Chip><Chip>holoflow-mesh-studio</Chip>
              <Chip>charming-academy</Chip><Chip>local-chat-vrm</Chip>
              <Chip>dev-test-agent-town</Chip><Chip>dolly-os shell</Chip>
            </div>
          </Card>
          <Card>
            <div className="text-[12px] font-semibold text-chrome-100">Services</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>by-gen</Chip><Chip>jewel-array</Chip><Chip>mqtt-bridge</Chip>
              <Chip>vlm-audit</Chip><Chip>print-queue</Chip><Chip>splatter-sidecar</Chip>
            </div>
          </Card>
          <Card>
            <div className="text-[12px] font-semibold text-chrome-100">Engines</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip>splat360</Chip><Chip>comfyui</Chip><Chip>TripoSR</Chip>
              <Chip>nerfstudio</Chip><Chip>brush</Chip><Chip>postshot</Chip>
            </div>
          </Card>
        </ThreeCol>
      </section>
    </article>
  );
}

const PORTS = [
  { name: "aura-vrm",      where: "ws:8770",          status: "live" as const },
  { name: "by-gen engine", where: "TCP:9876",         status: "live" as const },
  { name: "jewel-array",   where: "Zustand/R3F",      status: "live" as const },
  { name: "soul bridge",   where: "ws:8770",          status: "live" as const },
  { name: "vlm-audit",     where: "score pipeline",   status: "live" as const },
  { name: "mqtt-gimbal",   where: "MQTT broker",      status: "live" as const },
  { name: "print-queue",   where: "D:/print-queue",   status: "live" as const },
  { name: "soulSlice.ts",  where: "gimbal bridge",    status: "live" as const },
  { name: "charming-academy", where: "apps/",         status: "dev"  as const },
  { name: "mesh-studio",   where: "apps/",            status: "dev"  as const },
  { name: "agent-town",    where: "Phaser",           status: "dev"  as const },
  { name: "dolly-os shell",where: "Theatre.js",       status: "dev"  as const },
];

const treeLines: Parameters<typeof Terminal>[0]["lines"] = [
  { tag: "ok",   text: <span><span className="text-teal-300">apps/aura-vrm</span><span className="text-chrome-500"> ─── </span>VRM avatar + soul bridge · port 8770</span> },
  { tag: "ok",   text: <span><span className="text-teal-300">apps/holoflow-mesh-studio</span><span className="text-chrome-500"> ─── </span>3D geometry consolidation target</span> },
  { tag: "ok",   text: <span><span className="text-teal-300">apps/charming-academy</span><span className="text-chrome-500"> ─── </span>coaching · VRM agents · narrative</span> },
  { tag: "info", text: <span><span className="text-lavender-200">apps/local-chat-vrm</span><span className="text-chrome-500"> ─── </span>local VRM chat interface</span> },
  { tag: "info", text: <span><span className="text-lavender-200">apps/dev-test-agent-town</span><span className="text-chrome-500"> ─── </span>Phaser agent simulation</span> },
  { tag: "info", text: <span><span className="text-gold-300">services/by-gen</span><span className="text-chrome-500"> ─── </span>Darwinian engine · TCP:9876</span> },
  { tag: "info", text: <span><span className="text-gold-300">services/jewel-array</span><span className="text-chrome-500"> ─── </span>144-cell procedural jewellery</span> },
  { tag: "info", text: <span><span className="text-coral-300">services/mqtt-bridge</span><span className="text-chrome-500"> ─── </span>gimbal · Insta360 control</span> },
  { tag: "info", text: <span><span className="text-coral-300">services/vlm-audit</span><span className="text-chrome-500"> ─── </span>vision-language model pipeline</span> },
  { tag: "info", text: <span><span className="text-pink-400">services/print-queue</span><span className="text-chrome-500"> ─── </span>D:/print-queue → STL export</span> },
  { tag: "info", text: <span className="text-chrome-500">··· +74 workspace packages · pnpm · Windows &ldquo;Chonky&rdquo;</span> },
];

// silence unused-type-import
const _unused: ChatTurn[] | undefined = undefined;
void _unused;
