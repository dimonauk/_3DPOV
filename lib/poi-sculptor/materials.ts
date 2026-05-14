/**
 * lib/poi-sculptor/materials.ts
 *
 * Trail surface palette and print-bureau catalogue.
 * Content registry — exempt from the 300-line cap.
 */

export type TrailMaterial = {
  id: string;
  label: string;
  dot: string;
  base: number;
  emissive: number;
  rough: number;
  metal: number;
};

export const TRAIL_MATERIALS: TrailMaterial[] = [
  { id: "ember", label: "Ember", dot: "#c4520a", base: 0x1a0800, emissive: 0xc4520a, rough: 0.25, metal: 0.85 },
  { id: "bronze", label: "Bronze", dot: "#b8742a", base: 0x2a1400, emissive: 0x8b5e28, rough: 0.38, metal: 0.92 },
  { id: "obsidian", label: "Obsidian", dot: "#3a3a50", base: 0x06060e, emissive: 0x28285a, rough: 0.08, metal: 0.97 },
  { id: "coldfire", label: "Cold Fire", dot: "#4a9ab8", base: 0x040e16, emissive: 0x1a6070, rough: 0.20, metal: 0.90 },
  { id: "clay", label: "Raw Clay", dot: "#9a6840", base: 0x2a1808, emissive: 0x5a3218, rough: 0.90, metal: 0.02 },
  { id: "silver", label: "Silver", dot: "#c8c8d4", base: 0x181820, emissive: 0x505068, rough: 0.12, metal: 1.00 },
];

export type PrintMaterial = {
  name: string;
  process: string;
  price: string;
  desc: string;
  rec: boolean;
};

export const PRINT_MATERIALS: PrintMaterial[] = [
  {
    name: "PLA (FDM)",
    process: "FDM",
    price: "£0.10/cm³",
    desc: "Standard filament. Layer lines visible. Useful for testing scale before committing to premium.",
    rec: false,
  },
  {
    name: "Resin (SLA)",
    process: "SLA",
    price: "£1.20/cm³",
    desc: "Captures the finest details — individual tube striations, surface texture. Brittle at thin sections.",
    rec: false,
  },
  {
    name: "Nylon PA12 (SLS)",
    process: "SLS",
    price: "£0.85/cm³",
    desc: "No support material needed — suits complex interlocking poi trail topology. Smooth matte finish.",
    rec: true,
  },
  {
    name: "Nylon PA11 (MJF)",
    process: "MJF",
    price: "£1.10/cm³",
    desc: "HP Multi Jet Fusion. Smoother than SLS, isotropic strength. Reads as a deep matte black.",
    rec: true,
  },
  {
    name: "Carbon-fibre Nylon",
    process: "SLS",
    price: "£2.50/cm³",
    desc: "Stiff and light. Matte black surface reads well against the organic poi geometry.",
    rec: false,
  },
  {
    name: "Stainless Steel",
    process: "DMLS",
    price: "£8.00/cm³",
    desc: "Direct metal laser sintering. The poi sculpture as a permanent metal object.",
    rec: false,
  },
  {
    name: "Sterling Silver",
    process: "Cast",
    price: "£35.00/cm³",
    desc: "Fine silver from a wax pattern. The poi move as wearable scale — pendants, jewellery objects.",
    rec: false,
  },
  {
    name: "Bronze (Lost-Wax)",
    process: "Cast",
    price: "£15.00/cm³",
    desc: "Warm tone, ages well. Suits the poi sculpture as outdoor public-art scale.",
    rec: false,
  },
];
