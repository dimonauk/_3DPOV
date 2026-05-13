# Architecture canon

The four rules that hold the studio together. Every file, every
migration, every Box-3 lift obeys these. They are the forcing
function for everything else (the capability registry, the genome
loop, the evolution engine, the slash-command terminal).

## Rule 1 — 300-line cap, no exceptions

**No file we make is ever over 300 lines.** Past 300, it splits into
a folder — a multi-file system.

Why this matters:

- A file under 300 lines does one thing. One thing maps to one
  `CapabilityId`. That mapping is what the registry runs on.
- A multi-file system is modularised by default. The split forces
  each piece to be re-usable on its own. That's what feeds the loop.
- The cap removes a recurring question. Nobody argues "is this too
  big yet?" — at 250 lines you start planning the split, at 300 you
  do it.

Applies to: TypeScript source, React components, docs, JSON
fixtures, anything we author. Does not apply to generated files,
lock files, vendored license texts.

When you split, the directory replaces the file:

- `lib/foo.ts` (320 lines) → `lib/foo/` (a folder of pieces under 300
  each, with `lib/foo/index.ts` re-exporting the public surface).
- `components/big-thing.tsx` (350 lines) → `components/big-thing/`
  with sub-components.
- `docs/long-plan.md` (400 lines) → `docs/long-plan/` with
  `overview.md` + sub-pages.

## Rule 2 — Capabilities are headless; state lives in zustand

A **capability** is a typed function (or small set of functions) at
`lib/capabilities/<kind>/<verb>.ts`. It:

- Has no UI.
- Has no React hooks.
- Owns no module-scope mutable state.
- Reads and writes typed zustand slices at `lib/state/<slice>.ts`.

When a capability needs shared state, it imports the slice's
`use<Slice>Store` (for components) or `<slice>Store.getState()` /
`.setState()` (for headless code). That is the only legal channel
for state between capabilities.

Why this matters:

- Composability requires shared state. `vrm.expressions.blend` driven
  by `audio.visemes` driven by `audio.tts` only works if all three
  observe the same slice surface.
- Headlessness keeps capabilities testable in isolation. No DOM, no
  hook order, no provider tree.
- Zustand's selector-subscriber model is the cheapest way to keep
  many independent capabilities composing without re-render storms.

Slice layout (committed):

| Slice | Owns |
| --- | --- |
| `lib/state/vrm.ts` | Loaded VRM handles, pose targets, expression weights |
| `lib/state/audio.ts` | STT transcript stream, TTS queue, viseme stream |
| `lib/state/aura.ts` | Aura's OCEAN vector, current mood, current ChronoMode |
| `lib/state/cast.ts` | Per-character memory references, dialogue history |
| `lib/state/agent.ts` | Active turn state, pending intents |
| `lib/state/input.ts` | Head pose, gesture events, gamepad/XR controllers |
| `lib/state/viz.ts` | Attractor parameters, particle counts, visualisations |
| `lib/state/shell.ts` | Workshop shell state |
| `lib/state/world.ts` | Current shell index (1–10), parallax depth |

Slices do not import other slices. Cross-slice composition is a
capability's job, not a slice's.

## Rule 3 — Atomise on entry

Anything entering this repo from anywhere — Hangar (Box 1),
open-source quarry (Box 3), AI-generated draft, snippet from a pen —
goes through the same border ritual:

1. **Shred** to capability-sized units (≤300 lines each).
2. **Rewrite** to our conventions: TypeScript strict +
   `noUncheckedIndexedAccess`, our naming (`verb.noun` for
   capabilities), our types, our import paths.
3. **Strip** all UI, all demo scaffolding, all wrapper libraries.
4. **Register** each capability in `lib/capabilities/index.ts` with a
   stable `CapabilityId` and the slices it touches.
5. **Credit** in a file-header comment + an entry in
   `docs/ATTRIBUTIONS.md` for Box-3 lifts.

After the ritual, the code is **Holoflow Studio native**. It evolves
with our codebase. We do not track upstream. We do not vendor folders
that preserve original structure. Vendoring is just lazy migration.

The exception: real maintained libraries with release cadences
(Three.js, @pixiv/three-vrm, MapLibre, MediaPipe, Spark, Tailwind,
Next.js, Firebase, Stripe, zustand) stay as proper npm dependencies.
We use the API; we don't fork. Border test: *does this repo have a
release cadence and a maintainer who would answer an issue?* Yes →
dependency. No → quarry.

## Rule 5 — Every module declares its purpose for being

At the top of every file we author, a comment that says **why this
file exists**. Not what it does (the code tells you that) — *why it
is in the system at all, what would be missing without it*.

Format:

```ts
/**
 * <path/to/file.ts> — <one-line role>.
 *
 * # Purpose
 * <2-4 sentences. What problem does this solve? What capability
 * does it unlock? What other modules depend on its existence?>
 *
 * # Why this shape
 * <when the shape is non-obvious: why a slice not a context, why
 * pure functions not a class, why this lives at this path. Skip if
 * the shape is the default.>
 */
```

Why this matters:

- A file that can't justify its existence in three sentences is
  probably not a real abstraction. The purpose-of-being prompt
  catches premature splits and premature consolidations on contact.
- Future-Claude (and future-Dimona) reading the file six months from
  now needs the *why*. Naming and types carry the *what* already.
