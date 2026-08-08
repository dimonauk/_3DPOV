import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr";

const TITLE =
  "Python numpy — Kuen, Dini & Pseudosphere: Constant Negative Gaussian " +
  "Curvature K = −1, Bäcklund Transforms & Sine-Gordon Morphotypes for " +
  "Poi Head WebXR (Blender 5.1)";

const LEDE =
  "Three surfaces — the Kuen (1884), Dini (1865), and Beltrami's pseudosphere " +
  "(1868) — each carry Gaussian curvature K = −1 everywhere and are related " +
  "by Bäcklund transformations of the sine-Gordon equation.  This blueprint " +
  "evaluates all three on a shared 80 × 60 NumPy grid, encodes them as " +
  "shape-key morphotypes on a single 4 800-vertex poi head, assigns an indigo–" +
  "orange–indigo vertex-colour ramp from pole to equator, and exports a " +
  "Draco-6 GLB for WebXR morph-target animation in the Holoflow stage.";

function Body() {
  return (
    <>
      <p>
        In Euclidean geometry every sufficiently small patch of a smooth surface
        can be described by two principal curvatures κ₁ and κ₂; their product
        K = κ₁κ₂ is the{" "}<em>Gaussian curvature</em>.  Flat planes have
        K = 0; spheres have K = 1/r² &gt; 0.  Surfaces with K &lt; 0 everywhere
        are <em>hyperbolic</em> — they locally resemble a saddle — and the
        question of whether a complete hyperbolic plane (K = −1 everywhere) can
        be embedded in Euclidean ℝ³ consumed nineteenth-century geometers for
        decades.
      </p>
      <p>
        Beltrami showed in 1868 that <em>part</em> of the hyperbolic plane
        embeds as the pseudosphere (tractroid of revolution), but{" "}
        <Link className={lk} href="https://en.wikipedia.org/wiki/Hilbert%27s_theorem_(differential_geometry)">
          Hilbert proved in 1901
        </Link>{" "}
        that no complete K = −1 surface can exist in smooth ℝ³.  The finite
        patches that do fit — Kuen, Dini, the pseudosphere — are therefore the
        most one can achieve, and each expresses a different regime of the same
        underlying equation.
      </p>

      <h2>The sine-Gordon connection</h2>
      <p>
        Any surface of constant negative curvature K = −1 in ℝ³ can be
        described by an{" "}<em>asymptotic line coordinate system</em> (u, v)
        in which the first fundamental form reduces to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ds² = du² + 2 cos φ du dv + dv²,    φ = φ(u, v) — Chebyshev angle`}
      </pre>
      <p>
        The Gauss–Codazzi integrability condition then forces φ to satisfy the{" "}
        <em>sine-Gordon equation</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂²φ / ∂u ∂v = sin φ`}
      </pre>
      <p>
        This is the same PDE whose soliton solutions appear in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr">
          KdV soliton tutorial
        </Link>{" "}
        (the sine-Gordon and KdV are connected via inverse scattering
        theory).  A Bäcklund transformation is a pair of first-order PDEs that,
        given one solution φ, manufactures another — and each solution
        corresponds to a distinct K = −1 surface.
      </p>
      <p>
        For the three surfaces in this blueprint:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Pseudosphere</strong> — trivial solution φ = 2 arctan(e^u)
          (a 1-soliton in u); rotationally symmetric.
        </li>
        <li>
          <strong>Dini surface</strong> — Bäcklund image of the pseudosphere at
          parameter b/a = 0.4; the rotational symmetry is broken into a helix.
        </li>
        <li>
          <strong>Kuen surface</strong> — Bäcklund image of the pseudosphere at
          a parameter that introduces self-intersection; φ = 2 arctan(u sin v).
        </li>
      </ul>

      <h2>Parametric equations</h2>
      <p>
        All three are evaluated on the <em>same</em> normalised grid
        S, T ∈ [0, 1]² to ensure shape-key topology matches.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`── Kuen (1884) ────────────────────────────────────────────────────────────
u = (2S − 1) · 2.6       v = V_MIN + T · (V_MAX − V_MIN)
d = 1 + u² sin²v

x = 2(cos u + u sin u) sin v / d
y = 2(sin u − u cos u) sin v / d
z = log tan(v/2) + 2 cos v / d

WHY K = −1: d cancels the curvature contribution from the log term exactly.
The Kuen surface self-intersects near u = ±2.6 because the denominator d
does not prevent wrap-around of the x,y coordinates.

── Dini (1865) ────────────────────────────────────────────────────────────
u = S · 4π                v = same v range

x = a cos u sin v,   y = a sin u sin v
z = a (cos v + log tan(v/2)) + b·u        (a=1.0, b=0.4)

WHY THE HELIX: the linear term b·u translates the pseudosphere profile
upward as u increases, breaking axial symmetry into a Archimedean screw.

── Pseudosphere / Tractroid (Beltrami 1868) ────────────────────────────
u = S · 2π                v = T · 3.8

x = sech(v) cos u,   y = sech(v) sin u,   z = v − tanh(v)

WHY sech/tanh: the tractrix has tangent length = 1 everywhere.  The
surface of revolution of the tractrix around the z-axis is the pseudosphere.
sech(v) is the radial distance; v − tanh(v) is the axial position.`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <p>
        After the constants block, the three evaluators are pure NumPy — no
        loops, each returning a (GRID_U, GRID_V, 3) float64 array.  The key
        implementation choices:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Shared (S, T) grid</strong> — the same meshgrid feeds all
          three evaluators.  Shape-key topology therefore matches exactly:
          vertex i in Dini corresponds to the same (s, t) parameter as vertex i
          in Kuen.  The morphing path through parameter space is smooth.
        </li>
        <li>
          <strong>scale_to_poi()</strong> — each surface is independently
          centred and scaled to a 0.115 m bounding sphere.  Without this,
          Dini (which spirals in z) would be ten times taller than the
          pseudosphere (which is compact).
        </li>
        <li>
          <strong>foreach_set</strong> — shape-key vertex positions use
          <code className="mx-1">sk.data.foreach_set('co', flat_list)</code>
          rather than a Python loop.  For 4 800 vertices this is ~40× faster
          than iterating <code className="mx-1">sk.data[vi].co.z = …</code>.
        </li>
        <li>
          <strong>domain clipping</strong> — V_MIN = 0.18, V_MAX = π − 0.18
          keeps log(tan(v/2)) finite.  The clipped faces at the poles are
          visually minimal and avoid degenerate geometry in the exported GLB.
        </li>
      </ul>

      <h2>Failure modes and fixes</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Z-fighting at Kuen self-intersections</strong> — the Kuen
          surface crosses itself near u = ±U_KUEN.  Reduce U_KUEN to 2.2 to
          push the self-intersection outside the mesh boundary, or accept the
          artefact as visually interesting.
        </li>
        <li>
          <strong>Pseudosphere pinching at v = 0</strong> — sech(0) = 1 so the
          equatorial ring is fine, but if T_MIN &gt; 0 the base cap is open.
          For a closed mesh, add a circular cap face manually in Edit Mode.
        </li>
        <li>
          <strong>Dini z-range too large</strong> — with DINI_B = 0.4 and
          u ∈ [0, 4π] the z-extent before scaling is 4π × 0.4 ≈ 5 m.
          scale_to_poi() collapses this to 0.115 m but the shape becomes thin
          if DINI_B is increased.  Reduce DINI_U_MAX or lower DINI_B.
        </li>
        <li>
          <strong>Vertex colour missing in GLB viewer</strong> — ensure
          <em>Vertex Colors</em> is ticked in the glTF export dialogue and the
          viewer has a material that uses VERTEX_COLOR attribute.  In the
          Holoflow Three.js viewer this is automatic.
        </li>
      </ul>

      <h2>Related Holoflow tutorials</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr">
            KdV Soliton: Hirota τ-Function & Phase Shift
          </Link>{" "}
          — the KdV and sine-Gordon equations share inverse-scattering
          integrability; Bäcklund transforms appear in both.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr">
            Weierstrass–Enneper Minimal Surfaces
          </Link>{" "}
          — minimal surfaces have K ≤ 0 (K = 0 only at umbilic points); the
          contrast with the constant K = −1 regime here clarifies the role of
          mean curvature H.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr">
            Gielis Superformula: Polar 3D Organic Poi Head
          </Link>{" "}
          — another parametric poi-head approach, with shape-key morphing
          across biologically-inspired surface families.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr">
            Torus Knot P,Q Winding & Parallel Transport Tube
          </Link>{" "}
          — tubular poi geometry using the same from_pydata + shape-key
          pipeline introduced here.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Kuen, T. (1884).{" "}
          <em>Flächen von constantem Krümmungsmaasse</em>.
          Sitz. k. b. Akad. Wiss. München, math.-phys. Cl.{" "}
          <strong>Public domain</strong> (published 1884).  The original
          parametric equations appear on p. 194–196.  Related projects:
          Paul Bourke&apos;s surface catalogue (
          <a className={lk} href="http://paulbourke.net/geometry/kuen/" target="_blank" rel="noreferrer">
            paulbourke.net/geometry/kuen/
          </a>
          ) and the Wolfram MathWorld entry.
        </li>
        <li>
          Beltrami, E. (1868).{" "}
          <em>Teoria fondamentale degli spazii di curvatura costante</em>.
          Ann. di Mat. 2(2): 232–255.{" "}
          <strong>Public domain</strong> (published 1868).  This paper first
          proved that hyperbolic geometry has an Euclidean model, using the
          pseudosphere as the primary example.  Digitised by the Göttingen
          Digitization Center:{" "}
          <a className={lk} href="https://gdz.sub.uni-goettingen.de/id/PPN235181684_0002" target="_blank" rel="noreferrer">
            gdz.sub.uni-goettingen.de
          </a>
          .  Related: Beltrami–Klein model, hyperbolic tiling.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    directory: "blends/scripting/python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr",
    software: ["Blender 5.1", "numpy (bundled with Blender)"],
    time: "30 minutes",
    difficulty: "advanced",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open the Scripting workspace",
        body: "Launch Blender 5.1.  Switch to the Scripting workspace.  Create a new text block.  Save the .blend to a folder (the '//' path in record.py resolves relative to the .blend file).",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the Text Editor and press Alt+P.  The Python Console should print: '[kuen] 4800 verts  4661 faces  shape keys: Basis, Dini, Pseudosphere'.  Expect 3–8 s on a modern CPU.",
      },
      {
        title: "Inspect the Kuen surface",
        body: "Orbit the 3D Viewport.  Enable Viewport Shading → Vertex to see the indigo–orange–indigo latitude colour.  The surface self-intersects near its u-boundaries — this is geometrically correct for the Kuen surface.",
      },
      {
        title: "Explore shape keys",
        body: "Object Properties → Shape Keys panel.  Dial Dini from 0 to 1: watch the self-intersecting Kuen folds unwrap into a clean helical spiral.  Return to 0 and dial Pseudosphere from 0 to 1: the helix becomes a trumpet horn.",
      },
      {
        title: "Run record.py",
        body: "Load record.py in a second text block; press Alt+P.  This keyframes the morph animation over 150 frames and configures Workbench rendering.  Press Ctrl+F12 to render viewport.mp4 (~1–3 min).",
      },
      {
        title: "Follow SCREEN-RECORDING-NOTES.md",
        body: "Open OBS, configure the Blender window capture at 1920×1080, 30 fps.  Record the theory overview, code walkthrough, live run, and shape-key demo as described in the notes.  Save as screen.mp4.",
      },
      {
        title: "Export GLB",
        body: "File → Export → glTF 2.0.  Options: Format = GLB, Draco compression level 6, Morph Targets ✓, Vertex Colors ✓, Apply Transforms ✓.  Name the file hf_kuen_poi.glb and save it alongside the .blend.",
      },
      {
        title: "Verify in Three.js viewer",
        body: "Load hf_kuen_poi.glb in the Holoflow Three.js viewer.  Confirm the mesh appears at ≈0.23 m diameter, the vertex colour gradient is visible, and two morph targets (Dini, Pseudosphere) appear in the inspector.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-08",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);
