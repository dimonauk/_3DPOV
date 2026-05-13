# Evolution engine — breeding canon

The system that breeds the studio's sculptures and (in the same
engine) its choreographies. Interactive aesthetic evolution: a
genetic algorithm where the fitness function is a human with twelve
years of doing the work. The article
`articles/how-the-studio-breeds-sculptures` is the public-voice
variant; this file is the gene alphabet, the loop architecture, the
selection rules, and the named hardware the engine runs on.

When this file goes over 300 lines, it splits per
`ARCHITECTURE.md` Rule 1.

## I. The loop

Three players: generator, human, engine. The generator produces
candidates. The human scores. The engine carries the population
forward.

```text
generate ── render ── score (human, 1–5)
                      │
                      ▼
                  select + breed
                      │
                      ▼
               crossover + mutate
                      │
                      ▼
              llm advisor (optional)
                      │
                      ▼
             next generation (loop)
```

Key properties: entirely offline. No cloud, no API except local
Ollama. Population size 25 (5×5 grid). LLM is optional. Two modes:
sculpture and choreography. Output is a SQLite database with full
lineage — every genome, every score, every parent-child link
traceable back to generation zero.

## II. The 28-gene alphabet

Each gene is a float in `[0, 1]` (normalised). The generator maps
to the actual ranges. A type tag picks one of the five biomimetic
kingdoms (Section III).

### Form (12 genes)

| Gene | Range | Gene | Range |
| --- | --- | --- | --- |
| `scale` | 30–120 mm | `wall_thickness` | 0.1–2.0 mm |
| `aspect_ratio` | 0.3–3.0 | `symmetry` | 1–8 fold |
| `twist` | 0–720° | `noise_amplitude` | 0–5 mm |
| `taper` | 0.1–1.0 | `noise_frequency` | 1–20 octaves |
| `cell_density` | 0.1–0.9 | `verticals` | 1–12 |
| `branching` | 0–1 | `closure` | 0–1 (open → sealed) |

### Material (8 genes)

| Gene | Range | Gene | Range |
| --- | --- | --- | --- |
| `ior` | 1.45–1.65 | `subsurface` | 0–0.5 |
| `transmission` | 0–1 | `emission` | 0–2 |
| `roughness` | 0.001–0.5 | `tint_r / g / b` | 0–1 each |

Maps directly to Blender's Principled BSDF and the chosen resin
formulation. See `docs/PHYSICS_AND_OPTICS.md` for the refractive
index canon.

### Optics (4 genes)

| Gene | Range | Notes |
| --- | --- | --- |
| `grating_pitch` | 38–500 µm | Lower bound set by printer XY resolution. |
| `grating_depth` | 5–50 µm | Groove depth. |
| `channel_ratio` | 0.2–0.8 | Gyroid channel A/B volume ratio. |
| `escape_density` | 0.05–0.5 | Whispering-gallery escape-feature frequency. |

### Waveguide (4 genes)

| Gene | Range | Notes |
| --- | --- | --- |
| `tube_radius` | 0.5–3 mm | Base waveguide tube radius. |
| `tube_smoothness` | 0–1 | 0 = frosted, 1 = polished. |
| `network_density` | 3–20 | Physarum node count. |
| `murray_exponent` | 0.25–0.45 | Murray's Law exponent for tube-radius scaling. |

Twenty-eight letters, one type tag, every sculpture describable as
a single line of JSON. Feed the genome back into the generator and
out comes the same sculpture, give or take render noise.

## III. The five biomimetic kingdoms

The type tag picks one of five families. Each has its own
generator. See `docs/MANIFESTO.md` Section IV for the natural
mechanisms each kingdom borrows from.

