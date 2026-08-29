import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr";

const TITLE =
  "Python numpy — Chirikov–Taylor Standard Map: KAM Breakdown, Greene's K_c ≈ 0.971635 Critical Threshold, Symplectic Orbit-Density Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Chirikov–Taylor standard map is the simplest area-preserving map that captures every phenomenon of Hamiltonian chaos: KAM tori, resonance islands, noble-number barriers, and the sudden transition to global stochasticity at the critical parameter K_c ≈ 0.971635 (Greene 1979). This blueprint samples 200 trajectories × 6 000 iterations per K value, bins each visited phase-space cell into a 180 × 180 log-density grid, and lifts that grid into a Blender stage-floor mesh — intact KAM tori appear as sharp ridges, the chaotic sea flattens into a plateau, and island chains produce intermediate humps. Four shape keys sweep the floor from the nearly-integrable limit (K = 0.1) through the intact-tori regime (K = 0.5) to the exact critical threshold and on into the mostly-chaotic sea (K = 2.0).";

function Body() {
  return (
    <>
      <p>
        Every Hamiltonian system — pendulums, planetary orbits, particle
        accelerators, plasma confinement devices — faces the same question:
        as a perturbation grows, at what strength do the last stable orbits
        collapse and global transport begin? The standard map answers this
        question in its simplest possible form, stripped of everything
        non-essential.
      </p>
      <p>
        The map lives on the 2-torus T² = [0, 2π) × [0, 2π). Each step takes
        a point (θ, p) — angle and momentum — and advances it by exactly the
        formula below. No differential equations, no integration error, no
        approximation beyond the parameter K itself.
      </p>

      <h2>Equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`p_{n+1} = p_n + K · sin(θ_n)   (mod 2π)
θ_{n+1} = θ_n + p_{n+1}         (mod 2π)

Jacobian: J = [[1, K·cos θ], [1, 1+K·cos θ]]
det(J)  = 1 everywhere  →  area-preserving (symplectic)

K = 0        : integrable   — exact circles, no chaos
K < K_c      : KAM regime   — most tori intact, island chains at rationals
K ≈ K_c      : critical     — last invariant curve (ω = (√5−1)/2) breaks
K > K_c      : diffusive    — global transport, Lévy flights, accelerator modes`}
      </pre>

      <h2>KAM theory — why most tori survive small perturbations</h2>
      <p>
        The Kolmogorov–Arnold–Moser theorem (1954–1963) guarantees that if K is
        small enough, all invariant tori whose winding number ω satisfies a
        Diophantine condition —
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`|ω − p/q| > C · q^{−τ}   for all integers p, q > 0`}
      </pre>
      <p>
        — persist under the perturbation. The Diophantine condition means ω
        is badly approximated by rationals: irrational numbers whose
        continued-fraction convergents grow slowly. The <em>most</em> irrational
        number by this measure is the golden ratio φ = (1+√5)/2, whose continued
        fraction is [1; 1, 1, 1, …] — every convergent is a ratio of consecutive
        Fibonacci numbers, and they converge as slowly as possible.
      </p>
      <p>
        So the last KAM torus to break has winding number ω = 1/φ = (√5−1)/2 ≈
        0.618. Rationally-resonant tori (ω = p/q) break first, each shattering
        into 2q alternating stable (elliptic) and unstable (hyperbolic) fixed
        points — the Poincaré–Birkhoff theorem.
      </p>

      <h2>Greene's residue criterion and K_c</h2>
      <p>
        John M. Greene (1979) found an elegant way to detect whether the
        golden-ratio torus still exists at a given K. He tracked the period-q
        orbits whose winding numbers p_n/q_n are the Fibonacci convergents to
        1/φ, then computed the <em>residue</em> of each:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`R = (2 − Tr(M^q)) / 4

where M^q is the linearised map around the period-q orbit.

R < 0  →  orbit is hyperbolic (unstable)
0 < R < 1  →  orbit is elliptic (stable)
R → 0.25 as q → ∞  ↔  KAM torus survives
R → ∞  as q → ∞  ↔  torus has broken

K_c ≈ 0.971635...  is the unique K where R_∞ = 0.25 (marginal stability)`}
      </pre>
      <p>
        This gives K_c to arbitrary precision by computing ever-longer Fibonacci
        convergents. The value 0.971635… is Greene's number, as precise and
        fundamental as any mathematical constant.
      </p>

      <h2>What the height-field encodes</h2>
      <p>
        The blueprint seeds 200 trajectories at evenly-spaced p₀ ∈ [0, 2π) with
        θ₀ = 0. After 6 000 map iterations each, every visited cell
        (θ, p) mod 2π is counted in a 180 × 180 histogram. The log of that
        count (with a small ε for numerical safety) drives the vertex height.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`height[i, j] = log(ε + count[i, j]) / max_log_count

Tall ridge  →  trajectory visits repeatedly  →  intact KAM torus
Flat plain  →  ergodic chaotic sea fills in uniformly
Hump chain  →  island chain at rational winding ω = p/q`}
      </pre>
      <p>
        The cobalt→amber gradient on the vertex colours reinforces this: amber
        peaks mark the densest ridges, cobalt troughs mark the chaotic sea.
      </p>

      <h2>Blueprint walk-through</h2>

      <h3>1. orbit_density(K)</h3>
      <p>
        Pure numpy, fully vectorised: all 200 trajectories advance
        simultaneously each iteration. <code>np.add.at</code> handles bin
        collisions correctly (unlike fancy indexing, which would silently drop
        duplicates). At 6 000 iterations this is about 1.2 M map steps — runs
        in roughly 2 seconds on a modern CPU.
      </p>

      <h3>2. build_floor_mesh(heights, name)</h3>
      <p>
        Uses <code>foreach_set</code> on the raw mesh data — no
        <code>bpy.ops</code>, no context dependency. A 180 × 180 vertex grid
        with 179 × 179 quad faces (32 041 faces). The x-axis maps to θ, the
        y-axis to p, both spanning MESH_SCALE = 6 m.
      </p>

      <h3>3. Shape keys</h3>
      <p>
        The Basis key holds K_critical; three additional keys hold K = 0.1,
        0.5, and 2.0. Each is a full independent density computation, so
        cross-fading in Blender blends the actual orbit-density landscapes —
        you see the tori rise and fall in real time as you drag the slider.
      </p>

      <h3>4. Vertex colours</h3>
      <p>
        A FLOAT_COLOR attribute &ldquo;Col&rdquo; stores linear-light values per
        vertex. The emission material samples this attribute directly at
        strength 1.8 — no texture bake needed, exports correctly to GLB via
        KHR_materials_unlit.
      </p>

      <h2>Trade-offs and failure modes</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>N_IC too small.</strong> With fewer than ~80 initial
          conditions, island chains at high-order resonances are not sampled
          and appear as empty cells. 200 is sufficient for chains up to order 8.
        </li>
        <li>
          <strong>N_ITER too short.</strong> KAM tori need many visits to
          appear as dense ridges. Below ~2 000 iterations the tori look dotted
          and indistinct. 6 000 gives clean ridges.
        </li>
        <li>
          <strong>Parallel toppling at K = 0.</strong> At K = 0, each p₀
          trajectory traces a horizontal line θ → θ + p₀ every step. With
          N_GRID = 180 and N_ITER = 6 000, a trajectory with p₀ = 2π/3 exactly
          (rational) will repeat after 3 steps and leave only 3 filled cells.
          Using endpoint=False in linspace avoids most rational seeds.
        </li>
        <li>
          <strong>Accelerator modes at K ≥ 2π.</strong> Above K ≈ 6.3,
          accelerator-mode orbits drift unboundedly in p (wrapping the torus
          many times). These appear as vertical stripes. K_CHAOTIC = 2.0 is
          safely below this regime.
        </li>
      </ul>

      <h2>GLB export for WebXR</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`bpy.ops.export_scene.gltf(
    filepath="hf_chirikov_standard_map.glb",
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_colors=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
)`}
      </pre>
      <p>
        Apply transforms before export (<code>export_apply=True</code>) so the
        WebXR runtime receives a mesh in world space. Draco level 6 reduces file
        size by roughly 6× for a flat height-field — the z-variance is low,
        which Draco exploits heavily.
      </p>

      <h2>Related studio entries</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
            className={lk}
          >
            Arnold Tongue / Circle Map — Mode-Locking
          </Link>{" "}
          — the standard map&apos;s 1D cousin: a twist map on a circle. The
          Arnold tongues show exactly which winding numbers lock at each K,
          complementing this tutorial&apos;s KAM picture of how those same
          resonances appear in the 2D phase portrait.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
            className={lk}
          >
            Hénon–Heiles Hamiltonian — KAM Tori &amp; Poincaré Section
          </Link>{" "}
          — KAM structure from a continuous two-degree-of-freedom Hamiltonian.
          Compare that system&apos;s surface-of-section with this discrete
          map&apos;s phase portrait: the topology is identical, but the
          continuous system requires numerical ODE integration while the
          standard map is exact at each step.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
            className={lk}
          >
            Hénon Map — Strange Attractor &amp; Fractal Basin
          </Link>{" "}
          — the Hénon map is a dissipative cousin: Jacobian determinant{" "}
          <em>b</em> &lt; 1 rather than 1, so orbits contract onto a strange
          attractor. Setting b = 1 recovers an area-preserving twist map
          structurally similar to the standard map.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
            className={lk}
          >
            Feigenbaum — Logistic Map Period-Doubling Universality
          </Link>{" "}
          — KAM breakdown in the standard map and period-doubling in the
          logistic map are both universal transitions to chaos, but they
          belong to different universality classes. Feigenbaum&apos;s δ ≈ 4.669
          governs the logistic route; Greene&apos;s K_c ≈ 0.971635 governs the
          Hamiltonian route.
        </li>
      </ul>

      <h3>External — sources and attribution</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Chirikov B V (1979){" "}
          <a
            href="https://www.sciencedirect.com/science/article/pii/0370157379900231"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            A universal instability of many-dimensional oscillator systems
          </a>{" "}
          — <em>Physics Reports</em> 52(5):263–379. The defining paper for the
          standard map and the resonance-overlap criterion. Equations are in
          the public domain. Related:{" "}
          <a
            href="https://www.budker.nsk.su/en/about/history/chirikov/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Budker Institute biography of Chirikov
          </a>
          ; the Chirikov map was originally developed to study stochasticity
          in proton accelerators.
        </li>
        <li>
          Greene J M (1979){" "}
          <a
            href="https://doi.org/10.1063/1.524170"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            A method for determining a stochastic transition
          </a>{" "}
          — <em>Journal of Mathematical Physics</em> 20:1183–1201. Establishes
          the residue criterion and computes K_c to six decimal places.
          Equations and theorems are in the public domain. Greene&apos;s
          criterion was later proved rigorously by MacKay (1992) using
          renormalisation-group methods; see{" "}
          <a
            href="https://arxiv.org/abs/math/9211209"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            MacKay&apos;s Renormalisation in Area-Preserving Maps (arXiv)
          </a>
          .
        </li>
        <li>
          Cvitanović P et al.{" "}
          <a
            href="https://chaosbook.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chaos: Classical and Quantum
          </a>{" "}
          — online textbook (chaosbook.org), CC-BY for educators. Chapter 26
          covers the standard map in depth with worked residue calculations and
          excellent figures. Related:{" "}
          <a
            href="https://github.com/ChaosBook"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ChaosBook GitHub organisation
          </a>{" "}
          (MIT-licensed Python and Mathematica notebooks for chaosbook
          exercises, including standard-map Poincaré sections).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  tags: [
    "blender",
    "scripting",
    "python",
    "chaos",
    "hamiltonian",
    "KAM",
    "symplectic",
    "webxr",
    "mathematics",
  ],
  body: Body,
});
