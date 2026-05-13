# The living stage — choreography canon

The canon under the choreography side of the bench. Where Laban's
movement vocabulary lives, how the stage is named as a proxemic
field, how the song is read as dramatic architecture, and the
four-beat flirt dial that runs underneath every intimate moment in
a solo performance. The article `articles/the-living-stage` is the
public-voice variant; this file is the named coordinates, axes,
and equations the article cites.

When this file goes over 300 lines, it splits per
`ARCHITECTURE.md` Rule 1.

## I. Laban as the alphabet

Rudolf Laban's analysis carves every gesture into four interlocking
components — **Body**, **Effort**, **Shape**, **Space**. The bench
leans on Effort hardest because Effort is what the audience feels
when they cannot name what they are seeing. Each axis is a number
between zero and one. So is every parameter on the sculpture genome
(`docs/EVOLUTION_ENGINE.md`). Body and resin object share an
alphabet.

### The four Effort axes

| Axis | Spectrum | What it reads as on stage |
| --- | --- | --- |
| Weight | Strong (0.0) to Light (1.0) | Strong commands a room. Light beckons. Same path, different message. |
| Space | Direct (0.0) to Indirect (1.0) | Direct locks a single face. Indirect draws the whole room into uncertainty. |
| Time | Sudden (0.0) to Sustained (1.0) | Sudden lands as surprise. Sustained reads as inevitability. |
| Flow | Free (0.0) to Bound (1.0) | Free is outpouring. Bound is withheld. Alternation produces the push-pull. |

### Body, Shape, Space — the other three components

| Component | What it encodes | Poi translation |
| --- | --- | --- |
| Body | Which parts move, who initiates, joint connectivity. | Which hand leads. Whether the torso isolates or follows. |
| Shape | How the body changes form through space (shape-flow, directional, carving). | Mechanical pendulum (directional) versus reaching reach-and-sigh (shape-flow). |
| Space | The 27 directions of Laban's icosahedron; near/middle/far reach; high/middle/low level. | Maps to stage position and audience relationship — see Section III. |

The LabanLab paper (Eurographics 2025) demonstrates an LLM can
translate Labanotation symbols to and from natural language using
events of the form `<description> # <start_time> # <end_time> #
<body_part>`. That format is the choreography gene's structural
target.

## II. The flirt — Effort as a four-beat

The sequence by which an audience member is made to feel personally
seen, in order:

1. **Direct space toward them.** Focused gaze, aimed movement. The
   room sharpens around one face.
2. **Transition to Indirect.** The moment of maybe. The body
   becomes peripheral, scanning, ambiguous.
3. **Brief Free flow toward them.** A small open gesture — a hand
   extension, a poi opening, an uncurled arm. The gift offered.
4. **Bound withdrawal.** The gift withheld. The body recovers, the
   poi closes, the gaze breaks. The audience member is left
   holding the offer in the air.

Two seconds at performance tempo, a four-bar phrase, repeated
across a five-minute set in slightly different keys. On poi: direct
circle into wandering spiral into open hand-extension into poi
withdrawal behind the body. This is the structure of seduction at
any scale.

## III. The stage as a proxemic field

Edward Hall (1966): **distance is meaning**. For a solo performer
there is no other dancer to carry relationship; the audience IS the
relationship. Every spatial decision is a sentence about how the
body wants to be with the room.

### Hall's distance zones, applied to stage

| Zone | Range | Stage application |
| --- | --- | --- |
| Intimate | 0–45 cm | Edge of stage / thrust. Overrides every other signal. Use once per performance. Never longer than 4–8 bars. |
| Personal | 45 cm – 1.2 m | Front third. Individual faces legible. The territory of flirtation. |
| Social | 1.2 – 3.6 m | Mid-stage. Movement quality has to do the work proximity used to. |
| Public | 3.6 m + | Upstage / deep stage. Architectural use of the body, full line, scale. |

### The nine-square stage grid

Classical mapping divides the performing surface into nine zones.
Each carries centuries of accumulated theatrical convention.

| Zone | Audience relationship | Choreographic use |
| --- | --- | --- |
| Downstage Centre (DSC) | Highest power. Direct address. The "I am here" statement. | Climax, first entrance, final stillness. Avoid overstaying — declamatory after ~16 bars without spatial variety. |
| Downstage Right (DSR) | "Future / positive" in Western reading. Approach reads as optimism. | First flirtation moves — come down right, offer, withdraw. |
| Downstage Left (DSL) | "Past / weight" in the same convention. Arrivals carry gravity. | Use after a right-side seduction sequence for emotional depth. |
| Centre Stage (CS) | Fulcrum. Equidistant from all sections. Spatially balanced, not the most powerful. | Full-body poi patterns. When every section should feel included at once. |
| Upstage Centre (USC) | Farthest, draws by distance and contrast. Stillness here reads as retreat into mystery. | Pre-entrance. Post-climax. Bridge sections. |
| Diagonal paths | DSR → USL and DSL → USR carry the most kinetic charge — they cross the power-axis. | Use for transitions between song sections. |

### Audience-address patterns

| Pattern | What it does |
| --- | --- |
| Full-house | Centre stage, open body, indirect effort space. Nobody excluded. Nobody chosen. |
| Section | Move toward a section, orient body toward them, hold 4–8 bars. |
| Individual | Move into personal zone near one person. Direct gaze. Hold 2–4 bars. Withdraw. Do not repeat to the same person for two song sections. |
| Exclusion tease | Address one section warmly while visibly withholding from another. Gift the withheld section something more intimate next. |
| Pull-back | After an intimate moment, retreat upstage and perform something technically complex. Proxemic distance asks the audience to lean in. |

