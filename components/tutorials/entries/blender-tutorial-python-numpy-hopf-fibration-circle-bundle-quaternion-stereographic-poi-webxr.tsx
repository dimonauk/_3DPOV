import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr";

function Body() {
  return (
    <>
      <p>
        In 1931 Heinz Hopf proved that the 3-sphere S³ can be projected onto
        the 2-sphere S² in a way that gives every point on S² exactly one
        circle as its preimage — and any two of those circles are linked
        precisely once. This blueprint constructs 48 such fibres by
        stereographic projection from S³ into ordinary ℝ³, wraps each in a
        Bishop parallel-transport tube, and exports a Cobalt–Amber
        FLOAT_COLOR poi head as a Draco-6 GLB for WebXR.
      </p>

      <h2>Why the Hopf fibration matters to Blender artists</h2>
      <p>
        Every quaternion rotation in Blender is a point on S³ — the unit
        sphere in four dimensions. The map q&nbsp;↦&nbsp;q·i·q̄ (conjugation
        by unit imaginary <em>i</em>) sends each quaternion to the
        corresponding rotation axis on S². That map is exactly the Hopf
        fibration. When Blender SLERP-interpolates between two rotations, it
        traces a Hopf fibre. Understanding the fibration is therefore
        understanding why quaternion blending produces the shortest rotational
        path — and why gimbal lock never arises in quaternion space.
      </p>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
        >
          the Bloch Sphere tutorial
        </Link>{" "}
        for a parallel treatment of SU(2)→SO(3) double cover — the Hopf
        fibration restricted to the Bloch sphere is exactly the qubit state
        space, and Berry phase accumulates along the fibres as a holonomy of
        the Hopf connection.
      </p>

      <h2>The fibre construction</h2>
      <p>
        We model S³ as the unit sphere in ℂ²: the set of pairs (z₁,&nbsp;z₂)
        with |z₁|²&nbsp;+&nbsp;|z₂|²&nbsp;=&nbsp;1. The Hopf map is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`π(z₁, z₂) = ( 2 Re(z₁z̄₂),  2 Im(z₁z̄₂),  |z₁|²−|z₂|² )  ∈ S² ⊂ ℝ³

For base point p = (sin θ cos φ,  sin θ sin φ,  cos θ):

  z₁(α) = √((1+cos θ)/2) · e^{iα}           (r₁ controls the z₃-coordinate)
  z₂(α) = √((1−cos θ)/2) · e^{i(φ+α)}       (r₂ controls the equatorial radius)
                                               α ∈ [0, 2π)  — fibre parameter`}
      </pre>
      <p>
        Writing (w,&nbsp;x,&nbsp;y,&nbsp;z)&nbsp;=&nbsp;(Re&nbsp;z₁,
        Im&nbsp;z₁, Re&nbsp;z₂, Im&nbsp;z₂), the stereographic projection
        from the north pole (1,0,0,0)&nbsp;∈&nbsp;S³ gives:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`  X = x / (1−w)
  Y = y / (1−w)
  Z = z / (1−w)

When θ = 0 (S² north pole):  r₁=1, r₂=0.  w = cos α → 1 as α→0,
so the denominator (1−w) → 0 and the projection diverges — this fibre
maps to a straight line at infinity.  Blueprint clamps 1/(1−w) ≤ STEREO_CLAMP=25.

When θ = π (S² south pole):  r₁=0, r₂=1.  w=0 always, denom=1.
Projection yields:  X=0,  Y = cos(φ+α),  Z = sin(φ+α) — the unit circle in YZ.`}
      </pre>
      <p>
        The Fibonacci-sphere sampling places the 48 base points uniformly in
        the polar band θ&nbsp;∈&nbsp;[0.08π,&nbsp;0.92π], naturally avoiding
        the degenerate poles.
      </p>

      <h2>Linking topology in ℝ³</h2>
      <p>
        After stereographic projection, the fibres become circles (or lines)
        in ℝ³, and a classical result says the Gauss linking integral between
        any two projected Hopf fibres equals&nbsp;1. The linking number is a
        topological invariant — it does not change under continuous
        deformation that avoids intersection. You cannot separate any two of
        these circles without tearing one of them.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Linking number of γ₁ and γ₂:

  L(γ₁, γ₂) = 1/(4π) ∮γ₁ ∮γ₂  (r₁−r₂)/|r₁−r₂|³ · (dr₁ × dr₂)  = 1

