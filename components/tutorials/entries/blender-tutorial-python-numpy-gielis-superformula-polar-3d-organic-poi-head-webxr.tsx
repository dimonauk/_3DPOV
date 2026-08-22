import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr";

const TITLE =
  "Python numpy — Gielis Superformula: Polar-Form 3D Organic Surfaces, " +
  "Five Shape-Key Morphologies & Bioluminescent Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Johan Gielis (2003) unified a vast menagerie of natural and abstract shapes " +
  "into a single six-parameter polar equation: r(θ) = [|cos(mθ/4)/a|^n₂ + " +
  "|sin(mθ/4)/b|^n₃]^(−1/n₁). Setting m=6 and all exponents to 1 gives a " +
  "hexagonal blob; m=5 with high n₂/n₃ gives a sea star; n₁→∞ with m=4 " +
  "converges to a rounded cube. This blueprint extends the formula to 3D " +
  "via two independent superformula evaluations over latitude and longitude, " +
  "builds a 60×90 quad poi-head, adds four shape keys that morph through " +
  "starfish, cross, thorny spikes, and rounded cube, colour-encodes local " +
  "radius as violet→cyan vertex colour, and exports a Draco-compressed GLB.";

function Body() {
  return (
    <>
      <p>
        In 2003, Belgian plant biologist Johan Gielis published a generalisation
        of the Lamé curve — the superellipse |x/a|ⁿ + |y/b|ⁿ = 1 — into polar
        form. Instead of Cartesian exponents on a fixed Lp sphere, the superformula
        puts exponents on the cosine and sine terms of a polar parametrisation:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`r(θ) = [ |cos(mθ/4)/a|^n₂  +  |sin(mθ/4)/b|^n₃ ]^(−1/n₁)

m  — rotational symmetry order (integer lobes)
n₁ — global sharpness exponent (−1/n₁ power)
n₂ — cosine branch exponent
n₃ — sine branch exponent
a,b— axis scaling (a=b=1 gives rotational symmetry)`}
      </pre>
      <p>
        The compactness is deceptive. Setting m=4, n₁=n₂=n₃=2, a=b=1 gives a
        circle. Increasing n₁ to 100 while keeping m=4 approaches a square — the
        same limit the Lp norm reaches as p→∞. Setting m=5, n₂=n₃=7 gives a
        convincing sea-star silhouette. Small n₁ with large n₃ gives hypocycloid
        cusps. The formula captures the outline of leaves, snowflakes, pollen
        grains, diatoms, and crystallographic cross-sections — all from one
        equation.
      </p>

      <h2>The 3D spherical product</h2>
      <p>
        Gielis extended the formula to 3D by treating it as a{" "}
        <em>spherical product surface</em>: evaluate two independent superformulas,
        one over latitude φ ∈ [−π/2, π/2] and one over longitude θ ∈ [−π, π],
        then assemble Cartesian coordinates:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`r₁ = SF(φ; m_φ, n1_φ, n2_φ, n3_φ)   ← profile silhouette
r₂ = SF(θ; m_θ, n1_θ, n2_θ, n3_θ)   ← cross-section outline

x = r₁·cos φ · r₂·cos θ
y = r₁·cos φ · r₂·sin θ
z = r₁·sin φ`}
      </pre>
      <p>
        When the same parameters are used for both evaluations, the resulting
        surface has matching axial and radial symmetry — a starfish whose top
        view and front view show the same m-fold star. Mixing parameters gives
        asymmetric organic forms.
      </p>
      <p>
        Contrast this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr"
          className={lk}
        >
          superquadric (Barr signed-powers) tutorial
        </Link>
        , which works in Cartesian space: |x/a|^p + |y/b|^q + |z/c|^r = 1.
        Superquadrics handle ellipsoidal → cuboid deformations cleanly; the
        superformula handles star-arm → petal count → cusp-tip transitions.
        Different tools for different shape families.
      </p>

      <h2>Shape key parameter families</h2>
      <p>
        The five shape keys encode distinct regions of the parameter space:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis    m=6, n1=1.0, n2=1.0, n3=1.0  — hexagonal blob
