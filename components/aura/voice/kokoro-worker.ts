/**
 * components/aura/voice/kokoro-worker.ts — TTS worker.
 *
 * Runs the Kokoro 82M ONNX model off-main-thread so generation doesn't
 * block the UI. Ported from local-chat-vrm's kokoroTtsWorker.ts; same
 * model id, same WebGPU-preferred / WASM-fallback device selection.
 */

import { KokoroTTS, TextSplitterStream } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

let tts: KokoroTTS | null = null;

async function detectWebGpu(): Promise<boolean> {
  try {
    const nav = globalThis.navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown> };
    };
    const adapter = await nav.gpu?.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

async function load(): Promise<void> {
  const device = (await detectWebGpu()) ? "webgpu" : "wasm";
  self.postMessage({ status: "device", device });
  try {
    tts = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: device === "wasm" ? "q8" : "fp32",
      device,
    });
    self.postMessage({ status: "ready", voices: tts.voices, device });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ status: "error", error: message });
  }
}

async function generate(text: string, voice: string, speed: number) {
  if (!tts) {
    self.postMessage({ status: "error", error: "tts not loaded" });
    return;
  }
  try {
    const streamer = new TextSplitterStream();
    streamer.push(text);
    streamer.close();
    // Cast: kokoro-js types `voice` as a narrow string-literal union;
    // we accept any string and let the runtime validate (the model
    // throws on unknown voice ids).
    const stream = tts.stream(streamer, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      voice: voice as any,
      speed,
    });
    const chunks: { sampling_rate: number; audio: Float32Array }[] = [];
    for await (const { audio } of stream) {
      chunks.push(audio);
    }
    if (chunks.length === 0) {
      self.postMessage({ status: "complete", audio: null });
      return;
    }
    const first = chunks[0]!;
    const samplingRate = first.sampling_rate;
    const length = chunks.reduce((sum, c) => sum + c.audio.length, 0);
    const waveform = new Float32Array(length);
    let offset = 0;
    for (const { audio } of chunks) {
      waveform.set(audio, offset);
      offset += audio.length;
    }
    // Merged RawAudio of the same constructor as the chunks; we
    // hand its Blob form back to the main thread.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (first as any).constructor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audio = new Ctor(waveform, samplingRate);
    const blob: Blob = await audio.toBlob();
    self.postMessage({ status: "complete", audio: blob });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ status: "error", error: message });
  }
}

self.addEventListener("message", (e: MessageEvent) => {
  const { type } = e.data as { type: string };
  switch (type) {
    case "load":
      void load();
      break;
    case "generate": {
      const { text, voice, speed } = e.data as {
        text: string;
        voice: string;
        speed: number;
      };
      void generate(text, voice, speed);
      break;
    }
  }
});

export {};
