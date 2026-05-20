# Sculpture genome evolution mathematics

The studio's foundational-maths reference for the genetic algorithm
that breeds the waveguide sculptures. The public-voice version of the
loop is at `articles/how-the-studio-breeds-sculptures`; the engine
canon is at `docs/EVOLUTION_ENGINE.md`; this document is the
mathematical substrate underneath both. It is the entry the codex
points to when the reader asks *why this works*, not *how the bench
runs it*.

Forward references — `codex/linear-algebra-essentials` for the metric
on the search space, `codex/numerical-optimization-essentials` for the
gradient-based alternatives this engine deliberately does not use.

## The genome as a point in ℝ²⁸

Every sculpture in the studio is, mathematically, a vector

```text
g = (g₁, g₂, …, g₂₈) ∈ [0, 1]²⁸ ⊂ ℝ²⁸
```

of twenty-eight real numbers, each normalised to the unit interval
before the generator denormalises them back into printable
parameters. The twenty-eight, as defined in `lib/evolution/genome.ts`,
partition into five categories.

| Category | Count | What they encode |
| --- | --- | --- |
| Form | 12 | Silhouette, growth rule, symmetry, density, anisotropy, twist, curvature, branching, cell pattern, surface noise, perimeter, fill ratio. |
| Material | 8 | Base resin colour, opacity, IOR, surface finish, dye gradient, cast-metal mix, thermal response, weight. |
| Optics | 4 | Caustic profile, Fresnel rings, GRIN gradient, refraction tightness. |
| Waveguide | 4 | Guide diameter, branch count, root LED count, exit aperture. |
| Canon extension | 8 | Kingdom affinity, parentage hint, ritual gesture, OCEAN bias, fitness target, scale class, edition class, narrative tag. |

The search space is the unit hypercube `[0, 1]²⁸`, an ordinary
subset of `ℝ²⁸` carrying the standard Euclidean metric. The metric
is what makes it sensible to speak of *nearby* genomes, of a
descent tree as a directed graph in the hypercube, or of a
crossover as drawing a line segment between two parent points and
dropping a child onto it. The Evolution Hub fan-chart renders this
in 2D because twenty-eight-dimensional geometry resists honest
visualisation — a problem the linear-algebra-essentials entry
expands on.

## The fitness landscape, and why the terrain metaphor is a half-truth

A fitness function `f : [0, 1]²⁸ → ℝ` scores every genome. Plot `f`
over a two-dimensional slice and the result looks like rolling
country: peaks where good sculptures live, valleys where unprintable
failures lurk, ridges connecting families of related forms. Useful
for talking about hill-climbing and basins of attraction. Also a
half-truth.

Why the half-truth matters:

- **The curse of dimensionality.** Nearly all of `[0, 1]²⁸`'s volume
  sits in a thin shell against its boundary. Uniform random sampling
  almost never visits the "middle" of the cube; the intuition that
  random search covers the space is wrong by many orders of magnitude
  in twenty-eight dimensions.
- **The fitness function is not differentiable.** A human pressing a
  star button doesn't carry a gradient. Gradient descent simply
  doesn't apply — part of why evolutionary search is chosen at all.
- **Local maxima multiply combinatorially.** Twenty-eight directions
  with a couple of plausible peaks each produces millions of local
  optima. A gradient method locks onto the nearest; evolutionary
  search, with crossover and mutation, can jump between them.
- **The landscape moves.** The maker's taste drifts across a session.
  The same genome scored in generation five and in generation
  twenty-five attracts a different number of stars. The terrain is at
  best a time-averaged sketch.

Use the metaphor for basins and ridges. Don't use it as a literal
map.

## Multi-objective optimisation — Pareto fronts and scalarisation

The studio's interactive sessions reduce fitness to a single
one-to-five star value because the human-in-the-loop is implicitly
weighing aesthetic merit, printability and optical interest in her
head. The moment the engine optimises without a human — the planned
`genomeKingdomBridge.ts` sampler is the obvious case — fitness
becomes multi-objective: aesthetic merit, printability, cost,
optical fidelity, edition uniqueness. Three or four numbers, not
one.

Two textbook responses.

**Scalarisation.** Pick weights `(w₁, …, wₖ)` and collapse:

```text
F(g) = w₁ f₁(g) + w₂ f₂(g) + … + wₖ fₖ(g)
```

