/**
 * lib/shape-of-it/labyrinth.ts
 *
 * Two orbiting labyrinths that wreathe the spine:
 *   - Knowledge ring (11 nodes, outer & inner tier, rotates CCW)
 *   - Life ring (9 nodes, outer & inner tier, rotates CW)
 *
 * Plus 11 synthesis arcs that loop from a knowledge node to a life node
 * through the mound core, with a small joint spark at the midpoint.
 *
 * Content registry — exempt from the 300-line cap.
 */

export type LabNode = {
  id: number;
  label: string;
  /** RGB triple in 0..1 — turned into THREE.Color at the point of use. */
  col: [number, number, number];
  ang: number;
  /** 0 = outer ring, 1 = inner ring. */
  tier: 0 | 1;
  detail: string;
  data: string;
};

export type LabEdge = [number, number];

export type SynthArc = [knowIdx: number, lifeIdx: number, label: string];

export const KNOW_NODES: LabNode[] = [
  { id: 0, label: "Waveguide Optics", col: [0.28, 0.65, 1.0], ang: 0, tier: 0,
    detail: "Light trapped inside resin. Performs invisibly until the right angle.",
    data: "PMMA · RI 1.49 · TIR · fibre optic scale" },
  { id: 1, label: "Biomimicry · Physarum", col: [0.18, 0.85, 0.52], ang: Math.PI * 0.28, tier: 0,
    detail: "Slime mould spanning food sources. Murray radius. Adaptive conductance.",
    data: "r³=r1³+r2³ · adaptive conductance Δ" },
  { id: 2, label: "Evolutionary Comp", col: [0.55, 0.28, 1.0], ang: Math.PI * 0.57, tier: 0,
    detail: "Forms that breed. poi_sculptor.py running fitness functions on geometry.",
    data: "Python/numpy/trimesh/taichi · ~40s/gen" },
  { id: 3, label: "Laban · Encoded", col: [1.0, 0.38, 0.62], ang: Math.PI * 0.85, tier: 0,
    detail: "Movement as data. Body grammar into mesh. Butterfly. Triquetra. Antispin.",
    data: "Effort: Weight/Space/Time/Flow · Kinect" },
  { id: 4, label: "Resin · Print Bureau", col: [1.0, 0.68, 0.18], ang: Math.PI * 1.14, tier: 0,
    detail: "Craftcloud / i.materialise. Physical object arrives without performance.",
    data: "RI 1.49–1.58 · <£40/head · <72hr" },
  { id: 5, label: "WebGPU · TSL · Compute", col: [0.18, 0.92, 0.88], ang: Math.PI * 1.43, tier: 0,
    detail: "instancedArray. A million particles on-device. Offline PWA. Install for gigs.",
    data: "Three.js 0.171 · TSL node shaders · SW cache" },
  { id: 6, label: "Caustic Lens Design", col: [0.88, 0.88, 0.38], ang: Math.PI * 1.71, tier: 0,
    detail: "Monge-Ampère equation. Refractive surface throws light patterns.",
    data: "det(D²u)=f/g · PMMA · 1–3m throw · Brenier" },
  { id: 7, label: "AR City Drop", col: [0.7, 0.85, 1.0], ang: Math.PI * 0.14, tier: 1,
    detail: "Manchester. London. Sculpture placed in real space before it exists.",
    data: "WebXR+GPS · Northern Quarter · Shoreditch" },
  { id: 8, label: "Structural Colour", col: [0.5, 1.0, 0.7], ang: Math.PI * 0.71, tier: 1,
    detail: "Gyroid photonic crystal. Colour from geometry. Hidden until held right.",
    data: "Gyroid lattice · photonic bandgap · PMMA" },
  { id: 9, label: "Poi Sculptor Pipeline", col: [0.9, 0.5, 1.0], ang: Math.PI * 1.28, tier: 1,
    detail: "poi_sculptor.py → mesh → STL/GLB → print bureau. Full stack. No stage.",
    data: "Python → trimesh → Craftcloud → object" },
  { id: 10, label: "The Insta360 Pattern", col: [1.0, 0.85, 0.4], ang: Math.PI * 1.85, tier: 1,
    detail: "Saw the geometry before the product. Industry followed. Next one stays.",
    data: "2018→2022→2025 · ~3yr lead time · consistent" },
];

