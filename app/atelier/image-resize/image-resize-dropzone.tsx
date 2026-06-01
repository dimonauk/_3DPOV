"use client";
/**
 * image-resize-dropzone.tsx — Drag-and-drop / file-picker panel.
 */
import { useRef } from "react";

type Props = {
  sourcePreviewUrl: string | null;
  isDragOver: boolean;
  onFile: (file: File) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
};

export function ImageResizeDropzone({ sourcePreviewUrl, isDragOver, onFile, onDragOver, onDragLeave }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropCls = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver ? "border-pink-200 bg-warm-black-900/60" : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <section
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDragLeave(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={dropCls}
    >
      {sourcePreviewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sourcePreviewUrl} alt="Source" className="max-h-64 rounded-sm border border-warm-black-800" />
      )}
      <span className="chrome-label text-chrome-400">Drop zone</span>
      <p className="text-sm leading-relaxed text-chrome-300">Drag an image here, or</p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
      >
        Choose an image
      </button>
      <input
        ref={fileInputRef} type="file" accept="image/*"
        aria-label="Choose an image to resize" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    </section>
  );
}
