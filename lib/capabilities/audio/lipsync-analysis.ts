/**
 * lib/capabilities/audio/lipsync-analysis.ts — Capability `audio.lipsync-analysis`:
 * AnalyserNode + formant + RMS → real-time viseme stream from an actual audio source.
 *
 * One-line role: read frequency-domain frames from an AnalyserNode bound to a real
 * audio source (HTMLAudioElement, MediaStream, or AudioNode), classify each frame's
 * dominant F1/F2 pair into a vowel viseme, and write {viseme, weight} to the audio
 * slice — the buffer-aware sibling of `audio.visemes`.
 *
 * Full purpose in lipsync-analysis.PURPOSE.md.
 *
 * Same slot as `audio.visemes`: both write `audio.visemes`. The caller decides which
 * to run. The text-based estimator stays the v0.1 baseline for Web Speech (no buffer);
 * this one wakes up the moment ElevenLabs / Kokoro / F5 wire in an actual buffer.
 *
 * Ported from `apps/aura-vrm/src/features/lipSync/lipSync.ts` (AnalyserNode + RMS),
 * with the formant-classification layer added per the research-canon vowel centres.
 */

import { audioStore, type Viseme } from "lib/state/audio";

/** Vowel formant reference centres (Hz) — research-canon. */
type FormantRef = { name: string; f1: number; f2: number };
const FORMANT_TABLE: readonly FormantRef[] = [
  { name: "AA", f1: 750, f2: 1150 },
  { name: "E", f1: 610, f2: 1900 },
  { name: "I", f1: 270, f2: 2300 },
  { name: "O", f1: 520, f2: 870 },
  { name: "U", f1: 330, f2: 870 },
];

/** Below this normalised RMS we consider the frame silent → REST. */
const REST_RMS_THRESHOLD = 0.04;

/** Frequency window (Hz) inside which we look for F1. */
const F1_RANGE = { lo: 200, hi: 1000 };
/** Frequency window (Hz) inside which we look for F2. */
const F2_RANGE = { lo: 800, hi: 2600 };

export type LipsyncOptions = {
  /** AnalyserNode fftSize. Default 2048. Must be a power of two. */
  fftSize?: number;
  /** AnalyserNode smoothingTimeConstant. Default 0.6. */
  smoothingTimeConstant?: number;
  /** Hint used only when we cannot read sampleRate from the context. */
  sampleRateHint?: number;
};

export type LipsyncTarget = HTMLAudioElement | MediaStream | AudioNode;

export type LipsyncSession = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  /** Source node we created; null if caller passed an AudioNode they own. */
  source: AudioNode | null;
  /** True when we constructed the AudioContext (and so must close it). */
  ownsContext: boolean;
  freqData: Uint8Array;
  timeData: Float32Array;
  raf: number;
  binHz: number;
};

/**
 * Start a real-time analysis loop. Builds an AudioContext + AnalyserNode,
 * wires the target into it, and writes a single-entry `audio.visemes`
 * array each frame: `[{ t, name, weight }]`. Loop runs until `stopAnalysis`
 * or the underlying source emits `ended` (HTMLAudioElement only).
 *
 * Idempotent at the level of one session — start returns a fresh handle each
 * call; callers managing multiple speakers track sessions themselves.
 */
export function startAnalysis(
  target: LipsyncTarget,
  options: LipsyncOptions = {},
): LipsyncSession {
  const fftSize = options.fftSize ?? 2048;
  const smoothing = options.smoothingTimeConstant ?? 0.6;

  const sourceCtx = target instanceof AudioNode ? target.context : null;
  const ctx =
    sourceCtx instanceof AudioContext
      ? sourceCtx
      : new AudioContext({ sampleRate: options.sampleRateHint });
  const ownsContext = sourceCtx === null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothing;

  let source: AudioNode | null = null;
  if (target instanceof HTMLAudioElement) {
    const node = ctx.createMediaElementSource(target);
    node.connect(analyser);
    node.connect(ctx.destination);
    source = node;
    target.addEventListener("ended", () => {
      // Mark session for cleanup; caller will see freqData zeroed and viseme REST.
      audioStore.getState().setVisemes([{ t: 0, name: "REST", weight: 0 }]);
    });
  } else if (target instanceof MediaStream) {
    const node = ctx.createMediaStreamSource(target);
    node.connect(analyser);
    source = node;
  } else {
    target.connect(analyser);
  }

  const freqData = new Uint8Array(analyser.frequencyBinCount);
  const timeData = new Float32Array(analyser.fftSize);
  const binHz = ctx.sampleRate / analyser.fftSize;

  const session: LipsyncSession = {
    ctx,
    analyser,
    source,
    ownsContext,
    freqData,
    timeData,
    raf: 0,
    binHz,
  };

  const tick = () => {
    analyser.getByteFrequencyData(session.freqData);
    analyser.getFloatTimeDomainData(session.timeData);
    const viseme = classifyFrame(session);
    audioStore.getState().setVisemes([viseme]);
    session.raf = window.requestAnimationFrame(tick);
  };

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      // Autoplay-blocked — analyser still runs; the loop just sees silence.
    });
  }
  session.raf = window.requestAnimationFrame(tick);
  return session;
}

