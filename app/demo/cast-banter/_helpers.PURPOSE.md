# `_helpers.ts` — purpose twin

## Role

Private helper module for the `/demo/cast-banter` route. Holds the
pure logic the client needs (CAST_ORDER, MODE_HEX, mode lookup,
fallback synthesis) so the React file can stay under the 300-line
cap. Leading-underscore filename signals "scoped to this route" —
nothing outside `/demo/cast-banter` should import it.

## Public surface

- `CAST_ORDER` — display order of the speaker chips.
- `MODE_HEX` — the five ChronoMode hex colours.
- `modeForSpeaker(id)` — lookup of a cast member's default
  ChronoMode, validated against the enum.
- `buildFallback(context)` — synthesises a 1-3 turn canned
  exchange from the active speakers' `catchphrases`. Used when
  Gemini is unavailable or returns empty.
- Types `FallbackTurn` (carries `source: "fallback"`) and
  `TranscriptTurn` (union of `BanterTurn | FallbackTurn`) for the
  client's transcript array.

## Internal

- `pickCatchphrase(b, seed)` — deterministic index into a bible's
  catchphrases.
- `emotionFor(mode, telemetry)` — assigns a plausible emotion for
  fallback turns from health, speed, and the active ChronoMode.

## Depends on

- `lib/capabilities/agent/banter` — `BanterContext`, `BanterTurn`
  types only.
- `lib/cast` — `bibles`, `CastMemberId`, `CharacterBible`.
- `lib/chrono-protocol` — `ChronoModeSlug` only.

## Does not

- **Does not import React or JSX.** Headless TypeScript by design;
  the client owns rendering.
- **Does not call the capability.** The fallback path is pure;
  the real path lives in the server action in `page.tsx`.
- **Does not write to any slice.** Demo state is local to the
  client component.

## Bordering files

- `cast-banter-demo-client.tsx` — the only consumer.
- `page.tsx` — server shell that hosts the action + client.
