/**
 * lib/studio/print-export/textures.ts — Equirect texture loaders.
 *
 * Two source kinds:
 *   - equirect-image: a still URL → THREE.TextureLoader
 *   - equirect-video: grab the current frame from a hidden
 *                     <video>, hand it off as a CanvasTexture
 *
 * Both mirror EquirectViewer's filter + colourspace settings so the
 * print render and the live preview match.
 */

import * as THREE from "three";

/**
 * Load an equirect image source into a THREE.Texture suitable for
 * the inside-of-sphere material.
 */
export function loadEquirectTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        resolve(t);
      },
      undefined,
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

/**
 * For an equirect video, grab the current frame as an in-memory
 * canvas texture. We don't hold the video element open — the print
 * export is a one-shot operation.
 */
export function loadVideoFrameTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", () => {
      const off = document.createElement("canvas");
      off.width = video.videoWidth;
      off.height = video.videoHeight;
      const ctx = off.getContext("2d");
      if (!ctx) {
        reject(
          new Error("print-export: 2D context unavailable for video frame"),
        );
        return;
      }
      ctx.drawImage(video, 0, 0);
      const t = new THREE.CanvasTexture(off);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      video.pause();
      video.src = "";
      resolve(t);
    });
    video.addEventListener("error", () => {
      reject(new Error("print-export: video frame load failed"));
    });
  });
}
