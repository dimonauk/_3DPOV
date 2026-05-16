/**
 * lib/capabilities/viz/splat-providers/index.ts — Barrel for the
 * viz.splat-generate provider modules.
 *
 * The router in splat-generate.server.ts imports from here so adding
 * a new provider is a two-line change: add the file, add a re-export.
 */

export {
  generateViaSharpOnnx,
  generateViaSharpOnnxFromBytes,
} from "./sharp-onnx.server";
export { generateViaHangarGsplat } from "./hangar-gsplat.server";
export { generateViaHangar4dgs } from "./hangar-4dgs.server";
export { generateViaLumaGenie } from "./luma-genie.server";

export type { SplatOutputTarget } from "./_helpers.server";
