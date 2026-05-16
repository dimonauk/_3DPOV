# `app/atelier/breeding-floor/` — purpose twin

## What this is

A small genetic-algorithm chamber, in plain English. The page
spawns twelve sculpture genomes from a seeded random walk through
the studio's twenty-eight-gene alphabet, draws each one as a card
with a tinted placeholder thumbnail, and gives the visitor three
buttons:

- **Mutate selected.** Every card the visitor has marked as a
  favourite is replaced by a jittered child of itself. Cards that
  weren't favourited stay put.
- **Breed selected.** Favoured cards pair off as parents; the
  remaining slots are replaced by crossover + mutate children of
  the parent pool.
- **Reset.** Throw the floor away and start from a fresh seeded
  random walk.

The generation counter advances on every Mutate / Breed press. A
lineage strip down the bottom keeps the last five generations as a
row of small coloured thumbs so the user can see colour drift
through the lineage. No splat render yet &mdash; the thumbnails are
flat-coloured discs whose RGB comes from each genome's own
`tint_r/g/b` genes. The full splat renderer lands in a later pass.

## What this is not

- **Not a real-time evolutionary loop.** Generations advance under
  user control, one press at a time. The engine in
  `lib/evolution/engine.ts` could drive an autonomous walk, but
  this chamber is the manual studio.
- **Not a real splat renderer.** Thumbnails are still 2D tinted
  discs. A small R3F floor preview sits at the top of the chamber —
  twelve genomes as glowing spheres on a 4x3 grid, walkable in VR
  via the shared `ChamberXRBar` — but those spheres are placeholder
  geometry, not the real per-genome splat. The full splat-renderer
  lands in a later pass.
- **Not bound to `SculptureGenome` from `lib/assets/genomes.ts`.**
  The chamber uses the engine's normalised `Genome` type (every
  numeric gene in `[0..1]`). The catalogue's denormalised
  application genome is a different shape and a different concern.
- **Not persisted.** Closing the tab loses the floor. A future
  pass will hook into the genome-archive station.

## File layout

- `page.tsx` &mdash; server shell. Owns metadata, page heading,
  framing prose, and the cross-links.
- `breeding-floor-client.tsx` &mdash; the `"use client"` component
  that holds the population, favourites, and lineage state and
  wires the three top-bar actions into the evolution library.
- `PURPOSE.md` &mdash; this file.

## Depends on

- `lib/evolution` &mdash; for `Genome`, `mutateGenome`,
  `crossover`, `seededRng`, `GENE_NAMES`, and `cloneGenome`. The
  chamber only ever calls the public surface.
- `lib/log` &mdash; for the namespaced logger
  (`atelier:breeding-floor`).
- `components/layout/footer` &mdash; standard page chrome.

## Cross-references

- The fourteen-station evolution architecture lives at
  `/atelier/evolution`. The breeding floor is one corner of that
  larger suite, brought online as a working room.
- The article `how-the-studio-breeds-sculptures` is the prose
  argument for why every sculpture in the studio is a genome before
  it is a mesh. The chamber is the article, made operable.

## What's queued for later passes

- **Real splat thumbnails.** Wire the chamber's `Genome` to the
  `viz.thumbnail-splat` capability and replace the flat-tinted disc
  with the actual rendered preview.
- **Fitness scoring on each card.** Show the five-axis breakdown
  (optical, coherence, novelty, complexity, printability) so the
  visitor can see why the engine likes a card.
- **Persist favourites.** Bind to the future
  `genome-archive` slice so the visitor's favourites survive a
  reload and can be exported.
- **Wildcard slot.** Add an "inject wildcard" button that uses the
  engine's `wildcardFactory` option to drop a fresh random genome
  into the population mid-walk.
