/**
 * lib/capabilities/audio/tts-providers/web-speech.ts — Web Speech API provider for audio.tts.
 *
 * One-line role: speak text via the browser's built-in SpeechSynthesis. Zero-config baseline provider.
 * Full purpose in web-speech.PURPOSE.md.
 */

import type { TTSRequest, TTSResult } from "lib/state/audio";

export type WebSpeechProviderOptions = {
  /** Pitch in [0..2], default 1. */
  pitch?: number;
  /** Rate in [0.1..10], default 1. */
  rate?: number;
  /** Volume in [0..1], default 1. */
  volume?: number;
  /** Locale hint for voice selection — "en-GB" prefers UK voices. */
  locale?: string;
};

/**
 * Resolve a SpeechSynthesisVoice by name or locale hint. Falls back to
 * the default voice if no match.
 */
function pickVoice(name: string, locale?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const byName = voices.find((v) => v.name === name);
  if (byName) return byName;
  if (locale) {
    const byLocale = voices.find((v) => v.lang.startsWith(locale));
    if (byLocale) return byLocale;
  }
  return voices[0] ?? null;
}

/**
 * Speak a TTSRequest via Web Speech. Returns a TTSResult once the
 * utterance starts; resolves with `duration` known only on `end`.
 *
 * For Web Speech we can't pre-compute the audio buffer — the browser
 * owns the synthesis. We return `src: ""` because there's no URL, and
 * the actual playback happens inside this function. The caller still
 * gets the result so it can be threaded through the slice.
 */
export async function speakWebSpeech(
  req: TTSRequest,
  options: WebSpeechProviderOptions = {},
): Promise<TTSResult> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("web-speech: SpeechSynthesis is not available");
  }

  return new Promise<TTSResult>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(req.text);
    const voice = pickVoice(req.voice, options.locale);
    if (voice) utterance.voice = voice;
    utterance.pitch = options.pitch ?? 1;
    utterance.rate = options.rate ?? 1;
    utterance.volume = options.volume ?? 1;

    let started = false;

    utterance.onstart = () => {
      started = true;
    };
    utterance.onend = () => {
      resolve({ id: req.id, src: "", duration: null });
    };
    utterance.onerror = (event) => {
      if (!started) reject(new Error(`web-speech: ${event.error}`));
      else resolve({ id: req.id, src: "", duration: null });
    };

    window.speechSynthesis.speak(utterance);
  });
}

/** Cancel any in-flight or queued Web Speech utterances. */
export function cancelWebSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/** Pause / resume Web Speech playback. */
export function pauseWebSpeech(): void {
  window.speechSynthesis?.pause();
}
export function resumeWebSpeech(): void {
  window.speechSynthesis?.resume();
}
