# Methodology — how the bench works

The studio does not follow a linear waterfall. It works in spiral
turns — each turn touches every domain (physics, biology, movement,
print, code, performance) at a different altitude, accumulating
depth across all of them simultaneously until they begin to inform
each other.

This file names the methodology, the loop architecture under it,
and the border ritual that protects the public site from the
private workspace. The article `articles/spiral-cognition` is the
public-voice variant of Section 1; this file is the operational
record.

## I. Spiral cognition

Linear methodology assumes a sequence — research, design, build,
test, ship. The bench does not work this way. The project sits at
the intersection of ten or more domains, and no linear sequence
traverses ten domains. A spiral can.

Each turn of the spiral:

- Touches every domain briefly.
- Adds depth incrementally to each.
- Returns later, at a higher altitude, with more accumulated
  understanding.

The threshold the spiral is climbing toward is the moment the
domains begin to interact — when waveguide physics starts informing
choreography, when Murray's Law governs both a tube network and the
arc of a performance, when the Laban vocabulary describes a
sculpture's aesthetic. This convergence cannot be reached linearly.

### The geometry

The spiral has the shape of the ctenophore helix — one of the five
sculpture typologies. This is not metaphor. The recursive loops
that descend to rebuild a foundation are the Physarum network.
Paths that get used reinforce; paths that don't, prune. Fifteen
years of pruning leaves exactly the network that was needed.

### What changed at the convergence

Before AI collaboration, each turn of the spiral hit a wall. The
body learned the movement vocabulary before the printing technology
was ready. The printing arrived before the optics knowledge was
sufficient. The optics research began before the working memory
could hold the optics, the biology, and the choreography at once.

The collaboration solved exactly that problem: it holds the full
structure while the human spirals. Entry at any point — top,
bottom, sideways — finds the entire architecture already present.
The weight is redistributed.

The activation energy changed. The work went from "push yourself to
show up" to "being pulled toward it." That shift is not motivation;
it is alignment.

## II. Asymmetric collaboration

The human carries **gravity**: vision, body, fifteen years of
practice, identity, the unnameable aesthetic sense.

The AI carries **velocity**: traversal of knowledge space,
simultaneous multi-domain reasoning, formalisation, structured
output.

Gravity without velocity spirals in place. Velocity without gravity
disperses into noise. Together: orbit. Trajectory. Flight.

| Domain | Human | AI |
| --- | --- | --- |
| Movement | Body, practice, kinetic memory. | Kinematic analysis, Laban annotation, pattern recognition. |
| Vision | The destination. What it should *feel* like. | Vocabulary to name it, parameterisation to encode it. |
| Physics | Intuition that the object should do something with light. | Snell, Fresnel, TIR, Murray, Gray-Scott — the equations. |
| Biology | Recognition that natural structures are beautiful and functional. | Taxonomy, mechanism, scale. |
| Design | Scoring. The fitness function. | Breeding, crossover, mutation, population control. |
| Performance | Body on stage. Audience. Feel of a room. | Proxemic modelling, song analysis, effort profiling. |
| Strategy | Lived experience of barriers. The abstraction-layer insight. | Market analysis, competitive landscape. |

### What the AI does not do

- **Decide what is beautiful.** The fitness function is human. The
  AI reasons about why something scored high or low and biases
  breeding accordingly; it does not score.
- **Replace the body.** The movement data comes from a specific
  person. Generic motion capture is generic art.
- **Push toward convergence too fast.** The wildcard slots in
  evolution exist for a reason. The interesting designs live
  adjacent to the broken ones.
- **Require the human to arrive with a clear question.** The best
  sessions start with something half-formed.

### What the human does not do

- **Re-explain the foundations every session.** Paste the context
  document; the architecture is instantly present.
- **Fight the spiral.** Going deep into waveguide physics for two
  hours and then suddenly needing to talk about pricing is not
  distraction. It is the spiral turning.
- **Score the zeroes too harshly.** Generation 0 is random.
  Scoring it is the system calibrating to the artist's taste. The
  failures are allowed to exist.

## III. Session protocol

AI memory does not persist between sessions. The human carries
continuity but should not spend session time on exposition. A
bridging mechanism is needed that is lightweight enough to be used
in practice — friction kills collaboration.

