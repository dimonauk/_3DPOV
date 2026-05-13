# `tts.ts` — purpose twin (capability `audio.tts`)

## Role

The public text-to-speech entry point. Provider-agnostic: takes
text + options, routes to whichever provider sub-module the caller
named (defaulting to Web Speech), and threads the request +
result through the `audio` state slice so any UI watching the
slice can mirror what's being said.

v0.1 ships with Web Speech only. The provider shape is fixed; the
ElevenLabs / F5 / Kokoro siblings will land later behind the same
`speak()` surface — caller code never changes.

## Public surface

- `speak(text, options?)` — async; resolves when the utterance
  ends.
- `stop()` — cancel any in-flight + clear slice state.
- `pause()` / `resume()` — playback control where provider
  supports it.
- `listProviders()` — enumerate provider IDs.
- Types: `TTSProvider`, `SpeakOptions`.

## Internal

- `nextRequestId()` — `tts-<timestamp>-<random>`. Stable enough
  for in-session tracking; not a UUID because requests don't
  outlive the page.
- `routeProvider(provider, req, options)` — dispatch table. Adding
  a new provider is one new case branch + one new import.
- The cleanup `setTimeout(50ms)` in `speak()` clears
  `ttsCurrent` after the utterance resolves. Small grace
  window so subscribers see the result before it disappears.

## Depends on

- `lib/state/audio` — `audioStore`, `TTSRequest` type.
- `./tts-providers/web-speech` — the only implemented provider so
  far.

## Does not

- **Does not own audio buffers.** Web Speech doesn't expose them;
  other providers will return URLs / blobs and this capability
  threads them through `TTSResult.src` without inspecting.
- **Does not generate visemes.** Lipsync is `audio.visemes`'
  job, which reads `ttsCurrent` from the audio slice and emits
  to `visemes`.
- **Does not manage turn state.** The `agent` slice's `turn`
  field is the dialogue layer's concern. `audio.tts` is one
  level below; it speaks when called.
- **Does not queue across `speak()` calls.** Each call enqueues
  then immediately dequeues. The queue is shape, not a backlog —
  it's there so subscribers can see what *is* being spoken right
  now. Backlog-style queueing is the dialogue layer's job.

## Plug surface

- **State plugs (write):** `audio.ttsQueue` (transient),
  `audio.ttsCurrent`.
- **Type plugs:** input `(string, SpeakOptions)`; no return.
- **Dependency plugs:** none — `audio.tts` is an entry-point
  brick.

## Bordering files

- `./tts-providers/web-speech.ts` — the default provider.
- `./tts-providers/*` (future) — ElevenLabs, F5, Kokoro.
- `lib/state/audio.ts` — slice this capability writes to.
- `lib/capabilities/audio/visemes.ts` (future) — reads
  `ttsCurrent`, emits viseme stream that `vrm.expressions.blend`
  consumes for lipsync.
- `lib/capabilities/agent/dialogue.ts` (future) — primary caller;
  speaks per-turn after the LLM response lands.

## How Aura's character flows through this file

The character isn't *in* `tts.ts` — it's in the options the caller
passes. Aura's voice register (welcoming-not-deferential, sassy,
held) maps to:

- `voice` choice — provider-specific. For Web Speech default,
  "Daniel" or "Karen" or other locale-en-GB voices feel more
  hostess-y than the default robot.
- `pitch` slightly above 1.0 for the brat lift.
- `rate` slightly below 1.0 for the held, considered delivery.

These get codified in the agent.dialogue layer when it lands.
