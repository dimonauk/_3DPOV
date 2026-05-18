/**
 * lib/shape-of-it/chambers.ts
 *
 * The nine chambers of the spine and their colony branches. Each chamber
 * is a knotted sphere at a fixed Y along the central axis; the radial
 * branches splay outward from its equator and recurse to depth two.
 *
 * Source of truth: D:\The_Hangar\apps\prototypes\shape-of-it\src\data\constants.js
 *
 * Content registry — exempt from the 300-line cap.
 */

export type ChamberBranch = {
  ang: number;
  len: number;
};

export type Chamber = {
  id: number;
  name: string;
  sub: string;
  body: string;
  data: string;
  y: number;
  r: number;
  hex: number;
  wide: boolean;
  dark: boolean;
  passR: number;
  top?: boolean;
  branches: ChamberBranch[];
};

export const Y_BOTTOM = -5.12;
export const Y_TOP = 5.35;
export const Y_RANGE = Y_TOP - Y_BOTTOM;
export const BREAK_Y = -1.1;
export const BREAK_T = (BREAK_Y - Y_BOTTOM) / Y_RANGE;

export const CHAMBERS: Chamber[] = [
  {
    id: 1,
    name: "Foundation",
    sub: "Psychology & Ethics",
    body: "Hands / Base",
    data: "BSc · Qualitative Research",
    y: -4.2,
    r: 1.4,
    hex: 0xffffff,
    wide: true,
    dark: false,
    passR: 0.12,
    branches: [
      { ang: 0.4, len: 1.2 },
      { ang: 2.8, len: 0.8 },
      { ang: 4.5, len: 1.5 },
    ],
  },
  {
    id: 2,
    name: "The Homeless Eyes",
    sub: "Survival & Perception",
    body: "Eyes",
    data: "Oxford St / Street Reading",
    y: -3.2,
    r: 0.9,
    hex: 0xaaaaaa,
    wide: false,
    dark: true,
    passR: 0.08,
    branches: [
      { ang: 1.2, len: 1.0 },
      { ang: 3.5, len: 1.4 },
    ],
  },
  {
    id: 3,
    name: "Living Education",
    sub: "The London Sensorium",
    body: "Nervous System",
    data: "V&A · Shoreditch · The City",
    y: -2.1,
    r: 2.2,
    hex: 0xffddaa,
    wide: true,
    dark: false,
    passR: 0.18,
    branches: [
      { ang: 0.5, len: 2.2 },
      { ang: 1.8, len: 1.8 },
      { ang: 3.2, len: 2.0 },
      { ang: 4.8, len: 1.6 },
    ],
  },
  {
    id: 4,
    name: "The Break",
    sub: "Collapse & Reset",
    body: "Spine / Core",
    data: "Burnout · Retreat",
    y: -1.1,
    r: 0.3,
    hex: 0x222222,
    wide: false,
    dark: true,
    passR: 0.04,
    branches: [{ ang: 2.2, len: 0.6 }],
  },
  {
    id: 5,
    name: "Inward Turn",
    sub: "Silence & Restructuring",
    body: "Lungs / Breath",
    data: "Two years · Stillness",
    y: 0.5,
    r: 0.8,
    hex: 0xaa88ff,
    wide: false,
    dark: false,
    passR: 0.1,
    branches: [
      { ang: 0.8, len: 1.1 },
      { ang: 3.9, len: 0.9 },
    ],
  },
  {
    id: 6,
    name: "The Proof",
    sub: "First Technical Bridges",
    body: "Hands / Craft",
    data: "Sellotape + VR Controllers",
    y: 1.4,
    r: 1.1,
    hex: 0xaaaaff,
    wide: false,
    dark: false,
    passR: 0.14,
    branches: [
      { ang: 1.5, len: 1.3 },
      { ang: 4.2, len: 1.5 },
      { ang: 5.8, len: 1.0 },
    ],
  },
  {
    id: 7,
    name: "The Vision",
    sub: "Cyan Ambitions",
    body: "Third Eye",
    data: "XR Design · System Architecture",
    y: 2.1,
    r: 1.8,
    hex: 0x00ffff,
    wide: true,
    dark: false,
    passR: 0.16,
    branches: [
      { ang: 0.2, len: 2.5 },
      { ang: 2.5, len: 1.9 },
      { ang: 5.0, len: 1.8 },
    ],
  },
  {
    id: 8,
    name: "The Gift",
    sub: "Insta360 Seed",
    body: "Heart",
    data: "Sponsorship · Catalyst",
    y: 2.8,
    r: 1.0,
    hex: 0xffffaa,
    wide: false,
    dark: false,
    passR: 0.12,
    branches: [
      { ang: 1.1, len: 1.4 },
      { ang: 4.7, len: 1.2 },
    ],
  },
  {
    id: 9,
    name: "The Convergence",
    sub: "The Neo-London Array",
    body: "Crown",
    data: "DollyOS · Swarm Intelligence",
    y: 3.8,
    r: 2.5,
    hex: 0xffffff,
    wide: true,
    dark: false,
    passR: 0.2,
    top: true,
    branches: [
      { ang: 0.0, len: 3.0 },
      { ang: 0.9, len: 2.8 },
      { ang: 1.8, len: 2.5 },
      { ang: 2.7, len: 3.2 },
      { ang: 3.6, len: 2.9 },
      { ang: 4.5, len: 2.6 },
      { ang: 5.4, len: 3.1 },
    ],
  },
];
