# `visemes.ts` — purpose twin (capability `audio.visemes`)

## Role

Turn text + a duration estimate into a time-aligned viseme stream.
Writes the timeline + the *currently-active* viseme to
`audio.visemes` while a TTS clip plays. The brick that makes
Aura's mouth move in sync with what she's saying — without
requiring an audio buffer.

v0.1 estimates visemes from text characters alone. When provider
brick adds (ElevenLabs / F5) that return audio buffers, the
public `start()` surface stays the same — the buffer-analysis
path lands as an internal alternate generator.

## Public surface

- `start(text, durationMs)` — kick off the cursor. Writes the
  full timeline to the slice immediately, then updates the
  current-viseme slot each frame.
- `stop()` — cancel + reset to REST.
- `generateVisemes(text, durationMs)` — pure: returns the
  timeline. Useful for callers that want to render the viseme
  stream without driving the cursor.
- `estimateDurationMs(text)` — heuristic duration estimate
  (60ms / char) for callers that don't have provider-reported
  duration.

## Internal

- `visemeForChar(ch)` — character-class → viseme name lookup.
  Coarse mapping: vowels → AA/E/I/O/U, BMP → M, FV → F, other →
  REST.
- `cursor: CursorHandle | null` — module-scope state; only one
  stream runs at a time. v0.1 doesn't support multiple
  concurrent speakers.
- `tick()` — rAF loop. Reads `performance.now()`, finds the
  active viseme by walking the timeline, writes it.

## Depends on

- `lib/state/audio` — writes `visemes`.
- Browser globals: `performance.now`, `requestAnimationFrame`,
  `cancelAnimationFrame`. Client-only.

## Does not

- **Does not analyse audio buffers.** v0.1 is text-only. Audio
  analysis is a future internal alternate path under the same
  `start()` API.
- **Does not write to `vrm.expressions`.** That's
  `vrm.expressions.blend`'s job, which subscribes to
  `audio.visemes` and writes mouth-shape weights to whichever VRM
  is active.
- **Does not handle multiple speakers.** Single-cursor design.
  When the cast needs concurrent visemes (one for Aura, one for
  Penny), this file splits into `visemes/active.ts` per speaker
  or grows a `Record<speakerId, CursorHandle>` map.
- **Does not own pronunciation.** A future TTS provider with
  phoneme output (ElevenLabs has timestamps) will give us
  accurate visemes; this v0.1 is the placeholder synced to
  *timing*, not *phonemes*.

## Plug surface

- **State plugs (write):** `audio.visemes`.
- **State plugs (read):** none. Stream timing is driven by its
  own clock.
- **Type plugs:** input `(string, number)`; no return.
- **Dependency plugs:** none. `audio.visemes` is an
  entry-point — composes with `audio.tts` at the caller-level
  (caller invokes both in parallel), not via `dependsOn`.

## Bordering files

- `lib/state/audio.ts` — slice.
- `lib/capabilities/audio/tts.ts` — usually invoked in parallel
  by callers; the duration this capability needs comes from
  `estimateDurationMs(text)` until provider durations land.
- `lib/capabilities/vrm/expression.ts` — the consumer. Subscribes
  to `audio.visemes` and writes mouth-shape weights to
  `vrm.expressions`.
