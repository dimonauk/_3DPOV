"use client";

/**
 * components/studio/DropZone.tsx — primary ingest surface for the editor.
 *
 * Single file or multi-file drop; reads via File API; format detection
 * happens downstream in `lib/studio/source-detection`.
 */

import { useCallback, useRef, useState } from "react";

type Props = {
  onFiles: (files: FileList | File[]) => void | Promise<void>;
};

export default function DropZone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        void onFiles(e.dataTransfer.files);
      }
    },
    [onFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void onFiles(e.target.files);
      }
    },
    [onFiles],
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className="grid h-full place-items-center bg-warm-black-950"
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative flex aspect-[16/9] w-3/4 max-w-3xl flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors ${
          dragActive
            ? "border-pink-200 bg-pink-200/5"
            : "border-warm-black-700 hover:border-pink-200/60"
        }`}
      >
        <div className="chrome-label text-pink-200">DROP</div>
        <div className="mt-2 text-3xl text-chrome-100">
          OSV · INSV · MP4 · 360 · DNG · PLY · SPZ
        </div>
        <div className="mt-4 max-w-md text-center text-sm text-chrome-300">
          Drop a file from your DJI Avata 360 / Osmo 360, Insta360 X-series,
          GoPro MAX, Theta, or any equirect MP4. Splats welcome too.
        </div>
        <div className="mt-6 text-xs text-chrome-500">
          or <span className="underline">click to choose a file</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="video/*,image/*,.osv,.insv,.insp,.360,.dng,.ply,.splat,.ksplat,.spz"
          onChange={onPick}
          multiple
        />
      </button>
    </div>
  );
}
