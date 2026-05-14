---
name: holoflow-mammoth-hunt
description: >
  The 300-line code-file split protocol for the Holoflow Studio repo
  (D:/.github/_3DPOV). The studio's architectural cap: no behavioural code
  file is allowed to exceed 300 lines. This skill defines the exact split
  pattern (orchestrator + pure logic + presentational + side-effects),
  the type-check-then-commit cadence, and the commit-message format.
  Load when the user says: "mammoth", "mammoth hunt", "split this file",
  "this file is too long", "300 line cap", "refactor for size", "round 2.X",
  or when any code file in the repo crosses 300 lines and needs slimming.
  Triggers also on: "until no more mammoths", "next mammoth", "kill the
  mammoth", a file path with a known oversized component, or working
  through the explicit mammoth backlog.
---

# Holoflow Studio — The Mammoth Hunt

The studio's repo (`D:/.github/_3DPOV`, branch `holoflow-commerce`) holds
itself to a **300-line cap on every code file**. The "mammoth hunt" is the
recurring task of finding files past the cap and splitting them.

## Scope: what counts

**In scope** — must be ≤ 300 lines:

- `.tsx` / `.ts` files under `app/`, `components/`, `lib/capabilities/`,
  `lib/visualiser/`, `lib/chrono-protocol/`, `lib/holo-walk/` (the
  behavioural parts), `scripts/`.
- `.py` files under `python-services/`.

**Exempt** — registry, data, content, lookup tables:

- `lib/articles.tsx`, `lib/tutorials.tsx`, `lib/journal.tsx`, `lib/codex.tsx`,
  `lib/stack.ts`, `lib/services.ts`, `lib/play.ts` — all are registries that
  index typed entry components.
- `lib/holo-walk/locations.ts` — content (per-shoot narration).
- `lib/assets/*` (`genomes.ts`, `algorithms.ts`, `brushes.ts`) — data.
- `components/articles/entries/*`, `components/journal/entries/*`,
  `components/tutorials/entries/*` — each is a single Article/Journal/Tutorial
  written by hand. Each file IS the content.
- `lib/visualiser/marching-cubes-table.ts` — 256-row triangulation table.
- `.env.example`, `pnpm-lock.yaml`, anything under `public/`.

The rule of thumb: if the file's job is to **encode information** (narrate
a piece, list articles, hold a lookup table), it's exempt. If its job is to
**run logic**, it's in scope.

## The split pattern

A mammoth React component (>300 lines) typically splits into 3-5 siblings:

1. **`<feature>.tsx`** — slim orchestrator. Owns top-level state, lifecycle
   hooks, callbacks. Composes the children. Should end at ~150-200 lines.
2. **`<feature>-<domain>.ts`** — pure logic. Heuristics, math, type
   definitions, constants. No React, no DOM. Importable from a Node test.
3. **`<feature>-<surface>.tsx`** — presentational sub-panels. Take props,
   return JSX. No state of their own except trivial UI (open/closed, hover).
4. **`<feature>-<input>.tsx`** — R3F or pointer interaction. The
   raycaster/pointer-capture/canvas-event surface for the feature.
5. **`<feature>-actions.ts`** (optional) — pure side-effect functions that
   take a `Result`-shaped object and hit the DOM, network, or filesystem.

A mammoth pure-logic file (>300 lines, no React) typically splits into:

1. **`<feature>-table.ts`** — data / lookup (often the largest, often exempt).
2. **`<feature>-samplers.ts`** — generators / builders.
3. **`<feature>-math.ts`** — algorithm core. Slim, re-exports siblings so
   the public import path stays stable.

## The cadence

Per file split (one "round"):

1. **Read** the mammoth in full. Don't trust an outline; the splits emerge
   from the actual structure.
2. **Plan** the file boundaries. State the line target for each new file
   in your head: orchestrator ~150-200, helpers ~80-200, panels ~100-150.
