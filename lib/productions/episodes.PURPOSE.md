# `episodes.ts` — purpose twin

## Role

The typed catalogue of the studio's planned narrative episodes —
the shells **Pipeline Gamma** (Narrative Sitcom, see
`D:\The_Hangar\PIPELINES.md`) will fill with screenplay output
from its Director Agent stage.

Each entry is a placeholder: a slug, the canon arc it belongs
to, the bibled cast members onstage, the scene, the status, a
provisional 2-3 sentence synopsis, and an ISO-week target. The
catalogue captures the studio's *intent* — which episodes are
queued for which arcs across which weeks — without committing
to dialogue, beats, or camera.

## Public surface

- `episodes: Episode[]` — the catalogue.
- `listEpisodes()` — iterate.
- `getEpisode(id)` — single lookup.
- `episodesByArc(arc)` — filter by canon arc.
- `episodesByCast(castId)` — filter by cast member.
- Types: `Episode`, `EpisodeArc`, `EpisodeScene`, `EpisodeStatus`.

## Internal

Pure typed data + four list/filter helpers. No runtime logic.

## Depends on

- `lib/cast` — `CastMemberId` literal-union for the `cast` field.
  An episode that names a non-existent cast member fails to
  type-check.

## Does not

- **Does not write episodes.** Synopses for any non-`shipped`
  status are **PROVISIONAL** — the Director Agent (Pipeline Gamma
  stage 4) writes the real screenplay later. This file holds the
  shape, not the work.
- **Does not own episode state.** A running episode's render
  state belongs to the future production slice; this catalogue
  is static documentation + discovery.
- **Does not list characters not yet bibled.** Millie, Baby,
  Scribe, Tim, Excavation Bot and the unnamed slots from the
  `dollyos-world` skill canon don't have bibles in `lib/cast`
  yet, so they can't appear in any episode's `cast: CastMemberId[]`
  array. The Iron Ribbon arc entries reference Millie in synopsis
  prose only; her bible is the gate to inclusion in `cast`.
- **Does not enforce a `sourcePath`.** The Hangar's
  `D:\The_Hangar\Productions\episodes\` and
  `D:\The_Hangar\Productions\scenes\` directories were both
  empty at scaffold time — no existing canon to link. Future
  episodes can populate `sourcePath` once Pipeline Gamma writes
  files there.

## Plug surface

- **State plugs:** none directly; running episodes will plug into
  a future production slice.
- **Type plugs:** `CastMemberId` from `lib/cast`.
- **Dependency plugs:** none.

## Bordering files

- `lib/cast/index.ts` — the bibled-cast registry; gates the
  `cast` field's enum.
- `lib/pipelines.ts` — the Pipeline Banter / agent.banter
  composition that drives multi-character dialogue inside an
  episode.
- `lib/capabilities/agent/dialogue.ts`,
  `lib/capabilities/agent/banter.ts` (future) — the bricks that
  ground each episode's lines against the cast bibles.
- `app/productions/page.tsx` — the discovery route that renders
  this catalogue.

## Memory

- Arc canon: `dollyos-world` skill — "The Insubordinate Lavender"
  (Mon → Wed → Fri, Marcel + Betsy) and "The Iron Ribbon"
  (Mon → Tue → Wed → Thu → Fri, Trixie + Millie).
- Pipeline canon: `D:\The_Hangar\PIPELINES.md` — Pipeline Gamma:
  Narrative Sitcom, Metadata to Media.
- Hangar productions directory: `D:\The_Hangar\Productions\`
  contained empty `episodes/` and `scenes/` subdirectories plus a
  `scheduler.log` at scaffold time. No canon to lift.
