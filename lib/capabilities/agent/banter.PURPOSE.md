# `banter.ts` — purpose twin (capability `agent.banter`)

## Role

Multi-character LLM banter, driven by live telemetry. Takes a
subset of the cast that's currently on-mic + a telemetry snapshot
(speed, ChronoMode, combo, health, lifecycle phase) + an optional
last-event hint, and returns a 1-3 line exchange typed as
`{ speaker, emotion, text }[]`. Where `agent.dialogue` is the
single-turn brick that drives "Aura speaks back to the user",
`agent.banter` is the multi-voice brick that drives "the cast
chatters in response to what just happened in the world."

Ported from the Hangar's Neo-London Chrono-Protocol prototype —
the 3-construct (AURA / YOW / PURP) `SYSTEM_INSTRUCTION` engine —
and atomised so the active speaker set is whatever the caller
hands in. Any subset of the named cast can banter; the prompt is
assembled from the bibles each tick.

## Public surface

- `respondBanter(context, bibles)` — one async banter tick. Calls
  Gemini once with a multi-voice system prompt and a telemetry
  user payload, parses the JSON response against an allow-list of
  active speakers, returns a typed `BanterResult`.
- `isAvailable()` — predicate; true when `GOOGLE_AI_API_KEY` is
  set. Callers check this to decide whether to poll the banter
  loop at all.
- `DEFAULT_TICK_MS` — the 12-second Hangar canon, exported as a
  constant so the caller can use it as a default cadence.
- Types: `BanterEmotion`, `BanterTelemetry`, `BanterContext`,
  `BanterTurn`, `BanterResult`.

## Internal

- `describeSpeaker(bible)` — renders a single bible into the
  multi-block system-prompt section (voice + posture + draws +
  refusals + catchphrases + forbidden).
- `summariseTelemetry(t, lastEvent?)` — flattens the telemetry
  into one human-readable line for the user payload.
- `buildSystemPrompt(activeIds, bibles)` — composes the full
  system prompt: a header, one block per active speaker, the
  cross-cutting rules (1-3 lines, no out-of-voice borrowing, no
  forbidden phrases, react to telemetry), and the JSON-output
  contract.
- `callGemini(systemPrompt, userPayload)` — Gemini-specific call.
  Reads `GOOGLE_AI_API_KEY` + optional `GOOGLE_AI_MODEL` via
  `lib/env.ts`. Uses `responseMimeType: "application/json"` plus
  a `responseSchema` so the SDK constrains the output.
- `RESPONSE_SCHEMA` — the SchemaType-based schema. Matches the
  Hangar's enum-constrained shape, wrapped in
  `{ turns: [...] }` so the top-level object has a single
  collection field (the Hangar uses a bare array; we wrap so we
  can extend with metadata later without breaking parsers).
- `parseTurns(raw, activeIds)` — tolerant JSON parser: accepts
  either the wrapped object or a bare array; filters to
  speakers in the active set; truncates to 3 turns max; normalises
  emotion to the allow-list.
- `normaliseEmotion(raw)` — lower-cases + checks against the
  six-value emotion enum; falls back to "neutral" otherwise.

## Depends on

- `@google/generative-ai` — npm dependency.
- `lib/env` — typed env access.
- `lib/chrono-protocol` — `ChronoModeSlug` type only.
- `lib/cast/aura` — `CharacterBible` type only.
- `lib/state/cast` — `CastMemberId` type only.

## Does not

- **Does not write to any slice.** Headless by design. Callers
  decide whether to log the exchange into `cast.history`, write
  emotion deltas into the `aura` slice, or just speak the lines
  through `audio.tts` and forget them.
- **Does not own TTS.** Callers chain `respondBanter()` with one
  `audio.tts.speak(turn.text)` per turn (with the speaker's
  voice id), same way `agent.dialogue` is chained.
- **Does not own scheduling.** The 12-second tick is a *hint* in
  the returned `followUpEta`; the caller's loop is in charge of
  when to call again. If the run is paused or the user is
  speaking, the caller should skip the tick.
- **Does not gate on `process.env`.** Uses `isConfigured` via
  `lib/env.ts` and `console.warn`s when the key is missing, so
  `respondBanter` never throws on a misconfigured env.
- **Does not validate bibles** beyond presence-in-map. Callers
  must supply bibles whose ids match `activeSpeakers`.
- **Does not store the system prompt.** Re-assembled per tick so
  catchphrase / refusal edits in the bibles take effect on the
  next call.

## Plug surface

- **State plugs:** none (read or write). Headless.
- **Type plugs:** input `BanterContext` +
  `Record<CastMemberId, CharacterBible>`; output `BanterResult`.
- **Dependency plugs:** none mandatory at runtime. Callers
  typically pair this with `audio.tts` per turn and may persist
  to `cast.history` via `lib/state/cast`.

## Bordering files

- `lib/capabilities/agent/dialogue.ts` — single-turn sibling.
  Shares the Gemini call shape; differs on the multi-voice
  prompt + responseSchema + zero slice-writes contract.
- `lib/cast/<character>.ts` — every bible this capability can be
  fed. Aura, Penny, Marcel, Betsy, Trixie are present today;
  Yow / Purp / Baby will land as their bibles do.
- `lib/state/cast.ts` — supplies the `CastMemberId` type alias.
- `lib/chrono-protocol.ts` — supplies `ChronoModeSlug`.
- `app/chrono-protocol/run/` — the consumer route that will mount
  this capability into a 12-second tick during a run.

## How the Hangar canon lands here

The Hangar's `geminiService.ts` hardcodes AURA / YOW / PURP into
the system prompt and constrains `speaker` to a three-value enum
on the responseSchema. That's expressive enough for one
prototype but it can't host a fourth voice without a code edit.

Atomised here, the same engine becomes generic over the cast:

1. The caller decides who's on-mic (`activeSpeakers`).
2. The capability assembles their bibles into the system prompt
   the same way `agent.dialogue` does — voice + posture + draws +
   refusals + catchphrases + forbidden — and tells Gemini to
   stay in each voice.
3. The responseSchema constrains `speaker` to a string and the
   parser enforces "must be one of `activeSpeakers`", so the LLM
   cannot invent a fourth construct.

The 12-second cadence ships as `DEFAULT_TICK_MS` and is echoed
back as `followUpEta`. The caller scheduling — `setInterval`,
rAF gating, React effect with `setTimeout`, whatever — stays at
the caller. The capability does one tick and reports.
