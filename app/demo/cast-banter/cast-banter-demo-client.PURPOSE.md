# `cast-banter-demo-client.tsx` — purpose twin

## Role

The interactive scene-builder behind `/demo/cast-banter`. Mounts the
client island that gathers a `BanterContext` from viewer input
(speaker chips, ChronoMode wheel, last event, telemetry sliders),
posts it to the server action, and renders the returned exchange as
a colour-coded chat transcript. When `GOOGLE_AI_API_KEY` is absent
the same UI synthesises a canned exchange from the bibles'
`catchphrases` arrays, with an explicit fallback banner above the
transcript so the viewer can never confuse one for the other.

## Public surface

- Default export `CastBanterDemoClient({ available, generate })`.
  - `available: boolean` — passed from the server component; true
    when `GOOGLE_AI_API_KEY` is set. Drives the banner copy and
    decides whether to call the action at all.
  - `generate: (context: BanterContext) => Promise<BanterResult>`
    — the server action that wraps `respondBanter` from
    `lib/capabilities/agent/banter.ts`. Receiving the action as a
    prop keeps the client decoupled from the import graph of the
    capability.

## Internal

- `CAST_ORDER` — display order of the chips. Matches the
  registry's enumeration in `lib/cast/index.ts`.
- `MODE_HEX` — the five ChronoMode hex colours, used as
  speaker-chip and transcript accents.
- `modeForSpeaker(id)` — looks up the bible's `defaultMode` and
  validates it against the ChronoMode enum.
- `pickCatchphrase(bible, seed)` — deterministic index into a
  bible's catchphrases for the fallback path.
- `emotionFor(mode, telemetry)` — assigns a plausible emotion from
  health, speed, and the active ChronoMode for the fallback path.
- `buildFallback(context)` — synthesises 2-3 `FallbackTurn`s when
  Gemini is unavailable or returns an empty exchange.
- `NumberField` — slider with label + numeric readout.
- `Transcript` — renders the turn list, the fallback banner, the
  thinking spinner, and the empty-state copy.

## Depends on

- `lib/capabilities/agent/banter` — types only (`BanterContext`,
  `BanterResult`, `BanterTurn`). The function itself is reached
  via the server action prop.
- `lib/cast` — `bibles`, `CastMemberId`, `CharacterBible` for
  the chip list and the fallback synthesis.
- `lib/chrono-protocol` — `chronoModes` for the wheel and
  `ChronoModeSlug` for the typed mode state.

## Does not

- **Does not import `respondBanter` directly.** The capability
  uses `process.env` and `@google/generative-ai`, both of which
  belong on the server side. The client receives a server-action
  prop instead.
- **Does not register a capability.** This is a viewer for the
  existing `agent.banter` brick, nothing more.
- **Does not write to any zustand slice.** The demo's state is
  ephemeral and local; production callers (the run loop in
  `/chrono-protocol/run`, etc.) own the slice-write decisions per
  the capability's `Does not` list.
- **Does not chain TTS.** The brief stops at text; a production
  consumer would loop the returned `turns` through `audio.tts`
  with each speaker's voice id. Out of scope here.
- **Does not hide the fallback.** The fallback exchange is
  signalled with a yellow banner and an explicit "fallback ·
  catchphrases" tag. The viewer always knows which path
  produced the transcript.
- **Does not schedule ticks.** No `setInterval`, no polling. One
  button click → one banter call, same as `aura-talks`.

## Bordering files

- `app/demo/cast-banter/page.tsx` — the server shell. Owns the
  metadata, the prose, and the `generateBanterAction` server
  action that wraps `respondBanter`.
- `lib/capabilities/agent/banter.ts` — the brick being
  demonstrated. The demo's correctness contract is exactly its
  `BanterResult` shape.
- `lib/cast/index.ts` — supplies the bibles passed into the
  capability and the chips rendered in the UI.
- `lib/chrono-protocol.ts` — supplies the five-mode wheel.
- `app/demo/aura-talks/aura-talks-client.tsx` — sibling client
  for the single-voice lipsync chain. Same client-island shape,
  different brick.

## Signalling pattern (mock vs real)

The transcript header carries a small tag: `live · gemini` when
the API key is present, `fallback · catchphrases` when it isn't.
When the demo just produced a fallback exchange (either because
the key is absent or because Gemini returned empty turns), a
yellow banner above the turns says so in plain English and names
the exact env var. The same `FallbackTurn` type carries a
`source: "fallback"` discriminator, kept available for downstream
filtering even though the visible banner is the primary signal.