This is the Gauss linking integral (Gauss 1833), applied to any pair
of Hopf fibres.  The Hopf invariant of the map π is also 1, and it
generates π₃(S²) ≅ ℤ — the first of infinitely many non-trivial
homotopy groups of spheres beyond the obvious ones.`}
      </pre>

      <h2>The Clifford torus (SK_Clifford)</h2>
      <p>
        When all base points are restricted to the S² equator (θ&nbsp;=&nbsp;π/2),
        the fibres project onto a family of circles that collectively form
        the <em>Clifford torus</em> — the unique flat, embedded torus in
        S³. It is equidistant from both poles of S³, has zero mean curvature
        inside S³, and splits S³ into two solid tori of equal volume. The
        shape key SK_Clifford morphs all 48 fibres onto this configuration.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Clifford torus in S³:
  { (z₁, z₂) ∈ S³ : |z₁| = |z₂| = 1/√2 }

Parametrised by (α, β) ∈ [0, 2π)²:
  (z₁, z₂) = ( e^{iα}/√2,  e^{iβ}/√2 )

Intrinsic metric:  flat (zero Gaussian curvature in the induced metric)
Extrinsic in ℝ⁴:  principal curvatures κ₁=1, κ₂=−1 → mean curvature H=0
Stereographic image: the standard torus r=R, tube-radius ρ, where R=ρ`}
      </pre>
      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
        >
          Foucault Pendulum tutorial
        </Link>{" "}
        discusses holonomy and Berry phase — the Hopf connection is the
        natural connection on this S¹ principal bundle, and Berry phase is
        the holonomy of a loop on S².
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        Each projected fibre is a circle in ℝ³, but near-north-pole fibres
        are very elongated after the stereographic projection clips them. The
        Bishop frame is essential: unlike Frenet–Serret, it does not require
        the curvature κ to be positive everywhere, and it propagates the
        normal by minimal Rodrigues rotation along the spine.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Rodrigues rotation of normal Nᵢ onto Nᵢ₊₁:

  axis = Tᵢ × Tᵢ₊₁             (rotation axis between tangents)
  sinα = |axis|,  cosα = Tᵢ·Tᵢ₊₁

  Nᵢ₊₁ = cosα·Nᵢ + sinα·(axiŝ × Nᵢ) + (1−cosα)(axiŝ·Nᵢ)axiŝ

Holonomy correction:
  After n steps, accumulated twist γ = atan2(Nₙ·(T₀×N₀), Nₙ·N₀)
  Distribute γ linearly: Nᵢ ← Rₐₓ(Tᵢ, i·γ/n) Nᵢ   so seam closes.`}
      </pre>
      <p>
        See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr"
        >
          Viviani&apos;s Curve tutorial
        </Link>{" "}
        for a detailed walk-through of the holonomy correction on a
        self-intersecting closed curve — the same technique applies here.
      </p>

      <h2>Vertex colour encoding</h2>
      <p>
        Each fibre receives a single RGBA colour determined by the latitude θ
        of its base point on S². South-pole fibres (θ&nbsp;≈&nbsp;π) are
        Cobalt, north-pole fibres (θ&nbsp;≈&nbsp;0) are Amber, with a linear
        interpolation between them. This makes the radial gradient visible in
        the projection: the tight inner cluster glows Cobalt and the outer
        spread radiates Amber.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`t = 1 − θ/π          # 0 at south pole, 1 at north pole
colour = (1−t)·COBALT + t·AMBER

Cobalt  = (0.06, 0.20, 0.80, 1.0)
Amber   = (0.88, 0.52, 0.04, 1.0)

