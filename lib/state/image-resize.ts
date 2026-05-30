import { createLogger } from "lib/log";
import { create } from "zustand";

const log = createLogger("state:image-resize");

export type ResizeMode = "width" | "height" | "longest-edge";
export type FitMode = "contain" | "cover" | "stretch";
export type OutputFormat = "png" | "jpeg" | "webp" | "avif";

export type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      blob: Blob;
      previewUrl: string;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };

export interface ImageResizeState {
  sourceFile: File | null;
  sourcePreviewUrl: string | null;
  sourceDims: { w: number; h: number } | null;
  mode: ResizeMode;
  target: number;
  fit: FitMode;
  format: OutputFormat;
  quality: number;
  stripIcc: boolean;
  output: OutputState;
  isDragOver: boolean;

  setSourceFile: (file: File | null) => void;
  setSourcePreviewUrl: (url: string | null) => void;
  setSourceDims: (dims: { w: number; h: number } | null) => void;
  setMode: (mode: ResizeMode) => void;
  setTarget: (target: number) => void;
  setFit: (fit: FitMode) => void;
  setFormat: (format: OutputFormat) => void;
  setQuality: (quality: number) => void;
  setStripIcc: (stripIcc: boolean) => void;
  setOutput: (output: OutputState) => void;
  setIsDragOver: (isDragOver: boolean) => void;

  reset: () => void;
}

const initialState = {
  sourceFile: null,
  sourcePreviewUrl: null,
  sourceDims: null,
  mode: "longest-edge" as ResizeMode,
  target: 1920,
  fit: "contain" as FitMode,
  format: "png" as OutputFormat,
  quality: 90,
  stripIcc: false,
  output: { kind: "idle" } as OutputState,
  isDragOver: false,
};

export const useImageResizeStore = create<ImageResizeState>((set) => ({
  ...initialState,

  setSourceFile: (sourceFile) => set({ sourceFile }),
  setSourcePreviewUrl: (sourcePreviewUrl) => set({ sourcePreviewUrl }),
  setSourceDims: (sourceDims) => set({ sourceDims }),
  setMode: (mode) => set({ mode }),
  setTarget: (target) => set({ target }),
  setFit: (fit) => set({ fit }),
  setFormat: (format) => set({ format }),
  setQuality: (quality) => set({ quality }),
  setStripIcc: (stripIcc) => set({ stripIcc }),
  setOutput: (output) => set({ output }),
  setIsDragOver: (isDragOver) => set({ isDragOver }),

  reset: () => set(initialState),
}));
