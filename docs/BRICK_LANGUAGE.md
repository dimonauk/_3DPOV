# Brick language — Duplo × Technics × VR × Tetris × Cubism × Puzzles

The full six-way formula: **Duplo** is the scale, **Technics** is
the mechanical sophistication (gears, pins, axles that articulate
— bricks that *do work*, not just stack), **VR** is the medium,
**Tetris** is the silhouette family + interlock language,
**Cubism** is the visual encoding, **Puzzles** is the user-facing
activity (you *solve*, you don't just build).

A capability brick is a Duplo-scale, Technic-articulated,
VR-grabbable, Tetris-shaped, Cubist-faceted puzzle piece that
happens to be a typed programming function.

The Technics addition matters because capabilities aren't static
shapes. They have running behaviour visible on their surface:

- `audio.tts` pulses when speaking.
- `motion.idle` shows a slow breath cycle on its face.
- `agent.dialogue` flickers when thinking.
- `viz.attractor` renders its current attractor in miniature on a
  Cubist facet, so you see the engine at a glance.
- `vrm.load` shows a tiny rotating VRM head as its identity facet.

The brick is alive. Watching the shelf is watching the studio
work.

## Original short-form

The visual + spatial design language for the in-world editor.
Each capability is a *brick*. This doc names what the brick looks
like, how it snaps, and how the user reads it without opening a
file.

## The three-way mashup

| Lineage | What it contributes |
| --- | --- |
| **Tetris** | Distinct geometric brick shapes by capability kind. Bricks interlock at right-angled plugs/sockets. Spatial puzzle quality — you *see* what fits before you try it. |
| **Cubism** | Faceted visual surface per brick. Multiple-perspective-on-one-object. Not photorealistic, not minimalist — deliberately fragmented planes that hint at the brick's internal structure. |
| **Programming** | The underlying truth: typed function modules with real contracts. The Tetris shape and Cubist surface are *projections* of the type system into space. |

A brick in the studio is none of these three on their own. It is
the three at once — a tetromino-shaped cubist sculpture that
happens to be a callable typed function.

## Shape vocabulary (by capability kind)

Each `CapabilityKind` from `lib/capabilities/_base.ts` gets a base
tetromino silhouette. Variations come from plug-count and
status. Concrete geometry is TBD; the families are committed:

| Kind | Base silhouette | Why |
| --- | --- | --- |
| `vrm` | L-piece | Has a long body (rig) with a head joint hanging off — visually reads as a humanoid attachment point. |
| `audio` | I-piece (vertical) | Stream-shaped. Long axis = time. Plugs at top (input) and bottom (output). |
| `motion` | T-piece | Splits one input pose into multiple modulated outputs. The T branches read as the modulation fan-out. |
| `agent` | Z-piece | Asymmetric — the brick's "intelligence" sits offset from its plugs. Conveys judgment, not pipeline. |
| `input` | J-piece | Mirrors `vrm`'s L. Input world enters from the side and bends into the studio's state. |
| `viz` | S-piece | Curved-flow read. Particles and fields flow through it diagonally. |
| `algo` | O-piece (square) | Pure data-in / data-out. Symmetrical because algorithms have no temporal direction. |
| `shell` | I-piece (horizontal) | Surface-spanning. The terminal/HUD bricks ARE the user's window-frame; they lie flat. |
| `world` | composite | Shells, spheres, parallax — these break the tetromino discipline because they're containers, not bricks. They're the *play area*. |

## Plug system (Tetris-style)

A brick's plugs are visible as right-angle notches on its faces.

**State plugs** (round sockets, one per slice):

- A brick that reads/writes `lib/state/vrm.ts` has a socket labelled
  `vrm`.
- Two bricks with matching slice sockets can be placed adjacent and
  state flows through the bus automatically.
- Slice-incompatible bricks physically don't sit flush — there's a
  visible gap. The user sees the misfit.

**Type plugs** (square pins, one per typed input/output):

- The output of `audio.tts` is `AudioBuffer`. The input of
  `audio.visemes` is `AudioBuffer`. Pin shapes match — they click.
- The output of `audio.tts` is NOT a `PoseVector`. The input of
  `vrm.bones.pose` is `PoseVector`. Pin shapes mismatch — they
  refuse to connect, with a visible rejection animation.

**Dependency plugs** (triangle anchors, one per `dependsOn` entry):

- A brick with `dependsOn: ["vrm.load"]` has a triangle anchor that
  only seats on a `vrm.load` brick's matching mount.
- Dependency is *physical* — a brick whose dependencies aren't in
  the build literally cannot stand up.

## Cubist surface — what the brick "looks like"

Per brick, the faceted surface encodes:

- **Material palette** — by `CapabilityKind`. Audio bricks are
  cyan-cyan-magenta facets. VRM bricks are gold-on-midnight. Agent
  bricks have a third-eye motif. Palette draws from the existing
  Holoflow aesthetic (cyan `#00f3ff`, gold `#ffd700`, midnight
  `#0a0a0f`).
- **Facet count / density** — by complexity. A 50-line capability
  has fewer, larger facets. A 280-line capability has many small
  facets. The cap at 300 lines means no brick is ever *too dense to
  read* at glance.
- **Cracks / glow** — by status. `stub` bricks have visible hairline
  cracks (incomplete). `registered` bricks are intact. `deprecated`
  bricks have a fading patina (still pickable, with a warning).
- **Floating label** — the brick's `Role` line from its `.PURPOSE.md`
  twin renders as a holographic label above the brick when the user
  looks at it.

## Reading a brick at glance

A user walking past a shelf reads:

1. **Shape** (1m glance) → what *kind* of work this brick does.
2. **Palette** (3m glance) → same, double-confirmed.
3. **Crack pattern** (1m glance, on closer look) → is it ready to
   ship?
4. **Plug array** (when picked up) → what other bricks it talks to.
5. **Floating label** (when held / hovered) → exact `Role`.
6. **Open the twin** (`.PURPOSE.md`, displayed as a leaflet beside
   the brick) → full purpose record.

No documentation is needed beyond the brick itself. The brick is
its documentation.

## Unlock system (placeholder)

The user has flagged a *gating / unlock progression* mechanism for
the brick library — not yet designed. Candidate hooks:

- **Mode affinity** — bricks tied to a ChronoMode (AMBER / AZURE /
  AMETHYST / CRIMSON / VERIDIAN) unlock as the user spends play
  time in that mode.
- **Rookery tier** — subscription level gates access to advanced
  bricks.
- **Apprentice path** — completing a tutorial unlocks the bricks it
  taught.
- **Quest completion** — Chrono-Protocol zone clears drop specific
  bricks.

The `CapabilityRecord` type will grow an optional `unlock` field
when this system is designed. Until then, all registered bricks
are universally pickable; lock state lives outside the registry.

## Duplo as base genome — evolving the brick library

Tetris shapes are the silhouette family. **Duplo** is the actual
*base genome* the studio's brick mesh starts from when rendered in
VR. Lego is the smaller-scale variant for code-only / 2D contexts.

The studio's nursery language already encodes the distinction:
**Lego** = modular components, **Duplo** = foundational parts.
The VR brick language inherits that split:

- **VR form (Duplo-scale)** — chunky, palm-sized bricks the user can
  grab with a clenched fist. Pins are large enough that a hand
  controller can land on one with no precision-aiming. The whole
  brick fits the average reach of a seated XR user.
- **2D form (Lego-scale)** — the same brick rendered smaller for
  desktop/CodePen-style flat assembly. Pins are pixel-precise,
  bricks tile densely on a screen.

The base mesh is a 2×N studded Duplo silhouette. Every viewer
reads "modular component you can build with" on contact, no
onboarding needed. The studio's first generation of capability
bricks renders as **unmodified-Duplo silhouette** with Cubist
faceting on the surface and Tetris-family pin arrays on the studs.
Same brick a toddler would grab, with the studio's visual language
on top.

This makes the substrate a **VR Duplo-based programming language**.
You walk into the workshop. You pick up a brick. You see what it
does (label), what it talks to (sockets), what it needs (anchors).
You click it onto another brick. You run the assembly. You are
programming, in VR, with Duplo.

From there, the library *evolves*:

- **Generation 1 (Lego-base)** — standard 2×2, 2×4, 1×4, 2×6
  silhouettes. Studs on top, anti-studs underneath. Pins encode
  state-slice sockets (cyan dots), type plugs (square pins),
  dependency anchors (triangle tabs).
- **Generation 2 (mutation)** — same silhouettes with mutated pin
  layouts: hex-arrayed studs (encoding 6-way state-bus access),
  edge-mounted plugs (the brick passes a signal through its side
  instead of its top), recessed sockets (input-only bricks).
- **Generation 3 (Pokémon-stage evolution)** — a brick that's been
  composed into a working pipeline N times *evolves* its mesh: more
  facets, brighter facet glow, additional plug points that didn't
  exist on the base form. Bricks that "see use" become richer
  objects; bricks that sit on shelves stay base-form.
- **Generation 4 (cross-pollination)** — two bricks that have been
  reliably paired *breed*: an offspring brick appears in the
  library combining their plugs and a Cubist surface that visibly
  inherits from both parents. This is the genome-everything thesis
  reaching the brick mesh layer.

The Lego-base discipline matters because:

- A first-time visitor recognises the substrate without onboarding.
- Mutations are *additive* to a familiar form — readable as
  variants rather than novel shapes.
- The evolution pressure has somewhere to push *from* — Lego is
  the ground state, every divergence is measurable against it.

Implementation hook: `lib/bricks/genome.ts` (future) holds the
brick genome — a tetromino silhouette + stud array + facet
parameters. The brick renderer (`components/bricks/brick.tsx`,
also future) consumes the genome + a `CapabilityRecord` to draw a
specific instance. Evolved variants are stored alongside the
parent and selected by usage frequency, not at random.

## What this doc is NOT

- Not a 3D modelling spec — the meshes themselves come later.
- Not a UX flow — picking up, snapping, running bricks is its own
  spec.
- Not a renderer choice — WebGPU TSL is the implementation target
  (per `docs/ARCHITECTURE.md` substrate section) but this doc is
  agnostic to that.

This file describes the **encoding**: how a typed capability
becomes a thing the user grabs.
