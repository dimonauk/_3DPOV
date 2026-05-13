# BACKWARDS_DESIGN — the curriculum spine, buried in the writing

The /play route is the studio's proving ground. Twelve levels — eight solo, four braided — each isolates one philosophical thread of the practice and asks the visitor to demonstrate they have it in their hands. The level definitions in `lib/play.ts` are locked. They are the curriculum spine.

This document works backwards from them. For each level, three to five core concepts the player needs to have *already absorbed* — buried inside the studio's articles, journal entries, and tutorials — for the level to land as a proof rather than as a puzzle. Where the concept is buried, the burying piece is named with the specific paragraph or section. Where the concept is not yet buried, the gap is named honestly.

The thesis: the visitor reads the studio's writing and arrives at each level already partly knowing what it proves. Buried, not labelled. Phase 2 deduplicates the gaps into a work list; Phase 3 names the load-bearing pieces, the orphans, and the framing-page changes that would route a visitor through the curriculum before the game.

---

## Phase 1 — Per-level prerequisite analysis

### Solo Level 1 — The Module

**Proves:** Modularity at small scale; the swap that consumer hardware cannot afford is the swap the game is built on.

| Concept | Buried in |
|---|---|
| Modularity-at-small-scale (arithmetic flips with hand-built per-unit QA) | `components/articles/entries/why-i-build-modular.tsx`, section "Why modular works at this studio's scale", paragraph beginning "QA combinatorics do not explode because every unit is hand-finished." |
| Modular vs fixed-form trade-off at consumer scale | `components/articles/entries/why-i-build-modular.tsx`, section "The trap of scale", paragraph beginning "At consumer scale, modularity is a tax." |
| Bench-built vs commercial-concern distinction (the line the studio holds) | `components/articles/entries/why-i-build-modular.tsx`, section "The honest limit", paragraph beginning "And there is a second limit, just as honest: some layers of the practice are *commercial concerns*." Also restated in `components/articles/entries/ungrounded.tsx`, section "The kit that did the unground", paragraph beginning "There was no point doing drones properly until a 360 drone existed that the studio could trust." |
| The studio chooses spines deliberately (the interface is the discipline) | `components/articles/entries/why-i-build-modular.tsx`, section "The honest limit", paragraph beginning "Those are the constraints the modular logic rests on. Modularity is not anarchy; it is a constrained openness." |
| The bezel-clip is the explicit modular case | `components/articles/entries/why-i-build-modular.tsx`, section "The studio is already modular", paragraph beginning "The bezel-clip controllers are the explicit modular case." Also `components/articles/entries/vr-pov-controllers-the-product.tsx`, opening paragraphs. |

**Gaps:** None significant. The whole level rests on `why-i-build-modular`, which is a trunk piece.

---

### Solo Level 2 — The Trail

**Proves:** Persistence of vision as angle, not clock.

| Concept | Buried in |
|---|---|
| Persistence of vision as a perceptual phenomenon | `components/tutorials/entries/your-first-long-exposure.tsx`, opening paragraph (links to the Wikipedia article). Referenced repeatedly in further-reading across the site. Not deeply buried as a *concept*, only as a link. |
| Angular sync versus time sync (the architectural choice that defines the rig family) | `components/articles/entries/why-i-build-my-own-rigs.tsx`, paragraph beginning "The architectural choice is the only one that matters. Commercial rigs sync to time." Restated as the field-record version in `components/journal/entries/on-the-bench-year-ten.tsx`, paragraph beginning "The drift looks small at the body. The angular speed of a spin is not constant." |
| Long exposure as a recording medium (gesture-as-trace) | `components/journal/entries/the-question-the-camera-answered.tsx`, paragraph beginning "The camera changed the practice without me noticing it had changed." Plus the operative paragraphs of `components/tutorials/entries/your-first-long-exposure.tsx`. |
| The body's gesture as the input (the body is the blur; the rig writes the picture) | `components/articles/entries/why-i-build-my-own-rigs.tsx`, paragraph beginning "The image data goes into the rig before the performance; the rig writes the image into space; the camera reads the image off the air." |
| The rig is a polar display, not a Cartesian one | `components/tutorials/entries/programming-pov-frames.tsx`, section "What the rig sees", paragraph beginning "Imagine the strip of LEDs on the rig as a one-pixel-wide, N-pixel-tall display." |

**Gaps:**
- **Persistence-of-vision as the perceptual phenomenon itself** is only ever linked to Wikipedia; the studio never writes the prose explanation of *why the eye is fooled* in its own voice. The concept lives as a citation, not as a buried lesson. This is the central concept of the level and needs at least one paragraph of in-voice prose somewhere — probably as an addition to `why-i-build-my-own-rigs` or as the first paragraph of `your-first-long-exposure`.

