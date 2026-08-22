import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr";

const TITLE =
  "Python numpy — Weierstrass–Enneper Minimal Surfaces: Catenoid, Helicoid & Enneper Surface with Bonnet Associate Family Shape Keys for WebXR (Blender 5.1)";

const LEDE =
  "A minimal surface has zero mean curvature H = (κ₁ + κ₂)/2 = 0 everywhere — the first-order condition for area-minimising soap films. The Weierstrass–Enneper representation (1866) encodes every conformal minimal immersion X: Ω ⊂ ℂ → ℝ³ as the real part of a complex line integral whose integrands satisfy a single null condition, which forces harmonicity of each coordinate without any further constraint. This tutorial builds three classical surfaces in Blender 5.1 using numpy complex arithmetic: the embedded catenoid, the self-intersecting Enneper surface, and the helicoid — related to the catenoid by the Bonnet transformation — with nine Shape Keys that animate the full catenoid-to-helicoid morph live in the viewport.";

function Body() {
  return (
    <>
      <p>
        Karl Weierstrass circulated his parameterisation in 1866 lecture notes;
        Alfred Enneper had independently derived special cases a year earlier.
        Together they closed a problem Euler and Meusnier had opened in the 1740s:
        given that soap films minimise area, what is the explicit form of all such
        surfaces? The answer is a map from complex analysis — holomorphic functions
        — to differential geometry, via the observation that in a conformal
        parameterisation, minimality and harmonicity are the same condition.
      </p>

      <h2>Why complex analysis solves a geometry problem</h2>
      <p>
        For a surface X = (x₁, x₂, x₃): Ω → ℝ³ parameterised conformally
        (‖∂X/∂u‖ = ‖∂X/∂v‖, ∂X/∂u · ∂X/∂v = 0), the mean curvature is
        proportional to the Laplacian: H = 0 ⟺ Δx_k = 0 for each coordinate k.
        Harmonic functions on a simply-connected domain are exactly the real parts
        of holomorphic functions, so every minimal surface is locally X = Re[F(z)]
        where F = (F₁, F₂, F₃) is holomorphic. The single algebraic constraint
        that makes F a valid minimal surface (not just any harmonic map) is the
        null condition:
      </p>
      <pre>{`Φ₁² + Φ₂² + Φ₃² = 0   where  Φₖ = dFₖ/dz`}</pre>
      <p>
        The Weierstrass–Enneper representation solves this in terms of two free
        functions f (holomorphic) and g (meromorphic, with fg² holomorphic):
      </p>
      <pre>{`Φ₁ = f(1 − g²)/2
Φ₂ = if(1 + g²)/2
Φ₃ = f·g

X(z) = Re[ ∫_{z₀}^{z} (Φ₁, Φ₂, Φ₃) dζ ]`}</pre>
      <p>
        One verifies Φ₁² + Φ₂² + Φ₃² = f²[(1−g²)²/4 − (1+g²)²/4 + g²] = 0
        identically. The integrands are{" "}
        <em>holomorphic</em>, so the line integral is path-independent on a
        simply-connected domain — no numerical quadrature is needed for the
        classical examples, though it becomes essential for the Costa surface
        where g = ℘(z), the Weierstrass elliptic function.
      </p>

      <h2>The three surfaces</h2>
      <p>
        <strong>Catenoid</strong> — f = e^{"{−z}"}, g = e^z. The integrands
        simplify to Φ₁ = −sinh z, Φ₂ = i cosh z, Φ₃ = 1, with antiderivatives
        F₁ = cosh z, F₂ = i sinh z, F₃ = z. Evaluating on z = u + iv with
        v ∈ [0, 2π):
      </p>
      <pre>{`x₁ = Re[cosh(u+iv)] = cosh(u)·cos(v)
x₂ = Re[i·sinh(u+iv)] = −cosh(u)·sin(v)
x₃ = Re[u+iv] = u`}</pre>
      <p>
        This is the surface of revolution of a catenary — the only minimal surface
        of revolution, and the only complete embedded minimal surface of genus 0
        with two ends (Osserman 1964). Soap film stretched between two coaxial
        rings assumes this shape.
      </p>
      <p>
        <strong>Helicoid</strong> — obtained from the catenoid by the Bonnet
        transformation X^θ = Re[e^{"{iθ}"} ∫ Φ dζ]. At θ = π/2 the surface
        becomes the helicoid (r cos φ, r sin φ, φ) with r = sinh(u). It is a
        ruled surface — through every point runs a straight line — and it is
        isometric to the catenoid: same Gaussian curvature K = −1/cosh⁴(u),
        same geodesics. Schwarz proved this isometry in 1865; it was the first
        example of two non-congruent isometric surfaces.
      </p>
      <p>
        <strong>Enneper surface</strong> — f = 1, g = z on a square domain.
        Antiderivatives F₁ = (z − z³/3)/2, F₂ = i(z + z³/3)/2, F₃ = z²/2
        give the coordinate formulae:
      </p>
      <pre>{`x = u/2 − u³/6 + u·v²/2
y = −v/2 − u²·v/2 + v³/6
z = (u² − v²)/2`}</pre>
      <p>
        The surface has three-fold rotational symmetry in the (x, y, z) → rotation
        sense and is self-intersecting for ‖z‖ {">"} ≈ 1.6 — the domain parameter
        U_ENNEPER = 1.5 in the blueprint keeps the displayed patch just inside the
        self-intersection locus. Self-intersection does not violate minimality:
        the surface locally has zero mean curvature even where it crosses itself.
      </p>

      <h2>Bonnet associate family and Shape Keys</h2>
      <p>
        The family X^θ parameterised by θ ∈ [0, π/2] is called the{" "}
        <em>associate surface family</em> of the catenoid. Every member is
        minimal and isometric to every other, but they are not congruent — the
        local geometry (angles, distances) is preserved while the embedding in
        ℝ³ changes. In Blender this is a natural Shape Key animation: the vertex
        positions interpolate between catenoid (θ = 0) and helicoid (θ = π/2)
        while the mesh topology stays fixed. The blueprint generates nine keys
        (theta_00 through theta_08) at equal θ increments; scrubbing the final
        key from 0 to 1 in the Shape Key panel drives the morph.
      </p>

      <h2>Implementation notes</h2>
      <p>
        The numpy code evaluates complex antiderivatives over a grid of z = u + iv
        values using Python&apos;s native complex arithmetic broadcast across a
        (NU, NV) array. A cylindrical grid (_cyl_grid) is used for the catenoid
        and helicoid — where v is the angular coordinate and the mesh wraps
        seamlessly at v = 0 ↔ 2π — and a square grid (_sq_grid) for the Enneper
        surface, which has no periodic direction. The Bonnet rotation e^{"{iθ}"}
        is applied as a complex scalar multiply before taking the real part; this
        is a single numpy operation per surface, making the nine Shape Key
        variants cheap to compute.
      </p>
      <p>
        For the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
          className={lk}
        >
          gyroid TPMS tutorial
        </Link>{" "}
        the surface was also implicitly minimal (triply periodic minimal surfaces
        satisfy H = 0 globally), but obtained via a signed-distance field and
        marching cubes. The Weierstrass–Enneper approach is exact and produces a
        structured quad mesh without any SDF threshold artefacts — more suitable
        for rigged or animated surfaces. For smooth limit-surface quality the
        same mesh can feed Blender&apos;s Subdivision Surface modifier, mirroring
        the stencil-based refinement developed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr"
          className={lk}
        >
          Catmull-Clark from-scratch tutorial
        </Link>
        .
      </p>
      <p>
        The flat-shaded quads are a deliberate aesthetic choice: each quad face
        reads as a planar approximation of the saddle surface, and the faceted
        grid makes the curvature sign change (negative Gaussian curvature
        everywhere on a minimal surface) visually legible — each quad tilts
        away from its neighbours in all four cardinal directions, unlike a sphere
        where adjacent quads all tilt the same way. Compare the effect of flat
        vs smooth shading on the Möbius strip in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          className={lk}
        >
          Möbius strip tutorial
        </Link>
        .
      </p>

      <h2>Connection to cotangent Laplacian and energy minimisation</h2>
      <p>
        Minimality (H = 0) is the Euler–Lagrange condition for the area
        functional A[X] = ∫∫ ‖∂X/∂u × ∂X/∂v‖ du dv. On a mesh, the discrete
        analogue is the cotangent-weighted Laplacian L_c whose null space gives
        the minimal vertex positions — exactly what the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          cotangent Laplacian mesh-fairing tutorial
        </Link>{" "}
        builds for VRM skin smoothing. The WE surfaces are the continuous
        ground-truth that discrete mesh fairing converges to as resolution
        increases.
      </p>
      <p>
        Spherical harmonics — studied in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics tutorial
        </Link>{" "}
        — are eigenfunctions of the Laplace–Beltrami operator on S². Minimal
        surfaces are the zero set of the same operator acting on the embedding
        coordinates; the Shape Key animation here is analogous to the orbital
        Shape Key animation there, with θ playing the role of the quantum
        number interpolation.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>Period condition violated.</strong> For surfaces with non-trivial
        topology (torus, Costa), the complex integral around a cycle need not
        vanish: Re[∮_γ Φ dζ] ≠ 0 leaves the surface multi-valued (it jumps
        when you go round a handle). The Costa surface requires choosing branch
        cuts and numerically enforcing Re-period = 0 on both homology generators
        of the torus; this is a constrained optimisation problem, not a direct
        evaluation.
      </p>
      <p>
        <strong>Conformal singularities.</strong> Where g has a pole, Φ₁ and
        Φ₂ may diverge even if fg² stays holomorphic. The helicoid has a pole
        at z = i·(π/2 + nπ) in the cylindrical parameterisation; avoid placing
        grid points there by using v ∈ [0, 2π) with endpoint=False.
      </p>
      <p>
        <strong>Wrap seam mismatch.</strong> The catenoid mesh uses wrap_v=True.
        If NU or NV is not chosen so that v=0 and v≈2π give the same xyz values
        (they always do analytically, but can fail with float32 error), the seam
        will have a visible gap. Using float64 and endpoint=False for v eliminates
        this reliably.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Weierstrass, K. (1866){" "}
          <em>
            Untersuchungen über die Flächen, deren mittlere Krümmung überall
            gleich Null ist
          </em>
          . Monatsberichte der Königlichen Akademie der Wissenschaften zu Berlin.
          Public domain.{" "}
          <a
            href="https://en.wikipedia.org/wiki/Weierstrass%E2%80%93Enneper_parameterization"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            wikipedia.org/wiki/Weierstrass–Enneper_parameterization
          </a>
          . Related: Enneper (1864){" "}
          <em>Analytisch-geometrische Untersuchungen</em>, Zeitschrift für Math.
          und Physik 9.
        </li>
        <li>
          Osserman, R. (1986){" "}
          <em>A Survey of Minimal Surfaces</em>. Dover Publications (2nd ed.).
          Public domain (mathematical content; originally Van Nostrand Reinhold
          1969).{" "}
          <a
            href="https://www.maths.ed.ac.uk/~v1ranick/papers/osserman.pdf"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            maths.ed.ac.uk/~v1ranick/papers/osserman.pdf
          </a>
          . Related: Colding &amp; Minicozzi (2012){" "}
          <em>A Course in Minimal Surfaces</em>, AMS Graduate Studies in
          Mathematics vol. 121.
        </li>
        <li>
          NumPy — BSD-3-Clause, NumPy Developers.{" "}
          <a
            href="https://numpy.org/doc/stable/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org/doc/stable/
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: [
    "blender",
    "scripting",
    "python",
    "numpy",
    "minimal-surfaces",
    "complex-analysis",
    "differential-geometry",
    "webxr",
    "shape-keys",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr",
});
