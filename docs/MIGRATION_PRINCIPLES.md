# Migration principles

The ethos under every move from the Hangar to Holoflow Studio. Four
principles, each one sentence: the **two-box model** says Box 1 (the
Hangar, private, layered) and Box 2 (this repo, clean affordance
shapes) are separate spaces with a deliberate border between them;
**session-archaeology** says Hangar code is the sedimentary residue of
crafting sessions and must be read for intent before it can be moved;
**affordance-shape placement** says the thing crossing the border is
not a file but a chosen affordance in the user-facing site;
**genome-everything** says every artefact in Box 2 reaches the same
contract so the evolution loop can breed any with any.

These four sit downstream of `docs/ARCHITECTURE.md` (the five rules)
and upstream of `docs/CAPABILITY_REGISTRY_PLAN.md` (how the contract
gets populated). The rules say *what shape Box 2 has*. These
principles say *how things get into that shape from elsewhere*.

Box 3 — the open-source quarry catalogued in `docs/BOX_3_INVENTORY.md`
— sits next to the other two as a parts-quarry, not a dependency
graph. Same border ritual applies; the inbound material is just
demo-grade pens and gists rather than Hangar artefacts.

## The three boxes

| Box | Name | Visibility | Contents | Border to Box 2 |
| --- | --- | --- | --- | --- |
| 1 | The Hangar | Private (`D:\The_Hangar\`) | Working code locked inside demo apps, prototypes, crafting sessions, agent skills, Pipeline experiments | Migration |
| 2 | Holoflow Studio | Public (`D:\.github\_3DPOV\`) | This repo. The site, the registry, the slices, the brick library | — |
| 3 | Open-source quarry | Public (GitHub, CodePen, gists) | Pens, demo repos, course projects — anything with no maintenance contract | Lift |

**Box 1** is the studio's private workspace. Its value is exactly that
it is private — Dimona can experiment, fail, leave half-built things
on the bench, hold private cast lore, and not have any of that visible
to the world. Naming conventions are inconsistent because they
accumulated session by session.

**Box 2** is the public face of the studio. Every artefact in it
obeys the five rules. Files are atomised, headless, registered,
twinned, under the 300-line cap. The capability registry is its spine.

**Box 3** is everywhere else — `merrypranxter/strange_attractors`,
`AkshitIreddy/Interactive-LLM-Powered-NPCs`, CodePen scanline shaders,
gists. Listed and scoped in `docs/BOX_3_INVENTORY.md`. We crib parts
from these, not because we couldn't write them, but because working
code beats unwritten code.

Concrete examples of the same affordance across boxes:

- `webgpu-particles-library/apps/07-aura-alive/main.js` is **Box 1**.
  Its Box 2 atomisation is `lib/capabilities/vrm/load.ts` +
  `lib/capabilities/vrm/expression.ts` + `lib/capabilities/audio/visemes.ts`
  + others per `docs/CAPABILITY_REGISTRY_PLAN.md` Wave 1.
- `merrypranxter/strange_attractors` is **Box 3**. Its Box 2 lift is
  `lib/capabilities/viz/attractor.ts`.
- `lib/state/vrm.ts` is **Box 2 native** — born here, never lived
  anywhere else.

Border rule: **nothing crosses without atomising**. The same ritual
(Rule 3 of `ARCHITECTURE.md`) applies whether the source is Box 1 or
Box 3. There is no "Hangar fast path."

## Session-archaeology

Hangar code is sedimentary. A given file at
`D:\The_Hangar\apps\<thing>\main.js` is not the output of one design
session — it is the accumulated residue of many. A face-tracking
experiment from week one is still in there alongside a viseme
re-write from week six and a particle-emitter patch from a Sunday in
March. The file *works*, but its layers are not annotated.

This is why naïve copy-paste fails. A capability we want — say,
`audio.visemes` — is interleaved with code that belongs to other
capabilities, with dead scaffolding from earlier attempts, with
demo-specific glue that won't survive removal from its host page. The
file is a midden, not an artefact.

Reading the Hangar requires **reading for intent**:

- Identify which session each layer comes from (naming drift,
  comment style, dependency choices, neighbouring files).
- Identify which layers carry the affordance we want.
- Identify which layers are crafting-session ephemera — debug code,
  one-off probes, abandoned approaches.
- Identify the *real* dependency graph of the affordance, which is
  almost never what `import` statements suggest.

Only then does the migration begin. The output is not a port of the
file. It is a recovery of the affordance the file once
half-implemented, plus everything the Hangar learned about that
affordance across all subsequent sessions, expressed at Box 2's
contract.

In practice, the read-for-intent pass produces a short note before
any code is written — typically a paragraph in the migration's plan
doc naming what's being recovered and what's being left in the
midden. The note is the artefact that justifies the lift.

## Affordance-shape placement

Migration is not "this file from Box 1 becomes that file in Box 2."
Migration is asking *what does this thing want to be in the
user-facing site?* The answer is rarely a file. It's an
**affordance** — a shape the user can encounter and act on.

Affordances in Box 2 are of four kinds:

| Kind | What it is | Example |
| --- | --- | --- |
| Pages | A route the user can visit | `/atelier`, `/play`, `/visualiser` |
| Parts of pages | A component or section composed into a route | The Pipeline Epsilon body visualisation inside `/visualiser` |
| Choices | A selectable option that changes a page's state | An attractor engine pick: Clifford / Thomas / Lorenz / Dequan Li |
| Capabilities | A typed function under `lib/capabilities/` | `vrm.load`, `audio.tts`, `viz.attractor` |

A Hangar artefact rarely maps to one of these — it usually fans out
across several. Naming the fan-out is the gating question every
migration answers before any code is written.

Worked examples:

- **Pipeline Epsilon** (GPGPU attractor field driven by Aura's mood,
  Hangar) → the `viz.attractor` capability (`lib/capabilities/viz/`)
  + the `viz.particles` capability + a part of the `/visualiser` page
  + a commission line under `/services/auras-mood-printed` + an
  article entry. One Hangar artefact, five Box 2 affordances.
- **Aura-Alive** (`webgpu-particles-library/apps/07-aura-alive/`) →
  fourteen capabilities under `lib/capabilities/` per the registry
  plan + a future `/cast/aura` page that composes them + the cast
  slice (`lib/state/cast.ts`). One Hangar app, sixteen affordances.
- **ChatVRM** (Box 3, demo) → contributes to `audio.visemes` timing
  and the character-bible pattern. No page. The demo skin is
  dropped entirely. One Box 3 repo, partial contribution to two
  capabilities.
- **Workshop shell scanlines** (Box 1, existing on site) → extended
  by the `crt-finish` component (Box 3 quarry) into a richer surface
  affordance on the same shell. One affordance, evolved.

The placement step produces a short bullet list — one line per
affordance the source will become — before atomisation begins. The
list is the migration's contract with itself.

## Genome-everything

Every artefact in Box 2 reaches the same contract: a registered
capability, a slice it reads or writes, a `.PURPOSE.md` twin
describing its role and surface. That is the **genome alphabet** the
evolution engine will run on.

`docs/BRICK_LANGUAGE.md` describes how the alphabet renders as
physical objects in the in-world editor. `docs/ARCHITECTURE.md` Rule 4
("everything is in the loop") names the four properties that make a
thing breedable: registered, discoverable, breedable, composable.
Genome-everything is the migration-time consequence of those rules —
the requirement that nothing crosses the border without joining the
alphabet.

When all of Box 2 reaches the contract, four things become possible:

- **Darwinian selection** — usage frequency drives a brick's
  Pokémon-stage evolution (`BRICK_LANGUAGE.md` Gen 3). Bricks that
  see use enrich; shelf-sitters stay base-form.
- **Cross-pollination** — bricks that have been reliably paired in
  pipelines breed offspring bricks (`BRICK_LANGUAGE.md` Gen 4). The
  shared slice surface is what makes the breeding well-defined.
- **Composability without coordination** — any two capabilities that
  touch a shared slice can compose without the studio's authors
  having scripted that composition. The Wave-1 list at the end of
  `CAPABILITY_REGISTRY_PLAN.md` is six such compositions, none of
  them explicitly coded.
- **A real evolution engine** — `lib/evolution/` (pending, queued at
  `HANGAR_MAP.md` row Wave 2) consumes the genome alphabet and runs
  the breeding loop on it.

Genome-everything is the *reason* the migration ritual is strict. A
single un-atomised file in Box 2 is a non-participant in the loop —
the alphabet has a hole, and the evolution engine has to work around
it. The discipline is non-optional because the downstream system
requires totality.

## The ritual at the border

Every artefact crossing into Box 2 — from Box 1 or Box 3 — runs the
same five-step ritual. Detail is in `ARCHITECTURE.md` Rule 3; the
recap here is the migration-author's checklist.

1. **Shred** — break the inbound thing into capability-sized units
   (≤300 lines each). The Hangar's interleaved layers separate here;
   the Box 3 quarry's demo scaffolding drops away here.
2. **Rewrite** — TypeScript strict, `noUncheckedIndexedAccess`-clean,
   our naming (`verb.noun` for capabilities), our types, our import
   paths. No `any`. No default exports.
3. **Strip** — all UI, all demo scaffolding, all wrapper libraries.
   Capabilities are headless. JSX, hooks, `window.x` outside a
   feature-detect — none of these survive.
4. **Register** — entry in `lib/capabilities/index.ts` with a stable
   `CapabilityId`, metadata, lazy `load()`, the slices it touches.
   Twin file (`.PURPOSE.md`) created alongside the code file.
5. **Credit** — file-header comment naming the source + an entry in
   `docs/ATTRIBUTIONS.md`. Box 1 migrations name the Hangar path;
   Box 3 lifts name the upstream repo and licence.

The ritual is the same regardless of source. There is no shortcut
because the source is "ours" (Box 1) — the Hangar's privacy and the
site's contract are different commitments, and the border between
them is where the difference is enforced.

## When NOT to migrate

Some Hangar artefacts should stay in Box 1. The Hangar's value as a
*private* messy space is real and worth protecting.

Categories that stay:

- **Experimental** — crafting sessions in progress. The affordance
  hasn't settled yet; migrating it locks in a shape that's still in
  flux. Wait for the session to converge.
- **Private** — cast lore that isn't ready for the public site,
  agent skills tied to Dimona's local toolchain, business intel,
  personal notes. Privacy is a feature, not a bug.
- **Broken** — code that doesn't work yet. The site is a portfolio,
  not a graveyard. Fix in the Hangar, migrate when it stands.
- **Brand-conflicting** — anything whose voice or aesthetic
  doesn't match Holoflow Studio's. Trim or re-shape in the Hangar
  first; do not introduce dissonance into Box 2 to "make it
  consistent later."
- **Unfinished crafting sessions** — half-built capabilities whose
  affordance shape hasn't been chosen. The placement step (above)
  can't run on these — there's no decision to write down yet.

The 🔒 PRIVATE and 🚫 SKIP rows of `docs/HANGAR_MAP.md` are the
running list of what's deliberately left behind. The map is the
authoritative source for "is this migration in scope" — if it's
not on the map with a non-skip status, the question is not yet
answered.

Migration is a one-way valve. Once an affordance is in Box 2, it
evolves in Box 2. We do not back-port. We do not track upstream from
the Hangar. The Hangar can keep changing without affecting the site;
the site can keep evolving without disturbing the Hangar.

## Next reading

- `docs/HANGAR_MAP.md` — the living coverage tracker. What's
  migrated, what's queued, what's deliberately skipped.
- `docs/BOX_3_INVENTORY.md` — the open-source quarry, scoped lift
  by lift.
- `docs/CAPABILITY_REGISTRY_PLAN.md` — the atomisation plan for
  Aura-Alive, the first sustained application of these principles.
- `docs/ARCHITECTURE.md` — the rules that make the contract
  enforceable.
- `docs/BRICK_LANGUAGE.md` — what the genome alphabet looks like
  once it renders in the in-world editor.

When this file goes over 300 lines, it splits per
`ARCHITECTURE.md` Rule 1. `docs/migration-principles/` with one
principle per file, this file becomes the index. Same as everywhere
else.