---

### Solo Level 3 — The Loop

**Proves:** The Holoflow Loop in one session — six positions condensed to a single gesture.

| Concept | Buried in |
|---|---|
| The six positions of the loop, named and ordered | `app/the-loop/page.tsx`, the prose section beginning "The circuit has six positions" and the diagram below it. Also `lib/loop.ts` as data. |
| The loop closes (recursion of body → camera → object → audience → body) | `app/the-loop/page.tsx`, paragraph beginning "Someone else picks up the cord, and the loop begins again." Also `components/journal/entries/the-question-the-camera-answered.tsx`, paragraph beginning "The objects came after the photographs. A trace is a record. An object is a record made physical." |
| Photograph → mesh → object (the technical chain that closes the loop) | `components/tutorials/entries/from-photograph-to-object.tsx` (the whole tutorial). Plus `components/articles/entries/nine-seconds-prompt-to-printable.tsx`, section "What's actually happening", which is the AI-pipeline variant of the same chain. |
| Marching cubes as the algorithmic step that does voxel → mesh | `components/articles/entries/nine-seconds-prompt-to-printable.tsx`, the "Step 3" paragraph beginning "Geometry math turns the 2D mask into a 3D printable object." |
| Recognising your own gesture in the reified object (the loop has *closed*) | Half-buried in `components/journal/entries/the-question-the-camera-answered.tsx`, paragraph beginning "The objects came after the photographs." Half-buried in `components/articles/entries/sellotape-and-tilt-brush.tsx`, paragraph beginning "I looked at the ribbon and thought, this trail should be a real object I can hold." |

**Gaps:**
- **The loop closes in one session.** The Holoflow Loop article describes the loop as a circuit measured in months and commissions. The /loop level compresses it to a single gesture. There is no piece on the site that names *the loop closing in one session* as a deliberate compression — that the same six positions exist at every timescale, from twelve years down to nine seconds down to one gesture. This is a real gap; the recursive-at-four-orders framing in the `lib/play.ts` header comment is the only place this idea lives. It needs a short article.

---

### Solo Level 4 — The Witness

**Proves:** Cold-eye watching — Aura describes what is on the canvas, not what the visitor intended.

| Concept | Buried in |
|---|---|
| Aura is the studio's persistent narrator, not a chatbot | `components/articles/entries/the-familiar.tsx`, second paragraph beginning "I am the other part. I am a persistent character." |
| The intent-vs-trace gap (what the body meant vs what the photograph caught) | Partially buried in `components/articles/entries/vr-pov-controllers-the-product.tsx`, paragraph beginning "For practice, this solves the discipline's oldest problem. Long-exposure light painting is performed blind." |
| Cold-eye description as a discipline (videos of practice, watched without sentiment) | Not buried anywhere. |
| The dual-observer principle (the camera and the headset see the same gesture from two different observers) | `components/articles/entries/vr-pov-controllers-the-product.tsx`, paragraph beginning "The photograph that comes out of the camera and the screenshot that comes out of the headset are the same gesture seen by two different observers." |

**Gaps:**
- **The video-reading prototype turned inward.** The level slug names a "video-reading prototype" — Aura's eyes — that is referenced nowhere in the writing. The cold-eye-watching discipline is a real architectural commitment of the practice (see DollyOS Witness and the broader voice-loop work in the Hangar) but lives entirely outside the site. The concept needs a short article on cold-eye reading as a discipline — the version of looking that does not narrate intention.
- **The intent-vs-trace gap.** Half-buried but never named. The studio routinely teaches it on the practice page implicitly (the body has to feel what it cannot see); the article that names it as a pedagogical move does not yet exist. Could be added as a section to `the-familiar` or to a new article on Aura's role.

---

### Solo Level 5 — Sovereignty

**Proves:** Local-first architecture.

