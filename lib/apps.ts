/**
 * lib/apps.ts — Static catalogue of in-site apps surfaced at /apps.
 *
 * One-line role: the launcher manifest — every callable surface the studio wants featured as an "app" the user can launch, native or iframed or in-page.
 * Full purpose in apps.PURPOSE.md.
 */

export type AppKind =
  | "demo" // in-repo R3F / Canvas demo
  | "visualiser" // visualiser series entry
  | "tool" // utility / studio-tool
  | "external" // future iframe-wrapped external app (paid or free)
  | "play"; // game-shaped piece

export type AppGateKind =
  | "open" // free, no auth
  | "rookery" // requires Rookery subscription tier
  | "purchase"; // one-time IAP

export type AppEntry = {
  id: string;
  name: string;
  kind: AppKind;
  /** Internal route or external URL. */
  href: string;
  /** True if `href` is an external URL — will iframe-wrap with a Capacitor-friendly shell. */
  external?: boolean;
  summary: string;
  /** Pillar tag for grouping in the catalogue. */
  tag: string;
  /** Access gate; v0.1 most are "open"; "rookery" + "purchase" land when Stripe wires in. */
  gate: AppGateKind;
  /** ChronoMode register associated with the experience (per the wheel canon). */
  mode?: "amber" | "azure" | "amethyst" | "crimson" | "veridian";
};

