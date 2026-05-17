# spectrum.PURPOSE.md

## Role

Real-time microphone FFT → low/mid/high/volume scalar bands. The
audio-reactive substrate for shader uniforms (`u_audio_low/mid/high/
volume`) and any visualiser that wants to breathe with the room.

## Public surface

- `startSpectrum(options?)` — start meyda analyzer + return handle.
- `SpectrumHandle` — `stop()`, `getBands()`, `isRunning()`.
- `SpectrumBands` — `{ low, mid, high, volume }`.
- `StartSpectrumOptions` — `bufferSize`, `onBands` callback.

## Internal

- `SILENT` — zeroed bands returned after stop or before first tick.

## Depends on

- `meyda` (^5.6) — AnalyserNode wrapper + amplitudeSpectrum extractor.
- `navigator.mediaDevices.getUserMedia` — mic permission.
- `AudioContext` — browser-only Web Audio.

## Does not

- **Does not write to a zustand slice.** Surfaces opting into the
  audio bus do so explicitly via `onBands` or by polling `getBands()`.
  Keeps the capability composable across chambers that want different
  treatments of the same signal.
- **Does not own UI.** The toggle button + permission flow live in
  the consuming chamber.
- **Does not auto-stop on visibility change.** Caller decides whether
  the analyzer pauses when the tab hides.

## Bordering files

- `lib/capabilities/audio/lipsync-analysis.ts` — analyzer sibling that
  formant-detects for visemes. Both can run from a single mic stream
  if the consumer wires the AnalyserNode split.
- `app/atelier/shader-station/` (planned) — the primary consumer.
- `app/atelier/light-weaver/` — would benefit from the same bands
  driving its shader uniforms.