- When a module's purpose drifts, the preamble drifts too — and
  visible drift is fixable drift.

Applies to: every file under `lib/`, `components/`, `app/`,
`docs/` that we author. Not to generated files. Module headers in
docs go under a `## Why this exists` section, same job.

When the preamble grows past a paragraph or two, the module is
probably trying to do too many things — split it.

### 5b — Every code file has a `.PURPOSE.md` twin

For every code file we author, a **file twin** sits beside it: same
basename, `.PURPOSE.md` extension. The in-file preamble (5a) carries
the one-line role at the top of the code; the twin carries the full
purpose record.

```text
lib/capabilities/_base.ts
lib/capabilities/_base.PURPOSE.md   ← twin

lib/state/vrm.ts
lib/state/vrm.PURPOSE.md            ← twin

components/shell/workshop-shell.tsx
components/shell/workshop-shell.PURPOSE.md  ← twin
```

Required sections in the twin:

- **Role** — one sentence: what slot in the system this fills.
- **Public surface** — the exports outside callers should touch.
- **Internal** — what's deliberately not exported (underscore-prefix
  convention, etc).
- **Depends on** — slices, capabilities, libraries this file reads.
- **Does not** — anti-scope, with reasons. What this file
  deliberately does NOT do.
- **Bordering files** — siblings that compose with this one, and
  who is responsible for the composition.

Why a twin and not a single longer file:

- The code file stays short and code-focused. The 300-line cap is
  easier to hold when prose lives somewhere else.
- The twin is searchable as its own corpus. `grep "Role:" lib/**/
  *.PURPOSE.md` enumerates the system's slot map.
- Twins survive refactors. When code is renamed, its twin renames
  with it. The pairing is enforced by filename.
- An IDE or future-Claude opening the code file sees the twin in
  the same directory listing — discovery is automatic.

Applies to: every `.ts`, `.tsx`, `.js`, `.css` file we author under
`lib/`, `components/`, `app/`. Not to generated files, fixtures, or
license texts. Docs files do not need twins — `docs/*.md` is itself
purpose-prose.

When a twin grows past 300 lines, the code file it twins is
probably trying to do too many things — split the code file, and
each new piece gets its own twin.

## Rule 4 — Everything is in the loop

Every capability, slice, algorithm, mesh, genome, character bible,
and visualisation participates in the same loop:

1. **Registered** with a stable identifier.
2. **Discoverable** via `/capabilities`, `/pipelines`, `/atelier`,
   `/run <id>` from the terminal.
3. **Breedable** by the evolution engine (`lib/evolution/`, queued)
   because it reaches the common contract.
4. **Composable** with anything else because the state bus is shared.

When you add something, ask: which registry does it join, which
slices does it read or write, which other artefacts can now compose
with it? If the answer to any of those is "none," the abstraction is
wrong — refactor until it fits.

## What this substrate enables

The five rules above are not just code hygiene. They are the data
model for an in-world editor — a *workshop you walk through in VR*
where every capability is a physical brick you grab off a shelf and
click into a build.

- **3D Lego meshes.** Every capability under `lib/capabilities/`
  ships with a generated 3D brick (mesh + label + socket geometry).
  The brick's sockets correspond to the zustand slices it reads
  and writes — bricks snap together when their sockets line up.
- **Code-in-VR.** A user picks up the `vrm.load` brick, then the
  `audio.tts` brick, then `audio.visemes`, then
  `vrm.expressions.blend`, and clicks them along the `audio` and
  `vrm` slice sockets. The chain becomes a callable pipeline
  registered at runtime.
- **Apps-in-VR.** A finished chain becomes a runnable app the user
  can spawn inside the workshop. Two users in the same WebXR room
  can build together, hand each other bricks, save assemblies as
  named pipelines.
- **The `.PURPOSE.md` twin renders as the brick's floating label**
  when the user looks at it. The Role line is the brick's name,
  the Does-not list is the visual tooltip showing what won't snap.

For this to work, the rules above must be obeyed without
exceptions:

- Files over 300 lines are bricks too big to grab.
- State that lives anywhere but a slice means a brick with no
  sockets — nothing snaps to it.
- A missing twin means a brick with no label — un-pickable.
- A capability that hasn't atomised means a brick with mystery
  internals — un-trustable in a build.

The VR substrate is downstream of the rules. The rules are the
substrate's correctness contract.

## Practical defaults

- New file path: pick the smallest folder it belongs in. Don't
  pre-emptively nest.
- Naming: `verb-noun.ts` for capabilities (kebab in segment names),
  `noun.ts` for slices, `kind-name.ts` for typed data tables.
- Imports: prefer named, never default. Default exports break
  refactoring tools.
- Types: no `any`. `unknown` at boundaries, narrowed by guards.
- Comments: only when *why* is non-obvious. Names carry the *what*.

## Reading order for new contributors / future Claudes

1. This file.
2. `docs/CAPABILITY_REGISTRY_PLAN.md` — how capabilities work in
   practice.
3. `docs/BOX_3_INVENTORY.md` — what we crib and from where.
4. `docs/HANGAR_MAP.md` — the migration coverage tracker.
5. `lib/capabilities/_base.ts` — the typed contract itself.

## When this file goes over 300 lines

It splits. `docs/architecture/` with one rule per file,
`docs/ARCHITECTURE.md` becomes the index. Same as everywhere else.
The rule applies to its own statement.
