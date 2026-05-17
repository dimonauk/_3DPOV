/**
 * lib/capabilities/viz/shader-editor.ts — Capability `viz.shader-editor`:
 * headless GLSL editing primitives.
 *
 * One-line role: pure functions for the shader-station chamber's
 * authored-code → assembled-fragment → compile-status pipeline.
 *
 * Full purpose in shader-editor.PURPOSE.md.
 *
 * # Three operations
 *
 *   1. `detectCustomUniforms(code)` — regex scan for `uniform <type>
 *      <name>;` declarations not in the built-in set; returns a typed
 *      `CustomUniform[]` the chamber can render slider/colour inputs
 *      for.
 *   2. `assembleFragment(code, opts)` — wrap the author's render()
 *      function with the precision + built-in uniform declarations
 *      + lib injection (HASH/NOISE/SDF etc. from lib/math/glsl) +
 *      the gl_FragColor entry point.
 *   3. `compileFragment(source)` — try-compile against a throw-away
 *      WebGL context; returns `{ ok, error }`. Browser-only.
 *
 * # Why headless
 *
 * The chamber composes these into its UI: editor textarea → debounced
 * `detectCustomUniforms` for the sliders panel; on each edit,
 * `assembleFragment` + `compileFragment` for the live preview. Other
 * surfaces (a CLI compile-check, a CI smoke-test, a server-side
 * snapshot job that wants to validate before render) reuse the same
 * `assembleFragment` without React.
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/ShaderEditor/hooks/
 * useUniformDetection.ts + the assembly+compile blocks in
 * index.tsx + useShaderExport.ts (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md.
 */

import { injectLibs } from "lib/math/glsl";

export type Precision = "lowp" | "mediump" | "highp";

export type CustomUniformType = "float" | "vec2" | "vec3" | "vec4" | "bool" | "color";

export type CustomUniform = {
  name: string;
  type: CustomUniformType;
};

export type AssembleOptions = {
  precision?: Precision;
  /** Inject lib fragments automatically (HASH/NOISE/SDF/etc.). Default true. */
  injectHelpers?: boolean;
};

export type CompileResult = {
  ok: boolean;
  error: string | null;
};

/**
 * Built-in uniform names declared by `assembleFragment`'s preamble.
 * Authored `uniform ...;` lines for these are stripped by the chamber
 * before insertion, and `detectCustomUniforms` filters them out so
 * the slider panel doesn't double-up.
 */
export const BUILT_IN_UNIFORMS = [
  "u_time",
  "u_seed",
  "u_complexity",
  "u_palette",
  "u_texture",
  "u_use_texture",
  "u_tex_tiling",
  "u_tex_offset",
  "u_tex_scale",
  "u_tex_alpha",
  "u_prev_frame",
  "u_transition",
  "u_mouse",
  "u_resolution",
  "u_audio_low",
  "u_audio_mid",
  "u_audio_high",
  "u_audio_volume",
  "u_camera_pos",
  "u_cam_matrix",
] as const;

const UNIFORM_REGEX =
  /uniform\s+(float|int|bool|vec2|vec3|vec4)\s+([a-zA-Z_]\w*)\s*;(?:\s*\/\/\s*@(\w+))?/g;

/**
 * Scan authored source for `uniform <type> <name>;` declarations not in
 * `BUILT_IN_UNIFORMS`. Hint syntax: trailing comment `// @color` on a
 * `vec3` reclassifies the type to `"color"` so the chamber renders a
 * colour-picker instead of three sliders.
 */
export function detectCustomUniforms(code: string): CustomUniform[] {
  const matches = [...code.matchAll(UNIFORM_REGEX)];
  const result: CustomUniform[] = [];
  for (const m of matches) {
    const name = m[2]!;
    if (BUILT_IN_UNIFORMS.includes(name as (typeof BUILT_IN_UNIFORMS)[number])) {
      continue;
    }
    const glslType = m[1]!;
    const hint = m[3];
    let type: CustomUniformType = (glslType === "int" ? "float" : glslType) as CustomUniformType;
    if (type === "vec3" && hint === "color") type = "color";
    result.push({ name, type });
  }
  return result;
}

const PREAMBLE = (precision: Precision) => `
precision ${precision} float;
varying vec2 vUv;
varying vec3 vNormal;
uniform float u_time; uniform float u_seed; uniform float u_complexity;
uniform vec3 u_palette[5];
uniform sampler2D u_texture; uniform bool u_use_texture;
uniform vec2 u_tex_tiling; uniform vec2 u_tex_offset; uniform vec2 u_tex_scale;
uniform float u_tex_alpha;
uniform float u_audio_low; uniform float u_audio_mid; uniform float u_audio_high; uniform float u_audio_volume;
uniform vec3 u_camera_pos; uniform mat4 u_cam_matrix;
`;

const ENTRY = `
void main() {
  gl_FragColor = vec4(render(vUv), 1.0);
}
`;

/**
 * Wrap authored render() code with precision + built-in uniforms +
 * lib injection + the gl_FragColor entry point. Returns a complete
 * fragment shader source string.
 */
export function assembleFragment(code: string, options: AssembleOptions = {}): string {
  const precision = options.precision ?? "highp";
  const inject = options.injectHelpers ?? true;
  const body = inject ? injectLibs(code) : code;
  return `${PREAMBLE(precision)}\n${body}\n${ENTRY}`;
}

/**
 * Compile a complete fragment source against a throw-away WebGL
 * context. Returns `{ ok, error }`. Browser-only — throws if called
 * outside a DOM context.
 *
 * The throw-away context lets us validate without disturbing the live
 * renderer; if the source compiles, the chamber commits it as the new
 * `lastCompiledCode` and triggers a re-render of the preview mesh.
 */
export function compileFragment(source: string): CompileResult {
  if (typeof document === "undefined") {
    throw new Error("viz.shader-editor: compileFragment requires a browser context");
  }
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return { ok: false, error: "WebGL unavailable" };
  const shader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!shader) return { ok: false, error: "createShader failed" };
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    return { ok: false, error: log ?? "compile failed (no log)" };
  }
  gl.deleteShader(shader);
  return { ok: true, error: null };
}
