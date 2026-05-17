"use client";

/**
 * app/atelier/comfy-layered/comfy-layered-client.tsx — Comfy Layered chamber UI.
 *
 * The front for the studio's layered-prompt ComfyUI workflow. The
 * operator picks a prompt chain (each chain is an ordered list of
 * named layers), dials each layer's parameters, picks a workflow
 * variant (text-to-image, layered, progressive, style-transfer),
 * presses Run. The chamber POSTs to the ComfyUI backend's job queue,
 * polls until the job lands in `completed`, surfaces the rendered
 * image.
 *
 * Backend contract — every call goes through the server-side proxy at
 * `/api/comfy-layered/*`, which forwards to the ComfyUI bench named by
 * the `COMFYUI_URL` env (default `http://localhost:8188`). Keeping the
 * bench host server-only avoids leaking it into the browser bundle and
 * sidesteps direct-from-browser CORS. The bench must expose:
 *
 *   GET  /api/chains                  -> { chains: ChainConfig[] }
 *   GET  /api/chains/:id/params       -> Record<string, LayerParameter>
 *   GET  /api/presets                 -> { presets: Preset[] }
 *   POST /api/generate                -> { jobId }
 *   GET  /api/jobs/:id                -> JobStatus
 *   DELETE /api/jobs/:id              -> { cancelled }
 *
 * That's the same shape the Vite app at
 * `D:/The_Hangar/apps/comfy-layered-ai-ui/` was already wired to. When
 * the proxy can't reach the bench the chamber falls back to an empty
 * state with a "bench unreachable" notice instead of crashing.
 *
 * Ported from the Vite + React 18 source; React 19 + Next 15 here.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:comfy-layered");

// ---------------------------------------------------------------------------
// Types — kept thin, mirror the backend contract

type LayerParameter = {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "slider" | "toggle";
  defaultValue: string | number | boolean;
  realtime: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
};

type ChainConfig = {
  id: string;
  name: string;
  description: string;
  category: string;
  layers: string[];
  enabled: boolean;
};

type Preset = {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, string | number | boolean>;
};

type WorkflowKind =
  | "text-to-image"
  | "layered"
  | "progressive"
  | "style-transfer";

type JobStatus = {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep: string;
  totalSteps: number;
  previewImage?: string;
  imageUrl?: string;
  error?: string;
};

type RunState =
  | { kind: "idle" }
  | { kind: "running"; jobId: string }
  | { kind: "done"; imageUrl: string }
  | { kind: "error"; message: string };

// ---------------------------------------------------------------------------
// Backend URL — the chamber calls a same-origin proxy at
// `/api/comfy-layered/*`, which forwards to `${COMFYUI_URL}/api/*` on
// the server. Keeps the bench host server-only and avoids browser CORS.

const PROXY_BASE = "/api/comfy-layered";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // path comes in as "/chains", "/jobs/abc", etc. — strip the leading
  // "/api" the original Vite wiring carried.
  const trimmed = path.replace(/^\/api/, "");
  const res = await fetch(`${PROXY_BASE}${trimmed}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 200) || `http ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Component

const WORKFLOW_KINDS: WorkflowKind[] = [
  "text-to-image",
  "layered",
  "progressive",
  "style-transfer",
];

const MODEL_OPTIONS = [
  { value: "flux-dev", label: "Flux Dev" },
  { value: "flux-schnell", label: "Flux Schnell" },
  { value: "sd-xl", label: "Stable Diffusion XL" },
  { value: "sd-1.5", label: "Stable Diffusion 1.5" },
];

const RES_OPTIONS = [512, 768, 1024, 1280];

function prettyWorkflow(k: WorkflowKind): string {
  return k.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function prettyLayerName(id: string): string {
  const known: Record<string, string> = {
    "basic-concepts": "Basic concepts",
    relationships: "Relationships",
    "rendering-strategy": "Rendering strategy",
    optimization: "Optimisation",
  };
  return known[id] ?? id;
}

export default function ComfyLayeredClient() {
  useActiveChamber("comfy-layered");

  // Bench state ----------------------------------------------------------
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [benchReachable, setBenchReachable] = useState<boolean | null>(null);

  // Selection state ------------------------------------------------------
  const [prompt, setPrompt] = useState("");
  const [chainId, setChainId] = useState<string>("");
  const [workflow, setWorkflow] = useState<WorkflowKind>("layered");
  const [seed, setSeed] = useState<number>(-1);
  const [steps, setSteps] = useState(20);
  const [cfg, setCfg] = useState(7.5);
  const [model, setModel] = useState("flux-dev");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [showSettings, setShowSettings] = useState(false);

  // Layered params -------------------------------------------------------
  const [chainParams, setChainParams] = useState<Record<string, LayerParameter>>({});
  const [parameters, setParameters] = useState<Record<string, string | number | boolean>>({});
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});

  // Run state ------------------------------------------------------------
  const [run, setRun] = useState<RunState>({ kind: "idle" });
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Bootstrap ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          api<{ chains: ChainConfig[] }>("/api/chains"),
          api<{ presets: Preset[] }>("/api/presets"),
        ]);
        if (cancelled) return;
        setChains(c.chains ?? []);
        setPresets(p.presets ?? []);
        if ((c.chains ?? []).length > 0 && !chainId) {
          // Length > 0 guard above.
          setChainId(c.chains[0]!.id);
        }
        setBenchReachable(true);
      } catch (err) {
        if (cancelled) return;
        log.warn("bench unreachable", { err });
        setBenchReachable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load per-chain params when chain changes
  useEffect(() => {
    if (!chainId) return;
    let cancelled = false;
    (async () => {
      try {
        const params = await api<Record<string, LayerParameter>>(
          `/api/chains/${encodeURIComponent(chainId)}/params`,
        );
        if (cancelled) return;
        setChainParams(params);
        const chain = chains.find((c) => c.id === chainId);
        if (chain) {
          const next: Record<string, boolean> = {};
          for (const layerId of chain.layers) next[layerId] = true;
          setExpandedLayers(next);
        }
      } catch (err) {
        log.warn("chain params load failed", { chainId, err });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chainId, chains]);

  // Layered params grouped by layer id
  const layerGroups = useMemo(() => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return [];
    return chain.layers.map((layerId) => ({
      layerId,
      name: prettyLayerName(layerId),
      params: Object.values(chainParams).filter((p) => p.id.startsWith(layerId)),
    }));
  }, [chainParams, chainId, chains]);

  // Handlers -------------------------------------------------------------
  const onParam = useCallback(
    (id: string, value: string | number | boolean) => {
      setParameters((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const onPreset = useCallback((preset: Preset) => {
    setParameters(preset.parameters as Record<string, string | number | boolean>);
  }, []);

  const onRun = useCallback(async () => {
    if (!prompt.trim()) return;
    setRun({ kind: "running", jobId: "" });
    setProgress(0);
    setCurrentStep("");
    setPreviewImages([]);
    try {
      const chain = chains.find((c) => c.id === chainId);
      const body = {
        prompt,
        chainId,
        seed: seed === -1 ? undefined : seed,
        steps,
        cfg,
        model,
        width,
        height,
        workflow,
        layers: chain?.layers,
        parameters,
      };
      const { jobId } = await api<{ jobId: string }>("/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setRun({ kind: "running", jobId });

      // Poll
      let finalUrl: string | undefined;
      while (true) {
        await new Promise((r) => setTimeout(r, 500));
        const status = await api<JobStatus>(
          `/api/jobs/${encodeURIComponent(jobId)}`,
        );
        setProgress(status.progress);
        setCurrentStep(status.currentStep);
        if (status.previewImage) {
          setPreviewImages((prev) =>
            prev.includes(status.previewImage!) ? prev : [...prev, status.previewImage!],
          );
        }
        if (status.status === "completed") {
          finalUrl = status.imageUrl;
          break;
        }
        if (status.status === "failed") {
          throw new Error(status.error ?? "job failed");
        }
        if (status.status === "cancelled") {
          throw new Error("job cancelled");
        }
      }
      if (finalUrl) {
        setRun({ kind: "done", imageUrl: finalUrl });
      } else {
        setRun({ kind: "error", message: "job completed without image" });
      }
    } catch (err) {
      log.error("run failed", { err });
      setRun({
        kind: "error",
        message: err instanceof Error ? err.message : "run failed",
      });
    }
  }, [chains, chainId, cfg, height, model, parameters, prompt, seed, steps, width, workflow]);

  const onCancel = useCallback(async () => {
    if (run.kind !== "running" || !run.jobId) {
      setRun({ kind: "idle" });
      return;
    }
    try {
      await api(`/api/jobs/${encodeURIComponent(run.jobId)}`, { method: "DELETE" });
    } catch (err) {
      log.warn("cancel failed", { err });
    }
    setRun({ kind: "idle" });
  }, [run]);

  const onDownload = useCallback(() => {
    if (run.kind !== "done") return;
    const a = document.createElement("a");
    a.href = run.imageUrl;
    a.download = `comfy-layered-${Date.now()}.png`;
    a.click();
  }, [run]);

  const onRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 2147483647));
  }, []);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-8">
      {benchReachable === false ? (
        <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
          bench unreachable through{" "}
          <code className="font-mono">{PROXY_BASE}</code>
          . start ComfyUI on the bench, or set{" "}
          <code className="font-mono">COMFYUI_URL</code>{" "}
          to the right host and restart the dev server (see PURPOSE.md).
          the controls are still editable but Run won&rsquo;t submit
          anything.
        </p>
      ) : null}

      {/* Prompt ---------------------------------------------------------- */}
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

      {/* Chain + presets ------------------------------------------------- */}
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

      {/* Workflow type --------------------------------------------------- */}
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

      {/* Layered params -------------------------------------------------- */}
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
                    onClick={() =>
                      setExpandedLayers((prev) => ({
                        ...prev,
                        [group.layerId]: !expanded,
                      }))
                    }
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

      {/* Settings panel (collapsible) ------------------------------------ */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
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

            {/* Steps */}
            <SliderRow
              label="Sampling steps"
              value={steps}
              min={1}
              max={100}
              step={1}
              onChange={setSteps}
            />

            {/* CFG */}
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

      {/* Run / cancel ---------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={run.kind === "running" ? onCancel : onRun}
          disabled={run.kind !== "running" && !prompt.trim()}
          className={
            run.kind === "running"
              ? "self-start rounded-sm border border-pink-400/60 bg-pink-900/30 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-900/50"
              : "self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
          }
        >
          {run.kind === "running" ? "Cancel queue" : "→ Run workflow"}
        </button>

        {run.kind === "running" ? (
          <div className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-3">
            <div className="flex justify-between font-mono text-xs text-chrome-300">
              <span>queue progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-warm-black-800">
              <div
                className="h-full bg-pink-200 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentStep ? (
              <p className="font-mono text-[10px] text-chrome-500">
                {currentStep}
              </p>
            ) : null}
          </div>
        ) : null}

        {run.kind === "error" ? (
          <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            {run.message}
          </p>
        ) : null}
      </section>

      {/* Output ---------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Output</span>
        <div className="relative aspect-square overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          {run.kind === "done" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={run.imageUrl}
              alt="generated"
              className="h-full w-full object-contain"
            />
          ) : previewImages.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImages[previewImages.length - 1]}
              alt="preview"
              className="h-full w-full object-contain opacity-80"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-chrome-500">
              <span className="font-mono text-xs uppercase tracking-[0.2em]">
                no image yet
              </span>
            </div>
          )}
        </div>
        {run.kind === "done" ? (
          <button
            type="button"
            onClick={onDownload}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-200/20"
          >
            Download image
          </button>
        ) : null}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: LayerParameter;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const realtimeBadge = param.realtime ? (
    <span className="flex items-center gap-1 font-mono text-[10px] text-pink-200">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-200" />
      realtime
    </span>
  ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`param-${param.id}`}
          className="font-mono text-xs uppercase tracking-[0.16em] text-chrome-300"
        >
          {param.name}
        </label>
        {realtimeBadge}
      </div>
      {param.type === "text" ? (
        <input
          id={`param-${param.id}`}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(param.defaultValue)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        />
      ) : null}
      {param.type === "number" ? (
        <input
          id={`param-${param.id}`}
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          min={param.min}
          max={param.max}
          step={param.step ?? 1}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        />
      ) : null}
      {param.type === "slider" ? (
        <>
          <input
            id={`param-${param.id}`}
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="accent-pink-200"
          />
          <div className="flex justify-between font-mono text-[10px] text-chrome-500">
            <span>{param.min}</span>
            <span className="text-chrome-200">{String(value)}</span>
            <span>{param.max}</span>
          </div>
        </>
      ) : null}
      {param.type === "select" ? (
        <select
          id={`param-${param.id}`}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        >
          {(param.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : null}
      {param.type === "toggle" ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          aria-pressed={value ? "true" : "false"}
          aria-label={`${param.name}: ${value ? "on" : "off"}`}
          title={`${param.name}: ${value ? "on" : "off"}`}
          className={
            value
              ? "relative h-7 w-14 rounded-full bg-pink-900/40 ring-1 ring-pink-200/60"
              : "relative h-7 w-14 rounded-full bg-warm-black-800 ring-1 ring-warm-black-700"
          }
        >
          <span
            className={
              value
                ? "absolute top-1 h-5 w-5 translate-x-7 rounded-full bg-pink-200 transition-transform"
                : "absolute top-1 h-5 w-5 translate-x-1 rounded-full bg-chrome-500 transition-transform"
            }
          />
        </button>
      ) : null}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const inputId = `slider-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="chrome-label text-chrome-400">
        {label} &middot; {value}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}: ${value}`}
        className="accent-pink-200"
      />
    </div>
  );
}