export const apps: AppEntry[] = [
  {
    id: "aura-talks",
    name: "Aura speaks",
    kind: "demo",
    href: "/demo/aura-talks",
    summary:
      "Aura's full lipsync chain — type a line, she speaks, her mouth moves, her face mirrors mood. Eight bricks composing.",
    tag: "Aura",
    gate: "open",
    mode: "azure",
  },
  {
    id: "vrm-stack",
    name: "VRM stack",
    kind: "demo",
    href: "/demo/vrm",
    summary:
      "Aura's body in her hostess-superheroine-brat default stance, breathing. The capability stack proven end-to-end.",
    tag: "Aura",
    gate: "open",
    mode: "azure",
  },
  {
    id: "parallax-shells",
    name: "Ten shells",
    kind: "demo",
    href: "/demo/parallax-shells",
    summary:
      "The Russian-doll world wrapper — ten concentric layers, head-pose-driven offsets. The substrate user-facing.",
    tag: "World",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "strange-attractor",
    name: "Strange attractors",
    kind: "visualiser",
    href: "/visualiser/strange-attractor",
    summary:
      "Pipeline Epsilon. Mood picks the engine; the trajectory regenerates; Aura is the attractor she's feeling.",
    tag: "Visualiser",
    gate: "open",
    mode: "amethyst",
  },
  {
    id: "reaction-diffusion",
    name: "Reaction-diffusion",
    kind: "visualiser",
    href: "/visualiser/reaction-diffusion",
    summary:
      "Gray-Scott chemistry on a 128×128 grid. Five presets — leopards, mitosis, coral, solitons, spirals.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "caustic-projector",
    name: "Caustic projector",
    kind: "visualiser",
    href: "/visualiser/caustic-projector",
    summary:
      "Snell's Law made tangible — refract parallel rays through a curved surface, watch the caustic gather and disperse.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "laban-dial",
    name: "Laban Effort dial",
    kind: "visualiser",
    href: "/visualiser/laban-dial",
    summary:
      "Space × Time × Weight × Flow — the kinematic-extraction layer the choreography engine lives on.",
    tag: "Visualiser",
    gate: "open",
    mode: "azure",
  },
  {
    id: "marching-cubes",
    name: "Marching cubes",
    kind: "visualiser",
    href: "/visualiser/marching-cubes",
    summary:
      "Scrub the iso-value through a 3D field; the 256-case lookup table opened.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "total-internal-reflection",
    name: "Total internal reflection",
    kind: "visualiser",
    href: "/visualiser/total-internal-reflection",
    summary:
      "Snell + the full Fresnel reflectance. Drag the incident angle; watch the refracted ray vanish above critical.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "atelier",
    name: "Atelier — 30 algorithms",
    kind: "tool",
    href: "/atelier/algorithms",
    summary:
      "The jewellery algorithm cabinet. Thirty named generators, eight kingdoms. Each opens to a live preview.",
    tag: "Studio",
    gate: "open",
  },
  {
    id: "capabilities",
    name: "Capability registry",
    kind: "tool",
    href: "/capabilities",
    summary:
      "Every brick the studio knows about. The substrate for the VR Duplo programming language.",
    tag: "Studio",
    gate: "open",
  },
  {
    id: "pipelines",
    name: "Pipelines",
    kind: "tool",
    href: "/pipelines",
    summary:
      "The named compositions — lipsync, mood face, held stance, Pipeline Epsilon, ten-shell parallax, look back, dialogue loop.",
    tag: "Studio",
    gate: "open",
  },
  {
    id: "sphere",
    name: "The sphere",
    kind: "tool",
    href: "/sphere",
    summary:
      "Every page on the site as a node; every cross-reference as an edge. The structure of the catalogue, made visible.",
    tag: "Studio",
    gate: "open",
  },
  {
    id: "neo-london",
    name: "Neo-London — Chrono-Protocol",
    kind: "play",
    href: "/play/neo-london",
    summary:
      "The studio's AR game prototype. Five-mode color pie; three zones; Aura + Yow + Purp as the trio.",
    tag: "Play",
    gate: "open",
    mode: "crimson",
  },
  {
    id: "wall-piece-designer",
    name: "Wall Piece Designer",
    kind: "tool",
    href: "/atelier/wall-piece-designer",
    summary:
      "Breed a single waveguide wall sculpture via the studio's evolution loop. 12 candidates per generation; mutate, breed, keep one to commission.",
    tag: "Studio",
    gate: "open",
    mode: "amber",
  },
  {
    id: "wall-array-designer",
    name: "Wall Array Designer",
    kind: "tool",
    href: "/atelier/wall-array-designer",
    summary:
      "Breed a 9-piece wall array. Shared parent lineage means the tiles read as a rhythm; commissioned as one belt-printed slot.",
    tag: "Studio",
    gate: "open",
    mode: "amber",
  },
  {
    id: "jewellery-designer",
    name: "Jewellery Designer",
    kind: "tool",
    href: "/atelier/jewellery-designer",
    summary:
      "Breed a wearable waveguide. Same engine as the wall designers, biased for gem-rich genomes + wearable scale.",
    tag: "Studio",
    gate: "open",
    mode: "amber",
  },
  {
    id: "shader-station",
    name: "Shader Station",
    kind: "tool",
    href: "/atelier/shader-station",
    summary:
      "Author GLSL on a textured sphere. 28 seed presets, audio-reactive uniforms, QR transfer between devices, 2048×1024 equirect PNG export.",
    tag: "Visualiser",
    gate: "open",
    mode: "azure",
  },
  {
    id: "gaze-heatmap",
    name: "Gaze Heatmap",
    kind: "tool",
    href: "/atelier/gaze-heatmap",
    summary:
      "Replay recorded gaze JSON on an equirect canvas. Heatmap / foveal-mask / scanpath modes, dwell-zone clustering, scanpath statistics.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
  {
    id: "aura-tron",
    name: "Aura-Tron",
    kind: "visualiser",
    href: "/atelier/aura-tron",
    summary:
      "Neon-grid landscape with a mood-tinted backdrop. Synthwave aesthetic, large screen behind the avatar — vertex shader + aurora compositor.",
    tag: "Visualiser",
    gate: "open",
    mode: "amethyst",
  },
  {
    id: "procedural-city",
    name: "Procedural City",
    kind: "visualiser",
    href: "/atelier/procedural-city",
    summary:
      "Generated urban environments — buildings, ground, traffic. Seed + style controls, R3F preview.",
    tag: "Visualiser",
    gate: "open",
    mode: "veridian",
  },
];

export function listApps(): AppEntry[] {
  return apps;
}

export function getApp(id: string): AppEntry | undefined {
  return apps.find((a) => a.id === id);
}

export function appsByTag(tag: string): AppEntry[] {
  return apps.filter((a) => a.tag === tag);
}

export function appTags(): string[] {
  const set = new Set<string>();
  for (const a of apps) set.add(a.tag);
  return Array.from(set);
}
