"use client";

/**
 * app/atelier/veo/veo/use-veo-job.ts — State machine for the Veo 3
 * async job: POST to /generate-video to start, then poll
 * /generate-video/<jobId> every 5s until `done: true` or 4-minute
 * timeout. Surfaces an elapsed-seconds ticker for the running panel
 * and pushes the resulting video bytes (as a Blob URL) into the
 * atelier recent-outputs ring.
 *
 * Extracted from veo-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

import { dataUrlToBlob, downloadFromDataUrl } from "./data-url";
import {
  type AspectRatio,
  type GeneratedVideo,
  type OutputState,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
} from "./types";

const log = createLogger("atelier:veo:job");

export function useVeoJob() {
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [enhancePrompt, setEnhancePrompt] = useState<boolean>(true);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  // Track whether the chamber is still mounted so a slow poll doesn't
  // set state on an unmounted component.
  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Elapsed-time ticker for the "running" panel.
  useEffect(() => {
    if (output.kind !== "running") return;
    setElapsedSec(0);
    const startedAt = output.startedAt;
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [output]);

  const pollUntilDone = useCallback(
    async (jobId: string, startedAt: number, visitorKey: string | null) => {
      const headers: Record<string, string> = {};
      if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

      // Wait one tick before the first poll — Veo never returns
      // instantly and a 0ms poll just wastes a request.
      let waited = 0;
      while (waited < POLL_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        waited += POLL_INTERVAL_MS;

        if (!mountedRef.current) return;

        let res: Response;
        try {
          res = await fetch(
            `/api/ai/google/generate-video/${encodeURIComponent(jobId)}`,
            { method: "GET", headers },
          );
        } catch (err) {
          log.warn("poll fetch failed, retrying next tick", { err });
          continue;
        }

        if (!res.ok) {
          const text = await res.text();
          let message = `HTTP ${res.status}`;
          let code: string | undefined;
          try {
            const parsed = JSON.parse(text) as {
              error?: string;
              code?: string;
            };
            if (parsed.error) message = parsed.error;
            if (parsed.code) code = parsed.code;
          } catch {
            if (text.length > 0 && text.length < 300) message = text;
          }
          if (!mountedRef.current) return;
          const next: OutputState = { kind: "error", message };
          if (code !== undefined) next.code = code;
          setOutput(next);
          return;
        }

        const json = (await res.json()) as
          | { done: false; status: "running" }
          | { done: true; status: "ready"; videos: GeneratedVideo[] }
          | { done: true; status: "error"; error: string };

        if (!mountedRef.current) return;

        if (json.done === false) {
          // Still cooking. Loop.
          continue;
        }

        if (json.status === "error") {
          setOutput({
            kind: "error",
            message: json.error ?? "Veo reported an error.",
          });
          return;
        }

        // Ready.
        const videos = Array.isArray(json.videos) ? json.videos : [];
        if (videos.length === 0) {
          setOutput({
            kind: "error",
            message: "Veo finished but returned no video bytes.",
          });
          return;
        }
        const durationMs = Date.now() - startedAt;
        setOutput({
          kind: "ready",
          videos,
          durationMs,
          promptUsed: prompt.trim(),
        });

        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        videos.forEach((v, i) => {
          const blob = dataUrlToBlob(v.dataUrl);
          const blobUrl = URL.createObjectURL(blob);
          const ext = v.mimeType === "video/webm" ? "webm" : "mp4";
          pushAtelierOutput({
            chamberSlug: "veo",
            kind: "video",
            label: `veo-${stamp}-${i + 1}.${ext}`,
            blobUrl,
            mimeType: v.mimeType,
            sizeBytes: blob.size,
          });
        });
        return;
      }

      if (!mountedRef.current) return;
      setOutput({
        kind: "error",
        message:
          "Veo took longer than four minutes — that usually means the job is stuck. Refresh and try a simpler prompt.",
      });
    },
    [prompt],
  );

  const onGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      setOutput({ kind: "error", message: "Write a prompt first." });
      return;
    }
    const startedAt = Date.now();

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

    const body: Record<string, unknown> = {
      prompt: trimmed,
      aspectRatio,
      durationSeconds,
      generateAudio,
      enhancePrompt,
    };
    const trimmedNeg = negativePrompt.trim();
    if (trimmedNeg.length > 0) body.negativePrompt = trimmedNeg;

    try {
      const res = await fetch("/api/ai/google/generate-video", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        let code: string | undefined;
        let retryAfterSec: number | undefined;
        try {
          const parsed = JSON.parse(text) as {
            error?: string;
            code?: string;
            retryAfterSec?: number;
          };
          if (parsed.error) message = parsed.error;
          if (parsed.code) code = parsed.code;
          if (typeof parsed.retryAfterSec === "number") {
            retryAfterSec = parsed.retryAfterSec;
          }
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        const next: OutputState = { kind: "error", message };
        if (code !== undefined) next.code = code;
        if (retryAfterSec !== undefined) next.retryAfterSec = retryAfterSec;
        setOutput(next);
        return;
      }
      const json = (await res.json()) as {
        jobId?: string;
        etaSeconds?: number;
      };
      const jobId = typeof json.jobId === "string" ? json.jobId : "";
      if (jobId.length === 0) {
        setOutput({
          kind: "error",
          message: "Veo accepted the request but didn't return a job id.",
        });
        return;
      }
      const etaSeconds =
        typeof json.etaSeconds === "number" ? json.etaSeconds : 60;
      setOutput({ kind: "running", startedAt, jobId, etaSeconds });

      // Fire-and-forget the poll; it manages its own state via setOutput.
      void pollUntilDone(jobId, startedAt, visitorKey);
    } catch (err) {
      log.error("start failed", { err });
      setOutput({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Generation failed to start.",
      });
    }
  }, [
    prompt,
    negativePrompt,
    aspectRatio,
    durationSeconds,
    generateAudio,
    enhancePrompt,
    pollUntilDone,
  ]);

  const onDownload = useCallback(
    (dataUrl: string, mimeType: string, i: number) => {
      const ext = mimeType === "video/webm" ? "webm" : "mp4";
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadFromDataUrl(dataUrl, `veo-${stamp}-${i + 1}.${ext}`);
    },
    [],
  );

  return {
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    showAdvanced,
    setShowAdvanced,
    aspectRatio,
    setAspectRatio,
    durationSeconds,
    setDurationSeconds,
    generateAudio,
    setGenerateAudio,
    enhancePrompt,
    setEnhancePrompt,
    output,
    elapsedSec,
    onGenerate,
    onDownload,
  };
}
