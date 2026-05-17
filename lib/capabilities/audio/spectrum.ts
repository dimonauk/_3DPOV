/**
 * lib/capabilities/audio/spectrum.ts — Capability `audio.spectrum`:
 * real-time microphone FFT → low/mid/high/volume scalar bands.
 *
 * One-line role: the audio-reactive substrate for the shader-station
 * chamber's u_audio_low/mid/high/volume uniforms (and any visualiser
 * that wants to react to live mic input).
 *
 * # Why this exists
 *
 * The Shadrerapp `useAudio` hook bound meyda's AnalyserNode directly
 * to a React component. We need the same band-splitting math reachable
 * from any chamber, so the meyda wiring becomes a headless capability
 * that owns the analyzer lifecycle, writes to the `audio` zustand
 * slice, and exposes `start()` / `stop()` / `getBands()`.
 *
 * # Why one capability, three numbers
 *
 * The full spectrum is ~256 floats per frame; chambers don't need them
 * — what they want is three bands + an envelope. Splitting at 10% / 40%
 * of the spectrum matches DollyOS's `useAudio` convention so authored
 * shaders ported across keep their uniform contracts.
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/ShaderEditor/hooks/
 * useAudio.ts (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 */

export type SpectrumBands = {
  /** Low band — first 10% of the amplitude spectrum, averaged + scaled. */
  low: number;
  /** Mid band — 10..40% of the spectrum, averaged + scaled. */
  mid: number;
  /** High band — 40..100% of the spectrum, averaged + scaled. */
  high: number;
  /** RMS envelope — overall loudness, scaled to roughly 0..1. */
  volume: number;
};

export type SpectrumHandle = {
  /** Stop the analyzer + release the microphone tracks. Idempotent. */
  stop: () => void;
  /** Latest bands; updates ~30Hz while running. */
  getBands: () => SpectrumBands;
  /** Whether the analyzer is currently running. */
  isRunning: () => boolean;
};

export type StartSpectrumOptions = {
  /** Meyda buffer size; smaller = lower latency + noisier. Default 512. */
  bufferSize?: 256 | 512 | 1024 | 2048;
  /** Called every analyzer tick with fresh bands. */
  onBands?: (bands: SpectrumBands) => void;
};

const SILENT: SpectrumBands = { low: 0, mid: 0, high: 0, volume: 0 };

/**
 * Start a microphone FFT loop and return a handle for stop / poll.
 * Throws if mic permission is denied or meyda fails to spawn.
 *
 * Runs in the browser only — meyda needs AudioContext +
 * navigator.mediaDevices.getUserMedia. Calling from a Node context
 * throws synchronously.
 */
export async function startSpectrum(
  options: StartSpectrumOptions = {},
): Promise<SpectrumHandle> {
  if (typeof window === "undefined" || !navigator?.mediaDevices) {
    throw new Error("audio.spectrum: requires a browser context");
  }
  const bufferSize = options.bufferSize ?? 512;
  const { default: Meyda } = await import("meyda");

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);

  let bands: SpectrumBands = { ...SILENT };
  let running = true;

  const analyzer = Meyda.createMeydaAnalyzer({
    audioContext: ctx,
    source,
    bufferSize,
    featureExtractors: ["rms", "amplitudeSpectrum"],
    callback: (features: { rms?: number; amplitudeSpectrum?: Float32Array }) => {
      const spectrum = features.amplitudeSpectrum;
      if (!spectrum) return;
      const lowCount = Math.floor(spectrum.length * 0.1);
      const midCount = Math.floor(spectrum.length * 0.4);
      let low = 0;
      let mid = 0;
      let high = 0;
      for (let i = 0; i < lowCount; i++) low += spectrum[i]!;
      for (let i = lowCount; i < midCount; i++) mid += spectrum[i]!;
      for (let i = midCount; i < spectrum.length; i++) high += spectrum[i]!;
      const next: SpectrumBands = {
        low: (low / Math.max(1, lowCount)) * 10,
        mid: (mid / Math.max(1, midCount - lowCount)) * 50,
        high: (high / Math.max(1, spectrum.length - midCount)) * 100,
        volume: (features.rms ?? 0) * 10,
      };
      bands = next;
      options.onBands?.(next);
    },
  });

  analyzer.start();

  return {
    stop: () => {
      if (!running) return;
      running = false;
      try {
        analyzer.stop();
      } catch {
        /* analyzer already stopped */
      }
      for (const track of stream.getTracks()) track.stop();
      void ctx.close();
      bands = { ...SILENT };
    },
    getBands: () => bands,
    isRunning: () => running,
  };
}
