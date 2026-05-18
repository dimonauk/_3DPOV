"use client";

/**
 * components/aura/voice/use-voice.ts — Aura's ears + voice.
 *
 * - **Ears (STT)**: Whisper-tiny.en via @huggingface/transformers,
 *   running in a Web Worker. Records mic audio with MediaRecorder,
 *   decodes to Float32 mono at 16 kHz, hands to the worker, returns
 *   transcribed text.
 *
 * - **Voice (TTS)**: Kokoro 82M via kokoro-js, in a separate worker.
 *   Returns a Blob the host can play through an `<audio>` element.
 *
 * Both workers lazy-load on first use — no model weights fetched until
 * the visitor actually pushes the mic button or enables the speaker.
 *
 * # Default voice
 * `af_heart` — Kokoro's default warm-female voice. Aura's canonical
 * voice in DollyOS (Kokoro per the dollyos-audio skill).
 *
 * # Audio capture quirk
 * MediaRecorder produces compressed audio (webm/opus typically). We
 * decode through an AudioContext to get raw Float32, then resample to
 * 16 kHz mono (Whisper's expected input rate). The resample is a
 * simple linear-interpolation pass — fine for chat-quality voice;
 * upgrade to a proper SRC if quality drops on edge devices.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = {
  /** STT model load state. */
  sttReady: boolean;
  sttLoading: boolean;
  sttError: string | null;
  /** TTS model load state. */
  ttsReady: boolean;
  ttsLoading: boolean;
  ttsError: string | null;
  /** Microphone state. */
  recording: boolean;
  /** Transcription in flight (mic stopped, Whisper running). */
  transcribing: boolean;
  /** Currently-playing TTS audio. */
  speaking: boolean;
};

export type VoiceControls = {
  /** Toggle mic — first call starts recording, second stops and
   *  returns transcript (resolved when STT completes). */
  toggleMic: () => Promise<string | null>;
  /** Speak a string. Returns when playback ends or errors. */
  speak: (text: string) => Promise<void>;
  /** Stop any in-flight audio playback. */
  stopSpeaking: () => void;
};

const DEFAULT_VOICE = "af_heart";
const TARGET_SAMPLE_RATE = 16_000;

function resampleToMono16k(
  input: AudioBuffer,
): Float32Array {
  const sourceRate = input.sampleRate;
  const channel0 = input.getChannelData(0);
  // If multi-channel, average — most cases this is just channel 0
  const channels = input.numberOfChannels;
  let sourceMono: Float32Array;
  if (channels > 1) {
    sourceMono = new Float32Array(channel0.length);
    for (let i = 0; i < channel0.length; i++) {
      let sum = 0;
      for (let c = 0; c < channels; c++) sum += input.getChannelData(c)[i] ?? 0;
      sourceMono[i] = sum / channels;
    }
  } else {
    sourceMono = channel0;
  }
  if (sourceRate === TARGET_SAMPLE_RATE) return sourceMono;
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.round(sourceMono.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, sourceMono.length - 1);
    const frac = srcIndex - i0;
    output[i] = (sourceMono[i0] ?? 0) * (1 - frac) + (sourceMono[i1] ?? 0) * frac;
  }
  return output;
}

