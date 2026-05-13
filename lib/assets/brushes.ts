/**
 * lib/assets/brushes.ts — Typed catalogue of every brush the studio
 * paints with.
 *
 * Migrated verbatim from the poi-sculptor brush engine at
 * D:\The_Hangar\apps\prototypes\poi-sculptor\brush-engine.html
 * (the BRUSHES array, lines 258-279, and the matching PARAMS table).
 *
 * Each brush is a node-material recipe — see the brush-engine.html
 * source for the WebGPU/TSL implementation. The .spec field carries
 * the three named parameters and their default values; .category
 * names which lineage (Tilt Brush import / Open Brush import /
 * studio-original Silk + Original families).
 */

export type BrushCategory =
  | "Tilt Brush"
  | "Open Brush"
  | "Silk"
  | "Original";

export type BrushParam = {
  /** Parameter name; one of three slots per brush. */
  n: string;
  /** Default value 0..1. */
  p: number;
};

export type BrushAsset = {
  slug: string;
  name: string;
  category: BrushCategory;
  /** Indicator dot colour (hex). */
  dotColor: string;
  /** One-line description of the visual character. */
  notes: string;
  /** The three named parameters with their default values. */
  spec: { params: [BrushParam, BrushParam, BrushParam] };
  /** Optional texture preview file under /public/assets/brushes/textures/. */
  textureUrl?: string;
};

