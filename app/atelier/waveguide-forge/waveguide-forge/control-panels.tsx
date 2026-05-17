"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge/control-panels.tsx —
 * All five right-side panels for the waveguide chamber: HDRI
 * generator, SDF file loader, IOR / density / brightness sliders,
 * light list (up to 4), and the WebGPU photon-mapper toggle.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1. Pure presentation — every action flows through callbacks
 * from the host orchestrator + the useHdri hook.
 */

import { type Dispatch, type RefObject, type SetStateAction } from "react";

import type { LoadedSdf } from "../sdf-loader";

import { Slider } from "./slider";
import type { LightCfg } from "./types";

export function ControlPanels({
  // HDRI
  hdriPrompt,
  setHdriPrompt,
  hdriUrl,
  setHdriUrl,
  hdriBusy,
  hdriErr,
  onGenerateHdri,
  // SDF
  fileInputRef,
  onSdfFile,
  sdf,
  sdfErr,
  // Sliders
  ior,
  setIor,
  density,
  setDensity,
  thickness,
  setThickness,
  // Lights
  lights,
  addLight,
  removeLight,
  updateLight,
  // WebGPU
  useWebGPU,
  setUseWebGPU,
  webgpuAvailable,
  webgpuErr,
  setWebgpuErr,
}: {
  hdriPrompt: string;
  setHdriPrompt: Dispatch<SetStateAction<string>>;
  hdriUrl: string | null;
  setHdriUrl: Dispatch<SetStateAction<string | null>>;
  hdriBusy: boolean;
  hdriErr: string | null;
  onGenerateHdri: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSdfFile: (file: File) => void;
  sdf: LoadedSdf | null;
  sdfErr: string | null;
  ior: number;
  setIor: Dispatch<SetStateAction<number>>;
  density: number;
  setDensity: Dispatch<SetStateAction<number>>;
  thickness: number;
  setThickness: Dispatch<SetStateAction<number>>;
  lights: LightCfg[];
  addLight: () => void;
  removeLight: (i: number) => void;
  updateLight: (i: number, patch: Partial<LightCfg>) => void;
  useWebGPU: boolean;
  setUseWebGPU: Dispatch<SetStateAction<boolean>>;
  webgpuAvailable: boolean | null;
  webgpuErr: string | null;
  setWebgpuErr: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
        <div className="chrome-label text-chrome-400">Background HDRI</div>
        <input
          type="text"
          value={hdriPrompt}
          onChange={(e) => setHdriPrompt(e.target.value)}
          placeholder="e.g. warm sunset over a glass beach"
          aria-label="HDRI prompt"
          disabled={hdriBusy}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-[0.7rem] text-chrome-100 placeholder:text-chrome-600 focus:border-pink-200/60 focus:outline-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !hdriBusy) onGenerateHdri();
          }}
        />
        <button
          type="button"
          onClick={onGenerateHdri}
          disabled={hdriBusy || !hdriPrompt.trim()}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
        >
          {hdriBusy ? "generating…" : "Generate HDRI"}
        </button>
        {hdriBusy && (
          <p className="font-mono text-[0.65rem] text-chrome-400">
            generating background, ~30-60s on the bench…
          </p>
        )}
        {hdriErr && (
          <p className="font-mono text-[0.7rem] text-pink-200">{hdriErr}</p>
        )}
        {hdriUrl && !hdriBusy && (
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[0.65rem] text-emerald-200">
              HDRI live in chamber
            </p>
            <button
              type="button"
              onClick={() => setHdriUrl(null)}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-chrome-500 transition-colors hover:text-pink-200"
            >
              clear
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
        <div className="chrome-label text-chrome-400">SDF source</div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Load .sdf.bin
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".bin"
          aria-label="Load an SDF binary produced by build_sdf.py"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSdfFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        {sdfErr && (
          <p className="font-mono text-[0.7rem] text-pink-200">{sdfErr}</p>
        )}
        {sdf ? (
          <p className="font-mono text-[0.7rem] text-emerald-200">
            {sdf.resolution.join("×")} &middot;{" "}
            {sdf.extentMm.map((n) => n.toFixed(0)).join("×")} mm
          </p>
        ) : (
          <p className="font-mono text-[0.7rem] text-chrome-500">
            using parametric gyroid placeholder
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            IOR &middot; {ior.toFixed(2)}
          </span>
          <input
            type="range"
            min={1.0}
            max={2.0}
            step={0.01}
            value={ior}
            onChange={(e) => setIor(Number(e.target.value))}
            className="accent-pink-200"
          />
        </label>
        {!sdf && (
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Gyroid density &middot; {density.toFixed(1)}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.1}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Brightness &middot; {thickness.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.05}
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="accent-pink-200"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
        <div className="flex items-center justify-between">
          <span className="chrome-label text-chrome-400">
            Lights &middot; {lights.length}/4
          </span>
          <button
            type="button"
            onClick={addLight}
            disabled={lights.length >= 4}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
          >
            + add
          </button>
        </div>
        {lights.map((l, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 border-t border-warm-black-800 pt-3 first:border-t-0 first:pt-0"
          >
            <div className="flex items-center justify-between font-mono text-[0.7rem] text-chrome-300">
              <span>L{i + 1}</span>
              <button
                type="button"
                onClick={() => removeLight(i)}
                disabled={lights.length === 1}
                className="font-mono text-[10px] text-chrome-500 transition-colors hover:text-pink-200 disabled:opacity-40"
              >
                remove
              </button>
            </div>
            <Slider
              label="cone"
              value={l.coneAngle}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(v) => updateLight(i, { coneAngle: v })}
            />
            <Slider
              label="radius"
              value={l.radius}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(v) => updateLight(i, { radius: v })}
            />
            <Slider
              label="intensity"
              value={l.intensity}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => updateLight(i, { intensity: v })}
            />
            <Slider
              label="dir x"
              value={l.direction[0]}
              min={-1}
              max={1}
              step={0.05}
              onChange={(v) =>
                updateLight(i, {
                  direction: [v, l.direction[1], l.direction[2]],
                })
              }
            />
            <Slider
              label="dir z"
              value={l.direction[2]}
              min={-1}
              max={1}
              step={0.05}
              onChange={(v) =>
                updateLight(i, {
                  direction: [l.direction[0], l.direction[1], v],
                })
              }
            />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useWebGPU}
            disabled={!sdf || !webgpuAvailable}
            onChange={(e) => {
              setUseWebGPU(e.target.checked);
              setWebgpuErr(null);
            }}
            className="accent-pink-200"
          />
          <span className="font-mono text-[0.7rem] text-chrome-200">
            WebGPU photon mapper
            {webgpuAvailable === false && " (unavailable)"}
            {webgpuAvailable && !sdf && " (needs SDF)"}
          </span>
        </label>
        {webgpuErr && (
          <p className="font-mono text-[0.7rem] text-pink-200">
            WebGPU: {webgpuErr}
          </p>
        )}
        <p className="font-mono text-[0.65rem] leading-relaxed text-chrome-500">
          mesh → SDF: bench tool{" "}
          <code className="text-chrome-300">
            tools/mesh-to-sdf/build_sdf.py
          </code>
          . WebGPU forward-traces photons; GLSL raymarches from the
          ground plane.
        </p>
      </section>
    </div>
  );
}
