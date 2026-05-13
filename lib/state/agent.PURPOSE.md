# `agent.ts` — purpose twin

## Role

The shared state-bus for the *live* conversation loop. While
`cast.ts` is the cast roster + history, this slice is *what's
happening right now* — who's speaking, what state the turn is in,
what intents are waiting to be acted on.

## Public surface

- `useAgentStore` / `agentStore`.
- Types: `TurnState`, `Intent`, `AgentState`, `AgentActions`.

## Internal

- `initial` — turn defaults to `idle`, no speaker.

## Depends on

- `zustand`.
- `./cast` for the `CastMemberId` type (type-only).

## Does not

- **Does not run the LLM.** That's `agent.dialogue`. The slice
  only tracks turn-state transitions.
- **Does not retain history.** History lives in `cast.history`.
  This slice is *current* state; what just happened scrolls into
  cast.
- **Does not enforce turn-state transitions.** No state-machine
  guard rails at the slice. Capabilities respect the canonical
  flow; misuse surfaces as inconsistent UI rather than throws.

## Bordering files

- `lib/state/cast.ts` — where turns scroll into history.
- `lib/state/audio.ts` — STT writes during `user-speaking`, TTS
  plays during `agent-speaking`. The agent slice owns the *phase*;
  audio owns the *stream*.
- `lib/capabilities/agent/dialogue.ts` — moves the turn through
  its states; sets `lastIntent` and `pendingIntents`.
- `lib/capabilities/audio/stt.ts` — reads `turn === "user-speaking"`
  to know whether to listen.
- `lib/capabilities/audio/tts.ts` — sets `turn` to
  `agent-speaking` on play, back to `idle` on completion.
