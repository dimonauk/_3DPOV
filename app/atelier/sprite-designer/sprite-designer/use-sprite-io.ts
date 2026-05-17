"use client";

/**
 * app/atelier/sprite-designer/sprite-designer/use-sprite-io.ts —
 * Export / save / load / photo-snap handlers as a hook. Owns the
 * error state; all canvas IO bounces through the supplied refs and
 * frame/history APIs.
 *
 * Extracted from sprite-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { type Dispatch, type RefObject, type SetStateAction, useState } from "react";

import { createLogger } from "lib/log";
import { encodeBmp24 } from "lib/sprite-designer/bmp";
import {
  deserialize as loadProject,
  downloadHolosprite,
  serialize as saveProject,
} from "lib/sprite-designer/holosprite";
import { kCentroid } from "lib/sprite-designer/kcentroid";
import {
  ALL_PALETTES,
  type Palette,
} from "lib/sprite-designer/palettes";
import { photoToSprite } from "lib/sprite-designer/photo-to-sprite";
import type { FramesApi } from "lib/sprite-designer/use-frames";
import type { useHistory } from "lib/sprite-designer/use-history";
import { buildZipStore } from "lib/sprite-designer/zip";
import { pushAtelierOutput } from "lib/state/atelier-hooks";

const log = createLogger("atelier:sprite-designer:io");

type HistoryApi = ReturnType<typeof useHistory>;

export type UseSpriteIoOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  palette: Palette;
  setWidth: Dispatch<SetStateAction<number>>;
  setHeight: Dispatch<SetStateAction<number>>;
  setPalette: Dispatch<SetStateAction<Palette>>;
  setActiveData: Dispatch<SetStateAction<ImageData | null>>;
  frames: FramesApi;
  history: HistoryApi;
  snapshot: () => ImageData;
  paintPreview: () => void;
  commitStroke: () => void;
};

export function useSpriteIo(opts: UseSpriteIoOptions) {
  const {
    canvasRef,
    width,
    height,
    palette,
    setWidth,
    setHeight,
    setPalette,
    setActiveData,
    frames,
    history,
    snapshot,
    paintPreview,
    commitStroke,
  } = opts;
  const [error, setError] = useState<string | null>(null);

  const onPhotoSelect = async (file: File) => {
    try {
      const result = await photoToSprite(file, width, height, palette.colors);
      canvasRef.current!.getContext("2d")!.putImageData(result, 0, 0);
      paintPreview();
      commitStroke();
    } catch (err) {
      log.error("photo-to-sprite failed", { err });
      setError(err instanceof Error ? err.message : "Photo conversion failed.");
    }
  };

  const runKCentroid = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const src = ctx.getImageData(0, 0, c.width, c.height);
    const out = kCentroid(src, width, height, 4, 3);
    ctx.putImageData(out.centroid, 0, 0);
    paintPreview();
    commitStroke();
  };

  const exportPng = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const filename = `sprite_${width}x${height}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      pushAtelierOutput({
        chamberSlug: "sprite-designer",
        kind: "image",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: "image/png",
        sizeBytes: blob.size,
      });
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const saveSprite = () => {
    const live = snapshot();
    const all = frames.frames.map((f, i) => (i === frames.current ? live : f));
    const text = saveProject({
      width,
      height,
      paletteName: palette.name,
      paletteColors: palette.colors,
      frames: all,
      fps: frames.fps,
    });
    const filename = `sprite_${width}x${height}_${all.length}f`;
    const blob = downloadHolosprite(text, filename);
    pushAtelierOutput({
      chamberSlug: "sprite-designer",
      kind: "data",
      label: `${filename}.holosprite`,
      blobUrl: URL.createObjectURL(blob),
      mimeType: "application/json",
      sizeBytes: blob.size,
    });
  };

  const loadSprite = async (file: File) => {
    setError(null);
    let parsed;
    try {
      const text = await file.text();
      parsed = loadProject(text);
    } catch (err) {
      log.error("load .holosprite failed", { err });
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
      return;
    }
    setWidth(parsed.width);
    setHeight(parsed.height);
    const known = ALL_PALETTES.find((q) => q.name === parsed.paletteName);
    setPalette(
      known ?? { name: parsed.paletteName, colors: parsed.paletteColors },
    );
    frames.setFps(parsed.fps);
    // Defer replaceAll until after the canvas resize effect runs.
    requestAnimationFrame(() => {
      frames.replaceAll(parsed.frames, 0);
      paintPreview();
      // parsed.frames is non-empty (replaceAll early-returns otherwise).
      history.reset(parsed.frames[0]!);
      setActiveData(parsed.frames[0]!);
    });
  };

  const exportBmpZip = () => {
    const live = snapshot();
    const all = frames.frames.map((f, i) => (i === frames.current ? live : f));
    const files = all.map((data, i) => ({
      name: `${String(i + 1).padStart(3, "0")}.bmp`,
      data: encodeBmp24(data),
    }));
    const zip = buildZipStore(files);
    const blob = new Blob([new Uint8Array(zip)], { type: "application/zip" });
    const filename = `sprite_${width}x${height}_${all.length}frames.zip`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    pushAtelierOutput({
      chamberSlug: "sprite-designer",
      kind: "data",
      label: filename,
      blobUrl: URL.createObjectURL(blob),
      mimeType: "application/zip",
      sizeBytes: blob.size,
    });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return {
    error,
    setError,
    onPhotoSelect,
    runKCentroid,
    exportPng,
    saveSprite,
    loadSprite,
    exportBmpZip,
  };
}
