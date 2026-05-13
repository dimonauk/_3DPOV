# `dialogue.ts` — purpose twin (capability `agent.dialogue`)

## Role

One LLM turn per call. Takes user text + a character bible + the
speaker's dialogue history, returns text + intent + chosen
ChronoMode. Writes the turn through three slices simultaneously
(`cast.history` for the record, `agent.lastIntent` for the
runtime, `aura.mode` when the speaker is Aura and the LLM picks
a new mode). The brick that turns "Aura speaks" into "Aura
thinks first, then speaks."

## Public surface

- `respond(options)` — one async turn.
- `isProviderAvailable(provider?)` — predicate. Caller checks
  this before invoking `respond()` to fail gracefully when the
  env var isn't set.
- `listProviders()` — enumerate provider IDs.
- Types: `AgentProvider`, `RespondOptions`, `RespondResult`.

## Internal

- `buildSystemPrompt(bible, contextSuffix?)` — assembles the
  Aura voice + draws + refusals + catchphrases + forbidden +
  output-format-JSON contract into one system prompt.
- `callGemini(systemPrompt, history, userText)` — Gemini-specific
  call. Reads `GOOGLE_AI_API_KEY` + optional `GOOGLE_AI_MODEL`
  via `lib/env.ts`.
- `parseResponse(raw)` — extracts JSON from the LLM response,
  with fenced-code-block tolerance. Falls back to raw text +
  null intent/mode if parsing fails.

## Depends on

- `@google/generative-ai` — npm dependency.
- `lib/env` — typed env access.
- `lib/state/agent` — turn-state + intents writes.
- `lib/state/cast` — history append.
- `lib/state/aura` — mode write (Aura speaker only).
- `lib/cast/aura` — `CharacterBible` type (passed in by caller).

## Does not

- **Does not own TTS.** Callers chain `respond()` with
  `audio.tts.speak(result.text)`. The dialogue capability returns
  text; the speaking is downstream.
- **Does not own visemes / lipsync.** Same pattern: callers chain
  with `audio.visemes.start()`.
- **Does not own memory.** v0.1 reads `cast.history` directly.
  When `agent.memory` lands, it'll layer vector retrieval on top
  — the dialogue capability will read from agent.memory's helpers
  rather than the raw slice.
- **Does not validate JSON schema strictly.** The LLM occasionally
  emits malformed JSON; the parser falls back to raw-text so the
  cast never goes mute. Strict schema validation lives in a
  future review pass.
- **Does not stream tokens.** v0.1 awaits the full response.
  Streaming is a v0.2 enhancement — same `respond()` surface,
  optional `onToken` callback.

## Plug surface

- **State plugs (write):** `agent.turn`, `agent.activeSpeaker`,
  `agent.lastIntent`, `cast.history`, `aura.mode` (Aura only).
- **State plugs (read):** `cast.history` for prompt context.
- **Type plugs:** `RespondOptions` in, `RespondResult` out.
- **Dependency plugs:** none — `agent.dialogue` is an
  entry-point. Composes with `audio.tts` and `audio.visemes` at
  the caller level.

## Bordering files

- `lib/cast/aura.ts` — the canonical bible for Aura.
- `lib/cast/<other>.ts` (future) — Penny, Baby, Marcel, etc.
- `lib/capabilities/agent/memory.ts` (future) — vector retrieval
  layer above raw history.
- `lib/capabilities/audio/tts.ts` — chained downstream.
- `lib/state/agent.ts` + `cast.ts` + `aura.ts` — slices written.
- `lib/env.ts` — API-key access.

## How Aura's character lands here

The character lives entirely in the bible (`lib/cast/aura.ts`).
This capability is the *transport*. The system prompt assembled
in `buildSystemPrompt` reproduces the bible's voice + posture +
draws + refusals + catchphrases + forbidden phrases into the LLM
context every turn. Swap a catchphrase in the bible, the next
turn reflects it. No code change required.

The JSON output contract (`text` + `intent` + `mode`) is what
lets her *decide* her own ChronoMode per turn. The wheel isn't
imposed by the UI; she picks. That's the genome of agency.
