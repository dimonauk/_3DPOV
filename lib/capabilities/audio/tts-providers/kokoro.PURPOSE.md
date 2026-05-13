# `kokoro.ts` — purpose twin

## Role

The local-first voice provider for `audio.tts`. Routes through
Kokoro (the open-weight TTS that runs on the Hangar workstation
behind the VRM AI bridge — see `docs/LOCAL_SERVICES.md`, port 8888
default). v0.1 ships as an env-shape-only stub: the base URL is
resolved, the call is intentionally not made.

## Public surface

- `speakKokoro(req, options?)` — promise-returning speak.
  Currently throws "not implemented" with the resolved base URL in
  the message.
- Type: `KokoroProviderOptions` — `{ voice?, speed?, pitch? }`.

## Internal

- `KOKORO_DEFAULT_BASE_URL = "http://localhost:8888"` —
  Aura-Alive HTTP per the local-services map. The wiring commit
  may switch this to `http://localhost:8000` (VRM AI bridge
  direct) once the bridge's HTTP route stabilises.
- Env read is `envOrUndefined` (not `envOrThrow`): unset is the
  expected case, and the default exists. Cloud providers use
  `envOrThrow` because absence is a hard fail; local providers
  use `envOrUndefined` because absence is the happy path.

## Why we ship a stub

- The bridge isn't reachable from a deployed Vercel build. We
  still want production builds to compile cleanly with the
  provider type-checked in the switch — the stub gives us that.
- Local-bench runs (Dimona at the workstation) eventually want
  this path live. Shipping the env + the type means the wiring
  commit doesn't touch the routing layer.

## Eventual call shape (documented, not implemented)

```
POST {KOKORO_BASE_URL}/api/tts/kokoro
Headers: Content-Type: application/json
Body: { text, voice, speed, pitch }
Response: audio/wav buffer
  (or { audio_url } JSON, depending on the bridge's mode)
```

Bridge source: `D:\The_Hangar\webgpu-particles-library\ws_ai_bridge.py`.

## Depends on

- `lib/env.ts` — `envOrUndefined` for the optional base URL.
- `lib/state/audio.ts` — `TTSRequest`, `TTSResult` types.

## Does not

- **Does not call the bridge.** Throws "not implemented". v0.1 is
  env-shape-only.
- **Does not detect bridge availability.** A future capability
  (`lib/capabilities/system/bridges.ts`) will probe and surface
  `isOnHangar()` for the routing layer to decide.
- **Does not handle CORS.** The bridge must be configured to
  accept the site's origin when this is wired; v0.1 throws before
  this matters.
- **Does not stream.** Kokoro is fast enough that full-buffer is
  fine for most utterances; the wiring commit can opt into a
  chunked SSE response if the bridge supports it.

## Bordering files

- `./web-speech.ts` — the working baseline provider; same surface.
- `../tts.ts` — the capability that routes by `provider: "kokoro"`.
- `./elevenlabs.ts`, `./f5.ts` — sibling stubs, same shape.
- `lib/env.ts` — typed env helpers.
- `docs/LOCAL_SERVICES.md` — bridge port map.
