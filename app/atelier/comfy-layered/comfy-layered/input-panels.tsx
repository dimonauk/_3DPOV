"use client";

/**
 * app/atelier/comfy-layered/comfy-layered/input-panels.tsx — All
 * "what to generate" UI: prompt textarea, chain dropdown + presets,
 * workflow-type buttons, expandable layered params, generation
 * settings (seed / steps / cfg / model / w / h).
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md
 * Rule 1. Pure presentation — every change flows through callbacks.
 */

import type { Dispatch, SetStateAction } from "react";

import {
  MODEL_OPTIONS,
  RES_OPTIONS,
  WORKFLOW_KINDS,
  prettyWorkflow,
} from "./constants";
import { ParamControl, SliderRow } from "./sub-controls";
import type {
  ChainConfig,
  LayerParameter,
  Preset,
  WorkflowKind,
} from "./types";

export function InputPanels({
  prompt,
  setPrompt,
  chains,
  chainId,
  setChainId,
  presets,
  onPreset,
  workflow,
  setWorkflow,
  layerGroups,
  expandedLayers,
  toggleLayer,
  parameters,
  onParam,
  showSettings,
  toggleSettings,
  seed,
  setSeed,
  onRandomSeed,
  steps,
  setSteps,
  cfg,
  setCfg,
  model,
  setModel,
  width,
  setWidth,
  height,
  setHeight,
}: {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  chains: ChainConfig[];
  chainId: string;
  setChainId: (id: string) => void;
  presets: Preset[];
  onPreset: (preset: Preset) => void;
  workflow: WorkflowKind;
  setWorkflow: Dispatch<SetStateAction<WorkflowKind>>;
  layerGroups: Array<{
    layerId: string;
    name: string;
    params: LayerParameter[];
  }>;
  expandedLayers: Record<string, boolean>;
  toggleLayer: (layerId: string) => void;
  parameters: Record<string, string | number | boolean>;
  onParam: (id: string, value: string | number | boolean) => void;
  showSettings: boolean;
  toggleSettings: () => void;
  seed: number;
  setSeed: Dispatch<SetStateAction<number>>;
  onRandomSeed: () => void;
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  cfg: number;
  setCfg: Dispatch<SetStateAction<number>>;
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
  height: number;
  setHeight: Dispatch<SetStateAction<number>>;
}) {
  return (
    <>
      {/* Prompt */}
      <section className="flex flex-col gap-2">
        <label htmlFor="prompt" className="chrome-label text-chrome-400">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="describe the image you want…"
          rows={4}
          className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-3 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-chrome-500">
          <span>{prompt.length} characters</span>
          <button
            type="button"
            onClick={() => setPrompt("")}
            className="font-mono uppercase tracking-[0.2em] text-chrome-400 hover:text-pink-200"
          >
            Clear
          </button>
        </div>
      </section>

      {/* Chain + presets */}
      <section className="flex flex-col gap-3">
        <label htmlFor="chain" className="chrome-label text-chrome-400">
          Prompt chain
        </label>
        <select
          id="chain"
          value={chainId}
          onChange={(e) => setChainId(e.target.value)}
          disabled={chains.length === 0}
          className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-2.5 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none disabled:opacity-50"
        >
          {chains.length === 0 ? (
            <option value="">(no chains loaded)</option>
          ) : null}
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
        {presets.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="chrome-label text-chrome-500">Presets</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPreset(preset)}
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Workflow type */}
      <section className="flex flex-col gap-2">
        <span className="chrome-label text-chrome-400">Workflow type</span>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {WORKFLOW_KINDS.map((kind) => {
            const active = workflow === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setWorkflow(kind)}
                className={
                  active
                    ? "rounded-sm border border-pink-200 bg-pink-900/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-pink-100"
                    : "rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60"
                }
              >
                {prettyWorkflow(kind)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Layered params */}
      {workflow === "layered" && layerGroups.length > 0 ? (
        <section className="flex flex-col gap-3">
          <span className="chrome-label text-chrome-400">
            Layered parameters
          </span>
          <div className="flex flex-col gap-3">
            {layerGroups.map((group) => {
              const expanded = expandedLayers[group.layerId] ?? true;
              return (
                <div
                  key={group.layerId}
                  className="overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-950"
                >
                  <button
                    type="button"
                    onClick={() => toggleLayer(group.layerId)}
                    className="flex w-full items-center justify-between bg-warm-black-900 px-4 py-2.5 text-left font-mono text-xs uppercase tracking-[0.18em] text-chrome-200 hover:text-pink-200"
                  >
                    <span>
                      {group.name}{" "}
                      <span className="text-chrome-500">
                        &middot; {group.params.length}
                      </span>
                    </span>
                    <span className="text-chrome-500">
                      {expanded ? "−" : "+"}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="flex flex-col gap-4 p-4">
                      {group.params.length === 0 ? (
                        <p className="text-xs text-chrome-500">
                          no parameters defined for this layer.
                        </p>
                      ) : (
                        group.params.map((p) => (
                          <ParamControl
                            key={p.id}
                            param={p}
                            value={parameters[p.id] ?? p.defaultValue}
                            onChange={(v) => onParam(p.id, v)}
                          />
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Settings panel (collapsible) */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={toggleSettings}
          className="self-start font-mono text-xs uppercase tracking-[0.2em] text-chrome-400 hover:text-pink-200"
        >
          {showSettings ? "− hide settings" : "+ generation settings"}
        </button>
        {showSettings ? (
          <div className="grid grid-cols-1 gap-4 rounded-sm border border-warm-black-700 bg-warm-black-950 p-4 md:grid-cols-2">
            {/* Seed */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="seed" className="chrome-label text-chrome-400">
                Seed
              </label>
              <div className="flex gap-2">
                <input
                  id="seed"
                  type="number"
                  value={seed === -1 ? "" : seed}
                  onChange={(e) =>
                    setSeed(e.target.value ? Number(e.target.value) : -1)
                  }
                  placeholder="random"
                  className="min-w-0 flex-1 rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onRandomSeed}
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
                >
                  Random
                </button>
              </div>
            </div>

            <SliderRow
              label="Sampling steps"
              value={steps}
              min={1}
              max={100}
              step={1}
              onChange={setSteps}
            />

            <SliderRow
              label="CFG scale"
              value={cfg}
              min={1}
              max={30}
              step={0.5}
              onChange={setCfg}
            />

            {/* Model */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model" className="chrome-label text-chrome-400">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Width */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="width" className="chrome-label text-chrome-400">
                Width
              </label>
              <select
                id="width"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
              >
                {RES_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}px
                  </option>
                ))}
              </select>
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="height" className="chrome-label text-chrome-400">
                Height
              </label>
              <select
                id="height"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
              >
                {RES_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}px
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