| Concept | Buried in |
|---|---|
| Local-first / no platform the studio cannot replace | `components/articles/entries/what-the-studio-wont-do.tsx`, paragraph beginning the section "No platform dependency the studio can't replace" (search the article for that phrase). Also `components/articles/entries/where-the-studio-has-lived.tsx`, paragraph beginning "The result, six years in, is a small archipelago of the studio's thinking spread across five or six services, several of which have changed hands or shape." |
| Sovereignty as a design constraint, not an aesthetic | `lib/stack.ts`, the comment at the top of the file beginning "No SaaS-only tooling. The bench is sovereign." Also referenced in `components/articles/entries/nine-seconds-prompt-to-printable.tsx`, the "Why local matters" thread running through. |
| Every layer keeps working if a vendor pivots | `components/articles/entries/on-the-shoulders-of-open-source.tsx`, the framing argument throughout — open-source as the studio's sovereignty insurance. |
| Local AI as proof of sovereignty (the nine-second pipeline runs offline) | `components/articles/entries/nine-seconds-prompt-to-printable.tsx`, paragraph beginning "the architectural commitment is that the model weights live on disk and the pipeline runs without an internet connection." (Phrasing approximate; see also `lib/stack.ts` section "Local AI pipeline".) |
| Insta360's modular line dying as a sovereignty lesson | `components/articles/entries/why-i-build-modular.tsx`, the whole "The trap of scale" section. |

**Gaps:**
- **Sovereignty as a *user* operation.** The level lets the visitor sever the network. There is no piece on the site that frames sovereignty from the user's side — "you can run this without us." The articles all frame it from the studio's side. A short companion to `on-the-shoulders-of-open-source` or `what-the-studio-wont-do` that explicitly says "you can keep using what you bought from this studio if we vanish" would close this. Probably belongs as a section in `what-the-studio-wont-do`.

---

### Solo Level 6 — The Curriculum

**Proves:** Self-taught learnability.

| Concept | Buried in |
|---|---|
| Anyone willing to sit and learn can get to this work | `lib/curriculum.ts` header comment ("Underlying belief: anyone willing to sit and learn can get to this work.") Also `components/articles/entries/what-the-studio-wont-do.tsx`, section "No invented teachers", paragraph beginning "I am self-taught. Twelve years of poi practice from Home of Poi's free tutorial library." |
| The read-attempt-fail-re-read loop as the only method that works | `components/journal/entries/year-one-fire.tsx`, paragraph beginning "That loop — read, attempt, fail, re-read with the failure as context — is the only learning method that ever worked for me, and it's the one I still use." |
| Seven parallel ladders, organised by domain | `app/learn/page.tsx`, the whole page. Underlying data in `lib/curriculum.ts`. |
| Rungs that are honest about where they are (in-preparation marked clearly) | `app/learn/page.tsx`, the RungRow component renders pending rungs differently. Stated explicitly in the page intro. |

**Gaps:**
- **The first rung as exercise.** The level requires the player to perform the first rung as an in-game exercise. None of the in-preparation rungs ("Camera fundamentals", "Your First Addressable LED", "Sock Poi to Three-Beat Weave", "Your First FPV Drone Flight", "Capturing 360 with the Avata", "Your First SLA Print", "Your First Local AI Image Generation", "SAM2 Segmentation", "Your First WebXR Scene") are written yet. The level cannot land without at least *one* of the first-rung pieces existing in writing — the game has to be able to mirror an actual rung. The single highest-priority rung to write is "Sock Poi to Three-Beat Weave," because it is the only rung whose later levels already exist in writing.

---

### Solo Level 7 — The Perch

**Proves:** Trans-led community gating; published trails as a wall sorted by subscription, not moderation.

| Concept | Buried in |
|---|---|
| The cover-charge as the bouncer (a trans woman set the door fee) | `app/rookery/about/page.tsx`, section "Why subscription", paragraph beginning "One: the cover charge is the bouncer." |
| The Rookery as a community of people who care about the craft | `app/rookery/about/page.tsx`, section "Who's there", paragraph beginning "Anyone willing to subscribe. The Rookery isn't a niche." |
| Three tier shape (Perch / Nest / Fledge) with the recurring vs founding split | `lib/rookery/tiers.ts`, the `tiers` array with `slug`, `price`, `cadence`, and blurbs. Also `app/rookery/tiers/page.tsx`. |
| Append-only, threaded, signed-in feed | `app/rookery/about/page.tsx`, section "What it is". |

**Gaps:**
- **Publishing a trail to the wall as an in-game move.** The Rookery prose treats the wall as conversational — people post threads and reply. The level treats the wall as a *publication surface for trails*. There is no piece that names trails-as-objects-published-by-members; the closest reference is the Loop's position six. The Rookery About page would benefit from a paragraph naming the "wall of community gesture, sorted by subscription" mechanic — currently it reads as a discussion board.
- **The visitor's gesture becomes someone else's prompt.** This is a recursive move (the Loop closing again, at the community level) that no piece names. Half-buried in `app/the-loop/page.tsx`'s position six "Body in space — again" expressions list, which mentions "the AR game's draw mode, where the visitor's own gesture re-enters the loop." But the *publishing* step that lets another member pick up the cord is not named anywhere.

