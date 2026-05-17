"use client";

/**
 * components/aura/aura-launcher/use-aura-chat.ts — Chat state machine
 * for the AuraLauncher. Owns history + input + streaming + tool calls
 * + busy + error + loadProgress; exposes `send` which dispatches to
 * one of three backends:
 *
 *  - **Agent (default ON):** /api/aura/agent, streaming with tools.
 *  - **WebGPU:** @mlc-ai/web-llm running in the visitor's browser
 *    when probeWebGpuChatSupport recommends it AND agent mode is off.
 *  - **Gemini fallback:** /api/aura/chat plain text.
 *
 * History persistence is tiered: anonymous → localStorage,
 * logged-in → /api/aura/history. We optimistic-write the user turn
 * locally before the model returns, then sync server-side after the
 * reply lands so a refresh mid-stream still shows the user message.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { useVoice } from "components/aura/voice/use-voice";
import { aura } from "lib/cast/aura";
import {
  DEFAULT_WEBGPU_MODEL,
  type WebGpuChatSupport,
  respondWebGpu,
} from "lib/capabilities/agent/dialogue-webgpu";

import { callAuraAgent, callServerSideChat } from "./chat-api";
import {
  clearServerHistory,
  loadLocalHistory,
  loadServerHistory,
  saveLocalHistory,
  saveServerTurns,
} from "./history-store";
import { pathContext } from "./path-gating";
import { type ToolCallRecord, type Turn } from "./types";

export type UseAuraChatOptions = {
  pathname: string | null;
  /** Did probeWebGpuChatSupport recommend running locally? */
  support: WebGpuChatSupport | null;
  /** Speak Aura's replies through the voice worker. */
  speakerOn: boolean;
  /** Agent mode: tool-enabled streaming endpoint vs plain text. */
  agentMode: boolean;
  /** Set true after mount so we don't fire before hydration. */
  mounted: boolean;
};

