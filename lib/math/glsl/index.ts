/**
 * lib/math/glsl/index.ts — GLSL helper-library assembly and detection.
 *
 * The studio's GLSL editors (atelier shader-station, atelier waveguide-forge)
 * inject these helper fragments into authored shaders so authors don't have
 * to copy-paste hash/noise/sdf utilities into every file.
 *
 * `detectUsedLibs(code)` regex-scans authored source for known function
 * names, returns the subset of fragments to prepend. `injectLibs(code, [...])`
 * prepends them in dependency-correct order (HASH before NOISE/VORONOI).
 *
 * Lifted from D:/.github/Shadrerapp/src/libs/glsl-utils.ts (Apache-2.0,
 * "DollyOS GLSL Foundation Library") per docs/SHADRERAPP_MIGRATION.md.
 * Credit recorded in docs/ATTRIBUTIONS.md.
 */

import { COLOR } from "./color";
import { HASH } from "./hash";
import { NOISE } from "./noise";
import { SDF } from "./sdf";
import { VORONOI } from "./voronoi";

export { COLOR, HASH, NOISE, SDF, VORONOI };

export type GlslLibKey = "HASH" | "NOISE" | "VORONOI" | "COLOR" | "SDF";

export const GLSL_LIBS: Record<GlslLibKey, string> = {
  HASH,
  NOISE,
  VORONOI,
  COLOR,
  SDF,
};

const SDF_KEYWORDS = [
  "sdSphere",
  "sdBox",
  "sdTorus",
  "sdOctahedron",
  "sdCylinder",
  "sdCapsule",
  "rotate",
  "opRepeat",
  "opMirror",
  "opTwist",
  "opCheapBend",
  "smin",
  "sdMandelbulb",
] as const;

const SDF_REGEX = new RegExp(SDF_KEYWORDS.join("|"));

export function detectUsedLibs(code: string): GlslLibKey[] {
  const used = new Set<GlslLibKey>();

  if (/hash11|hash12|hash22/.test(code)) used.add("HASH");

  if (/perlin|fbm/.test(code)) {
    used.add("HASH");
    used.add("NOISE");
  }

  if (/voronoi/.test(code)) {
    used.add("HASH");
    used.add("VORONOI");
  }

  if (/hsv2rgb|cosPalette/.test(code)) used.add("COLOR");

  if (SDF_REGEX.test(code)) used.add("SDF");

  // Dependency-correct order; HASH must precede NOISE / VORONOI.
  const order: GlslLibKey[] = ["HASH", "NOISE", "VORONOI", "COLOR", "SDF"];
  return order.filter((key) => used.has(key));
}

export function injectLibs(code: string, libraries?: GlslLibKey[]): string {
  const selected = libraries ?? detectUsedLibs(code);
  return selected
    .map((lib) => GLSL_LIBS[lib])
    .concat([code])
    .join("\n");
}
