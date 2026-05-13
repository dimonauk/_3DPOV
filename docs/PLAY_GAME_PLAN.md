# Play — the studio's proving ground

Developer-facing design document for the AR game at `/play`.

## v0.1 status — what is live as of this pass

The closed mini-loop is playable. Four solo levels have v0.1
mechanics that pass on real conditions; the other eight levels are
designed and stubbed. The page reads honestly about which level is
which.

| Level                | Status  | v0.1 mechanic                                                                                                              |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Solo 1 · Module      | preview | Prompt-bank + 4 brushes + module-fits-prompt pass gate. Saves the brush choice to `localStorage` for Trail to read.        |
| Solo 2 · Trail       | preview | Angular-sync HUD; pass on ≥200 vertices AND ≥1 rad/s mean angular velocity. Reads the Module pass to drive the brush.      |
| Solo 3 · Loop        | preview | Five-stage cascade (Draw → Capture → Reify → Encounter → Pass) with a real marching-cubes pass at 16³.                     |
| Solo 4 · Witness     | preview | Deterministic cold-eye narration from geometric heuristics, mode-coded against the 5-mode chrono palette.                  |
| Solo 5–8, Braid 1–4  | future  | Stubs only. v0.2 plans below.                                                                                              |

**Implementation choices made in this pass.**

1. Module level inherits Tilt Brush's curated-palette philosophy.
   Four brushes at v0.1 chosen for clear differentiation; the
   roadmap names expansion to ~20 in v0.2 and a Rookery-tier benefit
   for community-contributed brushes in v0.3+.
2. The marching-cubes implementation is Three.js's canonical
   `MarchingCubes` from `three/examples/jsm/objects` rather than an
   inline minimal port. The library is already a dependency, the
   types are vendored, and the chunky-at-16³ aesthetic matches the
   reified-object feel the level wants. No new packages installed.
3. Witness narration is deterministic on geometric heuristics at
   v0.1. The Gemini cold-eye route is mapped for v0.2 but is wrong
   for real-time per-second narration on cost and latency grounds.
4. Witness observations are colour-coded against
   `lib/chrono-protocol.ts` — AMBER kinetic, AZURE slow-flow,
   AMETHYST rupture, CRIMSON force, VERIDIAN pattern. This is
   Beat Saber's mode-coded-targets pattern adapted to the chrono
   palette; it is the first integration point between the proving
   ground and the chrono protocol the studio is shipping into.
5. The Holoflow Loop is six positions in canon; Loop level
   condenses to five because the opening and closing "body in
   space" positions collapse into one continuous bracket — the
   visitor is the body the whole way through. The five-stage
   cascade is named in the scene with a label at the top.

## Overview

The game is a two-phase ladder of twelve levels. Phase one is eight
solo levels, each of which isolates and proves one thread of the
studio's philosophy by being that thread. Phase two is four braided
levels — the 2-braid, the 3-beat weave, the 5-beat, and the full
weave — that teach the player to combine the threads the same way the
body learns to combine poi moves: master each move alone, then learn
the weave.

The proof is recursive at four orders:

1. **The mechanic proves the thread.** Each level's gameplay is the
   thread it claims to demonstrate; the player cannot finish the level
   without performing the philosophy.
2. **The render proves the rig.** The game renders angular-sync
   trails because the studio's POV LED rigs are built on angular-sync
   firmware. Playing the game is rehearsing the rig's logic.
3. **The session proves the Loop.** A complete session closes all six
   positions of the Holoflow Loop inside one playthrough — body in
   space, light written, trail captured, trail reified, trail
   encountered, body in space again.
4. **The structure proves the pedagogy.** The solo-then-braided
   structure is the studio's poi teaching method. The game teaches
   philosophy the way the practice teaches the body.

### Integration principle

Every level consumes from and contributes to existing data layers.
No level invents a sub-product. The Loop level reads `lib/loop.ts`;
the Curriculum level reads `lib/curriculum.ts`; the Perch level
routes through `lib/rookery/tiers.ts`; the Witness level dispatches
to `/api/aura/watch` and reads `lib/aura/prompts.ts`. The game is the
studio's data layers, made playable.

The pedagogical model is poi vocabulary applied to thought:

- **Solo**: the body learns each move alone, eyes closed, until the
  geometry is in the hands. Each solo level is a single thread
  practised in isolation.
- **Braid**: once the moves are in the body, they get woven. The
  2-braid is the first weave. The 3-beat weave is the classic poi
  move. The 5-beat tightens. The full weave runs all eight threads on
  one sustained gesture.

---

## Phase 1 — Solo Levels

### Solo 1 · The Module · `/play/module`

**What it proves.** Modularity at small scale. The player picks the rig
before they swing it; the swap that consumer hardware cannot afford is
the swap this game is built on.

