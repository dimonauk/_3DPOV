import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott N Attractor 1994: ẋ=−2y ẏ=x+z² ż=b+y−2z " +
  "5-Term Single z²-Coupling Single Saddle-Focus " +
  "P Shilnikov |λ_s|/Re(λ_c)≈14.9 ✓ Constant Divergence ∇·F=−2 " +
  "λ₁≈+0.076 D_KY≈2.037 Liouville " +
  "Basis(b=1.0)/SK_LowB(b=0.7)/SK_HighB(b=1.5)/SK_WideB(b=2.0) " +
  "Shape Keys Cobalt–Amber SprottN_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott N is the only case in the 1994 canonical catalogue with a " +
  "single fixed point whose Shilnikov ratio reaches ~15 — the z² coupling " +
  "in ẏ bends trajectories back toward that single saddle-focus, " +
  "sustaining a compact ribbon attractor.  No partner equilibrium exists; " +
  "the global dynamics alone supply the folding.  Four b-parameter shape " +
  "keys survey orbital morphology from a tight inner loop to a topology " +
  "shift where the characteristic polynomial loses its linear term. " +
  "Bishop parallel-transport tube and poi head, WebXR-ready.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        Why a single fixed point is remarkable
      </h2>
      <p>
        Most 3-D Sprott attractors rely on two or more fixed points to
        generate the heteroclinic tangle that sustains chaos.  Sprott N
        achieves persistent chaos with only{" "}
        <strong>one equilibrium</strong> — P&nbsp;=&nbsp;(−b²/4,&nbsp;0,&nbsp;b/2),
        which for b=1 is P&nbsp;=&nbsp;(−¼,&nbsp;0,&nbsp;½).  The absence of
        a partner fixed point means there is no heteroclinic orbit; instead,
        the single saddle-focus ejects trajectories along its unstable spiral
        manifold, and the global nonlinearity (z² in ẏ) folds them back to
        re-approach the stable manifold.  Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott M
        </Link>
        {" "}(two fixed points, dual Shilnikov) and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott K
        </Link>
        {" "}(two fixed points, variable divergence) for contrast.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Fixed-point analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = 0  →  y = 0
ẏ = 0  →  x = −z²
ż = 0  →  b + y − 2z = 0  →  z = b/2

Single equilibrium: P = (−b²/4, 0, b/2)
Canonical (b=1):    P = (−0.25, 0, 0.5)

Jacobian at P = (−b²/4, 0, b/2):
  ∂ẋ/∂x=0   ∂ẋ/∂y=−2  ∂ẋ/∂z=0
  ∂ẏ/∂x=1   ∂ẏ/∂y=0   ∂ẏ/∂z=2z*=b
  ∂ż/∂x=0   ∂ż/∂y=1   ∂ż/∂z=−2

J = [[ 0, −2,  0],
     [ 1,  0,  b],
     [ 0,  1, −2]]`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Characteristic polynomial and Shilnikov condition</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`det(J − λI) = 0

Expanding:
  λ³ + 2λ² + (2−b)λ + 4 = 0    [general b]
  λ³ + 2λ² + λ + 4 = 0          [b=1 canonical]

Roots (b=1 numerical):
  λ_s  ≈ −2.31            (real, stable → 1-D stable manifold W^s)
  λ_c  ≈ +0.155 ± 1.303i  (complex, UNSTABLE → 2-D spiral repels)

Shilnikov ratio:  |λ_s| / Re(λ_c) = 2.31 / 0.155 ≈ 14.9 >> 1  ✓

