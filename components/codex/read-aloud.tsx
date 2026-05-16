"use client";

/**
 * components/codex/read-aloud.tsx — Aura reads a codex entry aloud.
 *
 * A small inline button beneath the entry header. Pipes the entry's
 * summary (and title) through Aura's in-browser Kokoro TTS — same model
 * already loaded by the floating Aura launcher, so the second listener
 * on a session pays no model-fetch cost. Self-contained: hides the
 * button when SSR-only, lazy-loads the worker on first click.
 */

import { useState } from "react";

import { useVoice } from "components/aura/voice/use-voice";

export default function CodexReadAloud({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const { speak, stopSpeaking, speaking, ttsLoading, ttsError } = useVoice();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    setPending(true);
    try {
      await speak(`${title}. ${summary}`);
    } finally {
      setPending(false);
    }
  };

  const label = speaking
    ? "■ Stop"
    : pending || ttsLoading
      ? "… loading voice"
      : "▶ Hear Aura read this";

  return (
    <div className="mt-6 flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || ttsLoading}
        className="self-start rounded-sm border border-pink-200/30 px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-pink-200/90 transition hover:border-pink-200/60 hover:text-pink-100 disabled:opacity-50"
      >
        {label}
      </button>
      {ttsError ? (
        <p className="chrome-label text-chrome-500">
          voice unavailable — {ttsError}
        </p>
      ) : null}
    </div>
  );
}
