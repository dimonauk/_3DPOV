# `elevenlabs.ts` — purpose twin

## Role

The studio-quality cloud-voice provider for `audio.tts`. v0.1 ships
as a stub: env wiring is real, the network call is deliberately
deferred. The slot exists in the provider switch so callers can
already address the provider by name; the error surface is clear
about why nothing speaks yet.

## Public surface

- `speakElevenLabs(req, options?)` — promise-returning speak.
  Currently throws "not implemented" once env is satisfied.
- Type: `ElevenLabsProviderOptions` — `{ voiceId?, modelId?,
  stability?, similarityBoost? }`.

## Internal

- Env validation runs before the throw. The order is intentional:
  surface "no key" errors first, then "no voice ID" errors, then
  the "not implemented" stub. The wiring commit later swaps the
  final `throw` for the actual SDK call without touching the
  validation flow above.

## Why we ship a stub

- The env keys (`ELEVENLABS_API_KEY`, `ELEVENLABS_DEFAULT_VOICE_ID`)
  are already documented in `.env.example` and typed in
  `lib/env.ts`. Surfacing the provider switch case now means the
  install-the-SDK PR is a one-file diff.
- Calling out to ElevenLabs costs credits. We don't burn credits
  from a CI test. The stub lets us exercise the routing path
  end-to-end without making the network call.

## Eventual call shape (documented, not imported)

```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
Headers:
  xi-api-key: <ELEVENLABS_API_KEY>
  Accept: audio/mpeg
  Content-Type: application/json
Body:
  { text, model_id, voice_settings: { stability, similarity_boost } }
Response: audio/mpeg buffer
```

Wrap the response in a Blob, take `URL.createObjectURL(blob)` for
`TTSResult.src`, and probe an `<audio>` element's `loadedmetadata`
to populate `duration`. SDK package: `elevenlabs` (not yet installed).

## Depends on

- `lib/env.ts` — `envOrThrow`, `isConfigured` for the API key and
  default voice ID.
- `lib/state/audio.ts` — `TTSRequest`, `TTSResult` types.

## Does not

- **Does not install the `elevenlabs` npm package.** Documented in
  the in-file comment; install lands with the wiring commit.
- **Does not call the ElevenLabs API.** Throws "not implemented"
  after env validation passes. v0.1 is env-shape-only.
- **Does not cache audio buffers.** When wired, caching lives at
  a higher layer (the dialogue capability) — the provider is
  stateless.
- **Does not handle streaming.** v0.1 throws before this matters;
  the wiring commit can choose `text-to-speech` (full buffer) or
  `text-to-speech/stream` (chunked) depending on UX needs.

## Bordering files

- `./web-speech.ts` — the working baseline provider; same surface.
- `../tts.ts` — the capability that routes by `provider: "elevenlabs"`.
- `./f5.ts`, `./kokoro.ts` — sibling stubs, same shape.
- `lib/env.ts` — typed env helpers.
