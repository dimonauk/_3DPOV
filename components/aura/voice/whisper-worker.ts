/**
 * components/aura/voice/whisper-worker.ts — STT worker.
 *
 * Runs Whisper (Xenova/whisper-tiny.en) off-main-thread for speech-to-
 * text. Ported from amica's whisper.js; uses the same model. Quantized
 * by default (smaller, faster, slightly worse quality — acceptable for
 * a chat input field).
 */

import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/whisper-tiny.en";

let transcriber:
  | Awaited<ReturnType<typeof pipeline>>
  | null = null;

async function ensureLoaded(progressCb: (data: unknown) => void) {
  if (transcriber) return transcriber;
  transcriber = await pipeline(
    "automatic-speech-recognition",
    MODEL_ID,
    {
      // @ts-expect-error - the `quantized` option is recognised by the
      // pipeline but not in the public type signature for this version.
      quantized: true,
      progress_callback: progressCb,
    },
  );
  return transcriber;
}

async function transcribe(audio: Float32Array) {
  try {
    const t = await ensureLoaded((data) => self.postMessage(data));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (t as any)(audio, {
      top_k: 0,
      do_sample: false,
      chunk_length_s: 30,
      stride_length_s: 5,
      language: null,
      task: null,
      return_timestamps: false,
    });
    const text =
      typeof output === "object" && output !== null && "text" in output
        ? String((output as { text?: string }).text ?? "")
        : "";
    self.postMessage({
      status: "complete",
      task: "automatic-speech-recognition",
      data: { text },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({
      status: "error",
      task: "automatic-speech-recognition",
      data: message,
    });
  }
}

self.addEventListener("message", (e: MessageEvent) => {
  const { audio } = e.data as { audio: Float32Array };
  void transcribe(audio);
});

export {};