export const KNOW_EDGES: LabEdge[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
  [0, 8], [1, 9], [2, 9], [3, 9], [4, 9], [5, 7], [6, 8],
  [7, 10], [8, 10], [9, 10], [7, 8], [8, 9], [9, 7],
  [0, 7], [3, 8], [6, 10],
];

export const LIFE_NODES: LabNode[] = [
  { id: 0, label: "Psychology Degree", col: [0.78, 0.55, 0.28], ang: 0, tier: 0,
    detail: "Understanding how minds inhabit bodies — before knowing it would matter.",
    data: "Hull · BSc Psychology · 2006–2009" },
  { id: 1, label: "Homelessness · Eyes", col: [0.45, 0.52, 0.65], ang: Math.PI * 0.33, tier: 0,
    detail: "Perception sharpened to a blade by necessity. Space without mediation.",
    data: "Sofa-surfing · hyper-vigilance · proxemics" },
  { id: 2, label: "London · Five Years", col: [0.88, 0.32, 0.52], ang: Math.PI * 0.67, tier: 0,
    detail: "Burlesque. Clubs. Hostessing. The full living education in presence.",
    data: "2010–2015 · burlesque · aerial · hostessing" },
  { id: 3, label: "The Break", col: [0.22, 0.16, 0.14], ang: Math.PI, tier: 0,
    detail: "Small bones. The continuity severed. A crack, not a door.",
    data: "2015 · spinal injury · chronic pain onset" },
  { id: 4, label: "Two Years in Bed", col: [0.28, 0.3, 0.52], ang: Math.PI * 1.33, tier: 0,
    detail: "The spiral going inward. Dense processing. VR the window that stayed open.",
    data: "2015–2017 · Oculus DK2 · Tiltbrush · Gear VR" },
  { id: 5, label: "Sellotape + VR Controller", col: [0.55, 0.62, 0.24], ang: Math.PI * 1.67, tier: 0,
    detail: "Proof of concept from whatever was to hand. Proved real before tools existed.",
    data: "2017 · VR controller + tape = poi head" },
  { id: 6, label: "Body Is Data", col: [0.9, 0.7, 0.4], ang: Math.PI * 0.17, tier: 1,
    detail: "Psychology + performance + disability = body as primary research instrument.",
    data: "Laban + proxemics + kinetics = mesh input" },
  { id: 7, label: "Hidden Light", col: [1.0, 0.82, 0.22], ang: Math.PI * 0.83, tier: 1,
    detail: "Work only reveals under right conditions. Built into the physics.",
    data: "TIR · caustic · gyroid · angle-dependent" },
  { id: 8, label: "Generosity as Infrastructure", col: [0.72, 0.55, 0.18], ang: Math.PI * 1.5, tier: 1,
    detail: "Insta360 2022. Antigravity A1 2025. DJI Osmo 360. Seeded so it could exist.",
    data: "2022→2025 → market · seed → confirm · repeat" },
];

export const LIFE_EDGES: LabEdge[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
  [0, 6], [1, 6], [2, 7], [3, 7], [4, 8], [5, 8],
  [6, 7], [7, 8], [8, 6],
  [0, 8], [3, 6],
];

export const SYNTH_ARCS: SynthArc[] = [
  [0, 7, "light in object · body in space"],
  [1, 6, "body as distributed network"],
  [2, 5, "sellotape proof → evolutionary fitness"],
  [3, 2, "london stage → laban encoding"],
  [4, 8, "print bureau from seeded geometry"],
  [5, 4, "VR bed → WebGPU offline PWA"],
  [6, 7, "caustic = hidden light made solid"],
  [9, 1, "pipeline from body learning space"],
  [10, 8, "insta360 pattern → next idea stays"],
  [7, 0, "AR drop from psychology of place"],
  [8, 2, "structural colour from performer presence"],
];

export const R_KNOW_OUTER = 3.2;
export const R_KNOW_INNER = 2.4;
export const R_LIFE_OUTER = 3.8;
export const R_LIFE_INNER = 2.9;
