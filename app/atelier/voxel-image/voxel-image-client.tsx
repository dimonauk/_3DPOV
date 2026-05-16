"use client";

/**
 * app/atelier/voxel-image/voxel-image-client.tsx — Voxel-image chamber UI.
 *
 * Drop an image, watch it explode into its constituent voxels.
 * Auto-selects sphere layout for equirectangulars, plane layout
 * otherwise. Animation toggle activates the pixel-stream effect.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useActiveChamber } from "lib/state/atelier-hooks";
import type { VoxelLayout } from "components/atelier/voxel-image/voxel-image";

const VoxelImage = dynamic(
  () => import("components/atelier/voxel-image/voxel-image"),
  { ssr: false },
);

const DEFAULT_IMAGE_URL = "/cards/dimona/card-front.png";

const RESOLUTION_OPTIONS = [256, 512, 1024, 2048] as const;
type Resolution = (typeof RESOLUTION_OPTIONS)[number];

export default function VoxelImageClient() {
  useActiveChamber("voxel-image");

  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [layout, setLayout] = useState<VoxelLayout>("plane");
  const [resolution, setResolution] = useState<Resolution>(512);
  const [animate, setAnimate] = useState<boolean>(false);
  const [cycleSeconds, setCycleSeconds] = useState<number>(6);
  const [amplitude, setAmplitude] = useState<number>(0.5);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    // Probe aspect to pick a sensible default layout.
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth >= 4096 && Math.abs(probe.naturalWidth / probe.naturalHeight - 2) < 0.05) {
        setLayout("sphere");
      } else {
        setLayout("plane");
      }
    };
    probe.src = url;
    setImageUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Display surface */}
      <section
        className="relative h-[560px] w-full overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-950"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
      >
        <VoxelImage
          imageUrl={imageUrl}
          resolution={resolution}
          layout={layout}
          animate={animate}
          cycleSeconds={cycleSeconds}
          animationAmplitude={amplitude}
          className="absolute inset-0"
        />
      </section>

      {/* Controls */}
      <section className="flex flex-wrap items-center gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
        >
          Drop image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose an image to voxelise"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Layout
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as VoxelLayout)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 text-chrome-100"
          >
            <option value="plane">plane</option>
            <option value="sphere">sphere (360)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Resolution
          <select
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value) as Resolution)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 text-chrome-100"
          >
            {RESOLUTION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} px ({r === 256 ? "~32K" : r === 512 ? "~131K" : r === 1024 ? "~524K" : "~2.1M"} voxels)
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
          />
          pixel stream
        </label>
        {animate ? (
          <>
            <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
              Cycle
              <input
                type="number"
                min={1}
                max={30}
                step={0.5}
                value={cycleSeconds}
                onChange={(e) => setCycleSeconds(Number(e.target.value))}
                className="w-16 rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 text-chrome-100"
              />
              s
            </label>
            <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
              Amplitude
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-24"
              />
              <span className="font-mono text-[0.55rem] text-chrome-500">
                {amplitude.toFixed(2)}
              </span>
            </label>
          </>
        ) : null}
      </section>

      <p className="text-xs leading-relaxed text-chrome-500">
        Voxel count scales as width × height. Sphere layout uses 2:1 by
        convention regardless of source aspect (equirectangular). On
        plane layout the height matches the source aspect. The pixel-
        stream effect: each voxel travels toward the antipode on a
        sphere, or the opposite side on a plane.
      </p>

      <details className="text-xs leading-relaxed text-chrome-400">
        <summary className="cursor-pointer text-chrome-300 hover:text-pink-200">
          Where this fits in the voxel pipeline
        </summary>
        <div className="mt-2 flex flex-col gap-2 pl-4">
          <p>
            This chamber does pure 1:1 pixel→voxel mapping with no depth
            inference — purely cosmetic. The studio&rsquo;s deeper
            voxelisation paths (cubemap+depth, 360-native depth models,
            stereo from dual-lens 360 cameras, multi-position gaussian
            splat, NeRF) are queued for separate chambers per
            <code className="px-1 text-chrome-300">docs/VOXEL-PIPELINE-PLAN.md</code>.
            Voxels with real depth feed HoloWalk AR anchors and the
            print bureau&rsquo;s "sculpture of a place" product line;
            voxels without depth feed the pixel-stream aesthetic and
            the 360 generation model&rsquo;s training corpus.
          </p>
        </div>
      </details>
    </div>
  );
}
