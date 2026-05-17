/**
 * lib/algorithms/shaders/index.ts — Typed accessors for shader presets,
 * examples, and snippets.
 *
 * Mirrors the existing lib/algorithms/index.ts pattern (registry +
 * discovery + per-id record) for the shader corpus lifted from
 * Shadrerapp. The data lives next door in `_data.ts` (preset GLSL
 * sources) and `snippets.ts` (insertable function snippets); this
 * module is the public surface every caller should import.
 *
 * Lifted from D:/.github/Shadrerapp constants.ts + SnippetLibrary.tsx
 * (Apache-2.0). Credit in docs/ATTRIBUTIONS.md.
 */

import {
  EXAMPLE_DESCRIPTIONS,
  EXAMPLES,
  PRESET_DESCRIPTIONS,
  PRESETS,
} from "./_data";

export { PRESETS, EXAMPLES, PRESET_DESCRIPTIONS, EXAMPLE_DESCRIPTIONS };
export { SNIPPETS, snippetsByCategory } from "./snippets";
export type { ShaderSnippet, SnippetCategory } from "./snippets";

export type PresetId = keyof typeof PRESETS;
export type ExampleId = keyof typeof EXAMPLES;

export type PresetRecord = {
  id: PresetId;
  /** Display name — used by the preset panel. */
  name: string;
  /** Short pitch from PRESET_DESCRIPTIONS. */
  description: string;
  /** Full shader source — drop-in for the editor. */
  code: string;
};

export type ExampleRecord = {
  id: ExampleId;
  name: string;
  description: string;
  code: string;
};

/** All preset records in declaration order. */
export function listPresets(): PresetRecord[] {
  return (Object.keys(PRESETS) as PresetId[]).map((id) => ({
    id,
    name: id,
    description: PRESET_DESCRIPTIONS[id] ?? "",
    code: PRESETS[id],
  }));
}

/** All example records in declaration order. */
export function listExamples(): ExampleRecord[] {
  return (Object.keys(EXAMPLES) as ExampleId[]).map((id) => ({
    id,
    name: id,
    description: EXAMPLE_DESCRIPTIONS[id] ?? "",
    code: EXAMPLES[id],
  }));
}

/** Default preset surfaces a chamber should boot to. */
export const DEFAULT_PRESET: PresetId = "MANDALA";
