import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott O Attractor 1994: ẋ=y ẏ=x−z ż=x+xz+by " +
  "5-Term Single xz-Product Zero-Trace Jacobian Shilnikov Ratio=2 Exact " +
  "Variable Divergence ∇·F=x ⟨x⟩≈−0.47 Dual Saddle-Focus Origin + Saddle-Spiral P " +
  "λ₁≈+0.086 D_KY≈2.155 Liouville ∑λᵢ≈−0.47 " +
  "Basis(b=2.7)/SK_LowB(b=2.0)/SK_HighB(b=3.5)/SK_NearP(b=1.7) " +
  "Shape Keys Cobalt–Amber SprottO_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott O carries a structural invariant that no other case in the 1994 " +
  "catalogue shares: because its Jacobian at the origin has exactly zero " +
  "trace, the Shilnikov ratio is locked at precisely 2 for every value of the " +
  "parameter b — no tuning required.  The xz bilinear term makes the phase-volume " +
  "divergence position-dependent (∇·F = x), placing Sprott O in the rare " +
  "variable-divergence class alongside Sprott D and K.  Four b-parameter shape " +
  "keys survey orbit morphology from a broad scroll to a tight spiral.  " +
  "Bishop parallel-transport tube and poi head, WebXR-ready.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        The zero-trace invariant and fixed Shilnikov ratio
      </h2>
      <p>
        The Jacobian of Sprott O at the origin evaluates to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J_O = [[ 0,  1,  0],
       [ 1,  0, -1],
       [ 1,  b,  0]]

trace(J_O) = 0 + 0 + 0 = 0   (independent of b)`}
      </pre>
      <p>
        A zero-trace Jacobian means the sum of eigenvalues is zero.  For the
        root configuration that produces Shilnikov chaos (one real eigenvalue
        λ_r plus a complex conjugate pair ρ ± iω), the sum is:
        λ_r + 2ρ = 0, so λ_r = −2ρ.  The Shilnikov ratio is then:
        |λ_r|/ρ = 2ρ/ρ = <strong>2 exactly</strong>, for every b &gt; 0.
        Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott N
        </Link>
        , whose ratio ≈ 14.9 comes from a Jacobian with a non-zero trace at
        its single fixed point, and with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott K
        </Link>
        {" "}(ratio ≈ 6.7, also parameter-dependent).  Sprott O&apos;s ratio 2
        is the minimum value that Shilnikov&apos;s 1965 theorem requires for
        guaranteed infinitely many periodic orbits near the homoclinic point —
        the system operates at the threshold between the chaotic and
        just-barely-not-chaotic regime.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Fixed-point analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Setting ẋ=ẏ=ż=0:
  ẋ = y = 0            → y = 0
  ẏ = x − z = 0       → x = z
  ż = x + xz + by = 0
    = x(1 + z) = 0    (since y=0)
    → x = 0  or  z = −1

Case 1: x=0, z=x=0   → O = (0, 0, 0)
Case 2: z=−1, x=z=−1 → P = (−1, 0, −1)

Both are independent of b — the parameter shifts dynamics, not topology.`}
      </pre>
      <p>
        The two-fixed-point structure contrasts with the single-point Sprott N,
        and with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott M
        </Link>
        {" "}whose fixed points depend on the parameters A, B, C.  In Sprott O
        the fixed-point locations are structurally stable — only their local
        eigenvalues change with b.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Eigenvalue structure and Shilnikov condition
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`── At O = (0,0,0) ──────────────────────────────────────────────
Characteristic polynomial (general b):
  λ³ + (b−1)λ + 1 = 0   [no λ² term — zero trace]

Canonical (b=2.7):
  λ_r ≈ −0.510            stable real  → 1-D stable manifold W^s
  λ_c ≈ +0.255 ± 1.378i   UNSTABLE complex pair → 2-D spiral out

Shilnikov condition:  |λ_r|/Re(λ_c) = 0.510/0.255 = 2.000 ✓

WHY exactly 2: trace=0 forces λ_r + 2·Re(λ_c) = 0.
  → |λ_r| = 2·Re(λ_c) always.
  → Ratio = 2, independent of b, for all b > 0.

── At P = (−1,0,−1) ────────────────────────────────────────────
Characteristic polynomial (b=2.7):
  λ³ + λ² + 1.7λ − 1 = 0

  λ_r ≈ +0.430            unstable saddle direction
  λ_c ≈ −0.715 ± 1.348i   stable spiral (dissipating)

NOT a Shilnikov focus: the unstable direction is real, not complex.
P acts as a secondary folding region — trajectories passing near P
are briefly captured by the stable spiral before the positive real
eigenvalue ejects them, adding structure to the attractor shape.`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Variable divergence: why it matters
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(y)/∂x + ∂(x−z)/∂y + ∂(x+xz+by)/∂z
    = 0 + 0 + x

