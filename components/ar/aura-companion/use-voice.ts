"use client";

/**
 * components/ar/aura-companion/use-voice.ts — Web Speech API
 * synthesis hook for AuraCompanion. Caches voices, picks a sensible
 * default (preferring the card's `vrmVoice` then en-GB female), and
 * splits long utterances on sentence boundaries so the browser
 * doesn't truncate mid-paragraph.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1.
 *
 * Web Speech API quirks handled inside:
 *  - speechSynthesis.getVoices() returns [] on first call in Chrome
 *    until 'voiceschanged' fires; the hook listens.
 *  - Some platforms cut off long utterances; we split on sentence
 *    boundaries.
 *  - An outstanding-utterance counter ensures `setSpeaking(false)`
 *    only fires once the LAST queued utterance finishes — not the
 *    first one to error mid-queue.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type UseVoiceOptions = {
  /** Preferred voice name / lang / URI — falls back to en-GB female. */
  preferred?: string;
  /** When true, `speak` becomes a no-op. */
  muted: boolean;
};

export function useVoice({ preferred, muted }: UseVoiceOptions) {
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const pendingUtterancesRef = useRef(0);

  // Cache available voices once the browser has loaded them.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      voicesRef.current = v;
    };
    refresh();
    window.speechSynthesis?.addEventListener?.("voiceschanged", refresh);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", refresh);
    };
  }, []);

  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    const voices = voicesRef.current;
    if (preferred) {
      // Match by name or lang.
      const match = voices.find(
        (v) =>
          v.name === preferred ||
          v.lang === preferred ||
          v.voiceURI === preferred,
      );
      if (match) return match;
    }
    // Default: prefer en-GB female-sounding, fall back to en-*, then any.
    const enGB = voices.find(
      (v) =>
        v.lang === "en-GB" &&
        /female|woman|samantha|kate|fiona|emily|amy|aria/i.test(v.name),
    );
    if (enGB) return enGB;
    const anyEnGB = voices.find((v) => v.lang === "en-GB");
    if (anyEnGB) return anyEnGB;
    const anyEn = voices.find((v) => v.lang.startsWith("en"));
    return anyEn ?? voices[0];
  }, [preferred]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    pendingUtterancesRef.current = 0;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return;
      if (muted) return;
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel(); // stop anything already speaking
      pendingUtterancesRef.current = 0;
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length === 0) return;
      const voice = pickVoice();
      setSpeaking(true);
      pendingUtterancesRef.current = sentences.length;
      const finishOne = () => {
        pendingUtterancesRef.current = Math.max(
          0,
          pendingUtterancesRef.current - 1,
        );
        if (pendingUtterancesRef.current === 0) setSpeaking(false);
      };
      sentences.forEach((sentence) => {
        const u = new SpeechSynthesisUtterance(sentence);
        if (voice) u.voice = voice;
        u.rate = 1.0;
        u.pitch = 1.05;
        // Attach to EVERY utterance — if an early one errors and the
        // browser drops the rest, we still wind the counter down.
        u.onend = finishOne;
        u.onerror = finishOne;
        synth.speak(u);
      });
    },
    [muted, pickVoice],
  );

  // Stop speech when the consumer unmounts.
  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  return { speaking, speak, stopSpeaking };
}
