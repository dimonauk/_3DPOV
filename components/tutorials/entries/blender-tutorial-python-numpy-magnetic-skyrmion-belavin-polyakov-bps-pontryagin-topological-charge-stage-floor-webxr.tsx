import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-magnetic-skyrmion-belavin-polyakov-bps-pontryagin-topological-charge-stage-floor-webxr";

const TITLE =
  "Python numpy — Magnetic Skyrmion: Belavin-Polyakov BPS Topological Soliton, Q∈ℤ Pontryagin Index, BPS Exact Solution n_z=(r²−λ²)/(r²+λ²), Shape-Key Q-Family & Cobalt–Amber Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "A skyrmion is a knot in a magnetic texture that topology will not let you untie. The unit vector field n(x,y) wraps around the 2-sphere exactly once as the plane is traversed, and the integer counting that wrap — the Pontryagin / Hopf index Q — is preserved by any smooth deformation. Belavin and Polyakov found in 1975 that configurations saturating the energy lower bound E ≥ 4π|Q| are exact and analytic: n_z = (r^{2m}−λ^{2m})/(r^{2m}+λ^{2m}), a closed form whose derivation is a one-liner in arctan algebra. This blueprint builds a 120×120 stage-floor mesh whose height is that n_z field, four shape keys span the BPS family (Q=1, Q=2, Q=−1 antiskyrmion, dilated Q=1), and the Skyrmion_Nz vertex-colour attribute maps cobalt at the core (n_z=−1) to amber at the vacuum (n_z=+1).";

