"use client";

/**
 * lib/capabilities/agent/dialogue-webgpu.ts — Capability
 * `agent.dialogue-webgpu`: one LLM turn per call, running entirely on
 * the visitor's GPU via @mlc-ai/web-llm.
 *
 * One-line role: opt-in client-side alternative to `agent.dialogue`'s
 * Gemini backend. Same conceptual shape (character bible + history →
 * text + intent + mode), but the model weights live in the MLC public
 * registry (or our Vercel Blob once we host them), the visitor
 * downloads them once on first use, and inference runs on their
 * WebGPU device. Zero server-side per-call cost.
 *
 * # Posture
 * Foundation phase: scaffold + type surface + concrete browser engine.
 * Surfaces should call this only after `probeWebGpuChatSupport()`
 * returns `recommended: true`, falling back to `agent.dialogue`
 * (Gemini) otherwise. The architecture keeps RunPod / Ollama-bench as
 * a future third backend behind the same surface.
 *
 * # Why client-only
 * Web-LLM allocates GPU buffers and runs WebAssembly + WebGPU code at
 * construction time. There is no server-side analogue. The capability
 * cannot be imported into a Server Component or API route — only
 * Client Components.
 *
 * # Trade-off (visible to operator on the page)
 * First call downloads ~1.5-2 GB of MLC weights. Cached in IndexedDB.
 * Subsequent visits reuse the cache. Frame this for the visitor so
 * the wait is a feature, not a bug.
 */

import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

import type { CharacterBible } from "lib/cast/aura";

// MLC model identifiers from the public registry. Llama-3.2-3B is the
// smallest serious option; Phi-3-mini is the fastest. Both fit
// comfortably under 2 GB of first-load and run on 4 GB-VRAM hardware.
export const DEFAULT_WEBGPU_MODEL = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

export type WebGpuModelId =
  | "Llama-3.2-3B-Instruct-q4f16_1-MLC"
  | "Llama-3.2-1B-Instruct-q4f16_1-MLC"
  | "Phi-3-mini-4k-instruct-q4f16_1-MLC"
  | "Qwen2.5-3B-Instruct-q4f16_1-MLC";

export type WebGpuChatSupport = {
  webgpu: boolean;
  /** Storage available to cache the model weights. Browsers vary; we
   *  ask for an estimate from the Storage API. */
  storageQuotaBytes: number | null;
  /** Whether the studio recommends this backend on the current device.
   *  False on iOS Safari <18, Firefox without WebGPU, missing-quota
   *  contexts, etc. */
  recommended: boolean;
  reason?: string;
};

export type WebGpuDialogueOptions = {
  /** The character bible to ground the turn. */
  bible: CharacterBible;
  /** Conversation history so far. */
  history: { role: "user" | "model"; text: string }[];
  /** User's message. */
  userText: string;
  /** Model to use. Default: Llama-3.2-3B-Instruct. */
  model?: WebGpuModelId;
  /** Streaming callback. Called once per token chunk with the
   *  accumulated text so far. */
  onStream?: (chunk: string, full: string) => void;
  /** Loading callback while the model downloads / initialises on
   *  first use. */
  onProgress?: (progress: { text: string; progress: number }) => void;
};

export type WebGpuDialogueResult = {
  text: string;
  intent: string | null;
  mode: string | null;
};

/** Probe the visitor's device. Pure / cheap; safe to call on page
 *  load before deciding which backend to offer. */
export async function probeWebGpuChatSupport(): Promise<WebGpuChatSupport> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return {
      webgpu: false,
      storageQuotaBytes: null,
      recommended: false,
      reason:
        "WebGPU not available — needs Chrome / Edge / Safari 18+ / recent Firefox",
    };
  }
  try {
    const adapter = await (
      navigator as Navigator & {
        gpu?: { requestAdapter: () => Promise<unknown> };
      }
    ).gpu?.requestAdapter();
    if (!adapter) {
      return {
        webgpu: false,
        storageQuotaBytes: null,
        recommended: false,
        reason:
          "WebGPU adapter unavailable — likely no compatible GPU driver",
      };
    }
  } catch {
    return {
      webgpu: false,
      storageQuotaBytes: null,
      recommended: false,
      reason: "WebGPU probe threw — browser does not honour the API",
    };
  }

  let storageQuotaBytes: number | null = null;
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const est = await navigator.storage.estimate();
      storageQuotaBytes = typeof est.quota === "number" ? est.quota : null;
    } catch {
      // Storage estimate is best-effort; absence isn't a blocker.
    }
  }
  if (storageQuotaBytes !== null && storageQuotaBytes < 3 * 1024 ** 3) {
    return {
      webgpu: true,
      storageQuotaBytes,
      recommended: false,
      reason: `Storage quota ${Math.round(storageQuotaBytes / 1024 ** 3)} GB too small to cache the model — needs ~3 GB`,
    };
  }
  return { webgpu: true, storageQuotaBytes, recommended: true };
}

