# `_parts.tsx` — purpose twin

## Role

Presentational sub-components for the `/demo/cast-banter` client.
NumberField for the telemetry sliders, TurnCard for one row of the
exchange, Transcript for the whole exchange section. Owns no
state — props in, JSX out — so the orchestrator's render tree
stays readable and the file stays under the 300-line cap.

## Public surface

- `NumberField({ label, value, min, max, step, onChange })` — one
  labelled slider with a numeric readout.
- `TurnCard({ turn, index })` — one chat row, colour-accented by
  the speaker's defaultMode.
- `Transcript({ turns, thinking, fallback, available, error })` —
  full transcript section with the live/fallback header tag, the
  yellow fallback banner, error display, empty-state copy, and
  the turn cards.

## Internal

- None. All exports are presentational.

## Depends on

- `lib/cast` — `bibles` (for the speaker name + bible lookup
  in the turn card) and `CastMemberId`.
- `lib/chrono-protocol` — `ChronoModeSlug` only.
- `./_helpers` — `MODE_HEX`, `modeForSpeaker`, and the
  `TranscriptTurn` type.

## Does not

- **Does not own state.** No `useState`, no `useEffect`, no
  zustand. The orchestrator passes everything in.
- **Does not call the capability.** Renders whatever the
  orchestrator hands it.
- **Does not gate on `available`.** The "live · gemini" vs
  "fallback · catchphrases" header tag is purely cosmetic and
  driven by the prop.

## Bordering files

- `cast-banter-demo-client.tsx` — the only consumer of these
  components.
- `_helpers.ts` — pure logic + constants the parts share.
- `page.tsx` — the server shell.