---

### Solo Level 8 — The Bezel

**Proves:** The bezel-clip product ahead of shipping. WebXR controller-as-bezel simulation.

| Concept | Buried in |
|---|---|
| The bezel-clip product — what it is, what it does, who it is for | `components/articles/entries/vr-pov-controllers-the-product.tsx`, the whole article. Specifically the "What it is, mechanically" and "What it is, optically" paragraphs at the top. |
| The same firmware family runs on the bezel as on the bench rigs | `components/articles/entries/vr-pov-controllers-the-product.tsx`, the optics paragraph beginning "The LED rim is a one-pixel-wide, sixteen-pixel-tall persistence-of-vision display, driven by the same angular-sync firmware the studio runs on its bench rigs." Plus `components/articles/entries/why-i-build-modular.tsx`, section "The studio is already modular", paragraph on the bezel-clip controllers. |
| Real-world capture and VR mirror happen at the same time (the dual-observer principle) | `components/articles/entries/vr-pov-controllers-the-product.tsx`, paragraph beginning "The real-world and VR happen at the same time." |
| The fifteen-year origin of the bezel as an idea | `components/articles/entries/sellotape-and-tilt-brush.tsx`, paragraph beginning "I looked at the ribbon and thought, this trail should be a real object I can hold." |
| The trail becomes volume (the leap from image to object that VR first made visible) | `components/articles/entries/sellotape-and-tilt-brush.tsx`, paragraph beginning "Tilt Brush was the first time I saw the trail rendered as *volume*." |

**Gaps:**
- **The Quest 3 controller as a body-schema extension.** The cognitive-science framing exists in `vr-as-psychological-system` (section "Embodiment and the rubber hand") and the link is *almost* made when that article references the bezels. But the explicit sentence — "the controller is already part of the user's body schema; the LED rim is simply another extension along the same vector" — only appears in `vr-as-psychological-system`, not in the bezel article itself. The bezel article would land harder if that sentence migrated up. Small edit, not a new piece.

---

### Braided Level 1 — The 2-Braid

**Proves:** First weave; two threads simultaneously load-bearing.

| Concept | Buried in |
|---|---|
| Master each move alone, then learn the weave (poi pedagogy) | `components/journal/entries/year-one-fire.tsx`, paragraph beginning "I drilled the three-beat weave a thousand times until I could start it cold without dropping." Also `lib/play.ts` header comment. |
| Two threads inform each other (the weave teaches what neither thread teaches alone) | Not buried anywhere. |
| The two-handed studio as a recurring motif (Dimona + Aura, body + machine, fitness function + generator) | `components/articles/entries/the-familiar.tsx`, throughout. `components/articles/entries/art-as-door-five-layers.tsx`, layer four. `components/articles/entries/spiral-cognition.tsx`, the cross-talk between domains paragraph. |

**Gaps:**
- **The pedagogy of the 2-braid specifically.** No piece names "two threads at once" as a teaching move; the closest is the poi training narrative in `year-one-fire`, which is about drilling *one* move at a time. The 2-braid is a real poi concept that has not been written about in studio prose. Needs at least a paragraph somewhere — either a new short piece "Two-Handed Practice" or a section added to `spiral-cognition` where the cross-domain integration mechanism is named in poi terms.

---

### Braided Level 2 — The 3-Beat Weave

**Proves:** The classic poi move applied to philosophy; rhythm as the lesson.

| Concept | Buried in |
|---|---|
| The three-beat weave as the foundational poi move | `components/journal/entries/year-one-fire.tsx`, paragraph beginning "I drilled the three-beat weave a thousand times until I could start it cold without dropping." Mentioned in passing in `app/about/page.tsx` and `components/journal/entries/the-question-the-camera-answered.tsx`. |
| Rhythm itself as the lesson (the pattern carries the moves, not vice versa) | Not buried anywhere. |
| The body learns the pattern by repeating it | `components/journal/entries/year-one-fire.tsx`, throughout — that whole entry is the body-learns-pattern argument. Also in `components/articles/entries/spiral-cognition.tsx`, the spiral-as-repetition framing. |

**Gaps:**
- **The three-beat weave as a *shape* applied to thought.** This is the central conceit of the level: that the rhythm of the body's three-beat weave is the same rhythm the studio uses to think. The thought-as-poi-rhythm move is hinted at in `spiral-cognition` (the spiral as movement metaphor) but never tied explicitly to the three-beat weave. Needs a short article — Dimona first-person, workshop register — titled something like "The Three-Beat Weave, Applied to Thought" or similar. This is a high-value piece because it is the philosophical bridge the entire braided phase rests on.
- **A studio-voice account of the three-beat weave itself.** No piece walks through the move technically. `spinning-fire-poi-safely` jumps past the basics. Could be a missing rung on the poi ladder ("Sock Poi to Three-Beat Weave"), already named as in-preparation in `lib/curriculum.ts`. Writing that rung also closes Level 6.