### The intimacy coefficient

```text
proximity + gaze_direction + effort_quality + duration
  = perceived_intimacy_coefficient (0–1)
```

Target 0.6–0.8 for peak engagement without discomfort.

## IV. The song as dramatic architecture

A song is a pre-built dramatic script. Every section has an
emotional function and a specific kinetic demand. The choreography
hangs off the song's structure.

| Section | Choreographic function and spatial logic |
| --- | --- |
| Intro (0–16 bars) | Claim the space. Slow spatial claim — upstage to centre to downstage. Effort: sustained, bound. Movement scale builds. By bar 16 the body should be in the power centre with first full poi extension. |
| Verse (16–48 bars) | Exposition. Full stage width. Indirect effort space. Conversational quality. First individual audience contact made but not sustained. |
| Pre-chorus | Build. Movement converges toward DSC. Patterns tighten. Flow shifts from free toward bound — withholding what's about to arrive. |
| Chorus (48–80 bars) | Release. Maximum range, maximum poi extension, full stage coverage. Flow fully free. Weight strong or very light (grey middle is wrong). |
| Breakdown / drop | The emptying. Stillness or near-stillness. Different zone from the chorus — contrast is everything. |
| Bridge | Surprise modulation. Change level (drop to floor), or direction (face upstage), or plane (vertical to horizontal). One strong choice. |
| Outro / fade | Resolution. Retrace the spatial journey or arrive somewhere meaningful relative to first position. |

### The kinetic arc

The deliberate management of audience attention across a
performance. Not a flat line.

| Song position | Energy | What happens |
| --- | --- | --- |
| 0–25% | 0.2 → 0.6 | Arrival and claim. Audience orienting. |
| 25–50% | 0.5–0.7 plateau | Exploration and seduction. Widest spatial range. Two or three intimate approaches. |
| 50–65% | Spike to 1.0 | First climax (chorus). Full release. |
| 65–75% | Drop to 0.2–0.3 | Trough. The breakdown. Where the next climax is earned. |
| 75–90% | Rebuilds fast | Return and escalation. Final approach to the most intimate moment. |
| 90–100% | Falls to 0 or held 0.4 | Resolution. The final image is what the audience takes home. |

## V. The song map — what the system hears

Offline, in Python, librosa produces the temporal scaffold every
choreographic decision pivots on.

| Tool | Output |
| --- | --- |
| Beat tracking | BPM and beat timestamps to millisecond precision. Tempo curve, not single BPM, so the choreography can breathe with rubato. |
| Onset detection | Drum hits, chord changes, melodic accents — each becomes a candidate accent point. The system picks about a third. |
| Spectral balance | Bass energy vs treble energy. Drives the Laban Weight gene of each phrase. |
| Section segmentation | Chroma features + boundary detection identify verse/chorus/bridge. Section boundaries become transition moments. |
| Emotional valence | Lightweight model estimates emotional weight. Maps to Effort Time and Effort Weight. |

The map: `{ bpm, beat_times, onset_times, energy_curve,
weight_curve, section_boundaries }`. Hit points become accent
candidates. Section boundaries become transition moments — the body
must be in a different zone by the start of the new section.

## VI. The choreography genome

Three nested levels.

| Level | Contents |
| --- | --- |
| Performance | `kinetic_arc_shape`, `climax_timing` (0–1 song position), `flirt_intensity` (0–1), `stage_coverage` bitmask, `audience_sections_addressed`, `spatial_variety_score`, `section_assignment`. |
| Phrase (4–32 bars) | `gesture_type`, `effort_profile` (Weight/Space/Time/Flow, each 0–1), `stage_zone` (one of 9), `travel_path` (straight/arc/diagonal/spiral), `audience_target` (none/section/individual), `duration_bars`, `entry_condition`. |
| Gesture (atomic) | `poi_pattern`, `plane` (vertical/horizontal/wall/floor), `speed_bpm_multiple`, `extension` (near/mid/far), `hand_separation`, `body_rotation`, `level` — plus the 28 sculpture genes from `docs/EVOLUTION_ENGINE.md`. |

A gesture gene is also the recipe for the sculpture that gesture
would carve out of resin. Every performance is implicitly a family
of sculptures. Every sculpture is implicitly a gesture.

## VII. Fitness axes

The choreography evolution loop is the same shape as the sculpture
loop (`docs/EVOLUTION_ENGINE.md`). Twenty-five performance genomes
per generation, scored on five axes:

| Axis | What it measures |
| --- | --- |
| Spatial variety | Does the performance use the full stage? Avoid zone-sequence repetition? |
| Audience coverage | Does every section receive meaningful address? Is no section ignored for more than 24 bars? |
| Kinetic arc shape | Does the energy build, peak, trough, rebuild? Is it flat? |
| Flirt effectiveness | Do the intimate moments feel earned? Is approach/withdrawal present? |
| Overall feel | Holistic. Did this dance have a shape I could follow? |

Each rendered as three review artefacts: floor-plan SVG, kinetic
arc chart, and Laban timeline (one strip per Effort axis).

## Cross-links

- `articles/the-living-stage` — public-voice variant.
- `articles/choreographing-with-laban` — companion piece on the
  Laban vocabulary specifically.
- `articles/how-the-studio-breeds-sculptures` — same evolution
  engine, sculpture side.
- `docs/EVOLUTION_ENGINE.md` — the engine that breeds both sides.
- `docs/MANIFESTO.md` Section III — provenance is causally
  entangled with a specific body's specific movement.

## When this file goes over 300 lines

It splits per `ARCHITECTURE.md` Rule 1. `docs/the-living-stage/`
with one section per file, this file becomes the index.