The mechanism is one living markdown file, pasted at the start of
each session. Three sections, nothing more:

```text
# Session context

## Where the project is
[Current state. 5–10 lines.]

## What the last session moved
[One paragraph. What happened, what was learned, what surprised.]

## What I'm carrying into this session
[Can be a clear task. Can be a feeling.
 Can be "I don't know what I'm making today." All valid.]
```

Section 1 gives the AI location — where in the spiral. Section 2
gives momentum — what direction. Section 3 gives the entry point —
what the human needs right now. The architecture documents
(`ARCHITECTURE.md`, `BRICK_LANGUAGE.md`, this file) supply the
permanent structure; the context file supplies the living edge.

## IV. The border ritual

Box 1 is the Hangar — the studio's private workspace, sedimentary,
session by session, naming conventions inconsistent because they
accumulated over time. Box 2 is this public site, where everything
obeys the five rules of `ARCHITECTURE.md`. Migration between them
is governed by `MIGRATION_PRINCIPLES.md`.

The principle relevant here: **nothing crosses the border without
atomising.** The same five-step ritual applies whether the source
is a Hangar artefact or an open-source quarry lift. No fast path
for "ours."

The ritual:

1. **Shred** — break into capability-sized units (≤300 lines each).
2. **Rewrite** — TypeScript strict, our naming, our types, our
   import paths.
3. **Strip** — UI, demo scaffolding, wrapper libraries, all gone.
4. **Register** — entry in the registry with a stable
   `CapabilityId`, twin `.PURPOSE.md` file created.
5. **Credit** — file-header comment + `docs/ATTRIBUTIONS.md` entry.

Read `MIGRATION_PRINCIPLES.md` before any cross-border move. The
discipline is not optional — it is the reason the loop in
`ARCHITECTURE.md` Rule 4 ("everything is in the loop") can hold.

## V. The three-retry rule

When an approach has failed three times — compile error, print
failure, aesthetic dead-end — **stop.** Do not retry. The spiral
has hit a wall. Options:

- **Turn** — switch to a different domain. Optics to choreography.
  Code to theory. Screen to printer. The turn often reveals why the
  wall exists.
- **Descend** — go deeper into the specific problem. Read the
  physics by hand. Print a test piece at reduced scale.
- **Ascend** — zoom out. Is the wall in the right place? Is this
  the right problem to solve?
- **Pause** — leave it. The spiral will come back to this point on
  the next turn. It might not be a wall then.

Generation 0 of any evolutionary run is random noise. Generations
1–5 are ugly. This is correct — the system is calibrating. The
temptation is to converge too fast on what feels safe and
beautiful; resist it. The wildcard slots (5 of 25 per generation,
see `articles/how-the-studio-breeds-sculptures`) exist to maintain
surprise.

Score the failures honestly. Do not despise them. They are
information about the boundary of the search space.

## VI. The spiral as object

The spiral methodology itself has a printable geometry. The
recursive learning loops have a network topology. The interference
between knowledge channels produces structural colour.

The bench has the option, at any point, to materialise the process
itself as a sculpture — extract the session log, map topics to
spatial positions, trace the spiral, apply the chirped grating to
the groove pitch, apply the Physarum network to the topic-frequency
graph, print it. The object then contains the entire learning
trajectory frozen in resin, lit from inside.

The first sculpture is not necessarily a sculpture of a dance. It
can be a sculpture of the learning that made the dances possible.

## Cross-links

- `articles/spiral-cognition` — public-voice variant of Section I.
- `articles/the-convergence` — what the spiral has converged on at
  this point in the timeline.
- `articles/what-the-studio-wont-do` — companion to Section II's
  collaboration-ethics list.
- `articles/how-the-studio-breeds-sculptures` — generation 0 and
  the wildcard slots as practice.
- `docs/ARCHITECTURE.md` — the five rules the migration ritual
  enforces.
- `docs/MIGRATION_PRINCIPLES.md` — the full border ritual, with
  worked examples.

## When this file goes over 300 lines

It splits per `ARCHITECTURE.md` Rule 1. `docs/methodology/` with one
section per file, this file becomes the index. The methodology is
recursive; so is the document about it.