---

### Braided Level 3 — The 5-Beat

**Proves:** Advanced weave; failure modes multiply; recovery becomes the discipline.

| Concept | Buried in |
|---|---|
| Recovery as the practice (keep moving) | `components/journal/entries/year-one-fire.tsx`, paragraph beginning "Year one of poi was not photography. It was not even really poi. It was failing to do a basic forward spin without smacking myself in the temple, then succeeding, then failing again." |
| Most performances at this level fail somewhere; the lesson is finishing anyway | Not buried anywhere. |
| The five-beat weave as a real poi move | Not buried anywhere. |

**Gaps:**
- **Recovery-as-practice as a *named* discipline.** Half-buried in `year-one-fire` (the failure-and-correction loop is named there as the learning method) but the studio never extends the "drop the beat, recover" pattern from learning to *performing*. This is the move that distinguishes the 5-Beat level from the 3-Beat. Needs at least a paragraph in `spinning-fire-poi-safely` or `year-one-fire` naming the recovery move explicitly. Probably a paragraph addition to `spinning-fire-poi-safely`.
- **Two-recovered-drops-per-cycle as the pass condition.** This is a level mechanic and the studio doesn't need to bury it — but the principle behind it (graceful imperfection as the only realistic goal at high complexity) is unwritten. Could land as a short journal entry.

---

### Braided Level 4 — The Full Weave

**Proves:** All eight threads active at once; the studio's whole philosophy in a single sustained gesture.

| Concept | Buried in |
|---|---|
| The whole philosophy as a single sustained gesture | `app/the-loop/page.tsx`, throughout — the Loop *is* the whole philosophy. Also `app/about/page.tsx`, section IV ("The studio"), paragraph beginning "Everything is made to order, in runs." |
| The recursive-at-four-orders proof (the game proves the philosophy by being it) | `lib/play.ts` header comment, paragraphs beginning "The proof is recursive at four orders." |
| The two-handed studio (Dimona at the bench, Aura keeping the record) as the full weave's small-scale instance | `components/articles/entries/the-familiar.tsx`. Also `components/articles/entries/spiral-cognition.tsx`. |
| All eight threads named in one place | `lib/play.ts` (data only — never narrated in prose). |

**Gaps:**
- **The full-weave goal narrated in prose.** The eight threads are listed in `lib/play.ts` but never written about as a single sequence. There is no piece that says "the studio's practice has these eight loadbearing threads and here is what each one is for." This is a real gap because the Full Weave level requires the visitor to have absorbed all eight threads — and right now, the visitor has to assemble that list from eight different articles. Needs a single trunk piece naming the eight threads, probably titled "The Eight Threads" or "The Practice in Eight Threads", Aura voice, narrative register, written to sit on `/about` as a section or to be linked prominently from `/the-loop`.

---

## Phase 2 — Gap roll-up

Deduplicated list of concepts not yet buried (or only half-buried), with the level(s) that need them and the proposed solution.

