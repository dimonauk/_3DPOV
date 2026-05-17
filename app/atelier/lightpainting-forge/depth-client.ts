// Depth-Anything-V2 client. POSTs to the bench's /depth endpoint and
// returns a Float32Array of normalised depth values (0..1, higher =
// nearer) matching the image dimensions.
//
// Falls back to a luminance proxy when the backend is offline — the
// field is monotonic but won't match the photograph's actual depth.

import { createLogger } from "lib/log";

const log = createLogger("atelier:lightpainting-forge:depth");

export type DepthResult = {
  data: Float32Array;
  width: number;
  height: number;
  source: "depth-anything" | "fallback";
};

const BACKEND = "/api/depth";

export async function estimateDepth(
  image: HTMLImageElement | ImageBitmap,
): Promise<DepthResult> {
  const c = document.createElement("canvas");
  c.width =
    image instanceof ImageBitmap ? image.width : image.naturalWidth;
  c.height =
    image instanceof ImageBitmap ? image.height : image.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  try {
    const blob = await new Promise<Blob>((res) =>
      c.toBlob((b) => res(b!), "image/png"),
    );
    const form = new FormData();
    form.append("image", blob, "frame.png");
    const r = await fetch(BACKEND, { method: "POST", body: form });
    if (!r.ok) throw new Error(`depth backend ${r.status}`);
    const depthBlob = await r.blob();
    const bmp = await createImageBitmap(depthBlob);
    const dc = document.createElement("canvas");
    dc.width = bmp.width;
    dc.height = bmp.height;
    const dctx = dc.getContext("2d")!;
    dctx.drawImage(bmp, 0, 0);
    // PNG is 16-bit grayscale on disk but Canvas decodes 8-bit RGBA.
    // Precision loss accepted for now; swap to a raw Float32 binary
    // endpoint when fine sculpture detail demands it.
    const img = dctx.getImageData(0, 0, dc.width, dc.height);
    const out = new Float32Array(dc.width * dc.height);
    for (let i = 0; i < out.length; i++) {
      // img.data is Uint8ClampedArray of length 4*width*height; in-bounds.
      out[i] = img.data[i * 4]! / 255;
    }
    return {
      data: out,
      width: dc.width,
      height: dc.height,
      source: "depth-anything",
    };
  } catch (err) {
    log.warn("depth backend unreachable, using luminance fallback", { err });
    return fallbackDepth(c);
  }
}

function fallbackDepth(srcCanvas: HTMLCanvasElement): DepthResult {
  const ctx = srcCanvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const out = new Float32Array(srcCanvas.width * srcCanvas.height);
  for (let i = 0; i < out.length; i++) {
    // RGBA stride; indices in-bounds by loop length.
    const r = img.data[i * 4 + 0]!;
    const g = img.data[i * 4 + 1]!;
    const b = img.data[i * 4 + 2]!;
    out[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  return {
    data: out,
    width: srcCanvas.width,
    height: srcCanvas.height,
    source: "fallback",
  };
}
