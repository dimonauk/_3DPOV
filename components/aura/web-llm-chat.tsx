"use client";

/**
 * components/aura/web-llm-chat.tsx — `<WebLLMChat>`.
 *
 * Browser-side chat with Aura. Probes WebGPU support on mount, lazy-
 * loads + caches the MLC weights in IndexedDB on first use, streams
 * tokens into the conversation transcript. Zero server-side cost
 * per turn after the model is in cache.
 *
 * Implements the `agent.dialogue-webgpu` capability surface.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { aura } from "lib/cast/aura";
import {
  DEFAULT_WEBGPU_MODEL,
  disposeWebGpuEngine,
  probeWebGpuChatSupport,
  respondWebGpu,
  type WebGpuChatSupport,
  type WebGpuModelId,
} from "lib/capabilities/agent/dialogue-webgpu";

type Turn = { role: "user" | "model"; text: string };

export type WebLLMChatProps = {
  /** MLC model id. Default: Llama-3.2-3B-Instruct. */
  model?: WebGpuModelId;
};

export default function WebLLMChat({
  model = DEFAULT_WEBGPU_MODEL,
}: WebLLMChatProps) {
  const [support, setSupport] = useState<WebGpuChatSupport | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{
    text: string;
    progress: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeWebGpuChatSupport().then((s) => {
      if (!cancelled) setSupport(s);
    });
    return () => {
      cancelled = true;
      // Dispose THIS page's engine on unmount so WebGPU device +
      // worker threads don't survive the navigation away. The
      // IndexedDB model weights stay cached so a re-visit only
      // pays the engine-init cost (seconds), not the download
      // cost (1.5-2 GB). The site-wide AuraLauncher deliberately
      // does NOT call this on close — its engine stays warm for
      // the next open.
      void disposeWebGpuEngine(model);
    };
  }, [model]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [history, streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const nextHistory: Turn[] = [...history, { role: "user", text }];
    setHistory(nextHistory);
    setBusy(true);
    setStreaming("");
    try {
      let full = "";
      await respondWebGpu({
        bible: aura,
        history,
        userText: text,
        model,
        onProgress: (p) => setLoadProgress(p),
        onStream: (_chunk, accumulated) => {
          full = accumulated;
          setStreaming(accumulated);
        },
      });
      setHistory([...nextHistory, { role: "model", text: full }]);
      setStreaming(null);
      setLoadProgress(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStreaming(null);
    } finally {
      setBusy(false);
    }
  }, [input, busy, history, model]);

  if (support === null) {
    return (
      <div className="text-sm text-chrome-400">Probing WebGPU support…</div>
    );
  }

  if (!support.recommended) {
    return (
      <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-4 text-sm">
        <div className="chrome-label">WebGPU unavailable</div>
        <p className="mt-2 text-chrome-300">
          {support.reason ?? "This device can't host Aura locally."}
        </p>
        <p className="mt-2 text-xs text-chrome-500">
          The hosted backend (Gemini) is the fallback for visitors in
          this state; not wired into this surface yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scrollerRef}
        className="h-80 overflow-y-auto rounded-md border border-warm-black-800 bg-warm-black-950 p-4"
      >
        {history.length === 0 && streaming === null && (
          <div className="text-sm text-chrome-500">
            Say something to Aura. First message will download ~2 GB of
            model weights into your browser (one-time, cached in
            IndexedDB).
          </div>
        )}
        {history.map((t, i) => (
          <div
            key={i}
            className={`mb-3 ${t.role === "user" ? "text-chrome-300" : "text-pink-100"}`}
          >
            <div className="chrome-label">
              {t.role === "user" ? "You" : "Aura"}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{t.text}</div>
          </div>
        ))}
        {streaming !== null && (
          <div className="text-pink-100">
            <div className="chrome-label">Aura</div>
            <div className="mt-1 whitespace-pre-wrap">
              {streaming}
              <span className="animate-pulse">▊</span>
            </div>
          </div>
        )}
      </div>

      {loadProgress && (
        <div className="rounded border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-xs text-chrome-400">
          {loadProgress.text}
          {loadProgress.progress > 0 && (
            <span className="ml-2 text-pink-200">
              {(loadProgress.progress * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded border border-rose-900 bg-rose-950 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something to Aura..."
          disabled={busy}
          className="flex-1 rounded border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm focus:border-pink-200 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded border border-pink-200/60 px-4 py-2 text-sm text-pink-100 hover:bg-pink-200/10 disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