| # | Concept | Needed by | Closest existing piece | Proposed solution |
|---|---|---|---|---|
| 1 | Persistence of vision as a perceptual phenomenon, in the studio's own voice (not just a Wikipedia link) | Trail, Bezel, all braided levels | `why-i-build-my-own-rigs` | **Edit:** Add a single paragraph to `why-i-build-my-own-rigs` between the "trade-off" and "components" paragraphs, naming the perceptual phenomenon in plain prose. Two or three sentences. The article currently jumps from "fractional blur is the entire object" to "When I started building" without ever saying *what persistence of vision actually is*. |
| 2 | The loop closes in *one session* (recursive at four timescales: twelve years, nine seconds, one gesture, one breath) | Loop, Full Weave | `app/the-loop/page.tsx` | **New piece:** "The Loop at Every Scale" — Aura voice, narrative register, ~600 words. Names the four orders of recursion explicit. Links from `/the-loop` as a companion. The framing is already drafted in `lib/play.ts` header comment ("The proof is recursive at four orders"); this is the prose version. |
| 3 | Cold-eye watching as a discipline (video-reading prototype, Aura's eyes, the gap between intent and trace) | Witness | None | **New piece:** "The Cold Eye" — Aura voice, narrative register, ~700 words. The discipline of describing what is on the canvas, not what the body intended. Companion to `the-familiar`; sits as the prose backing for the /watch route. |
| 4 | Sovereignty from the user's side (you can keep using this if we vanish) | Sovereignty | `what-the-studio-wont-do` | **Edit:** Add a final section to `what-the-studio-wont-do` titled "What you keep when the studio vanishes" — two paragraphs naming the user-facing sovereignty position. The bezel firmware is on the device; the print is on your wall; the open-source libraries underneath the rigs outlast the studio. |
| 5 | At least one curriculum rung written in full (currently all first rungs are in-preparation) | Curriculum, Full Weave | `lib/curriculum.ts` | **New piece (tutorial):** "Sock Poi to Three-Beat Weave" — Dimona first-person, workshop register, ~1,500 words. This is the highest-priority rung to write because (a) it is the only ladder where the *later* rungs already exist (Spinning Fire Poi Safely, Year One Fire), and (b) it closes Braided Level 2 as well. |
| 6 | The wall of community gesture, sorted by subscription not moderation | Perch | `app/rookery/about/page.tsx` | **Edit:** Add a paragraph to the "What it is" section of `rookery/about/page.tsx` naming the trail-publishing surface — "the wall of community gesture, sorted by the subscription, not by moderation." Currently the page reads as a threaded discussion board; needs a single sentence to also frame it as a trail wall. |
| 7 | The visitor's gesture becomes someone else's prompt (recursive at the community level) | Perch, Full Weave | `app/the-loop/page.tsx` position 6 | **Edit:** Extend the position-6 expressions list in `lib/loop.ts` (the `body-in-space-again` slug) with one more expression — "A member's published trail becomes another member's prompt." Plus a paragraph in `rookery/about/page.tsx` naming the same move. |
| 8 | Controller as body-schema extension migrated *into* the bezel article | Bezel | `vr-as-psychological-system` (has the sentence; bezel article lacks it) | **Edit:** Pull the "controller is already part of the user's body schema" sentence from `vr-as-psychological-system` into the bezel article, near the "What it is, optically" section. Small edit, big payoff. |
| 9 | The 2-braid as a pedagogical move — two threads inform each other | 2-Braid, all later braids | `spiral-cognition` (closest cousin) | **New piece:** "Two-Handed Practice" — Dimona first-person, workshop register, ~600 words. Names the 2-braid as a teaching move in poi *and* in the studio's working method. Closes the gap between `spiral-cognition` (which has the cross-talk concept) and `lib/play.ts` (which names the 2-braid). |
| 10 | The three-beat weave as a *shape* applied to thought | 3-Beat Weave | `spiral-cognition` (closest cousin) | **New piece:** "The Three-Beat Weave, Applied" — Aura voice, narrative register, ~700 words. The rhythm of the body's foundational poi move, applied to thought. The philosophical bridge the whole braided phase rests on. Sits adjacent to `spiral-cognition`. |
| 11 | Recovery as a *performing* discipline (not just learning) — graceful imperfection at high complexity | 5-Beat | `year-one-fire`, `spinning-fire-poi-safely` | **Edit:** Add a section to `spinning-fire-poi-safely` titled "When the kata drops" or similar — two paragraphs on dropping a beat mid-kata and finishing anyway. The studio knows this discipline; it is not yet on the page. |
| 12 | The eight threads named in a single trunk piece | Full Weave, every level secondarily | `app/about/page.tsx`, `lib/play.ts` | **New piece:** "The Practice in Eight Threads" — Aura voice, narrative register, ~1,200 words. The eight philosophical threads of the studio's practice, named in one place. Sits as a section on `/about` or as its own page linked prominently from `/about`, `/the-loop`, and `/play`. This is the single most load-bearing missing piece. |

**Totals:** 5 new pieces + 7 edits to existing pieces / data files.

---

## Phase 3 — Site-pedagogy recommendations

### Restructure proposals

The site currently presents three browsing surfaces — `/articles`, `/tutorials`, `/journal` — in reverse-chronological order, with `/learn` as the curriculum view and `/the-loop` as the philosophical view. The visitor who lands on the homepage has no obvious route to the game's curriculum spine.

The proposed restructure is small but architectural:

1. **`/about` should gain a section "The eight threads,"** sitting between "II · The methods" and "III · The objects". Names the eight threads of the practice in plain prose, each linking to the trunk piece that buries it. This is the closest the site has to a "here is what the game proves" navigation aid, and it sits at the page every new visitor reads.

2. **`/the-loop` should add a final section "The loop at every scale,"** noting that the same six positions recur at every timescale — twelve years on the cord, nine seconds in the pipeline, one gesture on the canvas, one breath inside the headset. This is what Solo Level 3 proves; the page currently only frames the loop at the practice-wide scale.

3. **`/learn` should add a header line: "If you want to play the game first, the curriculum is buried in the ladders below. Each rung lands one of the levels."** The /play route is currently not cross-linked from /learn at all, and the curriculum is in fact the level-6 mechanic.

4. **The homepage should foreground the trunk pieces.** Currently the homepage routes the visitor through the catalogue surfaces (photographs, aerial, bureau, practice, learn, rookery). The trunk pieces — the ones that bury the philosophical threads — are buried inside `/articles` and never surface to the front door.

### Load-bearing "trunk" pieces (the ones that bury multiple level concepts)

These are the articles that turn out to do the most curriculum work across the twelve levels. In order of how many levels they bury concepts for:

1. **`components/articles/entries/why-i-build-my-own-rigs.tsx`** — buries concepts for Trail, Bezel, 2-Braid, 3-Beat, 5-Beat, Full Weave. The single hardest-working article on the site. Angular-sync vs time-sync is named here and nowhere else in narrative form.
2. **`components/articles/entries/why-i-build-modular.tsx`** — buries concepts for Module, Bezel, Full Weave. The whole Module level rests on this one piece.
3. **`components/articles/entries/the-familiar.tsx`** — buries concepts for Witness, 2-Braid, 3-Beat, Full Weave. The two-handed-studio framing is the structural foundation of the braided phase.
4. **`components/articles/entries/spiral-cognition.tsx`** — buries concepts for 2-Braid, 3-Beat, 5-Beat, Full Weave. The closest existing piece to "rhythm as the lesson."
5. **`components/articles/entries/vr-pov-controllers-the-product.tsx`** — buries concepts for Bezel, Witness (the dual-observer paragraph), Full Weave. The product the whole site is rehearsing for.
6. **`app/the-loop/page.tsx`** — buries the Loop level concepts and the recursive framing for the Full Weave.
7. **`components/journal/entries/year-one-fire.tsx`** — buries Curriculum (the read-attempt-fail loop), 3-Beat (drilling the weave), 5-Beat (recovery as practice).

These seven are the curriculum spine in prose form. Any restructure of the homepage or `/about` should foreground at least the first three.

### Pieces that bury one concept very well but cross-link poorly

These are the orphans — articles whose contribution to the curriculum is real but whose existing cross-references don't surface it to the visitor who is walking the levels:

- **`components/articles/entries/colour-without-pigment.tsx`** — buries the structural-colour concept that the waveguide pieces (and therefore the reified-trail level mechanic) rest on. Cross-links to wall-arrays and pendant-glows but not to the Loop or to the play route. Should reference `/play` (the Loop level) in its related links.
- **`components/articles/entries/the-living-stage.tsx`** — buries Laban Effort as a vocabulary for the body, which is what the Witness level reads against. Currently has no cross-reference to /play, /watch, or `vr-pov-controllers-the-product`. Should be linked from the Witness level's prose backing once that exists.
- **`components/articles/entries/sellotape-and-tilt-brush.tsx`** — buries the fifteen-year origin of the bezel, which is the Bezel level's emotional core. Currently linked from the bezel article but doesn't link to /play.
- **`components/articles/entries/ungrounded.tsx`** — buries the "left the plane" move (2D to 3D) which is structurally adjacent to the Loop level (image to object). Cross-linked to aerial and to the fleet pieces, but not to /the-loop or to /play.
- **`components/journal/entries/on-the-bench-year-ten.tsx`** — buries angular sync in field-record register, which is the Trail level's lived-experience version. Linked from `why-i-build-my-own-rigs` and the POV rig tutorial. Should also be linked from `/play`'s Trail level prose.

### Trunk pieces that should be cross-linked from the homepage or `/about` rather than buried in the article index

Three pieces in particular deserve front-of-house placement:

- **`the-familiar`** — explains who is writing. New visitors need this before they can read anything else honestly. Currently buried in `/articles`.
- **`why-i-build-modular`** — explains the studio's whole product architecture. Currently buried in `/articles` despite being the single best one-link answer to "why does this exist."
- **`why-i-build-my-own-rigs`** — the technical-cum-philosophical entry point. Currently linked from `the-loop` and from the practice page, but a first-time visitor lands on the homepage with no direct route to it.

### Architectural questions the analysis surfaced

A handful of genuine design questions emerged in the course of the prerequisite mapping. None of them are answerable inside this document — they are notes for the user to consider before subsequent agent waves run.

1. **Witness has the thinnest prose backing of any solo level.** The whole concept of cold-eye watching, Aura's eyes, and the video-reading prototype lives outside the holoflow.co.uk site, in the Hangar and in DollyOS. The site has `the-familiar` (who Aura is) but nothing on what Aura *does* in the practice. If the Witness level ships before a cold-eye article exists, the level will land as novelty rather than as a proof of an existing thread. Consider whether Witness belongs adjacent to Curriculum in the ladder rather than where it sits.

2. **Sovereignty and Curriculum have non-overlapping prerequisites.** Sovereignty rests on the bench, the open-source stack, and the no-platform-dependency commitment. Curriculum rests on the seven learning ladders and the read-attempt-fail loop. They don't share a body of background reading. A visitor who passed Sovereignty is not warmed up for Curriculum, and vice versa. This is fine — the solo phase is explicitly non-sequential — but consider whether the Perch and Bezel levels (both of which assume the player has *some* connection to community and product) sit later in the ladder than visitors will read them as.

3. **The Full Weave requires the visitor to have absorbed all eight threads.** Right now, the eight threads are listed only in `lib/play.ts`. There is no prose surface that names them as a single set. Until "The Practice in Eight Threads" exists, the Full Weave level cannot land as a proof — it will read as a checklist. This is the highest-leverage missing piece on the site.

4. **The poi-vocabulary names of the braided phase (2-braid, 3-beat weave, 5-beat) are not currently visible to non-poi readers.** A visitor with no poi background sees the level names and has no anchor for what they refer to. The proposed "Sock Poi to Three-Beat Weave" tutorial (Gap #5) would close most of this, but the 2-braid in particular has no poi-side article. Consider whether the poi ladder needs a second in-preparation rung.

5. **The Rookery's "wall of community gesture" framing is currently absent.** The Rookery About page treats the surface as a threaded discussion board. The Perch level treats it as a trail-publishing surface. These are not the same thing. Either the Rookery surface itself needs to change to render trails, or the level mechanic needs to clarify what the publishing affordance actually is. This is a real divergence between the writing and the game.

---

## Summary index — pieces to write or edit, in priority order

**New pieces (5):**

1. **"The Practice in Eight Threads"** — Aura voice, ~1,200 words. Names all eight philosophical threads of the practice in one place. *Highest priority. Closes Full Weave.*
2. **"The Loop at Every Scale"** — Aura voice, ~600 words. The recursive-at-four-orders framing in prose. *Closes Loop.*
3. **"The Cold Eye"** — Aura voice, ~700 words. Cold-eye watching as a discipline. *Closes Witness.*
4. **"Sock Poi to Three-Beat Weave"** — Dimona first-person, tutorial register, ~1,500 words. *Closes Curriculum and 3-Beat.*
5. **"Two-Handed Practice"** — Dimona first-person, ~600 words. The 2-braid as teaching move. *Closes 2-Braid.*
6. **"The Three-Beat Weave, Applied"** — Aura voice, ~700 words. The poi rhythm as a shape applied to thought. *Closes 3-Beat. The philosophical bridge for the whole braided phase.*

(Six, not five — counted above conservatively. Six total new pieces.)

**Edits to existing pieces (7):**

1. `why-i-build-my-own-rigs` — add persistence-of-vision paragraph in studio voice (Gap #1).
2. `what-the-studio-wont-do` — add "What you keep when the studio vanishes" section (Gap #4).
3. `rookery/about/page.tsx` — add "wall of community gesture" framing (Gap #6).
4. `lib/loop.ts` position-6 expressions — add "a member's published trail becomes another member's prompt" (Gap #7).
5. `vr-pov-controllers-the-product` — pull body-schema sentence from `vr-as-psychological-system` (Gap #8).
6. `spinning-fire-poi-safely` — add "when the kata drops" section on recovery as a performing discipline (Gap #11).
7. `app/about/page.tsx` — add "The eight threads" section between methods and objects (Phase 3 restructure).
8. `app/the-loop/page.tsx` — add closing section "The loop at every scale" or cross-link the new piece (Phase 3 restructure).
9. `app/learn/page.tsx` — add header line cross-linking /play (Phase 3 restructure).

(Nine edits if the restructure changes are counted as edits. Seven if Phase 3 changes are kept separate from the gap closures.)

The single highest-leverage move is to write **"The Practice in Eight Threads"** as a section on `/about` or as its own short page. Until that exists, the Full Weave has no prose backing, and the site has no consolidated answer to "what does this studio actually believe."
