import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chirikov-standard-map-kam-tori-stochasticity-threshold-poincare-stage-floor-webxr";

function Body() {
  return (
    <>
      <p>
        The <strong>Chirikov–Taylor standard map</strong> is the canonical
        area-preserving diffeomorphism of the 2-torus T² — a pair of coupled
        recurrences with a single parameter K that controls the transition from
        perfectly ordered to fully chaotic dynamics:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`p_{n+1} = p_n + K·sin(θ_n)   (mod 2π)
θ_{n+1} = θ_n + p_{n+1}       (mod 2π)`}
      </pre>
      <p>
        At K = 0 the map is integrable: every orbit stays on the horizontal
        line p = const because sin(θ) averages to zero and the action p is
        conserved.  As K increases, the Kolmogorov–Arnold–Moser (KAM) theorem
        guarantees that irrational invariant tori survive small perturbations —
        they form the horizontal ridges visible as high-density bands in the
        stage floor.  At the <em>stochasticity threshold</em> K_c ≈ 0.9716,
        Greene's residue criterion (1979) identifies the last surviving torus:
        the one whose rotation number equals the reciprocal of the golden ratio,
        (√5−1)/2 ≈ 0.6180.  Above K_c that torus fragments into a{" "}
        <em>Cantorus</em> — a Cantor-set remnant that no longer blocks global
        transport — and the chaotic sea becomes connected across all of T².
      </p>

      <h2>From orbit density to height field</h2>
      <p>
        The script runs 180 stratified initial conditions for 3 500 iterations
        each (630 000 map evaluations per K value, all vectorised with numpy
        broadcasting over trajectory arrays).  Each map step records a hit in
        a 96 × 96 histogram covering T².  Log-normalised counts drive vertex
        heights:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`z(θ_i, p_j) = log(1 + count[j, i]) / log(1 + max_count)  ×  H_SCALE

θ → column index  (horizontal axis on stage floor)
p → row index     (vertical axis on stage floor)
H_SCALE = 0.35 m  (max height at saturated bin)`}
      </pre>
      <p>
        The logarithm compresses the dynamic range: KAM ridges have counts
        orders of magnitude larger than the chaotic sea, and without
        compression they would saturate while the sea appears flat.  With it
        both structures are simultaneously legible.
      </p>

      <h2>KAM theory and island chains</h2>
      <p>
        The Poincaré–Birkhoff theorem guarantees that for every rational
        rotation number p/q, an even number of period-q fixed points survive the
        perturbation — alternating between elliptic (stable, surrounded by
        miniature KAM tori forming an <em>island chain</em>) and hyperbolic
        (unstable, connected by separatrices).  On the stage floor these appear
        as oval clusters of elevated cells arranged symmetrically around the
        torus.  For example, at K = 0.5 a 5-island chain centred at (θ=π, p=π)
        is clearly visible as five equally spaced bumps on a ring.
      </p>

      <h2>Greene's residue criterion</h2>
      <p>
        John Greene (1979) devised a computable test for KAM torus survival: a
        sequence of periodic orbits whose rotation numbers converge to the target
        irrational via continued-fraction approximants.  The <em>residue</em> R
        of a period-q orbit is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`R = (2 − Tr(M)) / 4

where M is the 2×2 stability matrix (monodromy matrix) of the orbit.
R < 0  → hyperbolic (orbit unstable)
R ∈ (0,1) → elliptic (orbit stable — torus present)
R → ¼  → critical (transition to chaos)
R > 1  → inverse hyperbolic (torus broken)`}
      </pre>
      <p>
        As the continued-fraction approximants to the golden mean are the
        Fibonacci-ratio sequences F_n/F_{"{n+1}"} → φ⁻¹, Greene tracked R for each
        Fibonacci period orbit and showed it converges to R* ≈ 0.2500 at
        K = K_c ≈ 0.9716 — exactly the value where the torus is at the boundary
        of existence.  This is why the{" "}
        <strong>golden-mean torus is the last to break</strong>: it is the{" "}
        &ldquo;most irrational&rdquo; rotation number, least resonant with any
        rational perturbation.
      </p>

      <h2>Accelerator modes (K &gt; 2)</h2>
      <p>
        Once the chaotic sea is globally connected, some orbits near the
        boundary of island chains gain systematic phase-space momentum —
        &ldquo;accelerator modes&rdquo; first identified by Chirikov.  They
        cause <em>anomalous diffusion</em> in the action p: rather than the
        normal Gaussian spread ⟨Δp²⟩ ~ t, orbits near accelerators show
        super-diffusion ⟨Δp²⟩ ~ t^α with α &gt; 1.  In the stage-floor
        shape key{" "}
        <strong>SK_Wild</strong> (K = 5.0) these appear as narrow diagonal
        channels cutting across the otherwise uniform chaotic density.
      </p>

      <h2>Five shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Basis        K = 0.9716   stochasticity threshold — last KAM torus