Mathematically clean — equivalent to projecting the criterion space
onto a single axis. Useful when the trade-off ratios are known,
which they generally are not for sculpture-cost-printability
decisions. Scalarisation also commits the optimiser to one ratio
for the whole run; changing it mid-session forces a restart.

**Pareto front.** A genome `g` dominates `g'` if it is at least as
good on every objective and strictly better on one. The Pareto
front is the set of non-dominated genomes — those no other genome
beats on every axis at once. NSGA-II (Deb et al., 2002) is the
canonical multi-objective GA; its non-dominated sort plus crowding
distance is the standard pattern for keeping a population spread
along the Pareto front rather than collapsed onto a single peak.

A drop curated from the Pareto front offers the buyer a real
choice between *more optically clever* and *cheaper to cast*, both
valid, with no arbitrary weighting baked in.

## Crossover semantics — three flavours

Once two parents have been chosen, the engine combines their genes
into a child. Three operators are taught in the standard texts.

**Blend crossover.** For each gene `i`,

```text
cᵢ = α aᵢ + (1 − α) bᵢ
```

with `α ∈ [0, 1]` either fixed at 0.5 or drawn at random. Smooth
and fast; the population implodes towards the mean rather quickly,
which is fine if the mean is the optimum and unhelpful otherwise.

**Uniform crossover.** Per gene, copy from parent A with probability
0.5, otherwise from parent B. No blending. The studio's operational
default. Convergence is slower than blend, but the population
retains the discrete combinations the parents had between them —
which keeps the wildcards' contributions alive long enough to
matter.

**Single-point crossover.** Pick index `k`; give the child genes
`1…k` from parent A and `k+1…28` from parent B. Cheap, useful when
adjacency in the gene vector encodes structure — which it doesn't
for the studio's alphabet, since gene order is mostly editorial.

Goldberg (1989) proves uniform crossover has lower bias on long,
weakly-coupled genomes and higher disruption on tightly-coupled
ones. The studio's twenty-eight genes are weakly coupled by
construction, which is why uniform sits comfortably as default.

## Mutation — Gaussian noise and the sigma trap

After crossover, each child gene is perturbed with probability
`pₘ = 0.15` by adding Gaussian noise `ε ∼ N(0, σ²)` and clamping the
result back into `[0, 1]`. The studio uses `σ = 0.1` with 5% of
mutated genes promoted to wildcards (fresh uniform samples rather
than perturbations).

A fixed sigma is a compromise. Too small and the population only
does local search, climbing the nearest hill and missing the better
one behind it. Too large and useful structure is shaken to pieces
every generation. A constant sigma under-explores once the
population has settled near a peak: the noise that was usefully
exploratory at generation one becomes a tax on the genes that
already work.

The textbook escape is the **(μ + λ) evolution strategy** with
self-adaptive step sizes. Each genome carries its own sigma; the
sigma is mutated and inherited; children whose sigmas are well-
tuned out-reproduce the rest; the step size shrinks naturally as
the population zeroes in. Eiben & Smith (2015) is the modern
reference.

The studio uses constant-sigma-plus-wildcards because the
interactive loop is short — twenty-five candidates, twenty
generations — and the elegant theory doesn't pay back its
complexity. The planned headless kingdom-bridge sampler is where
self-adaptive sigma will earn its keep.

## Selection — three strategies, one default

Three selection strategies are taught in every evolutionary
computation course. One of them is the studio's operational default
for a reason.

**Roulette wheel.** Each genome is selected with probability
proportional to its fitness. Mathematically clean. Behaviourally
fragile: a single high-scoring outlier hoovers up the probability
mass and the population collapses to its descendants in two or
three generations. Also sensitive to additive constants — shifting
every score by +10 changes the selection pressure.

**Rank-based.** Sort by fitness; select with probability
proportional to rank rather than raw score. Robust to outliers but
loses magnitude — a generation where every genome scores three
stars is treated identically to one where every scores five.

**Tournament (size *k*).** Pick `k` random genomes; the highest-
scoring becomes a parent. Repeat. Selection pressure tracks `k`:
`k = 1` is random, large `k` approaches always-pick-the-best. The
studio uses `k = 3`, moderate pressure — a score-two candidate can
still parent if it beats two score-ones.

Tournament is the operational default because it is invariant to
monotonic rescaling of fitness (it only uses comparisons), it
parallelises trivially, and its pressure is a single tunable knob.
Roulette and rank-based are taught for completeness; the working
studio uses tournament.