Phase-volume rate: dV/dt = ∫∫∫ (∇·F) dV = ⟨x⟩ · V

On the canonical attractor ⟨x⟩ ≈ −0.47, so:
  dV/dt ≈ −0.47 V  (net contraction)

Liouville theorem:  λ₁ + λ₂ + λ₃ = ⟨∇·F⟩ ≈ −0.47

MLE (Sprott 1994):  λ₁ ≈ +0.086
Neutral:            λ₂ = 0
Contraction:        λ₃ ≈ −0.47 − 0.086 ≈ −0.556

Kaplan–Yorke dimension:
  D_KY = 2 + (λ₁ + λ₂)/|λ₃| = 2 + 0.086/0.556 ≈ 2.155

Lyapunov time:  τ = 1/λ₁ ≈ 11.6 time units`}
      </pre>
      <p>
        D_KY ≈ 2.155 is notably higher than Sprott N (2.037) — the attractor
        is thicker, the tube has more visible volume when rendered.  The
        variable divergence creates zones where the orbit locally expands
        (x &gt; 0) before globally contracting, giving the tube a subtle
        ribbed appearance where speed colour changes rapidly.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Blueprint walkthrough</h2>

      <h3 className="mt-4 font-medium">Step 1 — ODE definition</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`B_PARAM = 2.70   # canonical Sprott O
DT      = 0.01   # safe for orbital frequency ω≈1.38
BURN_IN = 3_000  # remove transient (≈260 Lyapunov times)
N_STEPS = 90_000
THIN    = 30     # keep every 30th → 3 000 waypoints

def _f(s, b):
    x, y, z = s
    return np.array([
         y,              # ẋ = y
         x - z,          # ẏ = x − z
         x + x*z + b*y   # ż = x + xz + by  ← xz bilinear nonlinearity
    ])`}
      </pre>
      <p>
        The xz product in ż is the sole nonlinearity.  Compared with the z²
        term in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott N
        </Link>
        , xz is a <em>bilinear</em> coupling — it affects ż when either x or
        z departs from zero, rather than only when z is large.  This is why
        the divergence ∂ż/∂z = x depends on position rather than being
        constant.
      </p>

      <h3 className="mt-4 font-medium">Step 2 — Bishop parallel-transport frame</h3>
      <p>
        Sprott O&apos;s orbit occasionally straightens near P = (−1,0,−1) as
        the saddle-spiral temporarily captures the trajectory.  At these near-
        straight sections, the Frenet principal normal is undefined (curvature
        → 0).  Bishop&apos;s 1975 frame avoids this by transporting the normal
        plane with zero accumulated twist — the Rodrigues formula rotates each
        frame by the minimum angle needed to stay perpendicular to the new
        tangent.  See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi
        </Link>{" "}
        tutorial for a step-by-step derivation.
      </p>

      <h3 className="mt-4 font-medium">Step 3 — Mesh construction</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`TUBE_SIDES = 8     # octagon cross-section
TUBE_R     = 0.040 # 4 cm radius (slightly wider than Sprott N's 3.5 cm,
                   # because D_KY 2.155 > 2.037 → thicker attractor)

# 3000 waypoints × 8 verts/ring = 24 000 vertices
# (3000−1) × 8 quads           = 23 992 faces

mesh = bpy.data.meshes.new("hf_sprott_o_poi")
mesh.from_pydata(verts.tolist(), [], faces)  # no operators
attr = mesh.color_attributes.new(
    name="SprottO_Speed", type='FLOAT_COLOR', domain='POINT'
)
attr.data.foreach_set("color", rgba_flat)   # cobalt→amber by |ẋ,ẏ,ż|`}
      </pre>

      <h3 className="mt-4 font-medium">Step 4 — Shape keys and the b-parameter</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# Four shape keys — b-parameter survey
obj.shape_key_add(name="Basis",    from_mix=False)  # b=2.7 canonical
add_shape_key(obj, "SK_LowB",  2.00)  # broader orbit
add_shape_key(obj, "SK_HighB", 3.50)  # tighter orbit
add_shape_key(obj, "SK_NearP", 1.70)  # more time near P neighbourhood

