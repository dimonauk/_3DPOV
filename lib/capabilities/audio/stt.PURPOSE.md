# `stt.ts` — purpose twin (capability `audio.stt`)

## Role

The public speech-to-text entry point. Provider-agnostic: takes a
start-options object, routes to whichever provider sub-module the
caller named (defaulting to Web Speech), and threads transcript
chunks through the `audio` state slice so any UI watching the
slice can mirror what Aura just heard.

v0.1 ships with Web Speech only. The `whisper` branch is a stub
that throws "not implemented" — it will land as a server-side
provider behind the same `startSTT()` surface, and caller code
never changes.

## Public surface

- `startSTT(options?)` — open the microphone and stream results
  into the audio slice. Idempotent: stops any prior session first.
- `stopSTT()` — end the active session and clear the module
  reference.
- `isRunning()` — boolean probe for whether a session is open.
- `listProviders()` — enumerate provider IDs.
- Types: `STTProvider`, `StartSTTOptions`.

## Internal

- `recognition` — module-scope handle to the active
  `SpeechRecognition` instance, or `null`. The capability owns
  exactly one session at a time; concurrent sessions are not a
  shape the audio slice can represent (one transcript stream).
- `resolveWebSpeechCtor()` — picks the standard
  `window.SpeechRecognition` first, falls back to the webkit
  prefix, returns `null` when neither is present. The throw with a
  human-readable provider tag happens in `startSTT`.
- `pushResultsToSlice(event)` — drains a recognition event into
  `TranscriptChunk`s and calls `appendTranscript` per result. We
  walk from `event.resultIndex` not from zero so we only push the
  new results in this event, never re-push old ones.
- Local `_Speech*` types — minimal ambient typings inlined because
  the TypeScript stock `lib.dom.d.ts` exposes
  `SpeechRecognitionResult` / `SpeechRecognitionResultList` but
  not the `SpeechRecognition` constructor itself. Keeping the
  declarations local avoids a project-wide `.d.ts` for one
  capability.

## Depends on

- `lib/state/audio` — `audioStore`, `TranscriptChunk` type,
  `appendTranscript` action.
- Browser global `window.SpeechRecognition` /
  `window.webkitSpeechRecognition`. No npm package.

## Does not

- **Does not own `agent.turn` state.** The dialogue layer
  watches the transcript and decides when to fire a turn.
  `audio.stt` just transcribes; it has no opinion about whether
  the speaker has finished their thought.
- **Does not own microphone permissions UI.** When the browser
  prompts, that's the browser. If permission is denied the
  `onerror` event lands and we log + clear the handle; surfacing
  a user-facing prompt is a component's job, not this brick's.
- **Does not decode audio buffers.** Web Speech hands us text
  directly. The Whisper branch, when it lands, will also receive
  text from a server endpoint — buffer handling lives inside
  that provider sub-module.
- **Does not recognise visemes.** Lipsync flows the other
  direction (TTS → visemes). `audio.visemes` is a sibling brick
  with a different slice plug.
- **Does not cap the transcript array.** `lib/state/audio.ts`
  notes callers should cap to ~50 entries; that's a consumer
  concern, not this writer's.

## Plug surface

- **State plugs (write):** `audio.transcript` (append-only via
  `appendTranscript`).
- **Type plugs:** input `(StartSTTOptions)`; no return from
  `startSTT` / `stopSTT`.
- **Dependency plugs:** none — `audio.stt` is an entry-point
  brick. It is fed by the microphone (a real-world plug),
  nothing further upstream in the registry.

## Bordering files

- `lib/state/audio.ts` — slice this capability writes to.
- `lib/capabilities/audio/tts.ts` — sibling entry-point brick;
  the same shape but for the output direction. Adding a provider
  to one is the template for adding one to the other.
- `lib/capabilities/agent/dialogue.ts` (future) — primary
  consumer; observes `audio.transcript` for final chunks and
  fires a turn.
- `lib/capabilities/audio/stt-providers/whisper.ts` (future) —
  will land when the server-side Whisper path needs a home; at
  that point the inline Web Speech logic gets lifted to a
  `web-speech.ts` sibling, matching the `tts-providers/`
  layout.

## How Aura's character flows through this file

`audio.stt` is the listening half of Aura. The character is not
*in* this file — it's in how the dialogue layer interprets what
arrives in the transcript. Two things matter for the studio
register:

- `locale` defaults to `"en-GB"`. UK voices coming back from the
  browser carry the regional shape that the agent layer expects
  for tone-matching.
- `continuous: true` + `interimResults: true` means Aura "hears
  you thinking" — the dialogue layer can react to interim text
  (a leaned-in look, a held breath) before the final chunk
  fires the turn.