## Kingdom-bias probability profiles

Each of the eight kingdoms in the studio's taxonomy — techno,
artistic, choreographic, biomech, thermal, protean, assemblage,
ritual — corresponds to a weight vector

```text
w^(K) ∈ ℝ²⁸
```

over the twenty-eight genes. The lookup table planned for
`lib/evolution/genomeKingdomBridge.ts` is precisely this map:
kingdom → weight vector.

The weights bias sampling through soft-constraint scalarisation.
When sampling a genome for kingdom `K`, each gene is drawn from a
distribution whose mean is shifted by `w^(K)` and whose variance is
tightened on the genes the kingdom cares about. *Techno*, for
instance, biases towards high cell density, high symmetry, and low
organic drift; the kingdom weight pulls those three genes to their
extremes and tightens their variance, while leaving the rest at the
default broad uniform.

Two properties matter. The bias is *soft*: a techno genome with low
symmetry is improbable, not forbidden. And the same weight vector
can be re-used as a fitness ingredient — an off-kingdom genome
scores lower on kingdom-fit, making the profile both a sampling
distribution and a fitness axis. This is one reason a Pareto
formulation is the honest choice: kingdom-fit and aesthetic merit
are separate objectives that occasionally pull in different
directions.

## Diversity maintenance — and why the sample population doesn't need it

Genetic algorithms famously collapse: after a few generations the
population becomes a cloud of near-identical copies of whichever
genome first scored well. Two textbook countermeasures:

- **Niching.** Partition the population into subgroups; run
  selection within each. Different niches converge on different
  peaks. Implementation usually involves a similarity radius and a
  rule that genomes inside the radius of an existing niche either
  join it or get rejected.
- **Fitness sharing.** Penalise a genome's fitness by how many of
  its near neighbours also score well. Crowded peaks share their
  fitness budget, so the population spreads across several peaks
  rather than piling onto the tallest.

The studio's interactive loop uses a simpler combination — five
elite slots, fifteen bred slots, five wildcard slots per
generation. The wildcards are the door staying open: they almost
never score well in the generation they appear in, but periodically
carry one gene worth keeping that the bred population is missing,
and a few generations later that gene is everywhere.

The sample population in `lib/evolution/sample-population.ts`
sidesteps the problem entirely. It builds a four- or five-
generation lineage of ~36 genomes *deterministically* from a single
seed, using the fixed plan `[8, 10, 8, 6, 4]` and a seeded PRNG.
Because the tree is written from a seed rather than evolved against
a moving fitness, there is no convergence pressure and therefore no
diversity to collapse. The lineage exists to populate the Evolution
Hub fan-chart with a believable family tree; it is not a real
optimisation.

## The overfitting trap

One failure mode deserves its own section because it is invisible
until it isn't. When the same fitness scorer judges every
generation — human, VLM auditor, or hand-coded heuristic — the
population eventually converges not on good sculptures but on *the
scorer's blind spots*. Any peculiarity in how the scorer weighs
criteria is amplified across generations until the engine learns
to exploit it.

Concrete examples:

- A VLM that over-rewards symmetry produces ever more symmetrical
  sculptures.
- A tired maker who clicks four stars by reflex breeds reflex-
  pleasers.
- A printability heuristic rewarding small bounding boxes shrinks
  the population towards the trivial.
- A camera angle baked into the renderer rewards genomes that look
  best from that viewpoint and nowhere else.

This is a close cousin of overfitting in supervised learning: the
population is *memorising the scorer*, not learning the underlying
aesthetic.

Three mitigations. Keep the human awake — sessions of thirty
minutes to two hours, never longer, with calibration generations at
the start. Inject five wildcards per generation so the population
can't fully memorise the scorer. And switch between scorers
periodically so no single set of blind spots dominates the lineage.
The maths is the maths; the discipline around the maths is what
keeps the output honest.

## Where this lives in Holoflow

The engine is implemented in TypeScript under `lib/evolution/`, with
a sibling Python implementation for the heavier offline work.

