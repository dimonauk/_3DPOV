# `cast.ts` — purpose twin

## Role

The shared state-bus for the studio's named cast — Aura's 14
agents (Penny, Baby, Marcel, Betsy, Trixie, Millie, Tim, Scribe,
Excavation Bot, and the five pending). Tracks who exists, who's on
stage, their dialogue history, and a pointer to each character's
vector-store memory.

## Public surface

- `useCastStore` / `castStore`.
- Types: `CastMember`, `CastMemberId`, `CastMemberStatus`,
  `DialogueTurn`, `CastState`, `CastActions`.

## Internal

- `initial` empty state.

## Depends on

- `zustand`.
- No other slice.

## Does not

- **Does not hold character bibles.** Bibles live as typed files
  under `lib/cast/<name>.ts` (future). The slice only holds a
  string pointer (`bibleRef`).
- **Does not embed memory.** Vector-store storage is the
  `agent.memory` capability's job; the slice holds an opaque
  reference (`memoryRef`) the capability resolves.
- **Does not drive scene composition.** Whether a character is
  rendered in the current shell is the world / scene layer's job;
  this slice only tracks their *narrative* status.

## Bordering files

- `lib/capabilities/agent/dialogue.ts` — appends turns to
  `history`, reads bible + memory refs.
- `lib/capabilities/agent/memory.ts` — owns the actual vector
  store; manages `memoryRef`.
- `lib/cast/<name>.ts` (future) — the per-character bible files
  this slice points to.
- `lib/state/agent.ts` — turn-state slice that drives the dialogue
  capability between cast and user.
