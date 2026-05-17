"use client";

/**
 * components/aura/aura-launcher/launcher-panel.tsx — The expanded
 * chat dialog itself: header (mode + speaker + clear + close
 * controls), scroller (history + streaming bubble + tool chips +
 * anonymous-engagement nudge), load-progress strip, error strip,
 * input form (mic + text + submit).
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1. Pure
 * presentation — the host orchestrator owns mode toggles + open
 * state + the chat hook.
 */

import { type RefObject } from "react";

import type { WebGpuChatSupport } from "lib/capabilities/agent/dialogue-webgpu";

import { ToolCallChip } from "./tool-call-chip";
import type { ToolCallRecord, Turn } from "./types";

type VoiceShape = {
  speaking: boolean;
  recording: boolean;
  transcribing: boolean;
  ttsError: string | null;
  sttError: string | null;
  stopSpeaking: () => void;
};

export function LauncherPanel({
  scrollerRef,
  history,
  historyLoaded,
  streaming,
  streamingTools,
  loadProgress,
  error,
  input,
  busy,
  agentMode,
  setAgentMode,
  speakerOn,
  setSpeakerOn,
  user,
  useWebGpu,
  support,
  voice,
  onSubmit,
  onInputChange,
  onMicClick,
  onClear,
  onClose,
  onCardClick,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>;
  history: Turn[];
  historyLoaded: boolean;
  streaming: string | null;
  streamingTools: ToolCallRecord[];
  loadProgress: { text: string; progress: number } | null;
  error: string | null;
  input: string;
  busy: boolean;
  agentMode: boolean;
  setAgentMode: (next: boolean | ((on: boolean) => boolean)) => void;
  speakerOn: boolean;
  setSpeakerOn: (next: boolean | ((on: boolean) => boolean)) => void;
  user: unknown;
  useWebGpu: boolean;
  support: WebGpuChatSupport | null;
  voice: VoiceShape;
  onSubmit: () => void;
  onInputChange: (value: string) => void;
  onMicClick: () => void;
  onClear: () => void;
  onClose: () => void;
  onCardClick: (slug: string) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aura chat"
      className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-warm-black-800 bg-warm-black-950/95 backdrop-blur-md md:bottom-5 md:right-5 md:h-[min(640px,80vh)] md:w-[400px] md:rounded-md md:border"
    >
      <header className="flex items-center justify-between border-b border-warm-black-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pink-300" />
          <span className="font-display text-base text-pink-100">Aura</span>
          <span className="text-[10px] uppercase tracking-wider text-chrome-500">
            {useWebGpu ? "local" : "hosted"}
            {user ? " · synced" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAgentMode((on) => !on)}
            aria-label={
              agentMode
                ? "Switch to plain chat (no tools)"
                : "Switch to smart mode (tools)"
            }
            title={
              agentMode
                ? "Smart mode: Aura can navigate, find cards, capture leads"
                : "Chat mode: plain text replies only"
            }
            className={`text-base leading-none transition ${
              agentMode
                ? "text-pink-200 hover:text-pink-100"
                : "text-chrome-500 hover:text-pink-200"
            }`}
          >
            {agentMode ? "⚡" : "·"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSpeakerOn((on) => {
                if (on && voice.speaking) voice.stopSpeaking();
                return !on;
              });
            }}
            aria-label={
              voice.ttsError
                ? `Aura voice unavailable — ${voice.ttsError}`
                : speakerOn
                  ? "Mute Aura"
                  : "Let Aura speak"
            }
            title={
              // Surface the voice worker error in the tooltip so a
              // visitor whose browser blocks the Kokoro worker sees
              // WHY the speaker button doesn't help instead of a
              // silently-broken toggle.
              voice.ttsError
                ? `Aura's voice can't load right now — ${voice.ttsError}`
                : speakerOn
                  ? "Aura speaks her replies (Kokoro TTS)"
                  : "Aura's replies are text-only"
            }
            className={`text-base leading-none transition ${
              voice.ttsError
                ? "text-pink-400/60"
                : speakerOn
                  ? "text-pink-200 hover:text-pink-100"
                  : "text-chrome-500 hover:text-pink-200"
            }`}
          >
            {voice.ttsError ? "♪!" : speakerOn ? "♪" : "♪̸"}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-chrome-400 hover:text-pink-200"
              aria-label="Clear conversation"
            >
              clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="text-chrome-300 hover:text-pink-100"
          >
            ✕
          </button>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {history.length === 0 && streaming === null && historyLoaded && (
          <div className="text-sm text-chrome-400">
            {support === null
              ? "Probing your device…"
              : support.recommended
                ? "Say hi. The first message fetches a model into your browser cache (~2 GB, one time, then she lives there)."
                : `Aura on this device runs through the studio's hosted backend.${
                    support.reason ? ` ${support.reason}.` : ""
                  }`}
          </div>
        )}
        {history.map((t, i) => (
          <div
            key={i}
            className={`mb-3 ${
              t.role === "user" ? "text-chrome-300" : "text-pink-100"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-chrome-500">
              {t.role === "user" ? "you" : "aura"}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{t.text}</div>
            {t.toolCalls && t.toolCalls.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {t.toolCalls.map((tc) => (
                  <ToolCallChip
                    key={tc.id}
                    call={tc}
                    onCardClick={onCardClick}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {streaming !== null && (
          <div className="text-pink-100">
            <div className="text-[10px] uppercase tracking-wider text-chrome-500">
              aura
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {streaming}
              <span className="animate-pulse">▊</span>
            </div>
            {streamingTools.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {streamingTools.map((tc) => (
                  <ToolCallChip
                    key={tc.id}
                    call={tc}
                    onCardClick={onCardClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription nudge: only when anon, only after some
            engagement. Phrased as Aura herself for tone. */}
        {!user && history.length >= 6 && history.length % 6 === 0 && (
          <div className="my-3 rounded border border-pink-200/20 bg-pink-200/[0.03] px-3 py-2 text-xs text-pink-200/80">
            If you sign in, I&rsquo;ll remember this conversation across your
            devices. Subscribers get a brighter version of me.
          </div>
        )}
      </div>

      {loadProgress && (
        <div className="border-t border-warm-black-800 px-4 py-2 text-[11px] text-chrome-400">
          {loadProgress.text}
          {loadProgress.progress > 0 && (
            <span className="ml-2 text-pink-200">
              {(loadProgress.progress * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}
      {error && (
        <div className="border-t border-rose-900 bg-rose-950/40 px-4 py-2 text-[11px] text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2 border-t border-warm-black-800 p-3"
      >
        <button
          type="button"
          onClick={onMicClick}
          disabled={busy || voice.transcribing || Boolean(voice.sttError)}
          aria-label={
            voice.sttError
              ? `Microphone unavailable — ${voice.sttError}`
              : voice.recording
                ? "Stop recording"
                : "Start recording"
          }
          title={
            voice.sttError
              ? `Mic can't load — ${voice.sttError}`
              : voice.recording
                ? "Recording — tap to stop and transcribe"
                : voice.transcribing
                  ? "Transcribing…"
                  : "Speak to Aura (Whisper STT)"
          }
          className={`rounded border px-3 py-2 text-sm transition disabled:opacity-50 ${
            voice.sttError
              ? "border-rose-400/60 text-rose-300/70"
              : voice.recording
                ? "border-rose-300 bg-rose-200/10 text-rose-100"
                : "border-warm-black-800 text-chrome-400 hover:border-pink-200/60 hover:text-pink-200"
          }`}
        >
          {voice.sttError
            ? "🎙!"
            : voice.recording
              ? "■"
              : voice.transcribing
                ? "…"
                : "🎙"}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            voice.recording
              ? "Recording…"
              : voice.transcribing
                ? "Transcribing…"
                : "Say something to Aura…"
          }
          disabled={busy || voice.recording || voice.transcribing}
          className="flex-1 rounded border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm focus:border-pink-200 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded border border-pink-200/60 px-3 py-2 text-sm text-pink-100 hover:bg-pink-200/10 disabled:opacity-50"
        >
          {busy ? "…" : "→"}
        </button>
      </form>
    </div>
  );
}