**The mechanic.** A picker UI presents three or four brush modules
(thin line, fat brush, dotted, additive smear). The level prompts for
a specific drawing — "draw a sword", "draw a beam", "draw a star
field". Selecting the wrong module makes the drawing impossible. The
selection is the gesture; the swing comes second.

**Pass condition.** Match the brush module to the prompt and complete
the drawing inside it. A sword with a fat brush; a beam with the
additive smear; a star field with the dotted module. Wrong module =
wrong tool = level cannot pass.

**Integration points.**
- Reads: the prompt-bank (TBD: `lib/play/prompts.ts`), the four brush
  parameter sets (TBD: `lib/play/brushes.ts`).
- Writes: the player's chosen module to `levelStates["module"]` in
  `lib/play/state.ts` when the level passes.
- Dispatches: the picked brush parameters to `<TrailLine />` so the
  trail-line primitive renders with the selected module's character.

**What ships in v0.1 (live).** Prompt-bank of eight prompts
("draw a sword", "draw a beam of light", "draw a fire trail", "draw
a field of stars", "draw a thrown shape", "draw a calligraphic
curve", "draw a glow", "draw a rhythm of beats"). Four brushes:
**Thin Line** (cyan, sharp), **Fat Brush** (pink-200, wide),
**Dotted** (chrome, intermittent sample-keep at 18%), **Additive
Smear** (gold, soft, low opacity). A live mouse-draw mini-canvas
renders the trail with the picked brush's parameters. Pass-condition
gate is real: pick the right module for the prompt and draw at least
32 vertices. On pass, the brush slug is written to `localStorage`
under `holoflow.play.module.choice` and `holoflow.play.module.passed`;
Trail level reads from this on mount. On fail (wrong brush), the
"wrong tool" reason text appears with the prompt-specific reason
spelled out — the lesson lands on which module fits, not on the
drawing.

**What ships in v0.2+.** Expansion to ~20 brushes per Tilt Brush's
curated-palette philosophy: light-only brushes (neon, hairline,
chromatic-aberration), mass brushes (sword, beam, ribbon), pattern
brushes (dotted, dashed, stippled), texture brushes (additive smear,
fire, smoke, water, electricity). v0.3+ adds a Rookery-tier benefit
for community-contributed brushes — paid members upload brush
parameter JSON to a `/brushes` Firestore collection; the picker
loads them alongside the curated set with a "by member" badge. v0.4
adds the Aura cold-eye mismatch loop: on wrong-tool, Aura narrates
why the module fights the prompt.

**Dependencies.**
- `lib/play/brushes.ts` — brush parameter sets (line width, dot
  density, additive falloff). Not yet written.
- `<TrailLine />` accepting a `brushModule` prop. Currently the
  primitive only takes a colour.
- The Aura narration pipeline for the v2 feedback loop.

**Open design questions.**
- How many brush modules in v1? Three keeps the picker uncluttered;
  four covers more of the prompt-space.
- Does the player see the prompt before or after picking? Before
  reads as "pick the right tool"; after reads as "discover the right
  tool". The former matches the pedagogy.

---

### Solo 2 · The Trail · `/play/trail`

**What it proves.** Persistence of vision as angle, not clock. The
trail is written by where the pointer is, not when the pointer fires;
the same architectural choice the studio's POV LED rigs are built on.

**The mechanic.** A single pointer, a single gesture. The trail
accumulates the way a long exposure accumulates light. No module
choice yet — just the move on its own.

**Pass condition.** Hold the gesture continuous. Time-sync gives
dots; angular-sync gives the curve. The shape only emerges if the
body keeps moving.

**Integration points.**
- Reads: nothing yet — the trail is the canonical starting point.
- Writes: trail snapshots to local React state (in v1) and to
  Firestore via `lib/rookery/client.ts` once the publish pipe lands
  (v2, shared with the Perch level).
- Dispatches: nothing in v1. In v2 the trail dispatches to the
  Witness level's narration pipe when the player toggles the Witness
  overlay.

**What ships in v0.1 (live).**
`components/play/play-scene.tsx` renders the mouse-draw R3F scene
with the trail-line primitive **plus** the angular-sync HUD top-left:
a live rad/s bar and a mean rad/s bar, with a numeric readout. The
pass gate is real and enforced: ≥200 vertices AND ≥1 rad/s mean
angular velocity on commit. Below either threshold the
release shows a "held back" panel naming exactly which threshold
failed; the trail is discarded. The brush parameters are read from
the Module level's `localStorage` choice — Thin Line otherwise. The
XR session entry button is still stubbed pending `@react-three/xr`.

**What ships in v0.2+.** Persistence to Firestore `/trails`. A
"replay your last trail" button that scrubs through the gesture
point by point. Quest 3 controller input via `@react-three/xr`
(coordinated with the Bezel level). Angular-sync threshold tuning
based on real session data once the proving-ground analytics land.

**Dependencies.**
- `@react-three/xr` for the XR entry (not yet installed).
- The Firestore `/trails` collection for persistence (queued behind
  the Perch level wiring).

**Open design questions.**
- What counts as "continuous" for the pass-condition? A
  duration threshold? A minimum vertex count? A no-stall check?

---

### Solo 3 · The Loop · `/play/loop`

**What it proves.** The Holoflow Loop in one session. Six positions,
one closed circuit; here, condensed to a single gesture that travels
through all six.

**The mechanic.** Draw a trail. The trail is captured (frozen),
reified as a small 3D mesh (a marching-cubes pass), and encountered
(a rotate-around view of the object you just made).

**Pass condition.** Recognise the shape of your own gesture in the
reified object. The loop has closed when the body that drew it sees
what it left behind.

**Integration points.**
- Reads: `lib/loop.ts` for the six-position labels and transitions.
  The Trail level's last snapshot (lifted into a shared store).
- Writes: the reified mesh's geometry to a temporary store; not
  persisted in v1.
- Dispatches: the trail points into a marching-cubes pipeline (TBD).

**What ships in v0.1 (live).** Five-stage cascade in one scene:
Draw → Capture (1s freeze + wireframe frame) → Reify (2s fade-in of
the marching-cubes mesh) → Encounter (5s autonomous orbit with
`OrbitControls` overlaid so the visitor can grab the camera) →
Pass (overlay with "Send to the Rookery" button — the Firestore
write is stubbed via a `sonner` toast, the persistence pipe lands
with Solo 7). The marching-cubes pass uses
`three/examples/jsm/objects/MarchingCubes` at 16³ resolution; each
trail vertex stamps a Gaussian blob with `addBall` after the trail
is normalised into the ±1 field. The reified mesh renders as a
chrome-cyan `MeshStandardMaterial` with emissive glow. The Holoflow
Loop is six positions in canon; this level condenses to five because
the opening and closing "body in space" positions collapse into one
continuous bracket — the visitor is the body the whole way through.

**What ships in v0.2+.** STL export of the reified mesh so the
visitor can carry the object out of the browser. A "did this match
your intention?" yes/redraw prompt (an explicit pass-condition
beyond the cascade running). Resolution bump to 32³ once the
perf-budget is profiled on commodity hardware. Eventually the
nine-second print pipeline — the same one the studio runs locally —
takes the STL and lands a printable object on the bench.