Baked via:  attr.data.foreach_set("color", flat_rgba_array)
            ← ~40× faster than per-element assignment`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Step 1: Distribute base points on S² (Fibonacci lattice)
thetas, phis = fibonacci_sphere(N_FIBERS)     # 48 points

# Step 2: For each base point, compute the Hopf fibre in ℝ³
pts = hopf_fiber_R3(theta, phi, N_FIBER_STEPS)     # (80, 3)

# Step 3: Build Bishop tube around the projected circle
verts, quads = bishop_tube(pts, TUBE_R, N_TUBE_SIDES)  # (640,3), (640,4)

# Step 4: Concatenate all 48 tube meshes → single joined mesh
# Total: 48 × 640 = 30 720 vertices, 30 720 quad faces

# Step 5: Attach FLOAT_COLOR POINT attribute "Hopf_Fibre"
attr.data.foreach_set("color", rgba_flat)

# Step 6: Scale to POI_R using 95th-percentile radius
scale = POI_R / np.percentile(radii, 95)

# Step 7: Shape keys — SK_Clifford, SK_SouthHeavy, SK_NorthHeavy, SK_Taut
for name, verts in sk_data:
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", verts.ravel().astype(np.float32))

# Step 8: Principled BSDF driven by vertex attribute (emission + base colour)
# Step 9: holoflow:facet=True, +Y-up rotation, Draco-6 WebP GLB export`}
      </pre>

      <h2>Failure modes and troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Problem: Tube has a visible twist seam.
Fix:    Holonomy correction in bishop_tube() must run before ring-vertex
        broadcast.  Check γ = atan2(Nₙ·cross(T₀,N₀), Nₙ·N₀) is correct.

Problem: South-pole fibres appear as a single spike.
Fix:    STEREO_CLAMP too high.  Reduce to 15–20 or limit theta_min=0.12π.

Problem: Shape keys appear identical in viewport.
Fix:    foreach_set("co", ...) needs dtype=float32.  Check ravel() is used
        (not reshape), and that scale is applied before storing SK vertices.

Problem: GLB morph targets missing on import.
Fix:    Pass export_morph=True to export_scene.gltf.  Blender 5.1 default
        is False for Draco-compressed exports; must be set explicitly.

Problem: Vertex colours invisible in Eevee.
Fix:    Material must use ShaderNodeAttribute with attribute_type="GEOMETRY",
        not "OBJECT".  Connect Color → Base Color AND Emission Color.`}
      </pre>

      <h2>Outside sources</h2>
      <p>
        Primary source:{" "}
        <a
          className={lk}
          href="https://link.springer.com/article/10.1007/BF01457962"
          target="_blank"
          rel="noreferrer"
        >
          Hopf, H. (1931). <em>Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche.</em>{" "}
          Math. Annalen 104: 637–665.
        </a>{" "}
        Public Domain. Related: Whitehead (1947) <em>An Expression of Hopf&apos;s
        Invariant as an Integral</em>; Steenrod (1951) <em>The Topology of
        Fibre Bundles</em> (Princeton UP).
      </p>
      <p>
        Numerical library:{" "}
        <a
          className={lk}
          href="https://numpy.org/doc/stable/"
          target="_blank"
          rel="noreferrer"
        >
          NumPy Developers (2024). NumPy v2.x.
        </a>{" "}
        BSD-3-Clause. Source:{" "}
        <a
          className={lk}
          href="https://github.com/numpy/numpy"
          target="_blank"
          rel="noreferrer"
        >
          github.com/numpy/numpy
        </a>
        . Related: SciPy BSD-3, Numba BSD-2 (JIT acceleration of fibre
        integration loops).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Hopf Fibration: Heinz Hopf 1931 π:S³→S² Circle Bundle, L(γ₁,γ₂)=1 Linking Number, Clifford Torus (SK_Clifford θ=π/2), Fibonacci-Sphere 48 Fibres, Bishop Holonomy-Closed Tube, SK_SouthHeavy/SK_NorthHeavy/SK_Taut & Cobalt–Amber Hopf_Fibre FLOAT_COLOR Quaternion Poi Head for WebXR (Blender 5.1)",
  lede:
    "Build 48 Hopf fibres via stereographic projection from S³, wrap each in a Bishop tube, and export a pairwise-linked Cobalt–Amber poi head — the geometry beneath every Blender quaternion rotation.",
  date: "2026-08-24",
  tags: ["blender", "python", "topology", "quaternions", "webxr", "poi"],
  body: Body,
});
