/**
 * app/holoflow/skills/page.tsx — Skill Web.
 *
 * Force-directed graph of every capability, tool, and discipline
 * across the studio. Clusters by vertical. Hover a node for label +
 * cluster; drag to rearrange. Legend below.
 */

"use client";

import {
  ChromeLabel,
  Card,
  Chip,
  SectionHeader,
  SkillWebGraph,
  type SkillNode,
  type SkillEdge,
} from "components/holoflow";

const CLUSTER_COLOR: Record<string, string> = {
  heritage:      "#e8c97a",
  "vr-aura":     "#9a6dff",
  parametric:    "#3ecfb0",
  flow:          "#e07060",
  "neo-academy": "#d060a0",
  infra:         "#b39fff",
};

const NODES: SkillNode[] = [
  // Heritage cluster
  { key: "photogrammetry", label: "Photogrammetry",       cluster: "heritage", weight: 1.6 },
  { key: "lidar",          label: "LiDAR scanning",       cluster: "heritage" },
  { key: "insta360",       label: "Insta360 X4",          cluster: "heritage" },
  { key: "webxr",          label: "WebXR delivery",       cluster: "heritage", weight: 1.4 },
  { key: "resolve",        label: "DaVinci Resolve",      cluster: "heritage" },
  { key: "heritage-eng",   label: "Heritage England fmt", cluster: "heritage" },

  // VR / Aura
  { key: "vrm",            label: "VRM rigging",          cluster: "vr-aura", weight: 1.6 },
  { key: "three",          label: "Three.js / R3F",       cluster: "vr-aura", weight: 1.4 },
  { key: "soul-server",    label: "Soul server :8770",    cluster: "vr-aura" },
  { key: "ollama",         label: "Ollama (local LLM)",   cluster: "vr-aura" },
  { key: "kokoro",         label: "KokoroTTS",            cluster: "vr-aura" },
  { key: "lithp",          label: "lithp.ts",             cluster: "vr-aura" },
  { key: "somatic",        label: "somatic.ts",           cluster: "vr-aura" },
  { key: "vlm",            label: "VLM vision routing",   cluster: "vr-aura" },
  { key: "webgpu",         label: "WebGPU TSL",           cluster: "vr-aura", weight: 1.4 },

  // Parametric / BY-GEN
  { key: "bygen",          label: "BY-GEN engine",        cluster: "parametric", weight: 1.6 },
  { key: "genome",         label: "14-gene genome",       cluster: "parametric" },
  { key: "blender",        label: "Blender (bpy)",        cluster: "parametric", weight: 1.4 },
  { key: "mcp-tcp",        label: "bld_remote_mcp",       cluster: "parametric" },
  { key: "vlm-audit",      label: "VLM audit pipeline",   cluster: "parametric" },
  { key: "jewel",          label: "Jewel Array 144",      cluster: "parametric" },
  { key: "saturn",         label: "Elegoo Saturn 4",      cluster: "parametric" },
  { key: "stl",            label: "STL → print-queue",    cluster: "parametric" },

  // Flow Arts
  { key: "poi",            label: "Poi mechanics",        cluster: "flow", weight: 1.4 },
  { key: "antispin",       label: "Antispin / inspin",    cluster: "flow" },
  { key: "shell-curve",    label: "Shell curve",          cluster: "flow" },
  { key: "fusion",         label: "Fusion frame stack",   cluster: "flow" },
  { key: "lightpaint",     label: "Light painting",       cluster: "flow", weight: 1.4 },
  { key: "kinect",         label: "Azure Kinect",         cluster: "flow" },
  { key: "leap",           label: "Leap Motion",          cluster: "flow" },

  // Neo-London / Academy
  { key: "neo-london",     label: "Neo-London",           cluster: "neo-academy", weight: 1.6 },
  { key: "academy",        label: "Charming Academy",     cluster: "neo-academy" },
  { key: "ocean",          label: "OCEAN physics",        cluster: "neo-academy" },
  { key: "chrono",         label: "Chrono-Protocol",      cluster: "neo-academy" },
  { key: "dolly-paradox",  label: "Dolly Paradox",        cluster: "neo-academy" },
  { key: "circle-line",    label: "Circle Line circuit",  cluster: "neo-academy" },

  // Infra
  { key: "pnpm",           label: "pnpm + Turborepo",     cluster: "infra", weight: 1.4 },
  { key: "tailscale",      label: "Tailscale mesh",       cluster: "infra" },
  { key: "mqtt",           label: "MQTT lattice",         cluster: "infra" },
  { key: "splat360",       label: "splat360 engine",      cluster: "infra", weight: 1.4 },
  { key: "comfyui",        label: "ComfyUI",              cluster: "infra" },
  { key: "next",           label: "Next.js 15",           cluster: "infra" },
  { key: "tailwind",       label: "Tailwind v4 @theme",   cluster: "infra" },
  { key: "fastapi",        label: "FastAPI sidecars",     cluster: "infra" },
  { key: "chonky",         label: "Chonky · RTX 3080 Ti", cluster: "infra", weight: 1.6 },
];