| Type | Generator | Key geometry operation |
| --- | --- | --- |
| `gyroid` | `gen_gyroid` | Implicit surface `sin(x)cos(y)+sin(y)cos(z)+sin(z)cos(x) = t`, threshold from `cell_density`. |
| `turing` | `gen_turing` | Gray-Scott RD simulation, 500–2000 timesteps, V-field as surface displacement. |
| `wgm` | `gen_wgm` | Three torus rings with designed intersection offsets. |
| `ctenophore` | `gen_ctenophore` | Helical swept surface with chirped groove modulation. |
| `slime` | `gen_slime` | *Physarum polycephalum* simulation. Steiner-tree-ish network. Poi-petal positions as food sources. |

Each mesh is validated with `trimesh`: watertight, positive volume,
min dimension > 5 mm, max < 200 mm. Renders at 512×512 PNG, Cycles,
64 samples, GPU, three-point lighting plus uplight for the
waveguide glow. ~3 s per sculpture, ~75 s per generation.

## IV. Selection, crossover, mutation

Three slots per generation, three sources. Five plus fifteen plus
five equals twenty-five.

| Slot | Count | Source | Purpose |
| --- | --- | --- | --- |
| Elite | 5 | Top scorers, unchanged | Preserve the best. No genetic drift on what scored highest. |
| Bred | 15 | Crossover + mutation | Explore adjacency to good solutions. |
| Wildcard | 5 | Completely random | Prevent premature convergence. Keep the door open. |

### Tournament selection

Tournament size 3. Pick three random parents, the highest-scoring
wins. Repeat for the second parent. Moderate selection pressure — a
score-2 individual can still parent if it beats two score-1s.

### Uniform crossover

Each child gene independently from parent A or B with 50/50
probability. The type tag is inherited from one parent at random.

### Mutation

Each gene has a 15% chance of mutation. Of those, 95% are Gaussian
(small noise, σ=0.1, clamped to `[0, 1]`); 5% are wildcards
(completely new random value). Wildcards are how the population
finds genes the parents didn't have between them.

## V. The LLM advisor

Optional. The LLM does NOT generate geometry. It does NOT generate
code. It does NOT score sculptures. It reads genomes (28 floats) +
scores (human ratings) and reasons about WHY certain combinations
scored higher. It proposes biased crossovers.

### Model — Qwen 2.5 14B (Q4_K_M)

| Property | Value |
| --- | --- |
| Size | 14B parameters |
| Quantisation | Q4_K_M (~8.4 GB) |
| VRAM | ~10 GB on Ollama |
| Inference | ~25 tok/s |
| JSON mode | Native — `"format": "json"` constrains output |

Fits alongside Blender on the RTX 3080 Ti (12 GB VRAM) with two
gigabytes to spare. Twenty-five-genome response renders in ~20
seconds.

### Why not reasoning models

DeepSeek-R1, QwQ and friends are explicitly turned off. They use
chain-of-thought — they spend tokens explaining their reasoning,
which the task does not need. The task is pattern matching plus
parameter interpolation, not logical reasoning. The extra tokens
are wasted; the extra inference time gives nothing the smaller
non-reasoning model does not already give.

### What the advisor adds

Domain reasoning across the gene space:

> The top scorers all have `transmission > 0.8` and `cell_density
> ∈ [0.6, 0.7]`; propose 15 children that preserve that region while
> exploring the twist axis.

The engine still does the actual crossover and mutation. The LLM
biases which crossovers get tried. Faster than waiting for a pure
GA to stumble onto the same combination.

## VI. Fitness — the scoring scale

Sculpture mode: single axis, 1–5 stars.

| Score | Meaning |
| --- | --- |
| 1 | Actively unpleasant. Broken geometry. No visual interest. |
| 2 | Functional but uninteresting. The "meh" band. |
| 3 | Decent. Has some quality but wouldn't print. |
| 4 | Strong. Want to see this developed further. |
| 5 | Print this. This is the one. |

Choreography mode: five axes per genome (see
`docs/THE_LIVING_STAGE.md` Section VII). Spatial variety, audience
coverage, kinetic arc shape, flirt effectiveness, overall feel.

Nothing in this loop is automated decision-making. The machine
carries the breadth; the maker carries the depth.

