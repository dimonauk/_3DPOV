import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr";

const TITLE =
  "Python numpy — Mandelbulb Power-8: Triplex Algebra, Distance Estimation & Orbit-Trap Vertex Colours for WebXR (Blender 5.1)";

const LEDE =
  "The Mandelbulb is a 3-D escape-time fractal defined by triplex (spherical-coordinate) exponentiation: z → z^n + c, where z^n maps (r, θ, φ) to (r^n, nθ, nφ). No genuine 3-D analogue of the complex numbers exists; triplex arithmetic is an ad-hoc extension due to White & Rudy (2007–2009); power n = 8 produces the iconic branched-antenna form with deep secondary bulbs. This blueprint vectorises the distance estimation field over a 72³ numpy grid, extracts the isosurface via scikit-image marching cubes, and colours each vertex by trilinear interpolation of three orbit-trap fields — distance to the Z-axis, XY-plane, and unit sphere — producing the iridescent RGB gradient exported to GLB.";

function Body() {
  return (
    <>
      <p>
        The 2-D Mandelbrot set iterates z → z² + c in ℂ, exploiting the field
        structure of complex multiplication. In ℝ³ no such field exists — the
        only normed division algebras over ℝ are ℝ, ℂ, ℍ (quaternions), and 𝕆
        (octonions), none of which naturally embed ℝ³. White and Rudy
        circumvented this by defining a spherical-coordinate power:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z = (r, θ, φ)  in spherical coords
z^n = (r^n, nθ, nφ)
iteration: z ← z^n + c`}
      </pre>
      <p>
        This is not derived from algebra; it is a geometric prescription that
        produces Mandelbrot-like branching. Power n = 8 creates eight-fold
        dihedral symmetry in the equatorial cross-section, matching the
        rotational character of the 2-D set at the main-bulb boundary.
      </p>

      <h2>Distance estimation</h2>
      <p>
        Colouring by raw escape-iteration count produces discontinuous banding.
        Distance estimation (DE) instead tracks the derivative magnitude{" "}
        <code>|dz/dc|</code> alongside <code>|z|</code>. When{" "}
        <code>|z| &gt; bailout</code>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DE(c) = |z| · log|z| / (2 · |dz/dc|)

# derivative update inside the loop (chain rule):
dz ← n · r^(n−1) · dz + 1`}
      </pre>
      <p>
        DE is a lower bound on the Euclidean distance from c to the Mandelbulb
        set — descended from the Auer-Lyne (1999) analysis of the 2-D
        Mandelbrot DE. It is smooth across parameter space, making it suitable
        as an SDF surrogate: marching cubes at DE = 0.012 traces a continuous
        exterior shell just outside the set boundary.
      </p>

      <h2>Orbit traps — three geometric loci</h2>
      <p>
        Orbit traps record the minimum distance of the iteration sequence to a
        chosen geometric set (the &ldquo;trap&rdquo;). Three traps are evaluated
        simultaneously during each iteration:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`trap_r ← min over orbit of  √(x² + y²)   # dist to Z-axis
trap_z ← min over orbit of  |z.z|          # dist to XY-plane
trap_s ← min over orbit of  | |z| − 1 |   # dist to unit sphere`}
      </pre>
      <p>
        The trap grids are trilinear-interpolated to mesh vertex positions and
        soft-normalised via sigmoid → RGB:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`R ← σ(clip(trap_r,        0,1))
G ← σ(clip(trap_z / 0.6,  0,1))
B ← σ(clip(trap_s / 0.5,  0,1))
σ(x) = 1 / (1 + exp(−6·(x−0.5)·2))`}
      </pre>
      <p>
        Points whose orbit passes near the Z-axis (polar bulbs) appear warm
        orange-red. Equatorial orbits that stay near the XY-plane appear green.
        The unit-sphere trap picks out narrow arcs that spiralled close to
        |z| = 1 — these appear as iridescent blue bands around secondary bulbs.
      </p>

      <h2>Grid resolution and isosurface</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`GRID_N = 72    # 72³ ≈ 373 K points  (~30–60 s on modern CPU)
GRID_N = 48    # quick preview         (~10 s, blocky)
GRID_N = 96    # high fidelity         (~4 min)

# Marching cubes on the DE field:
verts, faces, _, _ = marching_cubes(de_grid, level=0.012, spacing=(step,step,step))
verts_unit = verts − GRID_RANGE    # re-centre to [−GR, GR]
verts_world = verts_unit × SCALE`}
      </pre>
      <p>
        The DE field has 0 for interior voxels (never escaped) and a positive
        lower bound for exterior. The isosurface at DE = 0.012 is therefore an
        exterior shell. At 72³, the smallest resolvable feature is ≈ 3.5 cm
        world-space — sufficient for primary and secondary bulbs.
      </p>

      <h2>Trilinear interpolation — grid to mesh vertices</h2>
      <p>
        Mesh vertices from marching cubes lie at sub-voxel positions. A
        vectorised trilinear interpolation maps each vertex to its surrounding
        8-cell neighbourhood without re-running the Mandelbulb iteration:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`frac = (pts_unit + GR) / (2·GR) × (N−1)   # fractional grid index
i0   = floor(frac);  i1 = min(i0+1, N−1)
t    = frac − i0                               # ∈ [0,1]³

val = c000·(1−tx)·(1−ty)·(1−tz) + c100·tx·(1−ty)·(1−tz) + …`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>scikit-image not found</strong> — install:{" "}
          <code>&lt;blender_python&gt; -m pip install scikit-image</code>. The
          script falls back to a degenerate point-cloud mesh if the import
          fails.
        </li>
        <li>
          <strong>Script runs &gt; 3 minutes</strong> — reduce GRID_N to 48.
          Compute scales as O(N³ · MAX_ITER); halving N reduces time ≈ 8×.
        </li>
        <li>
          <strong>Vertex colours black in viewport</strong> — switch to
          Material Preview (Z → Material Preview). Solid shading ignores
          vertex-colour layers.
        </li>
        <li>
          <strong>Secondary bulbs absent at low resolution</strong> — secondary
          bulbs are ≈ 3× the grid step at GRID_N=72; use 72–96 for production.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
            className={lk}
          >
            Python numpy — Mandelbrot & Julia Fractal Poi WebXR
          </Link>{" "}
          — the 2-D precursor: same escape-time logic in ℂ, producing
          orbit-count height fields rather than 3-D meshes; the Mandelbulb
          triplex power is a direct generalisation of complex squaring
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
            className={lk}
          >
            Python numpy — Marching Cubes: Gyroid TPMS SDF Isosurface
          </Link>{" "}
          — identical scikit-image marching-cubes pipeline on a scalar field;
          the gyroid SDF is analytical while the Mandelbulb DE is iterative,
          but mesh extraction is the same
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr"
            className={lk}
          >
            Python numpy — SDF CSG: Quilez Primitives & Smooth Booleans
          </Link>{" "}
          — Quilez&apos;s SDF library tradition in which the Mandelbulb DE is also
          embedded; the smooth-minimum operator can be composed with the
          Mandelbulb DE to create hybrid SDF scenes
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr"
            className={lk}
          >
            Python numpy — IFS Chaos Game: Barnsley Fern & Dragon Curve
          </Link>{" "}
          — IFS attractors and escape-time fractals are dual: the IFS limit
          set is the attractor of a contractive system; the Mandelbulb
          boundary is the prisoner set of an expanding one
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          White, D. & Rudy, J. (2007–2009){" "}
          <a
            href="http://www.skytopia.com/project/fractal/mandelbulb.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            The Unravelling of the Real 3D Mandelbrot Fractal — skytopia.com
          </a>{" "}
          — original derivation of the triplex iteration and canonical n = 8
          parameterisation; mathematical formula is public domain. Related:{" "}
          <a
            href="http://www.skytopia.com/project/fractal/2mandelbulb.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mandelbulb Power Exploration (White 2009)
          </a>
        </li>
        <li>
          Christensen, M. H. (2011–2023){" "}
          <a
            href="https://github.com/Syntopia/Fragmentarium"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fragmentarium — GPU-accelerated fractal renderer (BSD-2-Clause)
          </a>{" "}
          — open-source GLSL fractal renderer whose{" "}
          <code>DE-Raytracer.frag</code> contains a canonical Mandelbulb DE
          implementation; the derivative update (n·r^(n−1)·dz + 1) matches
          Fragmentarium&apos;s reference shader. Related:{" "}
          <a
            href="https://github.com/Syntopia/Fragmentarium/blob/master/Fragmentarium-Source/ThirdPartyCode"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Syntopia/Fragmentarium ThirdPartyCode (BSD-2-Clause)
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-02",
  topics: ["blender", "python", "scripting", "mathematics", "fractal", "webxr"],
  body: Body,
  library: {
    type: "glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
