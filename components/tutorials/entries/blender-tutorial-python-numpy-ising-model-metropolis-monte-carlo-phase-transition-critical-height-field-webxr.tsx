import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr";

const TITLE =
  "Python numpy — Ising Model: Metropolis Monte Carlo, Onsager Critical Temperature " +
  "& Phase-Transition Height-Field for WebXR (Blender 5.1)";

const LEDE =
  "The 2D square-lattice Ising model assigns a binary spin σ ∈ {-1, +1} to each " +
  "site. Nearest-neighbour pairs interact via H = -J Σ σᵢσⱼ. Lars Onsager solved " +
  "it exactly in 1944, deriving Tc = 2J/(kB ln(1+√2)) ≈ 2.2692 — the first exact " +
  "solution of a non-trivial statistical mechanics model. This blueprint simulates " +
  "the system at three temperatures using a checkerboard-vectorised Metropolis sweep, " +
  "maps each spin state to a 64×64 Blender height-field, stores all three regimes " +
  "as shape keys, vertex-colours the critical state, and exports a Draco-6 GLB " +
  "stage floor for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1920, Wilhelm Lenz proposed the simplest possible model of a magnet:
        a lattice of sites, each carrying a binary spin. His student Ernst Ising
        solved the 1D chain exactly in 1925 and found no phase transition — he
        concluded ferromagnetism could not be explained this way. He was wrong
        about the 2D generalisation. In 1944, Lars Onsager derived an exact
        closed-form solution for the 2D square lattice, revealing a genuine
        phase transition at a precise critical temperature:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Tc = 2J / (kB · ln(1 + √2))  ≈  2.2692  (J = kB = 1)