Starfish m=5, n1=2.0, n2=7.0, n3=7.0  — 5-arm sea star (sharp tips)
Cross    m=4, n1=1.0, n2=2.0, n3=2.0  — 4-lobe rounded cross
Thorns   m=8, n1=0.5, n2=0.5, n3=8.0  — 8 spines (n1=0.5 → −2 exponent)
Cube     m=4, n1=50,  n2=50,  n3=50   — Lp→L∞ cube limit`}
      </pre>
      <p>
        The Thorns key is the most counterintuitive: n₁=0.5 means the base is
        raised to the power −1/0.5 = −2. A large base (near the star tips where
        both cos and sin terms contribute) becomes small after the negative power,
        but a tiny base (at the cusp where one term dominates the other) becomes
        enormous. This inverts the usual intuition: the formula peaks at the
        angular positions that minimize the base, producing sharp spines rather
        than rounded lobes.
      </p>
      <p>
        The Cube key demonstrates L^p convergence. As n₁=n₂=n₃→∞ with m=4, the
        superformula converges to the L∞ unit ball — a square in 2D, a rounded
        cube in 3D. This is precisely the same limit that the Lamé curve
        |x|^p + |y|^p = 1 reaches as p→∞, confirming the superformula as a
        strict generalisation of the Cartesian Lp ball in polar coordinates.
      </p>

      <h2>Vertex colour: radius deviation as hue</h2>
      <p>
        Each vertex is coloured by its normalised distance from the origin in the
        basis shape. The normalised radius r ∈ [0, 1] maps through a smoothstep
        function to the colour ramp violet (r_min, hexagonal recesses) → cyan
        (r_max, star tips). Smoothstep C¹ avoids colour banding at intermediate
        morph values when the viewer transitions between shape keys in WebXR.
        The same technique appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr"
          className={lk}
        >
          Centroidal Voronoi Tessellation poi head
        </Link>
        , where radius encodes the CVT energy density.
      </p>

      <h2>Polar coordinates and phyllotaxis</h2>
      <p>
        The superformula operates in polar/spherical coordinates, the same domain
        as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr"
          className={lk}
        >
          phyllotaxis golden-angle spiral
        </Link>
        . Both map (angle, radius) pairs to 3D positions; phyllotaxis uses a
        fixed Vogel formula for r(n), while the superformula uses a trigonometric
        series. The difference is discrete-vs-continuous: phyllotaxis places N
        discrete points, superformula sweeps a continuous surface.
      </p>

      <h2>Shape-key topology constraint</h2>
      <p>
        Blender shape keys require a fixed vertex count and topology. All five
        parameter sets share the same 60×90 = 5,400-vertex quad grid. The
        topology is the grid connectivity (wrap at θ); only the <em>positions</em>{" "}
        change. This works cleanly for the superformula because the parametric
        grid (φ_i, θ_j) is the same structure across all parameter sets — each
        morph just moves the same grid point to a different radius.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics orbital tutorial
        </Link>
        , which uses the same (φ, θ) parametric grid but derives radii from real
        spherical harmonic functions Y_l^m(φ, θ). Both are{" "}
        <em>spherical product surfaces</em> in the broad sense: a sphere's
        topology with displacement controlled by a mathematical function.
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Gielis, J. (2003). &ldquo;A generic geometric transformation that
          unifies a wide range of natural and abstract shapes.&rdquo;{" "}
          <em>American Journal of Botany</em> 90(3):333–338. DOI{" "}
          <a
            href="https://doi.org/10.3732/ajb.90.3.333"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            10.3732/ajb.90.3.333
          </a>{" "}
          — originating paper; mathematical content PD.
        </li>
        <li>
          Bourke, P. &ldquo;Superformula.&rdquo;{" "}
          <a
            href="https://paulbourke.net/geometry/superformula/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            paulbourke.net/geometry/superformula/
          </a>{" "}
          (PD educational reference) — parameter gallery and C reference
          implementation; related:{" "}
          <a
            href="https://paulbourke.net/geometry/supershape3d/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            supershape3d
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. The script builds 5,400 vertices and five shape keys in under a second. Confirm the console prints '[superformula] ✓ exported //hf_superformula_poi.glb'.",
      },
      {
        title: "Inspect the basis mesh",
        body: "Switch to 3D Viewport → Material Preview (Z → Material Preview). You should see a violet-and-cyan hexagonal blob with six gentle lobes. Press Numpad 7 for top-down view of the six-fold symmetry.",
      },
      {
        title: "Cycle through shape keys",
        body: "Open Object Properties → Shape Keys. Drag 'Starfish' to 1 to see five sharp cyan arms. Return to 0. Try 'Thorns' at 1 for eight dark violet spines with luminous tips. Try 'Cube' at 1 to watch the organic form lock into a rounded box.",
      },
      {
        title: "Run record.py",
        body: "Load record.py into the text editor and press Alt+P. This renders the 120-frame morphing animation to viewport.mp4 via Workbench renderer (~20 s on a mid-range CPU).",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture an OBS recording: theory walkthrough, blueprint run, shape-key demo with commentary on the Thorns and Cube limits, record.py playback.",
      },
      {
        title: "Save the .blend",
        body: "File → Save As → hf_superformula_poi.blend in the same directory as blueprint.py.",
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
