import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-r-attractor-1994-five-term-xy-bilinear-single-saddle-focus-shilnikov-ratio-ten-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott R Attractor 1994: ẋ=a−y ẏ=b+z ż=xy−z " +
  "5-Term XY-Bilinear Single Saddle-Focus " +
  "Shilnikov Ratio≈10.7 Third-Highest Single-Fixed-Point in Catalogue " +
  "Constant Divergence ∇·F=−1 λ₁≈+0.087 D_KY≈2.09 " +
  "Liouville ∑λᵢ=−1=∇·F RK4 DT=0.015 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(a=0.9,b=0.4)/SK_LowA(a=0.6)/SK_HighA(a=1.2)/SK_LowB(b=0.2) " +
  "Shape Keys Cobalt-Amber SprottR_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott R is a 5-term 1994 system with a bilinear xy nonlinearity — the same " +
  "nonlinearity class as Sprott K, distinct from the y²/z²/xz attractors that " +
  "dominate the catalogue.  Its single fixed point is a Shilnikov saddle-focus " +
  "with an exceptional ratio ρ ≈ 10.7, the third-highest among single-fixed-point " +
  "systems in the 1994 paper.  Constant divergence ∇·F = −1, four shape keys " +
  "scanning the (a, b) parameter plane, cobalt–amber speed gradient, WebXR-ready poi head.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        The XY-bilinear nonlinearity class
      </h2>
      <p>
        Most minimal-chaos systems use a self-squared term (y², z², or x²) to
        introduce curvature.  Sprott R uses a product of two distinct state
        variables:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = a − y          (constant forcing − linear damping)
ẏ = b + z          (constant bias + coupling)
ż = x·y − z        ← bilinear xy, constant dissipation

a = 0.9,  b = 0.4  (Sprott 1994 canonical values)`}
      </pre>
      <p>
        The bilinear product xz appears in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott K
        </Link>{" "}
        as well, but Sprott K has position-dependent divergence (∇·F = y − 0.7)
        while R enjoys a clean constant ∇·F = −1 from the −z self-damping term.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Fixed-point analysis and the Shilnikov certificate
      </h2>
      <p>
        Setting ẋ = ẏ = ż = 0 yields a unique fixed point for all a, b &gt; 0:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`P* = (−b/a,  a,  −b)
   = (−0.4̄,  0.9,  −0.4)   for canonical a=0.9, b=0.4`}
      </pre>
      <p>
        The Jacobian at P* is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J = [[ 0   −1    0 ]
     [ 0    0    1 ]
     [ a  −b/a  −1 ]]

Characteristic polynomial:  λ³ + λ² + (b/a)λ + a = 0
  (derived by cofactor expansion — the b/a term comes from J₃₂·J₁₂·J₂₃)`}
      </pre>
      <p>
        For the canonical values this evaluates to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ³ + λ² + 0.4̄λ + 0.9 = 0

Roots:
  λ_r ≈ −1.231             (stable real — saddle direction)
  λ_c ≈  0.115 ± 0.845i   (unstable complex spiral)

Shilnikov ratio:  ρ = |λ_r| / Re(λ_c) = 1.231 / 0.115 ≈ 10.7`}
      </pre>
      <p>
        By Shilnikov&apos;s theorem (1965), a homoclinic orbit to a saddle-focus
        with ρ &gt; 1 implies an infinite countable set of horseshoes, each
        containing infinitely many periodic orbits.  At ρ ≈ 10.7, Sprott R ranks
        third among single-fixed-point systems in the catalogue — behind only{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott I (≈16.7)
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott N (≈14.9)
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape-key parameter family
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis    a=0.9 b=0.4  canonical — ρ≈10.7, single scroll
SK_LowA  a=0.6 b=0.4  weaker xy-coupling, broader orbit
SK_HighA a=1.2 b=0.4  stronger coupling, topology shift
SK_LowB  a=0.9 b=0.2  smaller y-offset, near-periodic boundary`}
      </pre>
      <p>
        Moving a scales the fixed-point position: P* = (−b/a, a, −b), so raising
        a lifts the spiral centre along y while bringing x* closer to zero.
        Varying b translates the whole fixed point along the z-axis, which shifts
        the asymptotic winding plane without altering ∇·F.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Blueprint approach — why direct API over operators
      </h2>
      <p>
        The tube is built via <code>bpy.data.meshes</code> + <code>bmesh</code>,
        never via <code>bpy.ops.mesh.primitive_*</code>.  Operators depend on an
        active context (viewport, mode) that a headless / background Blender session
        does not guarantee; the direct API runs reliably from any Python entry point.
        Shape keys use <code>ob.shape_key_add</code> + per-key vertex overwrite —
        no intermediate mesh copies, no orphaned data-blocks.
      </p>
      <p>
        Bishop parallel-transport frames (Bishop 1975) propagate the normal by
        rotating each frame minimally onto the next tangent direction.  This
        avoids the Frenet–Serret flip at zero-curvature inflection points that
        would produce a twisted tube and incorrect UV layout on export.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Colour attribute and WebXR export
      </h2>
      <p>
        The <code>SprottR_Speed</code> FLOAT_COLOR attribute on POINT domain stores
        per-ring colour derived from <code>|ṡ|</code> at each waypoint — the
        magnitude of the velocity vector at the moment of recording.  A cobalt
        (slow) → amber (fast) ramp is percentile-clipped (5th–95th percentile) so
        outlier fast segments near the fixed-point saddle do not wash out the
        mid-range colour variation.  The attribute survives GLB export with{" "}
        <code>export_colors=True</code> and renders in Three.js via{" "}
        <code>MeshStandardMaterial.vertexColors</code>.
      </p>
    </>
  );
}

const CROSS_REFS = {
  studio: [
    "/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr",
    "/tutorials/blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr",
    "/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr",
  ],
  outside: [
    {
      title: "Some simple chaotic flows — Sprott 1994",
      url: "https://sprott.physics.wisc.edu/chaos/sprott.htm",
      licence: "public-domain equations",
      author: "Julien C. Sprott",
      doi: "10.1103/PhysRevE.50.R647",
      related: [{ title: "dysts (MIT)", url: "https://github.com/williamgilpin/dysts" }],
    },
    {
      title: "There is more than one way to frame a curve — Bishop 1975",
      url: "https://www.jstor.org/stable/2311093",
      licence: "public-domain technique",
      author: "Richard L. Bishop",
      doi: "10.2307/2311093",
      related: [{ title: "three.js TubeGeometry (MIT)", url: "https://github.com/mrdoob/three.js" }],
    },
  ],
};

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  tags: ["blender", "scripting", "python", "chaos", "attractor", "bishop-tube", "webxr", "poi"],
  libraryPath:
    "blends/scripting/python-numpy-sprott-r-attractor-1994-five-term-xy-bilinear-single-saddle-focus-shilnikov-ratio-ten-constant-divergence-rk4-bishop-tube-poi-webxr",
  body: Body,
  crossRefs: CROSS_REFS,
});
