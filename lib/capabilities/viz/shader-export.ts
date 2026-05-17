/**
 * lib/capabilities/viz/shader-export.ts — Capability `viz.shader-export`:
 * render a compiled fragment shader to a PNG snapshot.
 *
 * One-line role: the equirect / square / arbitrary-size snapshot
 * primitive for the shader-station chamber's export button (and any
 * pipeline that wants a still image from a GLSL fragment).
 *
 * Full purpose in shader-export.PURPOSE.md.
 *
 * # The function
 *
 * `exportShaderToPng(opts)`:
 *   - spin up a hidden THREE.WebGLRenderer at the requested size
 *   - mount an OrthographicCamera + full-screen quad with the
 *     assembled fragment as its material
 *   - render once, read the canvas back as a PNG data URL or Blob
 *   - dispose the renderer / geometry / material on return
 *
 * Equirect mode uses width=2048 / height=1024 (the studio's canonical
 * 2:1 ratio for VR / panoramic surfaces); square uses 1024x1024;
 * custom passes the caller's exact dimensions.
 *
 * Browser-only — Three.js's WebGLRenderer needs a DOM canvas. Server-
 * side panorama bake would land as a sibling using @napi-rs/canvas.
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/ShaderEditor/hooks/
 * useShaderExport.ts (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 */

import * as THREE from "three";

import { assembleFragment, type Precision } from "./shader-editor";

export type ExportSize =
  | { kind: "equirect" }
  | { kind: "square" }
  | { kind: "custom"; width: number; height: number };

export type ExportShaderOptions = {
  /** Authored render() body — same shape the editor consumes. */
  code: string;
  /** Output dimensions. */
  size: ExportSize;
  /** GLSL precision. Default highp. */
  precision?: Precision;
  /** Custom uniform values keyed by name. */
  uniforms?: Record<string, THREE.IUniform>;
  /** Palette colours — default cyan / magenta / yellow / green / blue. */
  palette?: string[];
  /** Seed + complexity passed as u_seed / u_complexity. */
  seed?: number;
  complexity?: number;
};

const DEFAULT_PALETTE = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#4444ff"];

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = vec3(0.0, 0.0, 1.0);
    gl_Position = vec4(position, 1.0);
  }
`;

function dimensionsFor(size: ExportSize): { width: number; height: number } {
  switch (size.kind) {
    case "equirect":
      return { width: 2048, height: 1024 };
    case "square":
      return { width: 1024, height: 1024 };
    case "custom":
      return { width: size.width, height: size.height };
  }
}

/**
 * Render a fragment shader to a PNG data URL. The returned string is
 * `data:image/png;base64,...` — ready for an anchor download or an
 * <img> src.
 */
export function exportShaderToDataUrl(options: ExportShaderOptions): string {
  if (typeof document === "undefined") {
    throw new Error("viz.shader-export: requires a browser context");
  }
  const { width, height } = dimensionsFor(options.size);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);

  const palette = (options.palette ?? DEFAULT_PALETTE).map((c) => new THREE.Color(c));
  const baseUniforms: Record<string, THREE.IUniform> = {
    u_time: { value: 0 },
    u_seed: { value: options.seed ?? 42 },
    u_complexity: { value: options.complexity ?? 4 },
    u_palette: { value: palette },
    u_texture: { value: new THREE.Texture() },
    u_use_texture: { value: false },
    u_tex_tiling: { value: new THREE.Vector2(1, 1) },
    u_tex_offset: { value: new THREE.Vector2(0, 0) },
    u_tex_scale: { value: new THREE.Vector2(1, 1) },
    u_tex_alpha: { value: 1.0 },
    u_audio_low: { value: 0 },
    u_audio_mid: { value: 0 },
    u_audio_high: { value: 0 },
    u_audio_volume: { value: 0 },
    u_camera_pos: { value: new THREE.Vector3() },
    u_cam_matrix: { value: new THREE.Matrix4() },
    ...(options.uniforms ?? {}),
  };

  const material = new THREE.ShaderMaterial({
    uniforms: baseUniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: assembleFragment(options.code, { precision: options.precision }),
  });

  scene.add(new THREE.Mesh(geometry, material));
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");

  renderer.dispose();
  geometry.dispose();
  material.dispose();

  return dataUrl;
}

/**
 * Render and trigger a download. Returns the filename used so the
 * caller can log it.
 */
export function downloadShaderPng(options: ExportShaderOptions, filename: string): string {
  const dataUrl = exportShaderToDataUrl(options);
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
  return link.download;
}
