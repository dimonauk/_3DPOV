# `lipsync-analysis.ts` — purpose twin (capability `audio.lipsync-analysis`)

## Role

The real-audio sibling of `audio.visemes`. Given a live audio source
(an HTMLAudioElement, a MediaStream, or any AudioNode), build an
AnalyserNode pipeline and convert each frame into a viseme — by
extracting RMS amplitude and the peak F1/F2 formant bins, then
classifying that pair against a research-canon vowel table.

Writes one current viseme per frame to `audio.visemes` (same slot as
the text-based estimator — they do not run simultaneously).

This file wakes up the moment ElevenLabs / Kokoro / F5 wire in an
actual audio buffer. Until then, `audio.visemes` (text-based) carries
Web Speech, since the Web Speech API never exposes a buffer.

## Public surface

- `startAnalysis(target, options?) → LipsyncSession` — accepts an
  HTMLAudioElement, a MediaStream, or an AudioNode. Builds context
  (or reuses the source's if it's already an AudioNode), wires the
  AnalyserNode, kicks the rAF loop.
- `stopAnalysis(session)` — cancels the loop, disconnects nodes,
  closes the context if we created it, and resets the audio slice
  to a single REST viseme.
- `LipsyncOptions = { fftSize?, smoothingTimeConstant?, sampleRateHint? }`.
- `LipsyncSession` — opaque handle. Holds the AudioContext,
  AnalyserNode, source node, frequency + time buffers, rAF id,
  and the bin-Hz size.

## Internal

- `FORMANT_TABLE` — canonical AA / E / I / O / U centres (F1, F2)
  in Hz. Source: standard phonetics-research reference values.
- `F1_RANGE`, `F2_RANGE` — bands the peak-finder searches inside,
  so spurious low-frequency hum or sibilant noise can't masquerade
  as a vowel.
- `REST_RMS_THRESHOLD` — below this normalised amplitude, every
  frame becomes REST at weight 0.
- `computeRms()` — peak amplitude over the time-domain buffer,
  shaped by the same sigmoid the Hangar source uses.
- `peakFreqInRange()` — argmax over the byte-frequency bins inside
  one band, returns the centre frequency.
- `nearestFormant()` — Euclidean nearest-neighbour on normalised
  (F1, F2). Coarse but reliable for five vowels.
- `classifyFrame()` — combine the above, return one `Viseme`.

## Depends on

- `lib/state/audio` — writes `visemes`.
- Browser globals: Web Audio API (`AudioContext`, `AnalyserNode`,
  `MediaStreamAudioSourceNode`, `MediaElementAudioSourceNode`),
  `requestAnimationFrame`, `cancelAnimationFrame`. Client-only.

## Does not

- **Does not co-exist with `audio.visemes` in the same slot at the
  same time.** Both write `audio.visemes`. The caller picks one per
  TTS turn: text-based when the provider is Web Speech (no buffer),
  analyser-based the moment a provider emits a real buffer. Picking
  both is a bug; the registry surfaces the conflict.
- **Does not phonemise**. The classifier sees only five vowels.
  Plosives (B, P, M), fricatives (F, V), and consonant clusters
  collapse to whichever vowel is loudest in the same frame. Good
  enough for mouth-shape interpolation; not phoneme-accurate.
- **Does not handle multiple speakers**. Each session is one source
  → one shared `audio.visemes` slot. When the cast needs concurrent
  lipsyncs, this file grows a `Record<speakerId, LipsyncSession>`
  map and the slice splits per-speaker.
- **Does not own playback**. The caller supplies whatever source it
  wants played — a `<audio>` element, an MSE stream, a worklet
  graph. We tap in; we never drive.
- **Does not install packages**. Web Audio is browser-native.

## Plug surface

- **State plugs (write):** `audio.visemes`.
- **State plugs (read):** none. Classification is driven by the
  AnalyserNode's own clock.
- **Type plugs:** input `(HTMLAudioElement | MediaStream | AudioNode,
  options?)` → `LipsyncSession`; `stopAnalysis(session) → void`.
- **Dependency plugs:** `audio.tts` upstream (a provider has to
  produce the buffer first); `vrm.expressions.blend` downstream
  (the consumer that turns visemes into mouth-shape weights).

## Bordering files

- `lib/state/audio.ts` — slice we write.
- `lib/capabilities/audio/visemes.ts` — the text-based sibling.
  Same slot, mutually exclusive at runtime.
- `lib/capabilities/audio/tts.ts` — the upstream that will hand us
  an audio buffer once ElevenLabs / Kokoro / F5 land.
- `lib/capabilities/vrm/expression.ts` — the downstream consumer
  subscribed to `audio.visemes`.

## Provenance

Ported from the Hangar's Aura VRM backend:
`apps/aura-vrm/src/features/lipSync/lipSync.ts` (the AnalyserNode +
RMS analyser). The formant-classification layer is added here per
the research-canon vowel-formant table, since the source file only
emitted volume — not viseme names. Atomised per
`docs/MIGRATION_PRINCIPLES.md` and `docs/HANGAR_RECONCILIATION.md` §C3.