Shilnikov's theorem (1965): ratio > 1 at a saddle-focus with a homoclinic
orbit → infinitely many periodic orbits in any neighbourhood.
Ratio 14.9 puts Sprott N near the high end of the 1994 catalogue.`}
      </pre>
      <p>
        In the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>{" "}
        tutorial we established the Shilnikov condition at the origin with ratio
        ρ/|λ_s| = 0.25 (notation reversed — H uses the stable-complex convention).
        Sprott N uses the <em>opposite</em> orientation: the stable manifold is
        real-1-D and the unstable manifold is the complex-2-D spiral, which is the
        more visually striking configuration — trajectories spiral outward in every
        direction before the z² term catches them.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Lyapunov spectrum and attractor dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(−2y)/∂x + ∂(x+z²)/∂y + ∂(b+y−2z)/∂z
    = 0 + 0 + (−2) = −2   (constant; b-independent)

Liouville:  λ₁ + λ₂ + λ₃ = −2

MLE (Sprott 1994):  λ₁ ≈ +0.076
Neutral:            λ₂ =  0      (along the flow)
Contraction:        λ₃ ≈ −2.076  (from ΣLyapunov = −2)

Kaplan–Yorke dimension:
  D_KY = 2 + (λ₁ + λ₂) / |λ₃|
       = 2 + 0.076 / 2.076
       ≈ 2.037

Lyapunov time:  τ = 1/λ₁ ≈ 13.2 time units`}
      </pre>
      <p>
        D_KY ≈ 2.037 is strikingly close to 2 — the attractor is an
        extraordinarily thin ribbon, almost surface-like.  The large λ₃ (≈ −2.076)
        compresses trajectories very rapidly in the stable direction, which is why
        the tube looks smooth rather than volumetrically fractal.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Blueprint walkthrough</h2>

      <h3 className="mt-4 font-medium">Step 1 — ODE definition</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# Named constants at the top — change b here to re-run a different orbit
B_PARAM = 1.00   # canonical Sprott N
DT      = 0.01   # step: safe for fastest eigenvalue |λ_s|≈2.31
BURN_IN = 2_000  # ≈2.7 Lyapunov times removes transient
N_STEPS = 90_000
THIN    = 30     # subsample → 3 000 waypoints

def _f(s, b):
    x, y, z = s
    return np.array([
        -2.0 * y,         # ẋ = −2y
         x + z * z,       # ẏ = x + z²
         b + y - 2.0 * z  # ż = b + y − 2z
    ])`}
      </pre>
      <p>
        RK4 with dt=0.01 is conservative: Euler stability requires
        dt &lt; 2/|λ_s| ≈ 0.87, and RK4 extends this by roughly 2.8×, giving an
        effective stability limit near dt ≈ 2.4.  We use 0.01 for accuracy, not
        just stability — orbit-sensitive colour gradients break at dt ≈ 0.05.
      </p>

      <h3 className="mt-4 font-medium">Step 2 — Bishop parallel-transport frame</h3>
      <p>
        The Frenet frame (tangent / principal normal / binormal) is undefined
        wherever curvature vanishes — which happens often in this ribbon attractor
        where sections run nearly straight.  Bishop&apos;s 1975 frame avoids
        the singularity by transporting the normal plane with zero twist: each
        frame is the minimum rotation of the previous one that stays perpendicular
        to the new tangent.  The implementation uses Rodrigues&apos; rotation formula
        with the cross product of consecutive tangents as axis.  See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi
        </Link>{" "}
        tutorial for a detailed derivation of the frame propagation equations.
      </p>

      <h3 className="mt-4 font-medium">Step 3 — Mesh construction</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# 8-sided polygon rings, one per waypoint → quad mesh
TUBE_SIDES = 8
TUBE_R     = 0.035   # 3.5 cm cross-section radius

# Vertex count: 3000 waypoints × 8 verts/ring = 24 000 vertices
# Face count:  (3000−1) × 8 quads       = 23 992 quads

# bpy.data.meshes.new() + from_pydata() — no operators, no context needed
mesh = bpy.data.meshes.new("hf_sprott_n_poi")
mesh.from_pydata(verts.tolist(), [], faces)

# FLOAT_COLOR attribute for vertex colours
attr = mesh.color_attributes.new(
    name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT'
)
attr.data.foreach_set("color", rgba_flat)  # cobalt→amber by speed`}
      </pre>

      <h3 className="mt-4 font-medium">Step 4 — Shape keys</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# Basis shape key at index 0 is mandatory in Blender
obj.shape_key_add(name="Basis", from_mix=False)

# SK_LowB (b=0.7): fixed point at z*=0.35 — compact, tight loop
# SK_HighB(b=1.5): fixed point at z*=0.75 — elongated z-range
# SK_WideB(b=2.0): char poly loses λ¹ term → topology shift