/**
 * Stop the analysis loop. Disconnects nodes, closes the context if we
 * created it, and resets the audio slice to a single REST viseme.
 */
export function stopAnalysis(session: LipsyncSession): void {
  window.cancelAnimationFrame(session.raf);
  try {
    session.source?.disconnect();
    session.analyser.disconnect();
  } catch {
    // Disconnect can throw if already disconnected — safe to swallow.
  }
  if (session.ownsContext) {
    void session.ctx.close().catch(() => {});
  }
  audioStore.getState().setVisemes([{ t: 0, name: "REST", weight: 0 }]);
}

/**
 * Compute RMS over the time-domain buffer (range 0..1, with a sigmoid
 * curve borrowed from the Hangar source so quiet rooms map to 0).
 */
function computeRms(timeData: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < timeData.length; i++) {
    const v = Math.abs(timeData[i] ?? 0);
    if (v > peak) peak = v;
  }
  // Sigmoid lifted from Hangar lipSync.ts — keeps the response punchy.
  const shaped = 1 / (1 + Math.exp(-45 * peak + 5));
  return shaped < 0.1 ? 0 : shaped;
}

/**
 * Find the bin with peak magnitude inside [loHz, hiHz]. Returns the
 * centre frequency of that bin, or null if every bin is empty.
 */
function peakFreqInRange(
  freqData: Uint8Array,
  binHz: number,
  loHz: number,
  hiHz: number,
): number | null {
  const loBin = Math.max(1, Math.floor(loHz / binHz));
  const hiBin = Math.min(freqData.length - 1, Math.ceil(hiHz / binHz));
  let bestBin = -1;
  let bestMag = 0;
  for (let b = loBin; b <= hiBin; b++) {
    const m = freqData[b] ?? 0;
    if (m > bestMag) {
      bestMag = m;
      bestBin = b;
    }
  }
  if (bestBin === -1 || bestMag === 0) return null;
  return (bestBin + 0.5) * binHz;
}

/**
 * Euclidean nearest-neighbour over the formant table on (F1, F2).
 * Distances normalised by 1000 Hz so F1 and F2 weigh roughly the same.
 */
function nearestFormant(f1: number, f2: number): string {
  let best = "REST";
  let bestDist = Infinity;
  for (const ref of FORMANT_TABLE) {
    const d1 = (f1 - ref.f1) / 1000;
    const d2 = (f2 - ref.f2) / 1000;
    const dist = d1 * d1 + d2 * d2;
    if (dist < bestDist) {
      bestDist = dist;
      best = ref.name;
    }
  }
  return best;
}

/**
 * Classify one analyser frame. Returns the viseme to write this tick.
 * Weight = RMS-derived openness in 0..1. Below threshold → REST at weight 0.
 */
function classifyFrame(session: LipsyncSession): Viseme {
  const t = session.ctx.currentTime;
  const rms = computeRms(session.timeData);
  if (rms < REST_RMS_THRESHOLD) {
    return { t, name: "REST", weight: 0 };
  }
  const f1 = peakFreqInRange(session.freqData, session.binHz, F1_RANGE.lo, F1_RANGE.hi);
  const f2 = peakFreqInRange(session.freqData, session.binHz, F2_RANGE.lo, F2_RANGE.hi);
  if (f1 === null || f2 === null) {
    return { t, name: "REST", weight: rms };
  }
  const name = nearestFormant(f1, f2);
  return { t, name, weight: rms };
}
