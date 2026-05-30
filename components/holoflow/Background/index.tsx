/**
 * Background option selector — reads the theme and renders the active
 * variant. Add a new background variant by:
 *
 *   1. Adding a key to BackgroundKey in lib/theme/registry.ts
 *   2. Adding an option entry under BACKGROUND.options
 *   3. Importing the component here and adding a case below
 *
 * The previous variant stays in the registry — never delete.
 */

"use client";

import { useTheme } from "lib/theme/store";

import { SolidBackground } from "./SolidBackground";
import { DynamicParticleBackground } from "./DynamicParticleBackground";

export function Background() {
  const key = useTheme((s) => s.selection.background);
  switch (key) {
    case "solid":
      return <SolidBackground />;
    case "dynamic-particles":
      return <DynamicParticleBackground />;
    default:
      return <SolidBackground />;
  }
}

export { SolidBackground, DynamicParticleBackground };
