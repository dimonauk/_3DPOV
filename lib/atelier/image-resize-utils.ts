import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";
import {
    ImageResizeState,
    OutputFormat,
    type OutputState,
} from "lib/state/image-resize";

const log = createLogger("atelier:image-resize:utils");

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "png", label: "PNG", ext: "png" },
  { value: "jpeg", label: "JPEG", ext: "jpg" },
  { value: "webp", label: "WebP", ext: "webp" },
  { value: "avif", label: "AVIF", ext: "avif" },
];

export async function performResize(
  state: ImageResizeState,
  setOutput: (output: OutputState) => void,
  sourceFile: File | null,
): Promise<void> {
  if (!sourceFile) return;
  const startedAt = Date.now();
  setOutput({ kind: "running", startedAt });
  try {
    const fd = new FormData();
    fd.append("file", sourceFile, sourceFile.name);
    fd.append("mode", state.mode);
    fd.append("target", String(state.target));
    fd.append("fit", state.fit);
    fd.append("format", state.format);
    fd.append("quality", String(state.quality));
    fd.append("strip_icc", state.stripIcc ? "1" : "0");
    const res = await fetch(functionUrl("image_resize"), {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as { error?: string };
        throw new Error(parsed.error ?? `HTTP ${res.status}`);
      } catch {
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }
    }
    const blob = await res.blob();
    const previewUrl = URL.createObjectURL(blob);
    const base = sourceFile.name.replace(/\.[^.]+$/, "");
    const ext =
      FORMAT_OPTIONS.find((opt) => opt.value === state.format)?.ext ??
      state.format;
    const filename = `${base}_resized.${ext}`;
    setOutput({
      kind: "ready",
      blob,
      previewUrl,
      filename,
      durationMs: Date.now() - startedAt,
    });
    pushAtelierOutput({
      chamberSlug: "image-resize",
      kind: "image",
      label: filename,
      blobUrl: URL.createObjectURL(blob),
      mimeType: `image/${state.format === "jpeg" ? "jpeg" : state.format}`,
      sizeBytes: blob.size,
    });
  } catch (err) {
    log.error("resize failed", { err });
    setOutput({
      kind: "error",
      message: err instanceof Error ? err.message : "Resize failed.",
    });
  }
}

export function downloadOutput(output: OutputState): void {
  if (output.kind !== "ready") return;
  const a = document.createElement("a");
  a.href = output.previewUrl;
  a.download = output.filename;
  a.click();
}

export function loadImageFile(
  file: File,
  currentPreviewUrl: string | null,
  setSourcePreviewUrl: (url: string | null) => void,
  setSourceFile: (file: File) => void,
  setSourceDims: (dims: { w: number; h: number } | null) => void,
  setOutput: (output: OutputState) => void,
): void {
  if (!file.type.startsWith("image/")) {
    setOutput({
      kind: "error",
      message: "That doesn't look like an image.",
    });
    return;
  }
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  const url = URL.createObjectURL(file);
  setSourcePreviewUrl(url);
  setSourceFile(file);
  setSourceDims(null);
  setOutput({ kind: "idle" });

  const probe = new Image();
  probe.onload = () => {
    setSourceDims({ w: probe.naturalWidth, h: probe.naturalHeight });
  };
  probe.src = url;
}
