"use client";

/**
 * app/atelier/comfy-layered/comfy-layered/use-comfy-job.ts — State
 * machine for the ComfyUI chamber: bootstraps chains + presets,
 * loads per-chain params when chain changes, submits the generate
 * job, polls until completion, cancels in-flight jobs.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md
 * Rule 1. The host owns prompt/chain/workflow/settings state and
 * passes them into `onRun` via the returned `submit` callback.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "lib/log";

import { api } from "./api";
import { prettyLayerName } from "./constants";
import type {
  ChainConfig,
  JobStatus,
  LayerParameter,
  Preset,
  RunState,
  WorkflowKind,
} from "./types";

const log = createLogger("atelier:comfy-layered:job");

export type SubmitArgs = {
  prompt: string;
  chainId: string;
  seed: number;
  steps: number;
  cfg: number;
  model: string;
  width: number;
  height: number;
  workflow: WorkflowKind;
  parameters: Record<string, string | number | boolean>;
};

export function useComfyJob() {
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [benchReachable, setBenchReachable] = useState<boolean | null>(null);
  const [chainId, setChainId] = useState<string>("");
  const [chainParams, setChainParams] = useState<Record<string, LayerParameter>>(
    {},
  );
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>(
    {},
  );

  const [run, setRun] = useState<RunState>({ kind: "idle" });
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Bootstrap chains + presets.
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
        if ((c.chains ?? []).length > 0) {
          setChainId((current) => current || c.chains[0]!.id);
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
  }, []);

  // Load per-chain params when chain changes.
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

  const layerGroups = useMemo(() => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return [];
    return chain.layers.map((layerId) => ({
      layerId,
      name: prettyLayerName(layerId),
      params: Object.values(chainParams).filter((p) => p.id.startsWith(layerId)),
    }));
  }, [chainParams, chainId, chains]);

  const toggleLayer = useCallback((layerId: string) => {
    setExpandedLayers((prev) => ({ ...prev, [layerId]: !(prev[layerId] ?? true) }));
  }, []);

  const submit = useCallback(
    async (args: SubmitArgs) => {
      if (!args.prompt.trim()) return;
      setRun({ kind: "running", jobId: "" });
      setProgress(0);
      setCurrentStep("");
      setPreviewImages([]);
      try {
        const chain = chains.find((c) => c.id === args.chainId);
        const body = {
          prompt: args.prompt,
          chainId: args.chainId,
          seed: args.seed === -1 ? undefined : args.seed,
          steps: args.steps,
          cfg: args.cfg,
          model: args.model,
          width: args.width,
          height: args.height,
          workflow: args.workflow,
          layers: chain?.layers,
          parameters: args.parameters,
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
              prev.includes(status.previewImage!)
                ? prev
                : [...prev, status.previewImage!],
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
    },
    [chains],
  );

  const cancel = useCallback(async () => {
    if (run.kind !== "running" || !run.jobId) {
      setRun({ kind: "idle" });
      return;
    }
    try {
      await api(`/api/jobs/${encodeURIComponent(run.jobId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      log.warn("cancel failed", { err });
    }
    setRun({ kind: "idle" });
  }, [run]);

  const download = useCallback(() => {
    if (run.kind !== "done") return;
    const a = document.createElement("a");
    a.href = run.imageUrl;
    a.download = `comfy-layered-${Date.now()}.png`;
    a.click();
  }, [run]);

  return {
    chains,
    presets,
    benchReachable,
    chainId,
    setChainId,
    chainParams,
    layerGroups,
    expandedLayers,
    toggleLayer,
    run,
    progress,
    currentStep,
    previewImages,
    submit,
    cancel,
    download,
  };
}