export const brushes: BrushAsset[] = [
  {
    slug: "fire",
    name: "Fire",
    category: "Tilt Brush",
    dotColor: "#ff4e1a",
    notes: "Animated scrolling displacement fire.",
    spec: {
      params: [
        { n: "Scroll", p: 0.6 },
        { n: "Disp", p: 0.5 },
        { n: "Heat", p: 0.7 },
      ],
    },
  },
  {
    slug: "embers",
    name: "Embers",
    category: "Tilt Brush",
    dotColor: "#ff8c1a",
    notes: "Sparkling particle embers trail.",
    spec: {
      params: [
        { n: "Density", p: 0.7 },
        { n: "Size", p: 0.4 },
        { n: "Life", p: 0.6 },
      ],
    },
  },
  {
    slug: "electricity",
    name: "Electricity",
    category: "Tilt Brush",
    dotColor: "#18d4ff",
    notes: "Forking lightning along the path.",
    spec: {
      params: [
        { n: "Branch", p: 0.5 },
        { n: "Jitter", p: 0.7 },
        { n: "Speed", p: 0.6 },
      ],
    },
  },
  {
    slug: "neonpulse",
    name: "Neon Pulse",
    category: "Tilt Brush",
    dotColor: "#c44aff",
    notes: "Pulsating light wire with bloom.",
    spec: {
      params: [
        { n: "Pulse", p: 0.7 },
        { n: "Width", p: 0.4 },
        { n: "Glow", p: 0.8 },
      ],
    },
  },
  {
    slug: "lightwire",
    name: "Light Wire",
    category: "Tilt Brush",
    dotColor: "#ffb830",
    notes: "Thin glowing wire with energy nodes.",
    spec: {
      params: [
        { n: "Nodes", p: 0.5 },
        { n: "Glow", p: 0.7 },
        { n: "Freq", p: 0.4 },
      ],
    },
  },
  {
    slug: "stars",
    name: "Stars",
    category: "Tilt Brush",
    dotColor: "#e8f0ff",
    notes: "Star field scattered along stroke.",
    spec: {
      params: [
        { n: "Size", p: 0.5 },
        { n: "Twinkle", p: 0.6 },
        { n: "Density", p: 0.7 },
      ],
    },
  },
  {
    slug: "rainbow",
    name: "Rainbow",
    category: "Tilt Brush",
    dotColor: "#ff88aa",
    notes: "Chromatic ribbon HSL cycling.",
    spec: {
      params: [
        { n: "Speed", p: 0.5 },
        { n: "Width", p: 0.6 },
        { n: "Sat", p: 0.8 },
      ],
    },
  },
  {
    slug: "hypercolor",
    name: "Hypercolor",
    category: "Tilt Brush",
    dotColor: "#ff44cc",
    notes: "Audio-reactive colour morph.",
    spec: {
      params: [
        { n: "React", p: 0.7 },
        { n: "Blend", p: 0.5 },
        { n: "Cycle", p: 0.6 },
      ],
    },
  },
  {
    slug: "waveform",
    name: "Waveform",
    category: "Tilt Brush",
    dotColor: "#18ff88",
    notes: "Oscillating waveform displacement.",
    spec: {
      params: [
        { n: "Amp", p: 0.6 },
        { n: "Freq", p: 0.5 },
        { n: "Phase", p: 0.4 },
      ],
    },
  },
  {
    slug: "chromawave",
    name: "Chroma Wave",
    category: "Tilt Brush",
    dotColor: "#88ffdd",
    notes: "Chromatic aberration wave trail.",
    spec: {
      params: [
        { n: "Shift", p: 0.5 },
        { n: "Speed", p: 0.6 },
        { n: "Width", p: 0.4 },
      ],
    },
  },
  {
    slug: "smoke",
    name: "Smoke",
    category: "Open Brush",
    dotColor: "#7890a8",
    notes: "Volumetric turbulent smoke plume.",
    spec: {
      params: [
        { n: "Density", p: 0.6 },
        { n: "Rise", p: 0.5 },
        { n: "Turb", p: 0.7 },
      ],
    },
  },
  {
    slug: "comet",
    name: "Comet",
    category: "Open Brush",
    dotColor: "#ffe080",
    notes: "Speed-attenuated glowing comet tail.",
    spec: {
      params: [
        { n: "Tail", p: 0.7 },
        { n: "Speed", p: 0.5 },
        { n: "Glow", p: 0.8 },
      ],
    },
  },
  {
    slug: "bubbles",
    name: "Bubbles",
    category: "Open Brush",
    dotColor: "#88ccff",
    notes: "Iridescent soap bubble spheres.",
    spec: {
      params: [
        { n: "Size", p: 0.5 },
        { n: "Iridesc", p: 0.7 },
        { n: "Float", p: 0.4 },
      ],
    },
  },
  {
    slug: "streamers",
    name: "Streamers",
    category: "Open Brush",
    dotColor: "#ff9944",
    notes: "Ribbon streamers with flutter.",
    spec: {
      params: [
        { n: "Flutter", p: 0.6 },
        { n: "Width", p: 0.5 },
        { n: "Ribbon", p: 0.7 },
      ],
    },
  },
  {
    slug: "plasma",
    name: "Plasma",
    category: "Open Brush",
    dotColor: "#aa44ff",
    notes: "Plasma ball branching tendrils.",
    spec: {
      params: [
        { n: "Branch", p: 0.7 },
        { n: "Energy", p: 0.6 },
        { n: "Arc", p: 0.5 },
      ],
    },
  },
  {
    slug: "silk",
    name: "Silk Strand",
    category: "Silk",
    dotColor: "#c8d8f0",
    notes: "Flowing symmetry silk strands.",
    spec: {
      params: [
        { n: "Tension", p: 0.6 },
        { n: "Fade", p: 0.5 },
        { n: "Mirror", p: 0.8 },
      ],
    },
  },
  {
    slug: "silkbloom",
    name: "Silk Bloom",
    category: "Silk",
    dotColor: "#ffaad0",
    notes: "Petal-like silk with radial symmetry.",
    spec: {
      params: [
        { n: "Petals", p: 0.6 },
        { n: "Curl", p: 0.7 },
        { n: "Glow", p: 0.5 },
      ],
    },
  },
  {
    slug: "silkplasma",
    name: "Silk Plasma",
    category: "Silk",
    dotColor: "#88ffcc",
    notes: "Fluid-simulation silk tendrils.",
    spec: {
      params: [
        { n: "Flow", p: 0.7 },
        { n: "Visc", p: 0.5 },
        { n: "React", p: 0.6 },
      ],
    },
  },
  {
    slug: "molten",
    name: "Molten Metal",
    category: "Original",
    dotColor: "#c8880a",
    notes: "Poi sculpt: viscous liquid metal.",
    spec: {
      params: [
        { n: "Viscous", p: 0.7 },
        { n: "Heat", p: 0.8 },
        { n: "Metal", p: 0.6 },
      ],
    },
  },
  {
    slug: "poi",
    name: "Poi Trail",
    category: "Original",
    dotColor: "#ff6e1a",
    notes:
      "Flow-arts trail; the studio's signature brush. The one every other brush is measured against.",
    spec: {
      params: [
        { n: "Thick", p: 0.5 },
        { n: "Glow", p: 0.7 },
        { n: "Meld", p: 0.6 },
      ],
    },
  },
];

export function getBrush(slug: string): BrushAsset | undefined {
  return brushes.find((b) => b.slug === slug);
}

export const brushCategories: BrushCategory[] = [
  "Original",
  "Silk",
  "Tilt Brush",
  "Open Brush",
];

export function brushesByCategory(
  category: BrushCategory,
): BrushAsset[] {
  return brushes.filter((b) => b.category === category);
}
