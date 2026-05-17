// SAM2 segmentation client.
//
// Sends a list of (x, y, label) points where label=1 is positive
// (include in mask) and label=0 is negative (exclude). The backend
// caches per-image embeddings so iterative clicks are fast — only the
// first call per image pays the encoder cost.
//
// Falls back to a client-side luminance threshold when the backend
// isn't reachable. The route the backend would mount under doesn't
// exist on the Holoflow site yet (the Python server lives at
// tools/lightpainting-forge-backend/); the fallback is what visitors
// will use until that's wired up.

import { createLogger } from "lib/log";

const log = createLogger("atelier:lightpainting-forge:sam2");

export type Point = { x: number; y: number; label: 0 | 1 };

export type SegResult = {
  mask: ImageData;
  source: "sam2" | "fallback";
  imageId?: string;
};

const BACKEND = "/api/sam2/segment";

export async function segment(
  image: ImageBitmap | HTMLImageElement,
  points: Point[] = [],
  imageId?: string,
): Promise<SegResult> {
  const c = document.createElement("canvas");
  c.width =
    image instanceof ImageBitmap ? image.width : image.naturalWidth;
  c.height =
    image instanceof ImageBitmap ? image.height : image.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  try {
    const form = new FormData();
    if (imageId) {
      form.append("image_id", imageId);
    } else {
      const blob = await new Promise<Blob>((res) =>
        c.toBlob((b) => res(b!), "image/png"),
      );
      form.append("image", blob, "frame.png");
    }
    if (points.length > 0) {
      form.append(
        "points",
        points.map((p) => `${p.x},${p.y},${p.label}`).join(";"),
      );
    }
    const r = await fetch(BACKEND, { method: "POST", body: form });
    if (!r.ok) throw new Error(`sam2 backend ${r.status}`);
    const newImageId = r.headers.get("x-image-id") ?? imageId;
    const maskPng = await r.blob();
    const maskBmp = await createImageBitmap(maskPng);
    const mc = document.createElement("canvas");
    mc.width = maskBmp.width;
    mc.height = maskBmp.height;
    const mctx = mc.getContext("2d")!;
    mctx.drawImage(maskBmp, 0, 0);
    return {
      mask: mctx.getImageData(0, 0, mc.width, mc.height),
      source: "sam2",
      imageId: newImageId ?? undefined,
    };
  } catch (err) {
    log.warn("sam2 backend unreachable, using luminance fallback", { err });
    return {
      mask: luminanceFallback(ctx.getImageData(0, 0, c.width, c.height)),
      source: "fallback",
    };
  }
}

function luminanceFallback(img: ImageData): ImageData {
  const out = new Uint8ClampedArray(img.data.length);
  for (let i = 0; i < img.data.length; i += 4) {
    // RGBA stride matched to loop step; in-bounds by construction.
    const lum =
      0.2126 * img.data[i]! +
      0.7152 * img.data[i + 1]! +
      0.0722 * img.data[i + 2]!;
    const alpha = lum > 80 ? 255 : 0;
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = alpha;
  }
  return new ImageData(out, img.width, img.height);
}