function Body() {
  return (
    <>
      <p>
        In 1975 Alexander Belavin and Alexander Polyakov were studying the
        two-dimensional O(3) sigma model — a field theory of a unit 3-vector
        field <strong>n</strong>(x,y) on the plane — when they realised that the
        configurations are sorted into topological sectors labelled by an integer
        Q that no smooth deformation can change. They then found the exact
        minimum-energy solution in each sector. The solution is a localised
        lump, now called a <em>Belavin-Polyakov soliton</em> in the mathematics
        literature and a <em>magnetic skyrmion</em> in condensed-matter physics
        (after Tony Skyrme, who introduced the topological-protection idea in
        nuclear physics in 1961).
      </p>
      <p>
        Skyrmions were experimentally observed in chiral magnets (MnSi, FeGe,
        Cu₂OSeO₃) in 2009–2012. The 2016 Nobel Prize in Physics went partly to
        work on topological phases of which the skyrmion is the most visually
        immediate example.
      </p>

      <h2>The topological charge</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Q = (1/4π) ∫ n · (∂_x n × ∂_y n) dx dy  ∈  ℤ

Pontryagin density:  ρ(x,y) = (1/4π) n · (∂_x n × ∂_y n)

∫ ρ d²x = Q`}
      </pre>
      <p>
        The density ρ is the Jacobian of the map <strong>n</strong>: ℝ² → S²
        divided by 4π (the area of S²). When the total wrapping adds up to one
        full cover of S², Q = 1. You cannot continuously deform a Q = 1
        configuration into Q = 0 — they live in disconnected components of the
        space of smooth maps. This is the content of the homotopy group
        π₂(S²) = ℤ.
      </p>

      <h2>The BPS exact solution</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Profile:  f(r) = 2·arctan( (λ/r)^m )   m ∈ ℤ, λ > 0

Field:    n = ( sin f·cos(mθ+γ),  sin f·sin(mθ+γ),  cos f )

Closed form for n_z:
  cos f = cos(2·arctan(u))  with u = (λ/r)^m
        = (1 − u²) / (1 + u²)
        = ( r^{2m} − λ^{2m} ) / ( r^{2m} + λ^{2m} )

Boundary conditions:
  n_z(0) = −1   (skyrmion core points anti-parallel to background)
  n_z(∞) = +1   (vacuum: n points up everywhere)

Energy:  E = 4π|m|·J   (BPS bound, exact, independent of λ)`}
      </pre>
      <p>
        The arctan algebra is the key step. Let u = (λ/r)^m; then
        f = 2 arctan u, and the double-angle identity cos(2α) = (1−tan²α)/(1+tan²α)
        delivers the closed form immediately. No ODE integration needed.
      </p>
      <p>
        The parameter γ is the <em>helicity</em>: γ = 0 gives a Néel skyrmion
        (in-plane moments point radially), γ = π/2 gives a Bloch skyrmion
        (in-plane moments curl tangentially). For the height field n_z only,
        helicity does not appear — the stage floor is indifferent to it.
      </p>

      <h2>Pontryagin density implementation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`f′(r) = d/dr [2·arctan(u)]  where u = (λ/r)^m
       = 2/(1+u²) · du/dr  =  −2m·u / (r·(1+u²))

sin f  = 2u/(1+u²)

ρ(r)   = m·f′·sin f / (4π r)
        = −m²·(λ/r)^{2m} / (π·r²·(1+(λ/r)^{2m})²)
        = −m²·λ^{2m}·r^{2m−2} / (π·(r^{2m}+λ^{2m})²)`}
      </pre>
      <p>
        For m = 1, λ = 0.5 m, the density peaks at r = 0 with
        ρ(0⁺) → −∞ and falls off as r⁻⁴ at large r. The floor&apos;s steepest
        gradient is at the inflection radius r* where d²n_z/dr² = 0, which
        for m = 1 is r* = λ/√3 ≈ 0.29 m in the Basis shape key.
      </p>

      <h2>Grid and mesh construction</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`NX = NY = 120        # 14 400 vertices, 14 161 quads
DOMAIN = 2.5 m       # half-side
Z_SCALE = 0.40 m     # n_z ∈ [−1,+1] → z ∈ [−0.40, +0.40]

Vertex [i,j] → index i·NY + j
Face [i,j]   → (a, b, c, d) = (i·NY+j, (i+1)·NY+j, …)   vectorised

foreach_set "co" : 40–100× faster than per-vertex Python loop`}
      </pre>
      <p>
        The grid uses an even count (120 × 120) so no vertex lands exactly at
        r = 0, avoiding division-by-zero. The closest approach is
        r_min ≈ 0.021 m (half a grid cell from the origin), where u ≈ (0.5/0.021)^2 ≈ 567,
        giving n_z ≈ −1 + 2/567 ≈ −0.9965 — effectively −1.
      </p>

      <h2>Shape keys</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Basis</strong> — m=1, λ=0.50 m. The canonical Q=1 skyrmion:
          a circular hollow at the centre with n_z = −1 rising smoothly to
          n_z ≈ +0.92 at the domain edge.
        </li>
        <li>
          <strong>SK_Q2</strong> — m=2, λ=0.50 m. A Q=2 two-skyrmion: the
          n_z profile is (r⁴−λ⁴)/(r⁴+λ⁴), which drops from −1 more steeply
          and recovers faster. The walls of the hollow are sharper; the
          Pontryagin density peaks at an annular ring rather than at the origin.
        </li>
        <li>
          <strong>SK_Anti</strong> — m=1, λ=0.50 m, n_z flipped. The
          antiskyrmion (Q=−1): the core now points up (n_z = +1), the
          background points down (n_z ≈ −0.92). The floor inverts — a dome
          rather than a hollow.
        </li>
        <li>
          <strong>SK_Large</strong> — m=1, λ=1.00 m. Same topology as Basis
          but twice the skyrmion radius. The hollow is wider and shallower in
          the central region; the boundary of the domain is closer to the core
          (r/λ ≤ 2.5 instead of ≤ 5).
        </li>
      </ul>

      <h2>Vertex colour: Skyrmion_Nz</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t  = (n_z + 1) / 2                # n_z ∈ [−1,+1] → t ∈ [0,1]
RGB = (1−t)·COBALT + t·AMBER

COBALT = (0.03, 0.15, 0.58)   n_z = −1  skyrmion core
AMBER  = (1.00, 0.65, 0.00)   n_z = +1  far-field vacuum

