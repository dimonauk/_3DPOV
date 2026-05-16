# `/academy` — The Charming Academy

The DollyOS narrative space, ported into a top-level Holoflow route.

## What this is

A single-page narrative landing for the studio's school. Surfaces two
rosters side by side:

- **The cohort** — six pastel students (Dolly, Bunny, Pip, Trixie,
  Boo, Tilly) authored in the Charming Academy architecture doc, each
  with a fixed OCEAN seed and a coaching specialty. Rotated in pairs
  through the week.
- **The cast** — the ten named agents whose typed bibles live in
  `lib/cast/`. Tap a name to inspect their voice, posture, default
  ChronoMode, OCEAN baseline, catchphrases, and the phrases they
  refuse to say.

The page is the human-readable face of the data the dialogue +
banter capabilities load programmatically. If a voice ever drifts in
production, the Academy is where it gets pulled back.

## Why a route at /academy

The Academy is the studio's narrative substrate — Aura's school,
the cast's home, the canon source for everything the dialogue layer
grounds against.

- Not a making-tool → does not belong in `/atelier`.
- Not a delivery surface for sculptures → does not belong on
  `/holo-walk`.
- Not authoring chrome over Sanity → does not belong at `/edit` or
  `/studio`.
- It is its own top-level destination, chrome-bypassed because the
  page owns its header and palette (mirrors `/edit`).

## Why not the Vite source

The original Vite app at `D:\The_Hangar\apps\charming-academy/` is a
planning scaffold — only `APP_ARCHITECTURE.md`, `package.json`, and
`node_modules/` exist there. No `src/` directory has been written.

The cohort canon (six students with OCEAN seeds) lives in that
architecture doc. The cast bibles (ten named agents) already live in
`lib/cast/` on this site. This route binds the two so the canon has
a live home until the full Vite app is consolidated in.

## File map

| File | Role |
| --- | --- |
| `page.tsx` | Server-component shell + metadata; loads cast bibles |
| `academy-client.tsx` | Client surface — cohort + cast browser |
| `layout.tsx` | Chrome-bypass (no Navbar / footer) — mirrors `/edit` |
| `PURPOSE.md` | This file |

## Logging

All logs flow through `createLogger("route:/academy")` per the
holoflow-testing-logging convention. Zero `console.*`.

## Voice

Copy lives in Aura's register — welcoming but held, slightly
imperious, never default-apologetic. "Welcome in" is her catchphrase
on file; "held, not neutral" describes the posture the Academy
trains. The header opens with one and closes with the other on
purpose.

## What it is NOT (yet)

- **No VRM viewer.** The Vite app's plan is for Aura to live in the
  centre of the page as a fully-rigged VRM with lip sync. The next
  milestone wires `components/aura/AuraScene` into the page header.
- **No live coaching modules.** PostureService, DailyPlanner,
  WeeklyReflection from the architecture doc are out of scope until
  the Vite app's `src/` lands.
- **No backend writes.** The cohort selection is local state.
  OCEAN drift, RAG queries, and Aura chat are not wired here.

## Strategic positioning

The Academy is the narrative *home*. `/cast` is the data *index*.
`/aura` is the technical *runtime*. The three together describe one
character system from three angles — story, schema, software.