Below Tc : large ferromagnetic domains → spontaneous magnetisation
At Tc    : fractal-like clusters at every length scale (scale-invariant)
Above Tc : disordered paramagnet → zero net magnetisation`}
      </pre>
      <p>
        The critical point is special because correlation length diverges — the
        system has no characteristic length scale, producing self-similar
        domain patterns indistinguishable at any zoom level. That makes the
        critical Ising lattice an excellent procedural texture: it is structured
        enough to read as a pattern but disordered enough to avoid obvious
        repetition.
      </p>

      <h2>Checkerboard Metropolis</h2>
      <p>
        Metropolis-Hastings (1953) is the canonical Monte Carlo sampler for
        the Ising model. For each candidate spin flip at site i, compute the
        energy cost ΔE = 2Jσᵢ(Σneighbours). Accept if ΔE ≤ 0; otherwise accept
        with probability exp(−ΔE/kT). This satisfies detailed balance, so the
        Markov chain converges to the Boltzmann distribution P ∝ exp(−H/kT).
      </p>
      <p>
        Naïve single-spin updates cannot be vectorised — updating site (i,j)
        changes the energy of its neighbours, invalidating a simultaneous update
        of (i+1,j). The solution is the <em>checkerboard decomposition</em>:
        colour the lattice like a chessboard so that every black site&apos;s four
        nearest neighbours are white, and vice versa. All black sites can then
        be updated simultaneously (they share no mutual neighbours), then all
        white sites. A full sweep retains exact detailed balance while running
        as two numpy bulk operations on arrays of size N²/2.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# precomputed sublattice index arrays
_ii, _jj = np.indices((N, N))
_MASKS = {c: (_ii[(_ii+_jj)%2==c], _jj[(_ii+_jj)%2==c]) for c in (0,1)}

def _sweep(spins, T, rng):
    beta = 1.0 / T
    for colour in (0, 1):
        i_, j_ = _MASKS[colour]
        nb = (spins[(i_-1)%N, j_] + spins[(i_+1)%N, j_] +
              spins[i_, (j_-1)%N] + spins[i_, (j_+1)%N])
        dE   = 2.0 * spins[i_, j_].astype(np.float32) * nb
        prob = np.where(dE <= 0, 1.0, np.exp(-beta * np.maximum(dE, 0.0)))
        flip = rng.random(len(i_), dtype=np.float32) < prob
        spins[i_, j_] = np.where(flip, -spins[i_,j_], spins[i_,j_]).astype(np.int8)`}
      </pre>
      <p>
        The <code>np.maximum(dE, 0.0)</code> clamp ensures the exponential
        argument is always ≤ 0 even for sites where dE ≤ 0 (where
        <code>np.where</code> will discard the exp result anyway). This
        prevents spurious warnings from exp of a large positive argument in
        the rejected branch.
      </p>

      <h2>Three temperature snapshots as shape keys</h2>
      <p>
        The blueprint runs three independent simulations — 2000 equilibration
        sweeps then 400 production sweeps at each temperature — and maps each
        final spin lattice to a Blender height-field:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`vertex index = i*N + j
Z = spin[i,j] × Z_AMP    (Z_AMP = 0.08 m)
X = i × SPACING           (SPACING = 0.1 m)
Y = j × SPACING`}
      </pre>
      <p>
        The T_high state (basis shape) looks like small random noise — roughly
        equal blue and magenta patches, no structure. The T_crit shape key
        shows clusters at every scale: tiny specks nested inside medium blobs
        nested inside larger regions, self-similar. The T_low shape key shows
        a small number of enormous flat domains separated by thin sharp
        boundaries — the classic ferromagnetic ground state.
      </p>
      <p>
        Vertex colours are stored from the critical state (most visually rich)
        as a <code>FLOAT_COLOR</code> per-point attribute. This stays fixed
        across shape key morphs, so the colour encodes the critical topology
        while the Z displacement morphs through the three temperature regimes.
        Compare the analogous approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
          className={lk}
        >
          Chladni figures tutorial
        </Link>
        , which maps eigenmode amplitudes to height with shape keys for
        different vibrational modes.
      </p>

      <h2>Connection to other pattern-forming systems</h2>
      <p>
        The Ising model belongs to a broad family of systems that self-organise
        into spatial patterns from local rules. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
          className={lk}
        >
          Gray-Scott reaction-diffusion tutorial
        </Link>{" "}
        shows another member: a two-chemical system that spontaneously produces
        spots, stripes, and maze patterns via Turing instability. Both systems
        exhibit parameter-dependent morphologies — the Ising model via
        temperature, Gray-Scott via feed/kill rates. At criticality, both
        develop scale-free structure.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr"
          className={lk}
        >
          Physarum slime-mould tutorial
        </Link>{" "}
        takes a different approach — agent-based sensing and trail deposition —
        but also self-organises into vein-like networks that share topological
        features with the Ising domain-boundary network at criticality.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi"
          className={lk}
        >
          FitzHugh-Nagumo excitable medium tutorial
        </Link>{" "}
        in Geometry Nodes provides a third variant using Simulation Zones to
        propagate spiral activation waves — a continuous analogue of domain walls.
      </p>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Onsager, L. (1944). &ldquo;Crystal Statistics. I.&rdquo;{" "}
          <em>Phys. Rev.</em> <strong>65</strong>, 117–149.{" "}
          <a
            href="https://doi.org/10.1103/PhysRev.65.117"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1103/PhysRev.65.117
          </a>{" "}
          — original exact solution; mathematical content PD. Related:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Ising_model"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia: Ising model
          </a>
          .
        </li>
        <li>
          Metropolis, N., Rosenbluth, A., Rosenbluth, M., Teller, A., Teller, E.
          (1953). &ldquo;Equation of State Calculations by Fast Computing
          Machines.&rdquo;{" "}
          <em>J. Chem. Phys.</em> <strong>21</strong>, 1087.{" "}
          <a
            href="https://doi.org/10.1063/1.1699114"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1063/1.1699114
          </a>{" "}
          — the Metropolis algorithm; mathematical content PD. Related:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Metropolis%E2%80%93Hastings_algorithm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia: Metropolis-Hastings
          </a>
          .
        </li>
        <li>
          NumPy community. <em>NumPy</em> (BSD-3-Clause).{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — vectorised random number generation and array operations. Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an hour",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock and save the .blend file so that '//' paths resolve to the same directory.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. Watch the console: three temperature simulations run sequentially. With default N=64 and 2000+400 sweeps, runtime is 20–60 s on a modern CPU.",
      },
      {
        title: "Verify mean magnetisation",
        body: "The console prints mean spin values: T_high ≈ 0.00 (disordered), T_crit ≈ ±0.05–0.20 (fluctuating), T_low ≈ ±0.85–0.98 (strongly ordered). A T_low value near 0 suggests insufficient equilibration — increase N_EQUIL.",
      },
      {
        title: "Switch to Vertex Colour shading",
        body: "In the 3D Viewport, press Z and choose Material Preview, or in the header change the shading to Vertex Colours under Overlays. You should see blue/magenta fractal patches from the critical state.",
      },
      {
        title: "Explore shape keys",
        body: "Object Properties → Shape Keys. Drag T_crit to 1.0: critical clusters appear at all scales simultaneously. Return to 0 and drag T_low to 1.0: large flat domains with thin boundaries. The T_high Basis shows uniform small-scale noise.",
      },
      {
        title: "Run record.py",
        body: "Load record.py and press Alt+P. A 120-frame animation morphs Basis → T_crit → T_low and renders to viewport.mp4 via Workbench.",
      },
      {
        title: "Screen-record the session",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture the full session in OBS: theory, script walkthrough, live run, shape key demo.",
      },
      {
        title: "Save .blend",
        body: "File → Save As → hf_ising_floor.blend. The GLB was already written automatically by blueprint.py.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-02",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);
