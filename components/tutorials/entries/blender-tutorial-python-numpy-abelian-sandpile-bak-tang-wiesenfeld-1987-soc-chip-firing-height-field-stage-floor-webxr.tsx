import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-abelian-sandpile-bak-tang-wiesenfeld-1987-soc-chip-firing-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Abelian Sandpile: Bak, Tang & Wiesenfeld (1987) Self-Organised Criticality, Chip-Firing D₄ Fractal, Power-Law Avalanches P(s) ∝ s^{−1.21}, Hausdorff d_H ≈ 1.7845 Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Place a sand grain on a grid cell; if any cell accumulates four or more, it fires — spilling one grain to each cardinal neighbour, which may then fire in turn. Repeat a few thousand times at the centre of a 101×101 grid and the stable pile reveals a quasi-fractal disc with exact four-fold symmetry, intricate nested diamond zones coloured by chip count, and a domain-boundary Hausdorff dimension of roughly 1.78. That is the Abelian Sandpile: the first published example of self-organised criticality (Bak, Tang & Wiesenfeld 1987), named 'Abelian' by Dhar (1990) after he proved that toppling order never affects the final state. This blueprint stabilises four configurations — Basis (12 000 chips), SK_Sparse (3 000), SK_Dense (25 000, pile truncated by the grid boundary), and SK_Cross (four overlapping piles in a cross) — and lifts them into a stage-floor mesh with vertex colours ranging cobalt (empty) through sky-blue and warm-amber to bright amber (three chips, maximum stable).";