export function useAuraChat({
  pathname,
  support,
  speakerOn,
  agentMode,
  mounted,
}: UseAuraChatOptions) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const voice = useVoice();

  const [history, setHistory] = useState<Turn[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [streamingTools, setStreamingTools] = useState<ToolCallRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{
    text: string;
    progress: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load history once auth state is known — Firestore for logged-in
  // visitors, localStorage otherwise.
  useEffect(() => {
    if (!mounted || authLoading) return;
    let cancelled = false;
    (async () => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const fromServer = await loadServerHistory(idToken);
          if (!cancelled) {
            // Merge any anonymous localStorage history that pre-dates
            // sign-in (one-time-only — clear local after merge so
            // sign-in/sign-out toggling doesn't duplicate).
            const local = loadLocalHistory();
            const merged =
              local.length > 0 ? [...fromServer, ...local] : fromServer;
            setHistory(merged);
            setHistoryLoaded(true);
            if (local.length > 0) {
              saveLocalHistory([]);
              void saveServerTurns(idToken, local);
            }
          }
        } catch {
          if (!cancelled) {
            setHistory(loadLocalHistory());
            setHistoryLoaded(true);
          }
        }
      } else {
        setHistory(loadLocalHistory());
        setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, authLoading, user]);

  const useWebGpu = support?.recommended === true;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const userTurn: Turn = { role: "user", text };
    const next = [...history, userTurn];
    setHistory(next);
    setBusy(true);
    setStreaming("");

    // Optimistic local persist; server persist after we have the reply.
    if (!user) saveLocalHistory(next);

    const ctx = pathContext(pathname);
    const idToken = user ? await user.getIdToken().catch(() => null) : null;

    try {
      let full = "";
      const turnToolCalls: ToolCallRecord[] = [];

      if (agentMode) {
        // Agent path: streaming with tool use.
        setStreamingTools([]);
        for await (const evt of callAuraAgent(
          history,
          text,
          pathname ?? "/",
          idToken,
        )) {
          if (evt.type === "text-delta") {
            full += evt.text;
            setStreaming(full);
          } else if (evt.type === "tool-call") {
            const rec: ToolCallRecord = {
              id: evt.toolCallId,
              name: evt.toolName,
              args: evt.args,
              status: "pending",
            };
            turnToolCalls.push(rec);
            setStreamingTools([...turnToolCalls]);
          } else if (evt.type === "tool-result") {
            const idx = turnToolCalls.findIndex(
              (r) => r.id === evt.toolCallId,
            );
            if (idx >= 0) {
              const rec = turnToolCalls[idx]!;
              const out =
                evt.result && typeof evt.result === "object"
                  ? (evt.result as { summary?: string })
                  : undefined;
              rec.status = "complete";
              if (out?.summary) rec.summary = out.summary;
              if (evt.action) rec.action = evt.action;
              // Pull surfaced cards/card off the action for inline rendering.
              if (evt.action?.kind === "showCards") rec.cards = evt.action.cards;
              if (evt.action?.kind === "showCard") rec.card = evt.action.card;
              setStreamingTools([...turnToolCalls]);

              // Execute the client-side effect of the action.
              if (evt.action?.kind === "navigate" && evt.action.path) {
                // Defer so the visitor sees the tool chip flip to "done"
                // before the page changes.
                setTimeout(
                  () =>
                    router.push(
                      evt.action!.kind === "navigate" ? evt.action!.path : "/",
                    ),
                  600,
                );
              }
            }
          } else if (evt.type === "error") {
            throw new Error(evt.message);
          }
        }
      } else if (useWebGpu) {
        await respondWebGpu({
          bible: aura,
          history,
          userText: text,
          model: DEFAULT_WEBGPU_MODEL,
          onProgress: (p) => setLoadProgress(p),
          onStream: (_chunk, acc) => {
            full = acc;
            setStreaming(acc);
          },
        });
      } else {
        full = await callServerSideChat(history, text, ctx, idToken);
        setStreaming(full);
      }
      const modelTurn: Turn = {
        role: "model",
        text: full,
        ...(turnToolCalls.length > 0 ? { toolCalls: turnToolCalls } : {}),
      };
      const final = [...next, modelTurn];
      setHistory(final);
      setStreaming(null);
      setStreamingTools([]);
      setLoadProgress(null);

      // Speak Aura's reply if the speaker toggle is on. Don't await —
      // playback can take seconds and we don't want to block the input.
      if (speakerOn && full) {
        void voice.speak(full);
      }

      if (user && idToken) {
        // WebGPU + agent paths: server hasn't already persisted the turn.
        // Gemini chat path: /api/aura/chat persists itself.
        if (useWebGpu || agentMode) {
          void saveServerTurns(idToken, [userTurn, modelTurn]);
        }
      } else {
        saveLocalHistory(final);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStreaming(null);
    } finally {
      setBusy(false);
    }
  }, [
    input,
    busy,
    history,
    useWebGpu,
    pathname,
    user,
    speakerOn,
    voice,
    agentMode,
    router,
  ]);

  // Mic: toggle recording, drop transcription into the input field
  // when it returns.
  const onMicClick = useCallback(async () => {
    const transcript = await voice.toggleMic();
    if (transcript !== null && transcript.trim()) {
      setInput((cur) => (cur ? `${cur} ${transcript}` : transcript));
    }
  }, [voice]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    setError(null);
    saveLocalHistory([]);
    if (user) {
      const idToken = await user.getIdToken().catch(() => null);
      if (idToken) void clearServerHistory(idToken);
    }
  }, [user]);

  return {
    voice,
    user,
    history,
    historyLoaded,
    input,
    setInput,
    streaming,
    streamingTools,
    busy,
    loadProgress,
    error,
    useWebGpu,
    send,
    onMicClick,
    clearHistory,
    router,
  };
}