3. **Write the new siblings first** (don't touch the original yet). Each
   sibling is a `Write` (new file).
4. **Rewrite the orchestrator** as the last step — it imports from the
   new siblings. Use `Write` (overwriting) since the diff is large.
5. **`pnpm tsc --noEmit`** — must pass. If it fails, fix in place; don't
   commit a broken type-check.
6. **Verify line counts** with PowerShell:
   ```pwsh
   Get-ChildItem path/to/your/files-* | ForEach-Object {
     ($_.Name + ": " + ((Get-Content $_) | Measure-Object -Line).Lines)
   }
   ```
7. **Commit** with the canonical message (see below).
8. **Mark the round done** in the todo list. Move to the next round.

Do NOT batch rounds. Each round is its own commit so a regression is
trivially bisectable.

## Commit message format

```
mammoth 2.N: split <file> (<oldLines> → <count> files)

- <new-file-1> (<lines>) — <one-line role>
- <new-file-2> (<lines>) — <one-line role>
- <new-file-3> (<lines>) — <one-line role>
- ...

<optional one-paragraph note: consumers untouched, anything subtle>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

The `2.N` numbering is the running tally on `holoflow-commerce`. Round 2.1
was print-bar.tsx; check `git log --oneline | grep mammoth` to find the
current highest N.

## Examples landed (use as templates)

| Round | Original (lines) | Split into | Commit |
|-------|------------------|------------|--------|
| 2.1 | `components/three/print-bar.tsx` (552) | `print-bar.tsx` (106) + `-shared.ts` (26) + `-3d.tsx` (201) + `-3d-plate.tsx` (155) + `-html.tsx` (136) | `8d80414` |
| 2.2 | `app/spatial/video/spatial-video-demo-client.tsx` (579) | client (200) + `-pipeline.ts` (135) + `-panels.tsx` (287) | `264b451` |
| 2.3 | `app/spatial/spatial-demo-client.tsx` (368) | client (180) + `-pipeline.ts` (88) + `-actions.ts` (52) + `-panels.tsx` (92) | `5cc3258` |
| 2.4 | `lib/visualiser/marching-cubes-math.ts` (723) | `-math.ts` (249) + `-samplers.ts` (117) + `-table.ts` (329, exempt) | `a213c53` |
| 2.5 | `components/play/scenes/witness-scene.tsx` (633) | scene (179) + `-narration.ts` (236) + `-draw-surface.tsx` (85) + `-overlay.tsx` (118) | `d0d35a8` |
| 2.6 | `components/play/play-scene.tsx` (564) | scene (158) + `-brush.ts` (64) + `-draw-surface.tsx` (199) + `-overlays.tsx` (149) | `b94f36a` |
| 2.7 | `components/layout/navbar.tsx` (532) | navbar (110) + `-config.ts` (86) + `-desktop-group.tsx` (145) + `-mobile-drawer.tsx` (128) + `-auth-slot.tsx` (51) | `f9b8913` |

Each commit is a clean blueprint for the same shape of split.

## Finding the next mammoth

```pwsh
Get-ChildItem -Recurse -Include *.ts,*.tsx |
  Where-Object { -not ($_.FullName -match "node_modules|\.next|coverage|dist|build|out") } |
  ForEach-Object {
    $lines = (Get-Content $_ | Measure-Object -Line).Lines
    if ($lines -gt 300) {
      "{0,5} {1}" -f $lines, ($_.FullName -replace [regex]::Escape((Get-Location).Path + "\"), "")
    }
  } |
  Sort-Object -Descending
```

Then filter mentally against the exempt list above. Pick the largest
behavioural file; that's the next round.

## Backlog (as of commit 6d53c32)

Remaining behavioural files >300 lines, roughly in priority order:

- `components/play/scenes/module-scene.tsx` (456)
- `components/play/scenes/loop-scene.tsx` (454)
- `components/sphere/sphere-scene.tsx` (453)
- `scripts/register-splat.ts` (445) — tooling, lower priority
- `components/visualiser/tir-scene.tsx` (425)
- `scripts/cctv-sharp-batch.ts` (407), `cctv-mesh-batch.ts` (391),
  `cctv-fetch.ts` (404), `cctv-download-matched.ts` (307) — CCTV pipeline
- `app/atelier/rig-simulator/rig-simulator-client.tsx` (332)
- `app/atelier/rig-simulator/simulator.ts` (322)
- `lib/chrono-protocol/dialogue.ts` (334)
- `components/neo-london/london-map.tsx` (311)
- `lib/capabilities/commerce/sharp-video-job.ts` (308)
- `components/shell/right-panel.tsx` (303)

`app/*/page.tsx` files in the 300-330 range are *probably* content
(narrative copy + JSX); inspect before splitting.

## Anti-patterns

- **Don't extract for the sake of extraction.** If splitting a 312-line
  file produces a 180-line orchestrator + a 132-line "helpers" file with
  no semantic boundary, leave it at 312. The cap is a forcing function;
  it isn't a religion.
- **Don't lose a stable import path.** If a file is widely imported (e.g.
  `lib/visualiser/marching-cubes-math.ts`), keep that path as the public
  API. Re-export from the new siblings rather than asking every consumer
  to update their imports.
- **Don't introduce a deps cycle.** Sibling files in the same feature
  directory should form a DAG: orchestrator → panels + pipeline; pipeline
  ⇄ panels is forbidden.
- **Don't comment-out the old code "just in case."** Delete it. The git
  log is the safety net.

## Voice in the commit body

Plain. Mechanical. Describe what moved and where; do not narrate the
journey. The commit body is for the future bisecter, not the audience.
