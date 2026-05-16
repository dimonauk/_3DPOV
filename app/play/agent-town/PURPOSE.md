# `/play/agent-town` — purpose twin

## What this is

A play surface. A small top-down floor where the studio's named cast
wanders inside their home rooms. Click a shape to see who that voice
is and what they're up to; press one button to ask the cast on the
floor to react in concert.

The simulation pulls double duty: it's a friendly demo of the
`agent.banter` capability (the same brick `/demo/cast-banter` shows
clinically), and it's a sibling to `/play/neo-london` for the cast
itself — somewhere the named voices live on a page rather than only
existing in the prose.

## Why this shape

- Server component shell (`page.tsx`) for metadata, prose, and the
  banter server action; client island (`agent-town-client.tsx`) for
  the Canvas + interaction. Same split the rest of `/play` uses.
- Canvas 2D, not Phaser. The source app at
  `D:/The_Hangar/apps/agent-town/` used Phaser; Phaser is not in the
  Holoflow lockfile and the renderer was small enough that rewriting
  it in plain Canvas was cheaper than carrying a new dep.
- Cast roster derived from `lib/cast`. The source had three extra
  shapes (lottie / dottie / shelly) without character bibles; they're
  silently dropped so every shape on the floor maps one-to-one to a
  real voice the banter capability can speak as.

## Files

- `page.tsx` — server shell. Owns metadata, prose, the cross-link
  block, and the `generateBanterAction` server action that wraps
  `respondBanter` from `lib/capabilities/agent/banter`.
- `agent-town-client.tsx` — client island. Owns the Canvas renderer,
  the wander loop, the click-to-inspect handler, the side panel, and
  the call to the banter server action.
- `PURPOSE.md` — this file.

## Capability wiring

`agent.banter` only. The client gathers the on-mic subset (the
selected agent + their roommates, or the first three voices if
nothing's selected), joins each speaker's current task into a single
`lastEvent` hint, and posts the resulting `BanterContext` through the
server action. The server action calls `respondBanter(context,
bibles)` and returns the typed `BanterResult`. If
`GOOGLE_AI_API_KEY` is unset, the surface reports the empty result
honestly rather than synthesising fallback turns — the demo route at
`/demo/cast-banter` is where the fallback exchange lives.

## Logging

`createLogger("route:/play/agent-town")` in `page.tsx`,
`createLogger("action:play.agent-town.banter")` inside the server
action, `createLogger("client:play.agent-town")` in the client. Zero
`console.*` calls anywhere in this route.

## Does not

- Does not write to any zustand slice. The simulation is presentational.
- Does not own TTS — callers chain banter turns into `audio.tts`
  elsewhere on the site; this route stops at text.
- Does not call any LLM directly. All AI goes through the existing
  `agent.banter` capability.
- Does not install new dependencies. Phaser was the source app's
  renderer; this route uses plain Canvas 2D instead.
