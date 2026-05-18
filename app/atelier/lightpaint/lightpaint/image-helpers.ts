/**
 * app/atelier/lightpaint/lightpaint/image-helpers.ts — Image probing
 * + safe decoding utilities. probeImage measures aspect ratio and
 * flags 2:1 ≥4096-wide images as equirectangular; loadImage is a
 * Promise wrapper around Image.onload.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

export async function probeImage(
  url: string,
): Promise<{ aspect: number; isEquirectangular: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w === 0 || h === 0) {
        resolve({ aspect: 1.5, isEquirectangular: false });
        return;
      }
      const aspect = w / h;
      // 2:1 with width >= 4096 = almost certainly equirectangular.
      const isEquirectangular = w >= 4096 && Math.abs(aspect - 2) < 0.02;
      resolve({ aspect, isEquirectangular });
    };
    img.onerror = () => resolve({ aspect: 1.5, isEquirectangular: false });
    img.src = url;
  });
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}