**Dependencies.**
- Marching-cubes implementation. Either ship a JS port or run a
  fetch to a local-only worker.
- Shared trail-snapshot store (TBD: `lib/play/store.ts` — a
  lightweight zustand/context model).

**Open design questions.**
- Is the reified mesh real-time or a freeze? Real-time keeps the loop
  legible; freeze gives a cleaner object.
- Should the mesh be exportable as STL? It would prove the
  reification more concretely but adds a save flow.

---

### Solo 4 · The Witness · `/play/witness`

**What it proves.** Cold-eye watching. The studio's video-reading
prototype turned inward on the visitor's own trail — Aura describes
what is on the canvas, not what the visitor intended.

**The mechanic.** Aura narrates as you draw. Her cold-eye reading
appears as an overlay, segment by segment; once the audio synth is
wired in, she speaks it in her own voice.

**Pass condition.** Compare Aura's description to what you intended.
The level passes when the player sees the gap between intent and
trace and either accepts it or redraws.

**Integration points.**
- Reads: `lib/aura/prompts.ts` (`WATCH_PROMPT_FLAT`).
- Dispatches: trail point-history to `/api/play/witness` (TBD, mirrors
  `/api/aura/watch`). The route uploads the trail as
  rendered frames to the Gemini Files API and runs the cold-eye
  prompt. The reading is returned as JSON; Aura's voice rewrite
  happens in a separate read-back pass.

