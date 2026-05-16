"use client";

/**
 * app/atelier/veo/veo-client.tsx — Veo 3 chamber UI with polling.
 *
 * Veo is async: the start call returns a jobId, then we poll
 * `/api/ai/google/generate-video/<jobId>` every 5s until the response
 * is `done: true`. The progress UI is a wall-clock counter (no
 * percentage available from the API), capped at 4 minutes before we
 * tell the visitor to give up.
 *
 * On success, the video bytes come back inline as a base64 data URL.
 * We blob it, autoplay it in-page, and push a `kind: "video"` entry
 * into the atelier recent-outputs ring so a sibling chamber can pick
 * it up.
 *
 * The visitor's BYO API key (if any) goes in `X-Visitor-Google-Key`
 * on both the start request and every poll. Never logged.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  useGoogleAiKeyStore,
  activeVisitorKey,
} from "lib/state/google-ai-key";

const log = createLogger("atelier:veo");

type AspectRatio = "16:9" | "9:16";

type GeneratedVideo = { mimeType: string; dataUrl: string };

type OutputState =
  | { kind: "idle" }
  | {
      kind: "running";
      startedAt: number;
      jobId: string;
      etaSeconds: number;
    }
  | {
      kind: "ready";
      videos: GeneratedVideo[];
      durationMs: number;
      promptUsed: string;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes — Veo usually returns in 60-120s

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return new Blob([], { type: "application/octet-stream" });
  const mime = m[1] ?? "application/octet-stream";
  const b64 = m[2] ?? "";
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function VeoClient() {
  useActiveChamber("veo");

  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [enhancePrompt, setEnhancePrompt] = useState<boolean>(true);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  const mode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

  const promptFieldId = useId();
  const negativeFieldId = useId();

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
          const ext =
            v.mimeType === "video/webm" ? "webm" : "mp4";
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

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: quota mode badge + settings gear */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Quota:{" "}
          <span className="text-chrome-100">
            {mode === "byo" && hasKey ? "your AI Studio key" : "studio (2/hr)"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          ⚙ Settings
        </button>
      </section>

      {/* Prompt + controls */}
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5" htmlFor={promptFieldId}>
          <span className="chrome-label text-chrome-400">Prompt</span>
          <textarea
            id={promptFieldId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A pewter cuttlefish ring rotating on a turntable, museum lighting, macro lens. The light catches the metal as it turns."
            rows={4}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="self-start font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:text-pink-200"
        >
          {showAdvanced ? "Hide" : "Show"} advanced &middot; negative prompt &middot; audio &middot; prompt-enhance
        </button>

        {showAdvanced ? (
          <div className="flex flex-col gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
            <label className="flex flex-col gap-1.5" htmlFor={negativeFieldId}>
              <span className="chrome-label text-chrome-400">
                Negative prompt (what to avoid)
              </span>
              <textarea
                id={negativeFieldId}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="text, watermark, low quality, motion blur"
                rows={2}
                className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-chrome-200">
              <input
                type="checkbox"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="accent-pink-200"
              />
              Generate native audio (ambient + foley)
            </label>
            <label className="flex items-center gap-2 text-sm text-chrome-200">
              <input
                type="checkbox"
                checked={enhancePrompt}
                onChange={(e) => setEnhancePrompt(e.target.checked)}
                className="accent-pink-200"
              />
              Let Veo rewrite the prompt for better results
            </label>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Aspect ratio</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            >
              <option value="16:9">16:9 &middot; landscape</option>
              <option value="9:16">9:16 &middot; portrait</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Duration (seconds)
            </span>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            >
              <option value={4}>4 s</option>
              <option value={5}>5 s</option>
              <option value={6}>6 s</option>
              <option value={7}>7 s</option>
              <option value={8}>8 s</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={output.kind === "running"}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {output.kind === "running" ? "Cooking…" : "→ Generate"}
        </button>
      </section>

      {/* Running state */}
      {output.kind === "running" ? (
        <section className="rounded-sm border border-pink-200/40 bg-pink-900/10 px-4 py-4 text-sm text-chrome-200">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-200">
            Job in flight &middot; {elapsedSec}s elapsed &middot; ETA ~{output.etaSeconds}s
          </p>
          <p className="mt-2 text-chrome-300">
            Veo is rendering. Don&rsquo;t close the tab. Most jobs return
            in 60&ndash;120 seconds; complex prompts can take longer.
            The chamber polls every {POLL_INTERVAL_MS / 1000}s and will
            surface the clip the moment it&rsquo;s ready.
          </p>
          <p className="mt-2 break-all font-mono text-[0.6rem] text-chrome-500">
            job: {output.jobId}
          </p>
        </section>
      ) : null}

      {/* Errors */}
      {output.kind === "error" ? (
        <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
          <p>{output.message}</p>
          {output.code === "no_key" ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
            >
              Open settings
            </button>
          ) : null}
          {output.code === "studio_capped" ? (
            <p className="mt-2 text-xs text-pink-200/80">
              Cap resets in roughly{" "}
              {output.retryAfterSec
                ? `${Math.ceil(output.retryAfterSec / 60)} min`
                : "an hour"}
              . Or open settings and paste your own AI Studio key for
              unbounded use.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Results */}
      {output.kind === "ready" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="chrome-label text-chrome-400">
              Ready &middot; {output.videos.length} clip
              {output.videos.length === 1 ? "" : "s"} &middot;{" "}
              {(output.durationMs / 1000).toFixed(1)}s wall-clock
            </span>
          </div>
          <div
            className={`grid gap-4 ${
              output.videos.length === 1
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {output.videos.map((v, i) => (
              <figure
                key={`${v.mimeType}-${i}`}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 p-2"
              >
                <video
                  src={v.dataUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full rounded-sm bg-warm-black-950"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    {v.mimeType}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDownload(v.dataUrl, v.mimeType, i)}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:bg-pink-200/20"
                  >
                    Download
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-chrome-500">
            The clip is dropped into the recent-outputs drawer at the
            bottom-right of the page.
          </p>
        </section>
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