const ENGINE_CACHE = new Map<WebGpuModelId, Promise<MLCEngine>>();

async function getOrCreateEngine(
  model: WebGpuModelId,
  onProgress?: WebGpuDialogueOptions["onProgress"],
): Promise<MLCEngine> {
  const existing = ENGINE_CACHE.get(model);
  if (existing) return existing;
  const promise = CreateMLCEngine(model, {
    initProgressCallback: onProgress
      ? (report) =>
          onProgress({ text: report.text, progress: report.progress })
      : undefined,
  });
  ENGINE_CACHE.set(model, promise);
  return promise;
}

/**
 * Release a cached MLC engine and its WebGPU + worker resources.
 * Pass `model` to dispose a specific engine; omit to dispose every
 * cached engine. Idempotent — calling with an unknown model is a
 * no-op. The IndexedDB-cached model weights stay (so a subsequent
 * `respondWebGpu()` call doesn't re-download).
 *
 * Callers (notably the dedicated `/aura/web-llm` page) should call
 * this on component unmount so the WebGPU device + worker threads
 * don't survive the navigation away. The site-wide AuraLauncher
 * deliberately does NOT dispose on close — the launcher reopens
 * many times per session and keeping the engine warm is desirable.
 */
export async function disposeWebGpuEngine(
  model?: WebGpuModelId,
): Promise<void> {
  if (model) {
    const cached = ENGINE_CACHE.get(model);
    if (!cached) return;
    ENGINE_CACHE.delete(model);
    try {
      const engine = await cached;
      await engine.unload();
    } catch {
      // Best-effort — never throw during teardown.
    }
    return;
  }
  const all = Array.from(ENGINE_CACHE.entries());
  ENGINE_CACHE.clear();
  await Promise.allSettled(
    all.map(async ([, cached]) => {
      try {
        const engine = await cached;
        await engine.unload();
      } catch {
        // Best-effort.
      }
    }),
  );
}

function buildSystemPrompt(bible: CharacterBible): string {
  const draws = bible.draws.map((d) => `- ${d}`).join("\n");
  const refusals = bible.refusals.map((r) => `- ${r}`).join("\n");
  const catchphrases = bible.catchphrases.map((p) => `- "${p}"`).join("\n");
  return `You are ${bible.name}. ${bible.role}

VOICE: ${bible.voice}
POSTURE: ${bible.posture}

You lean into:
${draws}

You refuse:
${refusals}

You sometimes say:
${catchphrases}

Reply in 1-3 short sentences. Stay in character. No JSON, no
markdown formatting — just speak.`;
}

function bibleDefaultMode(bible: CharacterBible): string | null {
  return typeof bible.defaultMode === "string" ? bible.defaultMode : null;
}

/**
 * One dialogue turn against the visitor's browser-side LLM. Throws if
 * WebGPU is unavailable or the engine fails to initialise.
 */
export async function respondWebGpu(
  opts: WebGpuDialogueOptions,
): Promise<WebGpuDialogueResult> {
  const model = opts.model ?? DEFAULT_WEBGPU_MODEL;
  const engine = await getOrCreateEngine(model, opts.onProgress);

  const messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[] = [
    { role: "system", content: buildSystemPrompt(opts.bible) },
    ...opts.history.map((h) => ({
      role:
        h.role === "model" ? ("assistant" as const) : ("user" as const),
      content: h.text,
    })),
    { role: "user", content: opts.userText },
  ];

  if (opts.onStream) {
    const stream = await engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.75,
    });
    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        full += delta;
        opts.onStream(delta, full);
      }
    }
    return { text: full, intent: null, mode: bibleDefaultMode(opts.bible) };
  }

  const completion = await engine.chat.completions.create({
    messages,
    temperature: 0.75,
  });
  const text = completion.choices[0]?.message?.content ?? "";
  return { text, intent: null, mode: bibleDefaultMode(opts.bible) };
}