# WHY b=1.7 is different:
# Char poly at O for b=1.7: λ³ + 0.7λ + 1 = 0
#   λ_r ≈ −0.780, λ_c ≈ +0.390 ± 1.077i (ratio still 2)
# But P's stability changes: λ_r(P) rises to ≈ +0.55 → P ejects faster,
# trajectories spend less time near it → orbit topology shifts visibly.`}
      </pre>
      <p>
        Note that the zero-trace property guarantees the ratio stays at 2 for
        every shape key.  What changes is the imaginary part of λ_c (the
        orbital frequency) and the overall dissipation, not the Shilnikov
        condition itself.
      </p>

      <h3 className="mt-4 font-medium">Step 5 — Material and GLB export</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`mat = bpy.data.materials.new("SprottO_Mat")
attr_node.attribute_name = "SprottO_Speed"
attr_node.attribute_type = 'GEOMETRY'
bsdf.inputs["Emission Strength"].default_value = 1.8
bsdf.inputs["Metallic"].default_value  = 0.50
bsdf.inputs["Roughness"].default_value = 0.22

# GLB: Draco-6 compression, morph targets, vertex colour, +Y up
bpy.ops.export_scene.gltf(
    filepath="hf_sprott_o_poi.glb",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_morph=True,
    export_colors=True,
    export_yup=True
)`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="ml-4 list-disc space-y-2 text-sm">
        <li>
          <strong>Orbit diverges to ∞</strong> — the IC y=0 is near the stable
          manifold of O only if x is also near zero.  If BURN_IN is too short
          (under 2 000), the transient can run along the unstable real direction
          of P and escape.  Use IC = (0.1, 0.0, 0.1) and BURN_IN ≥ 3 000.
        </li>
        <li>
          <strong>Tube self-intersects at P approach</strong> — when the orbit
          straightens near P = (−1,0,−1), consecutive waypoints become very
          close in angle.  Reduce TUBE_R from 0.040 to 0.028, or increase THIN
          to 40 (fewer but more spread waypoints).
        </li>
        <li>
          <strong>Shape key vertex mismatch</strong> — the vertex count is
          <code>(N_STEPS // THIN) × TUBE_SIDES</code>.  All four integrate()
          calls must use the same THIN and TUBE_SIDES, and the same IC for the
          burn-in phase.
        </li>
        <li>
          <strong>b &lt; 1 produces periodic orbit</strong> — for b ≈ 0.5 the
          char poly at O may transition to three real roots (no complex pair),
          losing Shilnikov chaos entirely.  Stay above b = 1.0 for reliable
          chaos.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Recording this tutorial</h2>
      <p>
        Follow <code>SCREEN-RECORDING-NOTES.md</code> in the library entry for
        OBS or Windows Game Bar setup.  The key moment to capture on screen is
        sliding the <strong>SK_NearP</strong> shape key to 1.0 — the orbit
        visibly contracts toward the P neighbourhood at (−1,0,−1), showing the
        influence of the saddle-spiral on global trajectory shape.  Run
        <code>record.py</code> inside Blender for the automated 150-frame
        viewport render with camera orbit and shape-key morph.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="ml-4 list-disc space-y-1 text-sm">
        <li>
          Sprott JC (1994). &ldquo;Some simple chaotic flows&rdquo;.{" "}
          <em>Phys Rev E</em> <strong>50(2)</strong>: R647.{" "}
          Public-domain mathematics.{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>
          {" "}— original 19-case catalogue with numerical Lyapunov exponents.
          Related: Sprott (2010) <em>Elegant Chaos</em>, World Scientific.
        </li>
        <li>
          Gilpin W (2021–2024). <em>dysts</em> — Dynamical Systems Benchmarks.
          MIT licence.{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          {" "}— 131 systems with verified Lyapunov spectra and D_KY.
          Related: williamgilpin/fnn (false nearest-neighbour dimension
          estimation, MIT), williamgilpin/chuimhne (attractor rendering, MIT).
        </li>
        <li>
          Bishop RL (1975). &ldquo;There is more than one way to frame a
          curve&rdquo;. <em>Am Math Monthly</em> <strong>82(3)</strong>:
          246–251. Public domain.{" "}
          <a
            className={lk}
            href="https://www.jstor.org/stable/2311093"
            target="_blank"
            rel="noreferrer"
          >
            jstor.org/stable/2311093
          </a>
          {" "}— parallel-transport frame theorem used throughout this
          tutorial&apos;s <code>bishop_frames()</code> implementation.
          Related: mrdoob/three.js TubeGeometry (MIT) uses the same approach.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Related studio tutorials</h2>
      <ul className="ml-4 list-disc space-y-1 text-sm">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott K
          </Link>{" "}
          — also variable divergence (∇·F = y − 0.7), xy-product nonlinearity,
          ratio 6.7.  Closest structural sibling to Sprott O.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr"
          >
            Sprott D
          </Link>{" "}
          — variable divergence ∇·F = x, non-hyperbolic origin (zero
          eigenvalue), two quadratic terms.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott N
          </Link>{" "}
          — constant divergence −2, ratio ≈ 14.9, single fixed point.  The
          contrast case for understanding what a fixed ratio of exactly 2 looks
          like by comparison.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott M
          </Link>{" "}
          — dual Shilnikov saddle-foci, constant divergence −1, parameter-
          dependent fixed-point locations.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  tags: [
    "blender",
    "scripting",
    "python",
    "numpy",
    "chaos",
    "dynamical-systems",
    "sprott",
    "attractor",
    "shilnikov",
    "bishop-frame",
    "webxr",
    "glb",
    "shape-keys",
  ],
  body: Body,
});

export default entry;