**What ships in v0.1 (live).** A real-time deterministic narration
generator. As the visitor draws, the scene samples the trail once
every 1.1 seconds and computes geometric heuristics: arc length, net
translation, curvature spikes (turn count), mean/min/max speed,
self-intersection, dominant compass direction. Heuristics map to a
pool of Aura-register observations ("A trail beginning. The line
moves rightward.", "The line turns — sharper than the segment
before it.", "The hand slowed. The line is breathing.", "A return.
The line has met its own past."). Each observation is colour-coded
against `lib/chrono-protocol.ts` — AMBER kinetic, AZURE slow-flow,
AMETHYST rupture, CRIMSON force, VERIDIAN pattern — and rendered
with a colour dot beside the line. Already-said observations are
held back to keep the narration fresh. On release the scene
compiles the heuristics into a one-line summary ("What I saw:
a winding line, drawn quickly, with 6 turns over 412 samples.") with
Accept and Redraw buttons. Either button passes the level — the
lesson is the gap between intent and trace, not which response.

**What ships in v0.2+.** A `/api/play/witness` route that mirrors
`/api/aura/watch`: trail rasterised to image segments, dispatched
to the Gemini Files API with `WATCH_PROMPT_FLAT`. Cold-eye reading
returned as JSON; the deterministic heuristics drop to a fallback.
ElevenLabs synthesis through `READ_PROMPT_AURA` so Aura speaks each
observation in her own voice with viseme lip-sync. Persistence of
the cold-eye reading alongside the trail snapshot so the Rookery
can show "what Aura said" beside each published gesture.

**Dependencies.**
- The /watch route's Gemini pipeline (already in
  `app/api/aura/watch/route.ts` — Witness can mirror it).
- ElevenLabs for the audio side. Not wired yet.

**Open design questions.**
- Frame-rate of the trail-to-image conversion. Too high and Gemini
  costs spiral; too low and the narration lags the gesture.
- Does Aura narrate as the player draws, or after they release?
  During = the cold-eye reads in real time. After = a single
  considered passage.

---

### Solo 5 · Sovereignty · `/play/sovereignty`

**What it proves.** Local-first architecture. Every layer keeps
working if a vendor pivots or the connection drops; sovereignty mode
is the demonstration the visitor can run with their own router
unplugged.

**The mechanic.** A toggle severs the network. The trail logic keeps
working — same render, same cache, same local state.

**Pass condition.** Complete a drawing with the connection cut. The
architecture passes the test the visitor's router can run on demand.

**Integration points.**
- Reads: a service-worker registration that intercepts every outbound
  request when the toggle is on.
- Writes: nothing different from the Trail level; the point is that
  nothing else changes.

**What ships in v0.1 (stub).** A decorative toggle in
`sovereignty-scene.tsx` that does not actually sever the network.

**v0.2 implementation plan.**

*Dependency chain:*
1. Service worker bootstrap for Next.js 16 + Turbopack. Next.js
   does not ship a Workbox plugin by default; the route is to write
   `public/sw-sovereign.js` by hand and register it from a client
   component in `components/play/sovereignty-loader.tsx`.
2. A pre-warm pass on first visit: the service worker pulls the
   `/play/sovereignty` route's JS bundle, the Three.js chunks, the
   `Inter` fonts, and the Tailwind CSS into a named cache
   (`holoflow-sovereign-v1`).
3. A toggle component that posts a `{type: "sovereign", mode: "on"}`
   message to the service worker; the worker then short-circuits
   every fetch that is not in the named cache and returns 503.
4. A "Sovereignty: severed" banner overlaid on the play scene while
   the toggle is on, with a live count of dropped requests for
   honesty.

*Pass condition:* the visitor toggles sovereign mode, draws a
trail that passes Trail-level's vertex + angular thresholds, and
the trail commits. Network panel shows 503s for the outbound
analytics call. The level passes when the visitor can demonstrate
the trail finished entirely from cache.

*Test pass criteria:*
- Disable Wi-Fi on the test machine. With sovereign mode off, the
  page reload fails. With sovereign mode on, the page reload
  serves and the level completes.
- The service worker drops at least the Vercel Analytics beacon
  and any Firebase write.

*v0.x milestone target:* v0.5.

*Open design questions.*
- What counts as "essential" for the offline cache? JS bundle is
  obvious; fonts and CSS are queued. Splat assets and any 3D
  models are explicitly out — the level proves the gesture works
  offline, not the whole site.
- Does the toggle persist across sessions? A toggle that survives
  a hard reload is honest about the architectural choice.

---

### Solo 6 · The Curriculum · `/play/curriculum`

**What it proves.** Self-taught learnability. The position the studio
has always held is that anyone willing to sit and learn can get to
this work; the curriculum level is that position made into experience.

**The mechanic.** Pick one of the seven learning ladders on `/learn`.
The level renders the first rung as an in-game exercise.

**Pass condition.** Finish one rung's exercise. The body has now
performed the act the studio writes about.

**Integration points.**
- Reads: `lib/curriculum.ts` — the seven ladders.
- Writes: the completed rung to `levelStates["curriculum"]`.
- Dispatches: nothing; the exercises are self-contained.

**What ships in v0.1 (stub).** The seven-ladder picker with the
first rung named for each. Stub: `curriculum-scene.tsx`. No exercise
runs yet.

**v0.2 implementation plan.**

*Dependency chain:*
1. An exercise-framework primitive at `lib/play/exercise.ts` that
   standardises start / running / pass / fail and a single React
   hook each scene mounts.
2. Seven micro-exercises, one per ladder, each a self-contained
   `<LadderExercise />` component reading the rung from
   `lib/curriculum.ts`. The micro-exercises are deliberately
   small (~60 seconds each):
   - **Photography ladder rung 1:** aim a virtual camera at a
     moving point source; tune shutter via slider; pass when the
     simulated long exposure produces a visible streak.
   - **POV rigs rung 1:** wire a virtual LED on a breadboard SVG;
     click-and-drag to connect; pass when the circuit lights.
   - **Programming rung 1:** drag-and-drop a four-frame POV
     sequence onto a timeline; pass when the frame order matches
     the prompt.
   - **Practice rung 1:** maintain a steady drawing rhythm to a
     metronome beat for eight cycles; pass via Trail-level's
     angular-sync gate.
   - **Writing rung 1:** read a passage from the studio's
     existing canon; click the sentence that names the thesis;
     pass on correct selection.
   - **Fabrication rung 1:** rotate a Three.js mesh of a hangar
     part with `OrbitControls`; pass when the orientation matches
     the target within a tolerance.
   - **Aura rung 1:** read a short Aura passage; identify which
     chrono mode the register reads as from a five-option picker.

*Pass condition:* visitor finishes any one rung's exercise. The
seven-ladders-at-once thesis ("anyone can sit and learn") lands
when the visitor completes a rung from any ladder; requiring all
seven would over-scope and contradict the self-taught invariant.

*Test pass criteria:* each exercise can be passed in ≤90 seconds
by a visitor reading the rung blurb cold.

*v0.x milestone target:* v0.6.

*Open design questions.*
- Does the picker show progress across ladders? A grid of
  completed-rungs would tempt the visitor to complete more
  rungs, which is good; but the level passes on one, which is
  the architectural point.
- Should the exercises share visual language with the rest of
  /play, or each lean into the ladder's own aesthetic?

---

### Solo 7 · The Perch · `/play/perch`

**What it proves.** Trans-led community gating. The Rookery's quiet
door policy admits anyone who can pay; the published trails are a
wall of community gesture, sorted by the subscription, not by
moderation.

**The mechanic.** Publish a trail to the Rookery feed. The
subscription gate is the door the level routes through; non-members
see the gate, not a workaround.

**Pass condition.** See your trail on the wall and reply to another
member's trail. The community position is passed when the visitor's
gesture becomes someone else's prompt.

**Integration points.**
- Reads: `lib/rookery/tiers.ts` for the subscription gate copy;
  the user's auth state from `components/auth/auth-provider.tsx`.
- Writes: a `Thread` via `createThread()` in
  `lib/rookery/client.ts` with the trail as the body. The trail's
  point array can be JSON-stringified into the body until a richer
  trail-thread type lands.
- Dispatches: a Stripe checkout on the gate hit, once Stripe is
  wired.

**What ships in v0.1 (stub).** A disabled "Publish trail" button
with the gate copy. Stub: `perch-scene.tsx`.

**v0.2 implementation plan.**

*Dependency chain:*
1. Stripe wired into the site. The interest-list flow at
   `/api/rookery/onboarding` is the existing infrastructure to
   route through; the Perch level routes that interest into an
   actual checkout once the price IDs are configured.
2. Subscription check against `/rookery_members/{uid}` in
   Firestore, populated by a Stripe webhook-fed cache.
3. A `<TrailThread />` component at
   `components/rookery/trail-thread.tsx` that renders a captured
   trail as a Rookery feed thread. The trail's points are stored
   as a JSON blob on the thread document; the component lazy-mounts
   an R3F canvas for the preview when the thread enters the
   viewport.
4. Reply UI extending the existing `createThread()` /
   `createReply()` pattern in `lib/rookery/client.ts`.

*Pass condition:* the visitor publishes a trail to the Rookery
(non-members see the subscription gate at the publish step, not a
workaround) and posts a reply to at least one other member's
trail. The community thesis lands when the visitor's gesture
becomes someone else's prompt.

*Test pass criteria:*
- Non-member sees the gate copy when "Publish" is clicked,
  followed by the Stripe checkout iframe.
- Paid member's publish lands a new document in `/trails` and a
  thread in `/rookery_threads`.
- Reply UI lands a reply document tied to the parent.

*v0.x milestone target:* v0.8 (queued behind Bezel because
Stripe-with-webhook is the largest single integration on the
roadmap).

*Open design questions.*
- How does the trail render in a thread? Inline R3F scene (rich,
  expensive) or static SVG (cheap, less honest about the gesture)?
  Compromise: static SVG by default, R3F on hover or click.

---

### Solo 8 · The Bezel · `/play/bezel`

**What it proves.** The bezel-clip product, ahead of shipping. The
same persistence-of-vision firmware family that will run on the
clip, here as a software simulation; the buyer holds the future
product before it ships.

**The mechanic.** WebXR mode with a Quest 3 controller. The
controller is treated as if a clip-on bezel were already on it; the
same angular-sync firmware runs in JavaScript and draws in 3D space.

**Pass condition.** Draw a trail in 3D space with the
controller-as-bezel. The visitor has held the product the studio is
building.

**Integration points.**
- Reads: the controller pose stream from `@react-three/xr`.
- Writes: 3D trail points (instead of the 2D plane-projected ones in
  the Trail level).
- Dispatches: nothing; the level is fully local.

**What ships in v0.1 (stub).** A stubbed WebXR entry button with
the contract named. Stub: `bezel-scene.tsx`.

**v0.2 implementation plan.**

*Dependency chain:*
1. `@react-three/xr` installed and pinned. The page imports
   `<XRButton />` and `<Controllers />` directly; the package
   ships type definitions.
2. WebXR session entry from the Perch button on the Bezel scene.
   The browser falls back cleanly when WebXR is unavailable —
   desktop sees a "WebXR not detected" panel.
3. Quest 3 controller mapping. The right-hand controller's grip
   pose drives a 3D trail in world space, mirroring the
   plane-projected 2D trail in the Trail level. Trigger pulled =
   drawing; trigger released = commit.
4. A port of the studio's angular-sync firmware logic into
   JavaScript — the same modulus-of-rotation-angle math that
   runs on the bezel firmware. The level explicitly inherits the
   Quest 3 controller's hand-pose precision (≥60 Hz, sub-mm) as
   the firmware target the bezel-clip product will match. Hand
   Physics Lab is the precision reference.

*Pass condition:* visitor draws a trail in 3D space with the
controller-as-bezel. The same angular-sync threshold as the
Trail level (≥1 rad/s mean, in 3D rotation rather than 2D) gates
the pass. On pass: "you have held the bezel firmware in your
hand."

*Test pass criteria:* a Quest 3 visitor lands on /play/bezel,
clicks "Enter WebXR," draws, releases trigger, sees the pass
screen. The 3D trail persists in the scene and rotates with the
visitor's head.

*v0.x milestone target:* v0.7.

*Open design questions.*
- Does the bezel level offer a desktop fallback? Probably not —
  the firmware-in-hand proof is the architectural point. Desktop
  visitors see the "Bezel requires WebXR" panel with a link to
  `/bezel` (the interest list).
- Does the level render the bezel as a controller skin in the
  scene? A model of the clip on the controller would make the
  product visible while the gesture is happening.

---

## Phase 2 — Braided Levels

### Braid 1 · The 2-Braid · `/play/the-2-braid`

**What it proves.** First weave. Two threads at once — the player
chooses which two from the eight they have already passed solo. The
weave teaches what no single thread teaches: that the threads inform
each other.

**The mechanic.** Pick any two solo levels. The game stages a single
performance that requires both threads active at the same time.
Module + Trail is the typical first pair; Witness + Sovereignty is
the harder choice.

**Pass condition.** Complete a single gesture in which both chosen
threads are demonstrably load-bearing — remove either thread and the
performance fails.

**Prerequisite logic.** Any two solo passes suffice. Checked at
runtime via `eligibleLevels()` in `lib/play.ts`.

**Thread-combination mechanics.** Simultaneity. Both threads run on
the same gesture, in parallel. The level's logic is the AND of the
two thread requirements.

**Integration points.** Inherits the integration of both picked
threads.

**What ships in v0.1 (stub).** Thread picker UI; rhythm-strip
placeholder. Stub: `braid-scene.tsx` parameterised by
`threadCount=2`.

**v0.2 implementation plan.**

*Dependency chain:* Solo 1–4 in preview (already landed in this
pass). The 2-braid is the first weave that depends on multiple
solo mechanics being actually playable.

*Mechanic:* Module + Trail is the canonical first pair. The
visitor picks two solo levels from a picker. The scene mounts a
single canvas in which both mechanics run on the same gesture:
the Module picker is shown above the canvas, the Trail's
angular-sync HUD sits left, and the pass-condition is the AND of
both — pick the right module for the prompt AND draw to the
Trail thresholds. Removing either requirement makes the level
trivially passable; both load-bearing is the lesson.

*Pass condition:* a single uninterrupted gesture in which both
chosen threads' pass-conditions are met simultaneously.

*Test pass criteria:* Module+Trail combo can be passed in ≤30
seconds by a visitor with both solos passed.

*v0.x milestone target:* v0.9 (after all eight solos at preview).

---

### Braid 2 · The 3-Beat Weave · `/play/the-3-beat-weave`

**What it proves.** The classic poi move applied to philosophy.
Three threads in rhythm; the rhythm itself is the lesson.

**The mechanic.** Three threads chosen by the player. The
performance is timed — the threads have to alternate on a rhythm
rather than firing simultaneously.

**Pass condition.** Complete eight clean cycles of the three-thread
alternation without dropping the rhythm.

**Prerequisite logic.** Any three solo passes.

**Thread-combination mechanics.** Alternation on a triplet beat.
Thread A on beat 1, thread B on beat 2, thread C on beat 3,
repeating.

**Integration points.** Inherits the three picked threads; adds a
rhythm engine.

**What ships in v0.1 (stub).** Same picker / rhythm-strip stub.

**v0.2 implementation plan.**

*Dependency chain:* Solo 1–5 in preview. The 3-beat weave needs
enough solo passes that picking three meaningfully different
threads is a real choice.

*Mechanic:* Synth-Riders flow-rhythm, **not** Beat Saber chop.
Three threads alternate on a slow triplet beat (~90 BPM) drawn
as a rhythm strip across the canvas top. Visitor's gesture has
to satisfy thread A's condition on beat 1, thread B's on beat 2,
thread C's on beat 3, repeating. The rhythm engine is a single
`useFrame` loop that emits beat events; each thread mechanic
listens for its turn.

*Pass condition:* eight clean cycles. Drop one beat and the
counter resets to zero.

*Test pass criteria:* a visitor who has passed any three solo
levels can pass the 3-beat in ≤90 seconds of rhythm.

*v0.x milestone target:* v0.95.

---

### Braid 3 · The 5-Beat · `/play/the-5-beat`

**What it proves.** The advanced weave. Five threads in rhythm; the
failure modes multiply, and the discipline becomes recovery rather
than execution.

**The mechanic.** Five chosen threads on a tighter rhythm. The game
accepts up to two dropped beats per cycle as the level becomes about
graceful recovery, not perfection.

**Pass condition.** Complete five cycles with at most two recovered
drops.

**Prerequisite logic.** Any five solo passes.

**Thread-combination mechanics.** Alternation on a five-beat
pattern; recovery accounting per cycle.

**What ships in v0.1 (stub).** Same picker / rhythm-strip stub.

**v0.2 implementation plan.**

*Dependency chain:* Solo 1–6 in preview. The 5-beat needs five
solid solo mechanics to thread.

*Mechanic:* five threads on a tighter rhythm (~120 BPM, quintuplet).
The rhythm engine from the 3-beat weave is extended with drop +
recovery accounting per cycle. A drop registers when the
expected thread's mechanic fails to fire; a recovery registers
when the next cycle catches up gracefully. Up to two recovered
drops per cycle is accepted.

*Pass condition:* five cycles with at most two recovered drops
per cycle. The lesson is recovery as the practice, not
execution-without-error.

*Test pass criteria:* a visitor who has passed five solos can
complete the 5-beat with one practice cycle.

*v0.x milestone target:* v0.95.

---

### Braid 4 · The Full Weave · `/play/the-full-weave`

**What it proves.** All eight threads active at once. The studio's
whole philosophy operating simultaneously in one performance. This
is the level the entire ladder has been pointing toward.

**The mechanic.** All eight threads required. The performance is a
single continuous gesture in which Module choice, angular-sync
trail, the closed loop, Aura's cold-eye, sovereignty mode, a
curriculum rung, a Perch publish, and the Bezel controller mode are
all demonstrably present.

**Pass condition.** Hold the full weave for one minute. At the end of
that minute, the visitor has used every thread of the studio's
philosophy in a single sustained gesture.

**Prerequisite logic.** Every solo level passed. Explicit
`requires: ["module", "trail", "loop", "witness", "sovereignty",
"curriculum", "perch", "bezel"]`.

**Thread-combination mechanics.** Simultaneous + sustained. All
eight thread runtimes mounted at once, gated on a one-minute
continuous-gesture timer.

**What ships in v0.1 (stub).** Same picker / rhythm-strip stub.

**v0.2 implementation plan.**

*Dependency chain:* every solo level passed. Explicit
`requires: ["module", "trail", "loop", "witness", "sovereignty",
"curriculum", "perch", "bezel"]`. This is the last level to
ship; it depends on every other level being at v0.2 preview at
minimum.

*Mechanic:* one-minute continuous gesture in WebXR. All eight
thread runtimes mounted on the same canvas. Module choice is
declared at entry; Trail's angular-sync gates the brush;
Sovereignty mode is on (the network is severed for the duration);
Loop's marching-cubes pass runs on the trail every 10 seconds
and the reified mesh hovers nearby; Witness narrates over the
gesture as it goes; Curriculum's chosen rung runs a parallel
exercise on the side panel; Perch publishes the final trail to
the Rookery at the minute mark; Bezel is the controller drawing
the trail in 3D. All eight threads visible. All eight load-bearing.

*Pass condition:* hold the gesture continuous for 60 seconds with
all eight thread states satisfied. The trail publishes to the
Rookery with all eight thread signatures recorded.

*Test pass criteria:* a visitor with all eight solos passed can
complete a Full Weave in one or two attempts.

*v0.x milestone target:* v1.0.

---

## Roadmap

| Milestone                  | Level set                                                                  | Features added                                                                                                                                                  | Dependencies resolved                       |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **v0.1 — skeleton**        | Trail (preview, free-draw); other levels stubbed                           | Mouse-draw R3F scene; additive-blended trail-line primitive; per-level routes; stub scenes; progress model                                                      | None                                        |
| **v0.1 — closed mini-loop** (current) | Module, Trail, Loop, Witness all at preview with real pass-conditions      | Module prompt-bank + 4 brushes + module-fits-prompt gate; Trail angular-sync HUD + vertex/velocity pass gate; Loop 5-stage cascade with marching-cubes at 16³; Witness deterministic cold-eye narration colour-coded against the chrono palette | None                                        |
| **v0.2**                   | + Module (full brush library, ~20)                                         | Module brush expansion; Aura mismatch loop on wrong tool                                                                                                        | None                                        |
| **v0.3**                   | + Trail (Firestore persistence + replay)                                   | Trail snapshots persisted; replay-the-gesture scrubber                                                                                                          | Firebase admin SDK wired into `/api/play/progress` |
| **v0.4**                   | + Loop (STL export + intention prompt); + Witness (Gemini route + audio)   | STL export from marching-cubes mesh; `/api/play/witness` route mirroring `/api/aura/watch`; ElevenLabs voice                                                    | None                                        |
| **v0.5**                   | + Sovereignty (preview)                                                    | Service worker registration; offline cache; sovereign-mode toggle                                                                                               | Service-worker bootstrap in Next.js + Turbopack |
| **v0.6**                   | + Curriculum (preview)                                                     | Exercise framework; one micro-exercise per ladder's first rung                                                                                                  | None                                        |
| **v0.7**                   | + Bezel (preview)                                                          | `@react-three/xr` install; XR controller pose-to-3D-trail wiring; angular-sync firmware port                                                                    | `@react-three/xr` package                   |
| **v0.8**                   | + Perch (preview)                                                          | Trail-as-thread component; subscription gate; reply UI                                                                                                          | Stripe checkout integration                 |
| **v0.9**                   | + 2-Braid (preview)                                                        | Simultaneity engine; thread-combination runtime                                                                                                                 | All eight solo levels at preview            |
| **v0.95**                  | + 3-Beat Weave, 5-Beat (preview)                                           | Synth-Riders flow-rhythm engine; cycle counting; drop / recovery accounting                                                                                     | None                                        |
| **v1.0**                   | + Full Weave (live); every solo level live                                 | One-minute continuous-gesture timer; full eight-thread mount in WebXR                                                                                           | Every level at v0.2+                        |

**Scope honest:** v1.0 is realistically 6–12 months of one-person
build. Each milestone above is a multi-week stretch. The bench will
ship them as they land; the page stays honest about which levels are
live, which are preview, and which are still stubs.

---

## Integration cross-references

Every level has at least one prose companion on the site. This is
the "building integrally" check — the game and the writing argue the
same threads, in two registers.

| Level | Prose companion(s) |
|-------|--------------------|
| Module | `/articles/why-i-build-modular`, `/bezel` |
| Trail | `/articles/why-i-build-my-own-rigs`, `/tutorials/programming-pov-frames` |
| Loop | `/the-loop`, `/articles/nine-seconds-prompt-to-printable` |
| Witness | `/watch`, `/articles/vr-as-psychological-system` (the prose argument for cold-eye watching) |
| Sovereignty | `/articles/on-the-shoulders-of-open-source`, `/stack` |
| Curriculum | `/learn` (all seven ladders) |
| Perch | `/rookery`, `/rookery/about`, `/rookery/tiers` |
| Bezel | `/bezel`, `/articles/vr-pov-controllers-the-product`, `/articles/sellotape-and-tilt-brush` |
| The 2-Braid | `/tutorials/spinning-fire-poi-safely` (the two-hand foundation) |
| The 3-Beat Weave | `/practice`, `/journal/year-one-fire` |
| The 5-Beat | `/journal/year-one-fire` (recovery as the practice) |
| The Full Weave | `/the-loop`, `/about` |

Every entry above is a route that resolves on the site today or is
openly named as pending in `lib/play.ts`. No invented routes.