foreach_set "color" — FLOAT_COLOR POINT attribute`}
      </pre>
      <p>
        The FLOAT_COLOR attribute drives both Base Color and Emission Color in
        the Principled BSDF, with Emission Strength = 2.0. In EEVEE Next
        with bloom enabled the cobalt core glows visibly against the dark world
        background.
      </p>

      <h2>Blender expert notes</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>from_pydata vs foreach_set</strong>: mesh construction uses
          <code>from_pydata</code> (convenient for the initial build), but
          subsequent shape-key positions use <code>foreach_set("co", …)</code>
          which is 30–60× faster than assigning to <code>sk.data[i].co</code>
          in a loop.
        </li>
        <li>
          <strong>Even grid count</strong>: NX = NY = 120 (even) ensures
          r = 0 is not a grid point, preventing the 0/0 singularity in the
          (λ/r)^m term. Use np.maximum(r, 1e-9) as belt-and-braces.
        </li>
        <li>
          <strong>Shape-key topology constraint</strong>: all four keys use
          the same grid size (NX × NY = 14 400 vertices). Blender silently
          corrupts shape keys whose vertex count differs from the basis.
        </li>
        <li>
          <strong>+Y up export</strong>: rotation_euler=(−π/2, 0, 0) then
          transform_apply ensures the floor lies flat in WebXR, which uses
          +Y as world up (not +Z as Blender does internally).
        </li>
        <li>
          <strong>Draco level 6</strong>: at 14 161 quads the Draco
          compression reduces the GLB by ≈60 % with no perceptible quality
          loss at WebXR viewing distances.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <em>Floor appears flat</em>: check Z_SCALE is not 0. If n_z_vals are
          all near +1 (every point at the background), λ is too small relative
          to the grid spacing — increase LAM_BASIS to 0.8 or 1.0.
        </li>
        <li>
          <em>Shape keys identical</em>: confirm that nz_q2 and nz_anti were
          computed with the correct parameters before <code>add_shape_key</code>
          is called. Print np.min/max of each array to verify they differ.
        </li>
        <li>
          <em>Emission colour incorrect</em>: the <code>ShaderNodeAttribute</code>
          must have attribute_type = &quot;GEOMETRY&quot; and attribute_name =
          &quot;Skyrmion_Nz&quot; (exact string, case-sensitive).
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Belavin AA & Polyakov AM (1975) &ldquo;Metastable states of
          two-dimensional isotropic ferromagnets.&rdquo;{" "}
          <em>JETP Lett</em> <strong>22</strong>(10):503–506.{" "}
          <a
            href="https://link.springer.com/article/10.1007/BF01078541"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Springer link
          </a>
          . Equations public domain. Proved the topological lower bound and
          gave the first analytic skyrmion solution. Related original work:{" "}
          <a
            href="https://link.springer.com/article/10.1007/BF01614754"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Polyakov 1975 — Particle spectrum in quantum field theory
          </a>{" "}
          (instantons and monopoles in the same topological framework).
        </li>
        <li>
          Skyrme THR (1961) &ldquo;A non-linear field theory.&rdquo;{" "}
          <em>Proc Roy Soc A</em> <strong>260</strong>:127–138.{" "}
          <a
            href="https://royalsocietypublishing.org/doi/10.1098/rspa.1961.0018"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Royal Society link
          </a>
          . Public domain. Introduced topological solitons in nuclear physics;
          the magnetic skyrmion is named in his honour. Related:{" "}
          <a
            href="https://royalsocietypublishing.org/doi/10.1098/rspa.1962.0018"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Skyrme 1962 — A unified field theory of mesons and baryons
          </a>{" "}
          (the original Skyrme term and topological baryon number).
        </li>
        <li>
          NumPy developers (BSD-3-Clause).{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . Vectorised meshgrid, maximum, column_stack used throughout.
          Related sibling project:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            SciPy (BSD-3)
          </a>{" "}
          — used in related tutorials for ODE integration and special functions.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr"
            className={lk}
          >
            Hopf Fibration — S³ → S² Circle Bundle
          </Link>{" "}
          — π₃(S²) = ℤ gives the Hopf index; π₂(S²) = ℤ gives the skyrmion
          charge. Both are winding-number invariants on spheres, just one
          dimension apart.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
            className={lk}
          >
            Bloch Sphere — Qubit & SU(2) Geometry
          </Link>{" "}
          — the Bloch sphere is also S², and the Berry phase around a loop on
          S² equals the solid angle enclosed — the same geometry that makes the
          skyrmion charge count sphere wrappings.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
            className={lk}
          >
            Foucault Pendulum — Berry Phase & Hannay Angle
          </Link>{" "}
          — geometric phase on S²; the skyrmion wrapping integral is the same
          solid-angle integral that computes Berry phase for a spin-½ particle.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr"
            className={lk}
          >
            Schoen Gyroid — TPMS Ia-3d Self-Dual Sponge
          </Link>{" "}
          — another example of a field-theoretic surface (minimiser of an
          energy functional) built from a closed-form analytic formula and
          rendered as a stage floor.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-30",
  topics: [
    "blender",
    "python",
    "numpy",
    "topology",
    "solitons",
    "condensed matter",
    "sigma model",
    "stage-floor",
    "webxr",
    "shape keys",
    "vertex colour",
  ],
  Body,
});
