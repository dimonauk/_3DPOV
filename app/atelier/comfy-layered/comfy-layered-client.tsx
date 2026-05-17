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
 * Orchestrator only. Bench IO + run state machine live in
 * comfy-layered/use-comfy-job.ts; UI in input-panels.tsx +
 * output-panel.tsx; sub-controls in sub-controls.tsx; types,
 * constants, api in their own files. Per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useState } from "react";

import { useActiveChamber } from "lib/state/atelier-hooks";

import { PROXY_BASE } from "./comfy-layered/api";
import { InputPanels } from "./comfy-layered/input-panels";
import { OutputPanel } from "./comfy-layered/output-panel";
import type { Preset, WorkflowKind } from "./comfy-layered/types";
import { useComfyJob } from "./comfy-layered/use-comfy-job";

export default function ComfyLayeredClient() {
  useActiveChamber("comfy-layered");

  const job = useComfyJob();

  // Selection state — owned by the host so the operator's draft
  // survives chain re-loads.
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<WorkflowKind>("layered");
  const [seed, setSeed] = useState<number>(-1);
  const [steps, setSteps] = useState(20);
  const [cfg, setCfg] = useState(7.5);
  const [model, setModel] = useState("flux-dev");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [showSettings, setShowSettings] = useState(false);
  const [parameters, setParameters] = useState<
    Record<string, string | number | boolean>
  >({});

  const onParam = useCallback(
    (id: string, value: string | number | boolean) => {
      setParameters((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const onPreset = useCallback((preset: Preset) => {
    setParameters(
      preset.parameters as Record<string, string | number | boolean>,
    );
  }, []);

  const onRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 2147483647));
  }, []);

  const onRun = useCallback(() => {
    void job.submit({
      prompt,
      chainId: job.chainId,
      seed,
      steps,
      cfg,
      model,
      width,
      height,
      workflow,
      parameters,
    });
  }, [
    job,
    prompt,
    seed,
    steps,
    cfg,
    model,
    width,
    height,
    workflow,
    parameters,
  ]);

  return (
    <div className="flex flex-col gap-8">
      {job.benchReachable === false ? (
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

      <InputPanels
        prompt={prompt}
        setPrompt={setPrompt}
        chains={job.chains}
        chainId={job.chainId}
        setChainId={job.setChainId}
        presets={job.presets}
        onPreset={onPreset}
        workflow={workflow}
        setWorkflow={setWorkflow}
        layerGroups={job.layerGroups}
        expandedLayers={job.expandedLayers}
        toggleLayer={job.toggleLayer}
        parameters={parameters}
        onParam={onParam}
        showSettings={showSettings}
        toggleSettings={() => setShowSettings((s) => !s)}
        seed={seed}
        setSeed={setSeed}
        onRandomSeed={onRandomSeed}
        steps={steps}
        setSteps={setSteps}
        cfg={cfg}
        setCfg={setCfg}
        model={model}
        setModel={setModel}
        width={width}
        setWidth={setWidth}
        height={height}
        setHeight={setHeight}
      />

      <OutputPanel
        run={job.run}
        prompt={prompt}
        progress={job.progress}
        currentStep={job.currentStep}
        previewImages={job.previewImages}
        onRun={onRun}
        onCancel={() => void job.cancel()}
        onDownload={job.download}
      />
    </div>
  );
}