| File | What it carries |
| --- | --- |
| `lib/evolution/genome.ts` | The 28-gene type system. `Gene<T>` with `{ id, kind, value }`; bounds and default ranges; the five-category partition. |
| `lib/evolution/engine.ts` | The operators — mutation, crossover, tournament-select, denormalise. Pure, deterministic, seeded; the entire run is reproducible from a seed. |
| `lib/evolution/sample-population.ts` | The pedigree generator. Builds a 4–5 generation lineage of ~36 genomes deterministically from a seed; drives the Evolution Hub fan-chart. |
| `lib/evolution/fitness.ts` | The multi-axis scorer for the choreography mode and the planned headless sampler. |
| `lib/evolution/selection.ts` | Tournament implementation; rank-based and roulette are available but not wired by default. |
| `lib/evolution/product-presets.ts` | The wall-piece, wall-array, and jewellery overlays that change which genes weigh more in fitness scoring without altering the genome itself. |
| `lib/evolution/genomeKingdomBridge.ts` (planned, V1.2) | The eight kingdoms' weight vectors. The lookup that turns the UI-side aesthetic taxonomy into Python-side structural bias profiles. |

## A worked example

Two parent genomes, five of the twenty-eight genes for legibility.
Uniform crossover (per-gene fair coin), then Gaussian mutation with
`σ = 0.1` and `pₘ = 0.15`, clamped to `[0, 1]`.

| Gene | Parent A | Parent B | Uniform pick | Mutated |
| --- | --- | --- | --- | --- |
| `cell_density` | 0.62 | 0.31 | 0.62 (A) | 0.58 (−0.04) |
| `twist` | 0.45 | 0.82 | 0.82 (B) | 0.82 (no mut.) |
| `ior` | 0.50 | 0.75 | 0.50 (A) | 0.61 (+0.11) |
| `transmission` | 0.88 | 0.40 | 0.88 (A) | 0.88 (no mut.) |
| `tube_radius` | 0.20 | 0.55 | 0.55 (B) | 0.49 (−0.06) |

Three of the five genes came from parent A, two from parent B —
what a fair coin tends to produce. Three were mutated under the 15%
roll, with Gaussian noise of `−0.04`, `+0.11`, and `−0.06`; the
other two survived unchanged.

The child is then denormalised by the generator (IOR 0.61 maps
back into the refractive-index range 1.45–1.65 as roughly 1.57;
tube radius 0.49 maps into 0.5–3 mm as roughly 1.7 mm), rendered
through one of the five biomimetic kingdoms, validated for
watertightness, and presented to the maker. Four stars and the
engine learns the neighbourhood is worth exploring; two stars and
it learns to steer away.

That is the whole mathematical machinery. A point in a twenty-
eight-dimensional unit hypercube, a function on it defined by a
human pressing buttons, three operators that move a cloud of points
around, and a discipline that prevents the cloud from collapsing
into the scorer's blind spots.

## References

- Holland, J. H. (1975). *Adaptation in Natural and Artificial
  Systems.* University of Michigan Press. The founding text of the
  genetic-algorithm tradition; introduced the schema-theorem
  analysis of why bit-string crossover works.
- Goldberg, D. E. (1989). *Genetic Algorithms in Search,
  Optimization, and Machine Learning.* Addison-Wesley. The textbook
  treatment of operator bias, schema disruption, the building-block
  hypothesis, and the comparative analysis of one-point, two-point,
  and uniform crossover.
- Deb, K., Pratap, A., Agarwal, S., & Meyarivan, T. (2002). *A fast
  and elitist multiobjective genetic algorithm: NSGA-II.* IEEE
  Transactions on Evolutionary Computation, 6(2), 182–197. The
  canonical multi-objective genetic algorithm; non-dominated sort
  plus crowding distance is the working pattern.
- Eiben, A. E., & Smith, J. E. (2015). *Introduction to
  Evolutionary Computing* (2nd ed.). Springer. The modern reference
  for the family of evolutionary algorithms — genetic algorithms,
  evolution strategies, genetic programming — including the
  self-adaptive (μ + λ) strategies referenced for adaptive sigma.

## Cross-links

- `articles/how-the-studio-breeds-sculptures` — public-voice variant.
- `docs/EVOLUTION_ENGINE.md` — engine canon, gene ranges, hardware.
- `codex/genetic-algorithm-mathematics` — the codex-shaped
  counterpart to this document.
- `codex/linear-algebra-essentials` (forward) — the Euclidean metric
  on the hypercube; projections and dimensionality reduction.
- `codex/numerical-optimization-essentials` (forward) — the gradient-
  based alternatives this engine deliberately does not use, and why.
- `synthesis/17-the-28-gene-alphabet.md` — the gene-by-gene canon.
- `docs/MANIFESTO.md` §02 — SculptureGenome canonical statement.
