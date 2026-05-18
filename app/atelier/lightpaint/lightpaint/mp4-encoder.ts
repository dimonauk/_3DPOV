/**
 * app/atelier/lightpaint/lightpaint/mp4-encoder.ts — WebCodecs MP4
 * encode of an ordered frame sequence via mediabunny. Lazy-loads
 * the encoder so the chamber doesn't pull it until the operator
 * actually exports. Letterboxes each frame to match the first
 * frame's dimensions.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { loadImage } from "./image-helpers";
import type { Frame } from "./types";

export async function encodeMp4Sequence(
  frames: Frame[],
  fps: number,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  // Lazy-load mediabunny only when the user actually exports.
  const {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    QUALITY_HIGH,
  } = await import("mediabunny");

  // Decode the first frame to determine output dimensions.
  const firstImg = await loadImage(frames[0]!.url);
  const width = firstImg.naturalWidth;
  const height = firstImg.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: QUALITY_HIGH,
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  await output.start();

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]!;
    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(f.url);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    // Letterbox / contain to keep aspect.
    const scale = Math.min(
      width / img.naturalWidth,
      height / img.naturalHeight,
    );
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
    const timestamp = i / fps;
    const duration = 1 / fps;
    // eslint-disable-next-line no-await-in-loop
    await videoSource.add(timestamp, duration);
    onProgress((i + 1) / frames.length);
  }

  await output.finalize();
  const buffer = (output.target as { buffer: Uint8Array | ArrayBuffer })
    .buffer;
  return new Blob([buffer as BlobPart], { type: "video/mp4" });
}