export function useVoice(): VoiceState & VoiceControls {
  const [state, setState] = useState<VoiceState>({
    sttReady: false,
    sttLoading: false,
    sttError: null,
    ttsReady: false,
    ttsLoading: false,
    ttsError: null,
    recording: false,
    transcribing: false,
    speaking: false,
  });

  const sttWorkerRef = useRef<Worker | null>(null);
  const ttsWorkerRef = useRef<Worker | null>(null);
  const sttListenerRef = useRef<((e: MessageEvent) => void) | null>(null);
  const ttsListenerRef = useRef<((e: MessageEvent) => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcribeResolverRef = useRef<
    ((value: string | null) => void) | null
  >(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Tracks the current Blob URL feeding the audio element so we can
  // revoke it before assigning a replacement (or on unmount). Without
  // this, every TTS reply leaks one URL into the document's internal
  // table and the page never gives that memory back.
  const audioUrlRef = useRef<string | null>(null);
  const speakResolverRef = useRef<(() => void) | null>(null);

  // ---------- STT worker lazy init ------------------------------------

  const ensureSttWorker = useCallback((): Worker => {
    if (sttWorkerRef.current) return sttWorkerRef.current;
    setState((s) => ({ ...s, sttLoading: true }));
    const worker = new Worker(
      new URL("./whisper-worker.ts", import.meta.url),
      { type: "module" },
    );
    const listener = (e: MessageEvent) => {
      const data = e.data as {
        status?: string;
        data?: { text?: string } | string;
      };
      if (data.status === "complete") {
        const text =
          typeof data.data === "object" && data.data && "text" in data.data
            ? (data.data as { text: string }).text
            : "";
        setState((s) => ({
          ...s,
          sttReady: true,
          sttLoading: false,
          transcribing: false,
        }));
        const resolver = transcribeResolverRef.current;
        if (resolver) {
          transcribeResolverRef.current = null;
          resolver(text);
        }
      } else if (data.status === "error") {
        const message =
          typeof data.data === "string" ? data.data : "STT failed";
        setState((s) => ({
          ...s,
          sttError: message,
          sttLoading: false,
          transcribing: false,
        }));
        const resolver = transcribeResolverRef.current;
        if (resolver) {
          transcribeResolverRef.current = null;
          resolver(null);
        }
      }
    };
    worker.addEventListener("message", listener);
    sttListenerRef.current = listener;
    sttWorkerRef.current = worker;
    return worker;
  }, []);

  // ---------- TTS worker lazy init ------------------------------------

  const ensureTtsWorker = useCallback((): Worker => {
    if (ttsWorkerRef.current) return ttsWorkerRef.current;
    setState((s) => ({ ...s, ttsLoading: true }));
    const worker = new Worker(
      new URL("./kokoro-worker.ts", import.meta.url),
      { type: "module" },
    );
    const listener = (e: MessageEvent) => {
      const data = e.data as { status?: string; audio?: Blob | null; error?: string };
      if (data.status === "ready") {
        setState((s) => ({ ...s, ttsReady: true, ttsLoading: false }));
      } else if (data.status === "complete") {
        if (data.audio) {
          // Revoke the previous Blob URL before assigning a new one.
          // The audio element doesn't release the prior src on its own.
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          const url = URL.createObjectURL(data.audio);
          audioUrlRef.current = url;
          if (!audioElRef.current) {
            audioElRef.current = new Audio();
            audioElRef.current.addEventListener("ended", () => {
              setState((s) => ({ ...s, speaking: false }));
              const resolver = speakResolverRef.current;
              if (resolver) {
                speakResolverRef.current = null;
                resolver();
              }
            });
            audioElRef.current.addEventListener("error", () => {
              setState((s) => ({ ...s, speaking: false }));
              const resolver = speakResolverRef.current;
              if (resolver) {
                speakResolverRef.current = null;
                resolver();
              }
            });
          }
          audioElRef.current.src = url;
          setState((s) => ({ ...s, speaking: true }));
          void audioElRef.current.play().catch(() => {
            // Autoplay may be blocked; user gesture required.
            setState((s) => ({ ...s, speaking: false }));
            const resolver = speakResolverRef.current;
            if (resolver) {
              speakResolverRef.current = null;
              resolver();
            }
          });
        } else {
          const resolver = speakResolverRef.current;
          if (resolver) {
            speakResolverRef.current = null;
            resolver();
          }
        }
      } else if (data.status === "error") {
        setState((s) => ({
          ...s,
          ttsError: data.error ?? "TTS failed",
          ttsLoading: false,
          speaking: false,
        }));
        const resolver = speakResolverRef.current;
        if (resolver) {
          speakResolverRef.current = null;
          resolver();
        }
      }
    };
    worker.addEventListener("message", listener);
    ttsListenerRef.current = listener;
    worker.postMessage({ type: "load" });
    ttsWorkerRef.current = worker;
    return worker;
  }, []);

  // ---------- Mic capture --------------------------------------------

  const startRecording = useCallback(async (): Promise<void> => {
    if (state.recording) return;
    ensureSttWorker(); // warm the worker while the mic starts
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState((s) => ({ ...s, recording: true, sttError: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, sttError: `mic: ${message}` }));
    }
  }, [state.recording, ensureSttWorker]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;
    return new Promise<string | null>((resolve) => {
      recorder.onstop = async () => {
        // Release the mic immediately.
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setState((s) => ({ ...s, recording: false, transcribing: true }));
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        recordedChunksRef.current = [];
        // AudioContext must be closed even when decodeAudioData throws —
        // otherwise the per-origin context budget leaks on every bad mic.
        let audioCtx: AudioContext | null = null;
        try {
          // Decode → resample → ship to worker.
          const arrayBuf = await blob.arrayBuffer();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          audioCtx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          const float32 = resampleToMono16k(decoded);
          transcribeResolverRef.current = resolve;
          ensureSttWorker().postMessage({ audio: float32 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setState((s) => ({
            ...s,
            transcribing: false,
            sttError: `decode: ${message}`,
          }));
          resolve(null);
        } finally {
          try {
            await audioCtx?.close();
          } catch {
            // Already closed, or browser refused — nothing we can do.
          }
        }
      };
      recorder.stop();
    });
  }, [ensureSttWorker]);

  const toggleMic = useCallback(async (): Promise<string | null> => {
    if (state.recording) return stopRecording();
    await startRecording();
    return null;
  }, [state.recording, startRecording, stopRecording]);

  // ---------- TTS ----------------------------------------------------

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;
      const worker = ensureTtsWorker();
      return new Promise<void>((resolve) => {
        speakResolverRef.current = resolve;
        worker.postMessage({
          type: "generate",
          text,
          voice: DEFAULT_VOICE,
          speed: 1,
        });
      });
    },
    [ensureTtsWorker],
  );

  const stopSpeaking = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, speaking: false }));
    const resolver = speakResolverRef.current;
    if (resolver) {
      speakResolverRef.current = null;
      resolver();
    }
  }, []);

  // ---------- Cleanup -------------------------------------------------

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      // Detach the message listeners before terminating the workers.
      // Without this, a worker that was re-created after a mic toggle
      // can fire stale listeners against an unmounted component.
      if (sttWorkerRef.current && sttListenerRef.current) {
        sttWorkerRef.current.removeEventListener(
          "message",
          sttListenerRef.current,
        );
      }
      if (ttsWorkerRef.current && ttsListenerRef.current) {
        ttsWorkerRef.current.removeEventListener(
          "message",
          ttsListenerRef.current,
        );
      }
      sttListenerRef.current = null;
      ttsListenerRef.current = null;
      sttWorkerRef.current?.terminate();
      ttsWorkerRef.current?.terminate();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = "";
      }
      // Final Blob URL release — every TTS reply allocated one.
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    toggleMic,
    speak,
    stopSpeaking,
  };
}