function Body() {
  return (
    <>
      <p>
        Self-organised criticality is the observation that certain driven
        systems — real sandpiles, forest fires, earthquakes, neural avalanches
        — spontaneously settle into a critical state where disturbances of all
        sizes occur without any external tuning. The Abelian Sandpile is the
        first clean mathematical model that demonstrates this, and it turns out
        to be strikingly beautiful when visualised as a height field.
      </p>

      <h2>The toppling rule</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`G[i,j] ≥ 4  →  G[i,j] -= 4
              G[i-1,j] += 1   (up)
              G[i+1,j] += 1   (down)
              G[i,j-1] += 1   (left)
              G[i,j+1] += 1   (right)
              chips leaving the grid boundary: absorbed (lost)

Stable state: G[i,j] ∈ {0, 1, 2, 3} everywhere`}
      </pre>
      <p>
        The rule is local, integer-valued, and deterministic. Yet the cascade of
        topplings triggered by a single grain addition — an <em>avalanche</em> —
        can be tiny (one topple) or enormous (touching the entire pile). Bak,
        Tang & Wiesenfeld measured the avalanche size distribution on this model
        and found a power law:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`P(s) ∝ s^{−τ},   τ ≈ 1.21 in d = 2

s = number of topplings in one avalanche`}
      </pre>
      <p>
        A power law with no characteristic scale is the hallmark of criticality.
        In a critical system — tuned to the phase transition between order and
        disorder — correlations extend across the whole system. The sandpile
        reaches this critical state on its own, without tuning any parameter:
        self-organised criticality.
      </p>

      <h2>The Abelian property</h2>
      <p>
        Dhar (1990) proved that the stable state reached by toppling is
        independent of the order in which unstable cells are processed. This is
        the Abelian property, and it has two practical consequences:
      </p>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>Uniqueness</strong> — any toppling sequence converges to the
          same stable configuration. Parallel (synchronous) numpy toppling
          therefore gives the canonical BTW result.
        </li>
        <li>
          <strong>Algebraic structure</strong> — the set of stable
          configurations of an N×N grid forms a commutative monoid under the
          operation "add chips at centre and stabilise." It contains an Abelian
          group (the "sandpile group") whose identity element is itself a
          beautiful quasi-fractal.
        </li>
      </ul>

      <h2>Fractal geometry of the stable pile</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`R ≈ √(n / π ρ̄),   ρ̄ ≈ 2.125 chips/cell (mean stable density)

For n = 12 000:  R ≈ 42 cells
For n = 25 000:  R ≈ 61 cells (exceeds grid half → chips lost at boundary)

Hausdorff dimension of chip-count domain boundaries:  d_H ≈ 1.7845
D₄ symmetry (4-fold square):  G[i,j] = G[j,i] = G[N−1−i,j] etc.`}
      </pre>
      <p>
        Levine & Peres (2010) proved the limit-shape theorem: as n → ∞ the
        rescaled pile (scaled by 1/R) converges in measure to a fixed disc with
        a quasi-periodic internal structure. The internal domain boundaries —
        the curves separating 0-chip from 1-chip regions, 1-chip from 2-chip,
        and so on — are not smooth; they have non-integer Hausdorff dimension.
        The four-fold symmetry is exact: the toppling rule commutes with the D₄
        symmetry group of the square lattice, so any symmetric initial condition
        produces a D₄-symmetric stable state.
      </p>

      <h2>Blueprint approach</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`N = 101,  CX = CY = 50,  BATCH = 200

# Add BATCH chips at a time, stabilise after each — keeps
# disturbances local to the active pile edge (O(R) rounds/batch)
for start in range(0, n_total, BATCH):
    G[CX, CY] += BATCH
    G = stabilise(G)       # parallel numpy toppling

# Vertex colour ramp (FLOAT_COLOR, POINT domain):
chip 0 → cobalt     (0.00, 0.38, 0.74, 1.0)
chip 1 → sky blue   (0.25, 0.62, 0.85, 1.0)
chip 2 → warm amber (0.85, 0.55, 0.10, 1.0)
chip 3 → amber      (1.00, 0.65, 0.00, 1.0)

# Shape keys added via ob.shape_key_add + foreach_set("co", …)`}
      </pre>
      <p>
        Incremental addition (BATCH chips at a time) is crucial for speed.
        Adding all n chips at once and then stabilising requires the wave front
        to travel from the heavily loaded centre to radius R: each parallel
        toppling round the centre receives as many chips as it fires, so it
        drains very slowly — O(n) rounds in the worst case. Adding chips in
        small batches confines each disturbance to the pile edge, reducing the
        effective rounds-per-batch to O(R) ≈ O(√n).
      </p>

      <h2>Shape keys</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/20">
            <th className="py-1 pr-4 text-left">Key</th>
            <th className="py-1 pr-4 text-left">Chips</th>
            <th className="py-1 pr-4 text-left">R (cells)</th>
            <th className="py-1 text-left">What to look for</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Basis",     "12 000", "≈ 42", "Canonical diamond fractal; nested concentric rings of cobalt/amber"],
            ["SK_Sparse", "3 000",  "≈ 21", "Smaller pile; intricate early-stage pattern with fine detail"],
            ["SK_Dense",  "25 000", "≈ 61", "Pile truncated at grid edge — sharp rectangular cutoff from absorbing sink"],
            ["SK_Cross",  "4 × 1 500","≈ 21 each", "Four overlapping circular piles; interference fringes at contact zones"],
          ].map(([key, chips, r, note]) => (
            <tr key={key} className="border-b border-white/10">
              <td className="py-1 pr-4 font-mono text-xs">{key}</td>
              <td className="py-1 pr-4">{chips}</td>
              <td className="py-1 pr-4 font-mono text-xs">{r}</td>
              <td className="py-1 text-xs opacity-80">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Failure modes & trade-offs</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>Slow computation</strong> — if the blueprint takes longer than
          expected, reduce N_BASIS or increase BATCH. The bottleneck is the
          number of stabilisation rounds per batch × number of batches; larger
          BATCH means fewer calls but more rounds per call.
        </li>
        <li>
          <strong>SK_Dense looks abruptly cut</strong> — expected. With n=25 000
          the pile radius exceeds the grid half-width (50), so chips fall off
          the absorbing boundary. The rectangular cutoff is a finite-size effect,
          not a bug. Use a larger N (e.g. 141) to avoid it.
        </li>
        <li>
          <strong>SK_Cross piles fully merged</strong> — at RING_OFF=20 and
          R≈21, the sub-piles' edges overlap. Raise RING_OFF to 30 for
          visually distinct piles; lower it further for stronger overlap.
        </li>
        <li>
          <strong>Pattern not symmetric</strong> — ensure N is odd (centre cell
          at an integer index). Even N gives an off-centre centre, breaking D₄.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Bak P, Tang C, Wiesenfeld K (1987) &ldquo;Self-Organized Criticality:
          An Explanation of the 1/f Noise.&rdquo; <em>Phys Rev Lett</em>{" "}
          <strong>59</strong>(4):381–384.{" "}
          <a
            href="https://link.aps.org/doi/10.1103/PhysRevLett.59.381"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1103/PhysRevLett.59.381
          </a>
          . Equations public domain. Related:{" "}
          <a
            href="https://link.aps.org/doi/10.1103/PhysRevLett.71.4083"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Bak &amp; Sneppen 1993
          </a>{" "}
          (punctuated-equilibrium evolution as SOC).
        </li>
        <li>
          Dhar D (1990) &ldquo;Self-organized Critical State of Sandpile
          Automaton Models.&rdquo; <em>Phys Rev Lett</em>{" "}
          <strong>64</strong>(14):1613–1616.{" "}
          <a
            href="https://link.aps.org/doi/10.1103/PhysRevLett.64.1613"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1103/PhysRevLett.64.1613
          </a>
          . Equations public domain. Related:{" "}
          <a
            href="https://arxiv.org/abs/0712.3378"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Levine &amp; Peres 2010
          </a>{" "}
          (limit-shape theorem, arXiv:0712.3378).
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr"
            className={lk}
          >
            Ising Model — Metropolis Monte Carlo Phase Transition Height Field
          </Link>{" "}
          — another self-organising lattice model with critical behaviour; the
          Ising critical point is externally tuned (temperature = T_c), whereas
          the sandpile reaches criticality without any tuning.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov Standard Map — KAM Breakdown Stage Floor
          </Link>{" "}
          — another height-field technique using a different kind of
          criticality (KAM transition at K_c ≈ 0.972); compare the geometric
          fractal structure of the two floors.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
            className={lk}
          >
            DLA — Diffusion-Limited Aggregation Dendritic Crystal
          </Link>{" "}
          — stochastic fractal growth from a random walk, conceptually
          opposite to the sandpile&apos;s deterministic chip-firing; both
          produce fractal structures with similar Hausdorff dimensions (DLA
          d_H ≈ 1.71 vs sandpile domains d_H ≈ 1.78).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-01",
  topics: [
    "blender",
    "python",
    "numpy",
    "self-organised criticality",
    "abelian sandpile",
    "chip-firing",
    "fractal",
    "stage floor",
    "webxr",
    "shape keys",
  ],
  Body,
});
