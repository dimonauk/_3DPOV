# `audio.ts` — purpose twin

## Role

The shared state-bus for everything ear-and-mouth: speech-to-text
input, text-to-speech output, viseme stream for lipsync. Whatever
the studio hears or says passes through this slice.

## Public surface

- `useAudioStore` — React hook.
- `audioStore` — headless alias.
- Types: `TranscriptChunk`, `TTSRequest`, `TTSResult`, `Viseme`,
  `AudioState`, `AudioActions`.

## Internal

- `initial: AudioState` constant.

## Depends on

- `zustand`.
- No other slice.

## Does not

- **Does not contain provider logic.** ElevenLabs / F5 / Kokoro
  /Web-Speech provider details live in `audio.tts` capability and
  its sub-modules. The slice only knows the request shape.
- **Does not decode audio.** Buffer playback / WebAudio is the
  audio.tts capability's job; this slice only holds metadata and
  URLs.
- **Does not cap transcript history.** Callers cap by calling
  `clearTranscript()` or pruning. Slice stays simple.
- **Does not enforce queue order.** Enqueue is FIFO; capabilities
  that need priority queue semantics layer on top.

## Bordering files

- `lib/capabilities/audio/stt.ts` — appends to `transcript`.
- `lib/capabilities/audio/tts.ts` — enqueues + dequeues `ttsQueue`,
  sets `ttsCurrent`.
- `lib/capabilities/audio/visemes.ts` — sets `visemes` from current
  TTS audio.
- `lib/capabilities/vrm/expression.ts` — reads `visemes` for
  lipsync mouth-shape mapping. This is the first canonical
  cross-capability composition.
- `lib/state/agent.ts` — agent dialogue capability enqueues TTS
  after a turn completes.
