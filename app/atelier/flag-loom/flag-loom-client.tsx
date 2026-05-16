"use client";

/**
 * app/atelier/flag-loom/flag-loom-client.tsx — Demo + showcase for the
 * FlagDisplay primitive. Drop an image; choose flag or sphere mode;
 * play with the cloth.
 *
 * Doubles as a manipulation sandbox: anything you can do with cloth
 * physics in the studio's WebGPU display stack starts here.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createXRStore } from "@react-three/xr";

import { ChamberXRBar } from "components/three/ChamberXRBar";
import { useActiveChamber } from "lib/state/atelier-hooks";
import type {
  FlagDisplayHandle,
  FlagDisplayMode,
} from "components/atelier/flag-display/flag-display";

const FlagDisplay = dynamic(
  () => import("components/atelier/flag-display/flag-display"),
  { ssr: false },
);

const DEFAULT_IMAGE_URL = "/cards/dimona/card-front.png";

export default function FlagLoomClient() {
  useActiveChamber("flag-loom");

  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [aspect, setAspect] = useState<number>(1.5);
  const [mode, setMode] = useState<FlagDisplayMode>("flag");
  const [draggable, setDraggable] = useState<boolean>(true);
  const [resolution, setResolution] = useState<number>(24);
  const flagRef = useRef<FlagDisplayHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stable XR store — hand tracking enabled by default so any of the
  // four control modalities (mouse / touch / hand / controller) work.
  const xrStore = useMemo(
    () =>
      createXRStore({
        hand: true,
        controller: true,
      }),
    [],
  );

  // Revoke object URLs on unmount or replacement
  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    // Determine aspect ratio of the dropped image
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setAspect(probe.naturalWidth / probe.naturalHeight);
      }
      // Auto-suggest sphere mode for 2:1 (equirectangular)
      if (
        probe.naturalWidth > 0 &&
        Math.abs(probe.naturalWidth / probe.naturalHeight - 2) < 0.05
      ) {
        setMode("sphere");
      } else {
        setMode("flag");
      }
    };
    probe.src = url;
    setImageUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const onReset = useCallback(() => {
    flagRef.current?.reset();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Display surface */}
      <section
        className="relative h-[520px] w-full overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-950"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
      >
        <FlagDisplay
          ref={flagRef}
          imageUrl={imageUrl}
          mode={mode}
          aspect={aspect}
          resolution={resolution}
          draggable={draggable}
          xrStore={xrStore}
          className="absolute inset-0"
        />
        <div className="absolute right-3 top-3 z-20">
          <ChamberXRBar store={xrStore} />
        </div>
      </section>

      {/* Controls */}
      <section className="flex flex-wrap items-center gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
        >
          Drop image (or browse)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose an image to hang"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as FlagDisplayMode)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 font-mono text-[0.65rem] text-chrome-100"
          >
            <option value="flag">flag</option>
            <option value="sphere">sphere</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Resolution
          <select
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value))}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 font-mono text-[0.65rem] text-chrome-100"
          >
            <option value={12}>12</option>
            <option value={18}>18</option>
            <option value={24}>24</option>
            <option value={32}>32</option>
            <option value={40}>40</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          <input
            type="checkbox"
            checked={draggable}
            onChange={(e) => setDraggable(e.target.checked)}
          />
          draggable
        </label>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          Reset
        </button>
      </section>

      <p className="text-xs leading-relaxed text-chrome-500">
        Cloth physics runs on CPU at 24×16 vertices by default —
        sub-millisecond per frame on any modern device. The WebGPU/TSL
        upgrade swaps the physics + shading without changing this
        component&rsquo;s prop surface. Drop a 2:1 equirectangular and
        the mode auto-switches to sphere.
      </p>
    </div>
  );
}