## VII. Hardware and software requirements

| Component | Minimum | Recommended |
| --- | --- | --- |
| GPU | GTX 1060 6GB | RTX 3080 Ti 12GB |
| RAM | 16 GB | 32 GB |
| Storage | 10 GB | 50 GB |
| CPU | Modern quad-core | 8+ cores |

| Software | Version | Purpose |
| --- | --- | --- |
| Python | 3.11+ | Core engine |
| Blender | 5.0.1+ | Geometry + rendering |
| Ollama | latest | Local LLM serving |
| SQLite | built-in | Lineage database |
| FastAPI | 0.100+ | API server |
| librosa | 0.10+ | Song analysis |
| NumPy / SciPy | latest | Genome ops, RD sim |
| trimesh | 4.0+ | STL validation |

## VIII. Lineage — the SQLite schema

Every genome, score, parent-child relationship, render and STL
export written to SQLite. Any sculpture walkable back to generation
zero in one SQL query. Three load-bearing tables:

```sql
CREATE TABLE genomes (
    id TEXT PRIMARY KEY, generation INTEGER, session_id TEXT,
    type TEXT,            -- gyroid/turing/wgm/ctenophore/slime
    genes TEXT,           -- JSON of 28 floats
    genome_type TEXT DEFAULT 'sculpture'
);
CREATE TABLE scores (
    id TEXT PRIMARY KEY, genome_id TEXT REFERENCES genomes(id),
    axis TEXT DEFAULT 'overall', score REAL
);
CREATE TABLE lineage (
    child_id TEXT REFERENCES genomes(id),
    parent_id TEXT REFERENCES genomes(id),
    method TEXT,          -- crossover/mutation/elite/wildcard/llm
    PRIMARY KEY (child_id, parent_id)
);
```

The provenance is physical. Every fabrication leaves the bench with
a JSON certificate naming its parentage chain, kingdom, channel,
fitness score and narrative. See `docs/MANIFESTO.md` Section III.

## IX. Session shape

A productive evolution session: 30 minutes to two hours. 10–20
generations.

| Generations | What happens |
| --- | --- |
| 1–5 | Calibration. The system learning the artist's taste. Scores noisy. |
| 6–15 | Convergence. The population shifts toward forms worth printing. |
| 15+ | Refinement. Differences become gene tweaks rather than phenotype shifts. |

At any point a selected sculpture exports as STL and drops into the
slicer. The print queue table is a list of files about to become
objects on the bench.

## X. Intellectual ancestry

The borrowing is wide; the composition is the studio's. Karl Sims's
*Genetic Images* (1991) and evolved virtual creatures (1994) are
the canonical ancestor of interactive aesthetic evolution. The GA
primitives — tournament selection, uniform crossover, Gaussian
mutation, elitism — are textbook. Stanley & Miikkulainen's NEAT
(2002) informs how diversity is maintained, though the bench's
genome is fixed-length.

What the bench adds: the fitness function is a human with twelve
years of doing the work, not a neural-net surrogate. Candidates are
real printable objects, validated for watertightness and minimum
dimension before render. The ancestry is provenance. The 28-gene
alphabet is specifically tuned to biomimetic optics.

## Cross-links

- `articles/how-the-studio-breeds-sculptures` — public-voice variant.
- `articles/the-living-stage` — choreography side of the same engine.
- `docs/THE_LIVING_STAGE.md` — Laban + proxemics for the choreography mode.
- `docs/PHYSICS_AND_OPTICS.md` — refractive index, grating pitch, Murray's-Law radii.
- `docs/MANIFESTO.md` Section III + `articles/provenance-as-discipline` — JSON-certificate practice.
- `lib/evolution/` — the TypeScript port of the engine for the site's playable surface.

## When this file goes over 300 lines

It splits per `ARCHITECTURE.md` Rule 1. `docs/evolution-engine/`
with one section per file, this file becomes the index.