SK_Integrable K = 0.00    fully integrable; horizontal bands only
SK_Partial    K = 0.50    KAM tori intact; Fibonacci island chains visible
SK_Chaotic    K = 2.00    chaotic sea dominates; residual small islands
SK_Wild       K = 5.00    accelerator modes; diagonal stochastic web`}
      </pre>

      <h2>Implementation notes</h2>
      <p>
        Vertices are indexed as{" "}
        <code>(row, col) ↔ (p_index, θ_index)</code>.  All five histograms
        are computed before any Blender object is created; shape-key vertex
        positions are written via <code>sk.data.foreach_set(&ldquo;co&rdquo;, coords)</code>{" "}
        which is 10× faster than per-element Python assignment.  Vertex colours
        use the <code>CORNER</code> domain so each face can be individually
        coloured regardless of shared vertices.  The material routes
        <code>ShaderNodeAttribute → Base Color</code> so the density colour
        renders in both Workbench and EEVEE/Cycles.
      </p>

      <h2>Studio cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
          >
            Hénon–Heiles Hamiltonian — KAM Tori &amp; Poincaré Section
          </Link>{" "}
          — 2-DOF Hamiltonian with a Poincaré section showing nested KAM tori
          and chaotic zones; companion piece built with the same histogram
          approach but driven by a continuous-time ODE rather than a
          discrete map
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr"
          >
            Mathieu Equation — Ince–Strutt Stability Diagram
          </Link>{" "}
          — parametric resonance in a linear oscillator produces an
          (a, q) stability chart analogous to the (K, rotation-number)
          parameter map of the standard map; stage-floor format, same colour
          scheme
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr"
          >
            Bunimovich Stadium — Ergodic Billiard
          </Link>{" "}
          — fully ergodic billiard flow whose Poincaré section is uniformly
          dense; contrast with the standard map at K &gt; K_c where the
          chaotic sea is also ergodic but coexists with residual island chains
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
          >
            Feigenbaum Bifurcation Diagram
          </Link>{" "}
          — the logistic map shares the period-doubling cascade as island
          chains in the standard map period-double en route to chaos; the
          Feigenbaum universality class covers both 1-D maps and
          area-preserving maps at their critical parameter
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
          >
            Aizawa Attractor — Toroidal Chaos
          </Link>{" "}
          — dissipative strange attractor whose toroidal topology echoes the
          KAM-torus geometry of the standard map; compare orbit density
          structures between conservative and dissipative chaos
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Chirikov BV (1979){" "}
          <em>
            A universal instability of many-dimensional oscillator systems
          </em>
          .{" "}
          <em>Physics Reports</em> 52(5):263–379.  Preprint: CERN-77-11.{" "}
          <a
            className={lk}
            href="https://cds.cern.ch/record/185478"
            target="_blank"
            rel="noopener noreferrer"
          >
            cds.cern.ch/record/185478
          </a>{" "}
          (CERN open institutional report).  Introduced the standard map,
          defined the stochasticity parameter K, and established the
          threshold K_c ≈ 0.9716 via overlap of resonance zones.  The same
          paper named accelerator modes and anomalous diffusion.  Related:
          Taylor JB (1969) independently derived the same map studying
          magnetic-field-line diffusion (J. Nucl. Energy C 11:69); Lichtenberg
          AJ &amp; Lieberman MA (1992){" "}
          <em>Regular and Chaotic Dynamics</em> Springer (standard text);
          MacKay RS (1992) <em>Renormalisation in Area-Preserving Maps</em>{" "}
          World Scientific (rigorous renormalisation near K_c).
        </li>
        <li>
          Meiss JD (1992){" "}
          <em>Symplectic maps, variational principles, and transport</em>.{" "}
          <em>Rev. Mod. Phys.</em> 64(3):795–848.{" "}
          <a
            className={lk}
            href="https://amath.colorado.edu/faculty/jdm/papers/SymplecticMaps.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            amath.colorado.edu/faculty/jdm/papers/SymplecticMaps.pdf
          </a>{" "}
          (author-posted PDF).  Comprehensive review: variational Birkhoff
          theory, Greene residue criterion, turnstile transport, cantori, and
          Aubry–Mather sets.  Related: MacKay RS, Meiss JD &amp; Percival IC
          (1984) &ldquo;Transport in Hamiltonian systems&rdquo; Physica D
          13:55–81 (turnstile = lobe that passes through the broken torus per
          iterate); Aubry S &amp; Le Daeron PG (1983) Physica D 8:381 (every
          cantorus is a minimising Aubry–Mather set of the Frenkel–Kontorova
          model); Greene JM (1979) J. Math. Phys. 20:1183 (residue criterion).
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Chirikov–Taylor Standard Map: KAM Stochasticity Threshold (K_c≈0.9716), Area-Preserving 2-Torus Automorphism, Kolmogorov–Arnold–Moser Invariant Tori, Poincaré Section Density Height Field, Greene's Residue Criterion (1979), Five Shape Keys (Basis/SK_Integrable/SK_Partial/SK_Chaotic/SK_Wild) & Stage Floor for WebXR (Blender 5.1)",
  date: "2026-08-22",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "standard-map",
    "chirikov",
    "kam-theory",
    "symplectic",
    "poincare-section",
    "area-preserving",
    "dynamical-systems",
    "shape-keys",
    "vertex-color",
    "stage-floor",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Chirikov BV",
      year: 1979,
      title:
        "A universal instability of many-dimensional oscillator systems",
      url: "https://cds.cern.ch/record/185478",
      licence: "CERN open institutional report",
      notes:
        "Chirikov BV (1979) Physics Reports 52(5):263-379. Preprint CERN-77-11 at https://cds.cern.ch/record/185478 (CERN open institutional report). Introduced the standard map p_{n+1}=p_n+K·sin(θ_n), θ_{n+1}=θ_n+p_{n+1} as a model for diffusion in action-angle phase space; defined the stochasticity parameter K; derived K_c≈0.9716 via resonance-overlap criterion. Named accelerator modes and proved anomalous diffusion in action above K_c. Related: Taylor JB (1969) independently in J. Nucl. Energy C 11:69 (magnetic-field diffusion context); Lichtenberg AJ & Lieberman MA (1992) Regular and Chaotic Dynamics Springer 2nd ed. (standard text); MacKay RS (1992) Renormalisation in Area-Preserving Maps World Scientific (renorm-group at K_c); Greene JM (1979) J. Math. Phys. 20:1183 (residue criterion for KAM breakup).",
    },
    {
      author: "Meiss JD",
      year: 1992,
      title: "Symplectic maps, variational principles, and transport",
      url: "https://amath.colorado.edu/faculty/jdm/papers/SymplecticMaps.pdf",
      licence: "author-posted PDF",
      notes:
        "Meiss JD (1992) Rev. Mod. Phys. 64(3):795-848. Author's PDF at https://amath.colorado.edu/faculty/jdm/papers/SymplecticMaps.pdf. Comprehensive review covering: variational (Birkhoff) formulation of symplectic maps; Greene residue criterion; turnstile lobes and the Meiss-Ott flux formula; cantori (Aubry-Mather sets); anomalous diffusion near island chains; accelerator modes. Related: MacKay RS, Meiss JD & Percival IC (1984) Physica D 13:55 (turnstile = area of lobe passing through broken torus per iterate; quantitative transport rates); Aubry S & Le Daeron PG (1983) Physica D 8:381 (every cantorus minimises the Frenkel-Kontorova action; Aubry-Mather theorem); Meiss JD (2015) Chaos 25:097602 (thirty years of turnstiles and transport — modern review); Github: jdmeiss/StandardMap (author's own Python/MATLAB implementations, typically MIT).",
    },
  ],
});

export { entry };