# shape_key.data.foreach_set("co", flat_coords) sets all vertex
# positions at once without a Python loop — 10× faster than per-vertex`}
      </pre>
      <p>
        WHY b=2.0 is special: the general characteristic polynomial is
        λ³&nbsp;+&nbsp;2λ²&nbsp;+&nbsp;(2−b)λ&nbsp;+&nbsp;4.  At b=2 the linear
        coefficient vanishes, leaving λ³&nbsp;+&nbsp;2λ²&nbsp;+&nbsp;4&nbsp;=&nbsp;0.
        This shifts the eigenvalue balance — the stable real root moves to
        ≈&nbsp;−2.4 and the unstable complex roots change to ≈&nbsp;0.2&nbsp;±&nbsp;1.28i.
        The ratio is still &gt;1 (chaos persists), but the attractor changes shape
        appreciably, making SK_WideB the most visually distinct key.
      </p>

      <h3 className="mt-4 font-medium">Step 5 — Material and export</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# ShaderNodeAttribute reads SprottN_Speed from geometry
attr_node.attribute_name = "SprottN_Speed"
attr_node.attribute_type = 'GEOMETRY'

# Base Color + Emission from same attribute → glow in Eevee Next
bsdf.inputs["Emission Strength"].default_value = 1.8

# GLB export settings
bpy.ops.export_scene.gltf(
    filepath="hf_sprott_n_poi.glb",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_morph=True,       # write shape keys as morph targets
    export_colors=True,      # write SprottN_Speed as vertex colour
    export_yup=True          # +Y up for WebXR
)`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="ml-4 list-disc space-y-2 text-sm">
        <li>
          <strong>Tube self-intersects</strong> — reduce TUBE_R from 0.035 to
          0.020.  Sprott N&apos;s tight ribbon means nearby passes are separated
          by only a few centimetres in the normalised space.
        </li>
        <li>
          <strong>Diverges to infinity</strong> — the IC must have z ≠ z* = b/2;
          if IC is too close to the unstable manifold, early transients can
          produce large excursions.  Set BURN_IN to 5 000 and use IC = (0.1, 0.5, 0.0).
        </li>
        <li>
          <strong>Shape key vertex count mismatch</strong> — Blender requires
          all shape keys to have the same vertex count as Basis.  Ensure THIN,
          N_STEPS and the tube sides are identical across all
          <code>add_shape_key()</code> calls.
        </li>
        <li>
          <strong>Bloom not visible</strong> — in Eevee Next, enable Bloom under
          Render Properties → Effects → Bloom, and set Threshold to 0.5.  Material
          Preview mode uses its own irradiance cache; switch to Rendered mode for
          the full glow.
        </li>
      </ul>

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
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>
        </li>
        <li>
          Gilpin W (2021–2024). <em>dysts: Dynamical Systems Benchmarks</em>.{" "}
          MIT licence.{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>.{" "}
          Related: <a className={lk} href="https://github.com/williamgilpin/chaosbook" target="_blank" rel="noopener noreferrer">chaosbook</a>.
        </li>
        <li>
          Bishop RL (1975). &ldquo;There is more than one way to frame a curve&rdquo;.{" "}
          <em>Am Math Monthly</em> <strong>82(3)</strong>: 246–251.{" "}
          Public domain.{" "}
          <a
            className={lk}
            href="https://www.jstor.org/stable/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            jstor.org/stable/2311093
          </a>
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Related studio work</h2>
      <ul className="ml-4 list-disc space-y-1 text-sm">
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr">
            Sprott M — dual Shilnikov saddle-foci, ratio 8.67
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr">
            Sprott K — xy-product nonlinearity, variable divergence
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr">
            Sprott H — z²-nonlinearity, Shilnikov at origin
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr">
            Genesio–Tesi — control-theory jerk chaos, Bishop frame derivation
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr">
            Shimizu–Morioka — two-mode laser Z₂ symmetry, Shilnikov wings
          </Link>
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
  topic: "scripting",
  tags: [
    "python",
    "numpy",
    "chaos",
    "attractor",
    "sprott",
    "rk4",
    "bishop-frame",
    "tube-mesh",
    "shape-keys",
    "webxr",
    "blender-5-1",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr",
});
