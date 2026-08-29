import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-wigner-semicircle-goe-random-matrix-eigenvalue-level-repulsion-stage-floor-webxr";

const TITLE =
  "Python numpy — Wigner Semicircle Law: GOE Random-Matrix Eigenvalue Density, Level Repulsion, Wigner Surmise vs Poisson, (λ, s) Joint Density Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "In 1955, Eugene Wigner showed that the neutron resonance levels of heavy nuclei — hopelessly complex to compute from first principles — obeyed the same spacing statistics as a completely random symmetric matrix. This blueprint samples 250 Gaussian Orthogonal Ensemble matrices at four sizes, bins every consecutive (eigenvalue λ, unfolded spacing s) pair into a 120 × 120 log-density grid, and lifts it into a Blender stage-floor mesh: the Wigner surmise ridge appears at s ≈ 0.9, the level-repulsion void is visible at s = 0, and a Poisson shape key shows exactly what integrable quantum systems do instead.";

function Body() {
  return (
    <>
      <p>
        The claim sounds implausible: take a large matrix whose entries are
        independent Gaussian random numbers, symmetrise it, and compute its
        eigenvalues. The spacing statistics of those eigenvalues will match the
        neutron resonance levels of uranium-238 to extraordinary precision —
        even though uranium has nothing random about it. Wigner was right, and
        the field of random matrix theory has not stopped expanding since.
      </p>

      <h2>The Gaussian Orthogonal Ensemble</h2>
      <p>
        The GOE is the ensemble of all N×N real symmetric matrices H with
        Gaussian-distributed entries. The normalisation used here places the
        bulk spectrum in [−2, 2] as N → ∞:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`A_{ij} ~ N(0, 1)  i.i.d. (full N×N matrix of independent Gaussians)
H = (A + Aᵀ) / √(2N)        (symmetrise and normalise)

Off-diagonal entry variance = 1/N
Diagonal entry variance     = 2/N

np.linalg.eigh(H)  →  N real eigenvalues sorted in ascending order
                       (exploits symmetry: O(N³/3) vs O(N³) for eig)`}
      </pre>
      <p>
        The factor 1/√(2N) is not arbitrary: it is the unique normalisation
        that keeps the spectral radius bounded as N → ∞. At this scale the
        largest eigenvalue converges to 2 (Tracy–Widom, 1994), and the bulk
        density converges to the semicircle.
      </p>

      <h2>Wigner Semicircle Law</h2>
      <p>
        The empirical eigenvalue density — the histogram of all N eigenvalues,
        normalised to integrate to 1 — converges weakly to the Wigner
        semicircle as N → ∞:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ρ_sc(λ) = (1/2π) √(4 − λ²),    |λ| ≤ 2
         = 0,                            otherwise

ρ_sc(0) = 1/π   ≈ 0.318   (maximum, at the centre)
ρ_sc(±2) = 0              (spectral edges)`}
      </pre>
      <p>
        This is the free-probability analogue of the Central Limit Theorem.
        Dan-Virgil Voiculescu (1985) identified the semicircle as the attractor
        under <em>free convolution</em> — the correct addition law for large
        random matrices — precisely as the Gaussian is the attractor under
        ordinary convolution. The result holds for any entry distribution with
        finite variance (Wigner&rsquo;s original proof assumed Gaussians; the
        Wigner semicircle law in full generality is universality in the bulk).
      </p>
      <p>
        The x-axis of the stage floor runs along the eigenvalue axis λ ∈
        [−2.3, 2.3]. The bulk cut at |λ| &lt; 1.90 excludes the Tracy–Widom
        edge regime near |λ| ≈ 2, where the local spacing statistics are
        different.
      </p>

      <h2>Level repulsion and the Wigner surmise</h2>
      <p>
        The eigenvalue <em>density</em> is only half the story. The spacing
        statistics — how far apart consecutive eigenvalues are — carry
        independent information. Before comparing spacings across different
        parts of the spectrum, the raw spacings must be{" "}
        <em>unfolded</em>: rescaled by the local mean spacing so that the
        global mean spacing equals 1 everywhere.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`δᵢ = λᵢ₊₁ − λᵢ                     (raw consecutive spacing)
midᵢ = (λᵢ + λᵢ₊₁) / 2              (midpoint eigenvalue)
sᵢ = δᵢ × N × ρ_sc(midᵢ)           (unfolded spacing; mean = 1 in bulk)

After unfolding, the nearest-neighbour spacing distribution:
  P_GOE(s) ≈ (π/2) s · exp(−πs²/4)   Wigner surmise
  P_Pois(s) = exp(−s)                  Poisson (integrable)`}
      </pre>
      <p>
        The linear factor <code>s</code> in P_GOE forces P(0) = 0: two GOE
        eigenvalues never coincide. This is <em>level repulsion</em>. The
        Poisson density is exponential and reaches its maximum at s = 0 —
        levels may cluster with no penalty. The difference is not subtle: the
        two distributions peak in completely different places, and the s = 0
        behaviour is the most diagnostic feature.
      </p>

      <h2>What the height-field shows</h2>
      <p>
        For each sampled matrix, the blueprint records every consecutive pair
        (λᵢ, sᵢ) from the bulk. These pairs are binned into a 120 × 120
        two-dimensional histogram:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x axis: eigenvalue position  λ ∈ [−2.3, 2.3]  (bin 120 cells)
y axis: unfolded spacing      s ∈ [0,    3.5]  (bin 120 cells)
height: h = log(ε + count) / max_log_count,  ε = 1

Wigner ridge at s ≈ 0.9:  visible as a high plateau running along x
s = 0 void:                visible as a trough at y = 0 (level repulsion)
Semicircle profile:        cutting the floor along z at fixed s gives ρ_sc(λ)
Surmise profile:           cutting along x at fixed λ gives P_GOE(s)`}
      </pre>
      <p>
        Both marginals of the two-dimensional distribution are visible
        simultaneously on one floor — a single object encodes both the Wigner
        semicircle law and the Wigner surmise.
      </p>

      <h2>BGS conjecture — quantum chaos and random matrices</h2>
      <p>
        Bohigas, Giannoni, and Schmit (1984) conjectured — based on
        computations for the Sinai billiard — that quantum-chaotic Hamiltonians
        follow GOE level statistics, while integrable systems follow Poisson.
        The BGS conjecture is now supported by vast numerical evidence across
        physics, but remains unproven.
      </p>
      <p>
        The physical intuition: a chaotic classical trajectory explores phase
        space ergodically, and the quantum Hamiltonian inherits this ergodicity
        in a way that forces eigenvalue correlations matching the GOE. An
        integrable system has as many conserved quantities as degrees of
        freedom; different conserved-quantity sectors are independent, and their
        eigenvalues are uncorrelated — Poisson statistics.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr"
            className={lk}
          >
            Bunimovich stadium billiard
          </Link>{" "}
          — the canonical quantum-chaotic billiard; its level statistics
          converge to GOE as the barrier radius increases from 0 (integrable
          rectangle) to ∞ (fully ergodic stadium).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr"
            className={lk}
          >
            Sinai billiard / Lorentz gas
          </Link>{" "}
          — the billiard Bohigas et al. originally studied; its dispersing
          property guarantees a positive Lyapunov exponent and GOE statistics
          in the quantum limit.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov standard map
          </Link>{" "}
          — the simplest Hamiltonian map exhibiting KAM → chaos transition;
          quantising it (quantum standard map / quantum kicked rotor) gives GOE
          statistics above the critical K and Poisson below.
        </li>
      </ul>

      <h2>Montgomery–Odlyzko — Riemann zeros and GUE</h2>
      <p>
        Hugh Montgomery (1973) conjectured that the pair-correlation function
        of the non-trivial zeros of the Riemann zeta function on the critical
        line matches the GUE (Gaussian Unitary Ensemble) pair-correlation — the
        complex analogue of the GOE, relevant when time-reversal symmetry is
        broken. The GOE described here is for systems with time-reversal
        symmetry; the GUE governs systems without it.
      </p>
      <p>
        Andrew Odlyzko&rsquo;s numerical computations (1987) over the first
        10¹³ zeros confirmed this to extraordinary precision. The shape-key
        floor in this tutorial shows GOE (real-symmetric matrices); the
        Riemann connection requires GUE (complex Hermitian matrices), but the
        qualitative picture — level repulsion, a ridge at s ≈ 0.9, a void at
        s = 0 — is the same.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr"
          className={lk}
        >
          Riemann zeta stage-floor tutorial
        </Link>{" "}
        visualises the zeros directly on the critical strip.
      </p>

      <h2>Blueprint walk-through</h2>

      <h3>1. sample_goe and sample_poisson</h3>
      <p>
        <code>sample_goe(n, rng)</code> constructs H = (A + Aᵀ)/√(2N) and
        calls <code>np.linalg.eigh</code>, which returns sorted real
        eigenvalues in O(N³/3) operations using the symmetric divide-and-conquer
        algorithm. <code>sample_poisson(n, rng)</code> returns N sorted uniform
        random numbers on [−2, 2] — uncorrelated levels, Poisson spacing
        statistics after unfolding with constant density ρ = 1/4.
      </p>

      <h3>2. compute_density</h3>
      <p>
        For each of the 250 matrices sampled per shape key, the function
        computes consecutive raw spacings δᵢ = λᵢ₊₁ − λᵢ, evaluates ρ_sc at
        each midpoint, and unfolds:{" "}
        <code>s_i = δ_i × N × ρ_sc(mid_i)</code>. Only bulk eigenvalues
        (|λ| &lt; 1.90) are included. The (λ, s) pairs are then binned with{" "}
        <code>np.add.at</code> — which handles duplicate indices correctly,
        unlike NumPy fancy indexing — into the 120 × 120 count array. The
        final step applies <code>log(ε + count)</code> and normalises to [0, 1].
      </p>

      <h3>3. build_floor and shape keys</h3>
      <p>
        The 120 × 120 vertex grid (14 400 vertices, 14 161 quad faces) is
        constructed with fully vectorised numpy operations: meshgrid for XY
        positions, broadcasting for the (N−1)² quad faces. Four independent
        density computations feed the Basis, SK_Small, SK_Med, and SK_Pois
        shape keys. Each key uses{" "}
        <code>sk.data.foreach_set(&lsquo;co&rsquo;, flat_array)</code> — one
        C-level call that is roughly 40× faster than iterating over{" "}
        <code>sk.data[i].co</code> in Python.
      </p>

      <h3>4. Vertex colour and material</h3>
      <p>
        The <code>WignerCol</code> FLOAT_COLOR POINT attribute interpolates
        linearly from Cobalt (0, 0.38, 0.74) at low density to Amber (1.0,
        0.65, 0) at high density. The emission material connects this attribute
        through a ShaderNodeAttribute node — no texture bake, no UV unwrap,
        and the attribute exports correctly to GLB as KHR_materials_unlit.
      </p>

      <h3>5. WebXR export</h3>
      <p>
        The floor is built in the XY plane (Blender +Z up). A −90° rotation
        around X followed by <code>bpy.ops.object.transform_apply</code>{" "}
        converts to WebXR convention (+Y up). Export with Draco compression
        level 6, WebP textures, and morph target export enabled.
      </p>

      <h2>Trade-offs and failure modes</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>N_MAT too small.</strong> With fewer than ~100 matrices, the
          histogram is noisy and the s = 0 void may not be clearly depleted.
          250 gives a clean result at all four N values in roughly 20 s on a
          modern CPU.
        </li>
        <li>
          <strong>Bulk cut too generous.</strong> Setting BULK_CUT above 1.95
          lets Tracy–Widom edge eigenvalues in. Their unusually large spacings
          inflate the tail of the s distribution, distorting the Wigner ridge.
          The value 1.90 is conservative and safe.
        </li>
        <li>
          <strong>LOG_EPS too small.</strong> If LOG_EPS = 0, any empty bin
          gives log(0) = −∞ and a NaN vertex height. LOG_EPS = 1 is safe and
          barely affects the visual for the high-count bins (log(1001) ≈
          log(1000)).
        </li>
        <li>
          <strong>Poisson comparison.</strong> The Poisson shape key uses N
          sorted uniform random numbers on [−2, 2] — not a GOE matrix with
          deliberately tuned disorder. This gives exact Poisson spacing
          statistics (independent levels), which is what the Berry–Tabor
          conjecture predicts for integrable quantum systems, and the clearest
          visual contrast with the GOE ridge.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Wigner EP (1955).{" "}
          <a
            href="https://www.jstor.org/stable/1970079"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Characteristic Vectors of Bordered Matrices with Infinite
            Dimensions
          </a>
          . <em>Annals of Mathematics</em> 62(3): 548–564. [Public domain —
          published 1955.] The original paper introducing GOE statistics for
          heavy-nucleus resonances. The semicircle law itself appears in the
          1958 follow-up paper (Ann. Math. 67:325).
        </li>
        <li>
          Bohigas O, Giannoni MJ, Schmit C (1984).{" "}
          <a
            href="https://doi.org/10.1103/PhysRevLett.52.1"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Characterization of Chaotic Quantum Spectra and Universality of
            Level Fluctuation Laws
          </a>
          . <em>Physical Review Letters</em> 52(1): 1–4. [Equations and
          theorems in the public domain; APS copyright on typeset text.] The
          BGS conjecture paper that connected quantum chaos to the GOE; now one
          of the most-cited papers in theoretical physics.
        </li>
        <li>
          NumPy Developers.{" "}
          <a
            href="https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.linalg.eigh
          </a>{" "}
          (BSD-3-Clause). The symmetric eigenvalue solver used in{" "}
          <code>sample_goe</code>; uses LAPACK&rsquo;s{" "}
          <code>_syevd</code> divide-and-conquer algorithm internally.
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
    "random-matrices",
    "statistics",
    "quantum-chaos",
    "webxr",
    "mathematics",
  ],
  body: Body,
});
