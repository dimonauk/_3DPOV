/**
 * app/cards/design/card-designer/constants.ts — Defaults + dropdown
 * options for the card designer page.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. Pure data —
 * the form Inner component consumes both; the share-link encoder
 * uses STARTER as the base shape it round-trips.
 */

import type { Card } from "lib/ar/types";

// Sensible defaults so the page is never empty.
export const STARTER: Card = {
  slug: "you",
  name: "Your Name",
  role: "What you do",
  studio: "",
  tagline: "",
  contact: {
    email: "",
    website: "",
    handles: [],
  },
  brand: {
    primary: "#FF6FB5",
    secondary: "#B488E0",
    accent: "#FFC1E3",
    font: "display",
    textOnBrand: "#FFFFFF",
  },
  ar: {
    targetImage: "/cards/dimona/card-front.png",
    targetMind: "/cards/dimona/target.mind",
    model: "/cards/dimona/model.glb",
    modelUSDZ: "/cards/dimona/model.usdz",
    modelScale: 0.6,
    modelRotation: [0, 0, 0],
    modelPosition: [0, 0.05, 0],
    description:
      "A placeholder 3D model. Commission the studio-hosted tier to swap in a model that's actually you.",
    autoRotate: true,
    lighting: {
      ambientIntensity: 1.0,
      directionalIntensity: 1.5,
      directionalAngle: 30,
    },
  },
  print: { width_mm: 85, height_mm: 55, bleed_mm: 3, safe_mm: 4 },
  issuedAt: new Date().toISOString(),
  public: false,
};

export const FONT_OPTIONS: Array<{
  value: Card["brand"]["font"];
  label: string;
}> = [
  { value: "display", label: "Display (serif, Cormorant)" },
  { value: "serif", label: "Serif (system)" },
  { value: "mono", label: "Mono (JetBrains)" },
];