const EDGES: SkillEdge[] = [
  // Heritage internal
  ["photogrammetry", "lidar"], ["photogrammetry", "blender"], ["photogrammetry", "insta360"],
  ["insta360", "mqtt"], ["webxr", "three"], ["webxr", "heritage-eng"], ["lidar", "blender"],
  ["resolve", "fusion"],

  // VR/Aura internal
  ["vrm", "three"], ["vrm", "soul-server"], ["soul-server", "ollama"], ["soul-server", "kokoro"],
  ["soul-server", "vlm"], ["lithp", "soul-server"], ["somatic", "soul-server"], ["soul-server", "mqtt"],
  ["webgpu", "three"], ["webgpu", "kokoro"],

  // Parametric internal
  ["bygen", "genome"], ["bygen", "blender"], ["bygen", "mcp-tcp"], ["bygen", "vlm-audit"],
  ["genome", "poi"], ["genome", "shell-curve"], ["jewel", "bygen"], ["jewel", "blender"],
  ["saturn", "stl"], ["stl", "bygen"],

  // Flow internal
  ["poi", "antispin"], ["poi", "shell-curve"], ["lightpaint", "insta360"], ["lightpaint", "fusion"],
  ["kinect", "leap"], ["poi", "kinect"],

  // Neo cluster
  ["neo-london", "academy"], ["neo-london", "ocean"], ["neo-london", "chrono"],
  ["neo-london", "dolly-paradox"], ["neo-london", "circle-line"], ["academy", "ocean"],
  ["dolly-paradox", "chrono"],

  // Infra ties everything
  ["splat360", "fastapi"], ["splat360", "blender"], ["splat360", "insta360"],
  ["comfyui", "blender"], ["comfyui", "vlm-audit"], ["pnpm", "next"], ["next", "tailwind"],
  ["next", "three"], ["chonky", "ollama"], ["chonky", "comfyui"], ["chonky", "saturn"],
  ["chonky", "bygen"], ["tailscale", "soul-server"], ["tailscale", "splat360"],

  // Cross-vertical bridges
  ["academy", "vrm"], ["academy", "soul-server"], ["ocean", "somatic"],
  ["jewel", "poi"], ["bygen", "lightpaint"], ["neo-london", "lightpaint"],
] as unknown as SkillEdge[];

// Tuple → object normalisation (so the table above can be terse).
const EDGES_OBJ: SkillEdge[] = EDGES.map((e) => {
  if (Array.isArray(e)) return { a: e[0] as string, b: e[1] as string };
  return e;
});

export default function SkillWebPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <ChromeLabel accent="lavender" withRule>
        Cross-vertical
      </ChromeLabel>
      <SectionHeader
        accent="lavender"
        eyebrow="Skill web"
        title={<>Web of <em className="text-gold-300">skills</em></>}
        body="Every capability, tool, and discipline across the studio laid flat as a force-directed graph. Hover a node for context; drag to rearrange."
      />

      <div className="mt-8">
        <SkillWebGraph
          nodes={NODES}
          edges={EDGES_OBJ}
          clusterColors={CLUSTER_COLOR}
          height={520}
        />
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap gap-5">
        {Object.entries(CLUSTER_COLOR).map(([cluster, color]) => (
          <div key={cluster} className="flex items-center gap-2 font-mono text-[10px] text-chrome-400">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            {LABELS[cluster]}
          </div>
        ))}
      </div>

      {/* cluster cards */}
      <section className="mt-12">
        <ChromeLabel accent="teal">Clusters</ChromeLabel>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(LABELS).map(([cluster, label]) => {
            const nodesInCluster = NODES.filter((n) => n.cluster === cluster);
            return (
              <Card key={cluster}>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: CLUSTER_COLOR[cluster] }}
                >
                  {label}
                </div>
                <div className="mt-1 text-[11px] text-chrome-100">
                  {nodesInCluster.length} skills
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {nodesInCluster.map((n) => (
                    <Chip key={n.key}>{n.label}</Chip>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </article>
  );
}

const LABELS: Record<string, string> = {
  heritage:      "Heritage",
  "vr-aura":     "VR / Aura",
  parametric:    "Parametric / BY-GEN",
  flow:          "Flow Arts",
  "neo-academy": "Neo-London / Academy",
  infra:         "Infrastructure",
};
