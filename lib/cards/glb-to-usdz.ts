/**
 * lib/cards/glb-to-usdz.ts — Browser-side GLB → USDZ conversion.
 *
 * Runs in a "use client" component. Pulls the uploaded GLB back from
 * Vercel Blob, parses it with three.js's GLTFLoader, exports a USDZ
 * binary via USDZExporter, and returns a Blob ready to upload.
 *
 * Trade-offs:
 *   - Materials: PBR (metallic/roughness, baseColor map, normal,
 *     emissive) survive. KTX2-compressed textures don't; iOS doesn't
 *     support them in USDZ anyway, so this matches the platform.
 *   - Animations: USDZExporter supports skeletal animation, but the
 *     conversion can be flaky on complex rigs. Static models (the
 *     common case for a personal AR card) work cleanly.
 *   - Size: USDZ tends to be 1.2–1.5× the GLB size, primarily because
 *     textures get re-encoded as PNG.
 *
 * This module is browser-only: it uses `fetch()` against the live Blob
 * URL and `URL.createObjectURL` semantics. Do not import from a server
 * component.
 */

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

export class USDZConversionError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "USDZConversionError";
    this.cause = cause;
  }
}

/**
 * Convert a GLB at `glbUrl` into a USDZ Blob.
 *
 * Throws a USDZConversionError with a human-readable message if any
 * stage fails (network, parsing, export).
 */
export async function convertGlbUrlToUsdz(glbUrl: string): Promise<Blob> {
  // 1. Fetch the GLB bytes. We use the same-origin Blob URL the upload
  //    endpoint returned; CORS is fine because Vercel Blob serves with
  //    permissive headers.
  let glbBuffer: ArrayBuffer;
  try {
    const resp = await fetch(glbUrl);
    if (!resp.ok) {
      throw new USDZConversionError(
        `Couldn't fetch the uploaded GLB (HTTP ${resp.status}).`,
      );
    }
    glbBuffer = await resp.arrayBuffer();
  } catch (err) {
    if (err instanceof USDZConversionError) throw err;
    throw new USDZConversionError(
      "Couldn't download the uploaded GLB for conversion.",
      err,
    );
  }

  // 2. Parse with GLTFLoader. The parser is asynchronous because it
  //    may have to load external resources (textures), but for a
  //    self-contained GLB everything is inline.
  const loader = new GLTFLoader();
  const gltf = await new Promise<Awaited<ReturnType<typeof loader.parseAsync>>>(
    (resolve, reject) => {
      // parseAsync needs a base path even for inline GLBs; "" suffices.
      loader.parse(
        glbBuffer,
        "",
        (result) => resolve(result),
        (err) => reject(err),
      );
    },
  ).catch((err) => {
    throw new USDZConversionError(
      "Couldn't parse the GLB. The file may be malformed or use features GLTFLoader doesn't recognise.",
      err,
    );
  });

  // 3. Export as USDZ.
  let usdzBytes: Uint8Array;
  try {
    const exporter = new USDZExporter();
    usdzBytes = await exporter.parseAsync(gltf.scene);
  } catch (err) {
    throw new USDZConversionError(
      "Couldn't export USDZ from the model. Some material/animation features may not be supported by USDZ.",
      err,
    );
  }

  // 4. Wrap as a Blob ready for FormData upload.
  return new Blob([new Uint8Array(usdzBytes)], {
    type: "model/vnd.usdz+zip",
  });
}
