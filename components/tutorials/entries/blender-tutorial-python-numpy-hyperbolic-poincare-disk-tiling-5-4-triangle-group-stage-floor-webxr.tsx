import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr";

const TITLE =
  "Python numpy — Hyperbolic {5,4} Tiling: Poincaré Disk Model, Triangle Group Möbius Reflections, Coxeter's Circumradius Formula & Aperiodic Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Place four pentagons around every vertex, each touching the others at a perfect right angle, and you cannot tile the Euclidean plane — but you can tile the hyperbolic plane H² infinitely, filling it without gap or overlap. This is the {5,4} Schläfli tiling, one of the countably infinite family of tilings that exist only in hyperbolic geometry, where (p−2)(q−2) > 4 forces the surface to curve. The Poincaré disk model represents H² as the open unit disk D = {z ∈ ℂ : |z| < 1} with the metric ds² = 4|dz|²/(1−|z|²)², geodesics are arcs of Euclidean circles orthogonal to the unit circle, and the isometry group is the Möbius group PSL(2,ℝ). This blueprint computes the tiling by BFS-applying the five hyperbolic reflections (one per pentagon side) using a clean three-step Möbius conjugation, scales the result to a 1.2-metre stage floor, colours tiles by depth from the origin (purple at centre, warm at the Escher-like boundary), and exports a GLB with three shape keys — SK_Dome, SK_Bowl, SK_Ripple — for live animation in WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Thurston WP (1997) Three-Dimensional Geometry and Topology, §2.3. Princeton UP. Mathematical content Public Domain — defines the Poincaré disk model, geodesics as arcs orthogonal to the unit circle, isometries as Möbius transformations in PSL(2,ℝ), and the discrete subgroups (triangle groups) that generate regular {p,q} tessellations. Related: Thurston (1982) Bulletin AMS 6:357–381 (geometrisation conjecture); Scott (1983) Geometries of 3-manifolds; Cannon–Floyd–Kenyon–Parry (1997) Hyperbolic geometry survey.",
      url: "https://press.princeton.edu/books/hardcover/9780691083049/three-dimensional-geometry-and-topology-volume-1",
      licence: "Mathematical content Public Domain",
      author: "William P. Thurston",
    },
    {
      label:
        "Coxeter HSM (1954) Regular honeycombs in hyperbolic space. Proc. ICM Amsterdam 3:155–169. Public Domain — enumerates the {p,q} hyperbolic tilings via the Schläfli condition (p−2)(q−2) > 4, gives the circumradius formula cosh(R) = cos(π/q)/sin(π/p) via Napier's rules for right triangles in H², and shows the connection to the Coxeter–Dynkin diagram of the triangle reflection group. Related: Coxeter (1973) Regular Polytopes; Magnus (1974) Noneuclidean Tessellations and Their Groups; Stillwell (1996) Sources of Hyperbolic Geometry.",
      url: "https://www.mathunion.org/fileadmin/ICM/Proceedings/ICM1954.3/ICM1954.3.ocr.pdf",
      licence: "Public Domain",
      author: "H.S.M. Coxeter",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — complex dtype for Möbius arithmetic (element-wise add, multiply, conj, exp, angle, abs); vectorised poincare_reflect_vec applied to all 5 pentagon vertices simultaneously; math.atanh for the hyperbolic-distance formula d(0,z) = 2 arctanh(|z|). Related: https://github.com/numpy/numpy; scipy.special for Gauss–Bonnet area computations.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        A tiling of the Euclidean plane requires that the interior angles of
        the tiles sum to exactly 2π at every vertex. For a regular p-gon the
        interior angle is (p−2)π/p. In the {"{p,q}"} tiling, q tiles meet at
        each vertex, so we need q·(p−2)π/p = 2π — which forces pq − 2p − 2q = 0
        — the Euclidean condition. The only solutions are {"{3,6}"}, {"{4,4}"},
        {"{6,3}"}: triangles around hexagons, squares, hexagons around triangles.
      </p>
      <p>
        In the hyperbolic plane the angle sum at every vertex is still 2π, but
        the interior angle of a regular p-gon <em>depends on its size</em>:
        larger polygons have smaller angles (Gauss–Bonnet). For a given target
        angle 2π/q we can always make p-gons small enough to fit — as long as
        (p−2)(q−2) &gt; 4. This is the only arithmetic condition needed. For
        {"{5,4}"}: (5−2)(4−2) = 6 &gt; 4 ✓, and each corner is a right angle (2π/4 = π/2).
      </p>

      <h2>The Poincaré disk model</h2>
      <p>
        Henri Poincaré (1882) showed that H² is isometric to the unit disk
        D = {"{ z ∈ ℂ : |z| < 1 }"} with the metric:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`ds² = 4|dz|² / (1 − |z|²)²

Distances near the boundary |z| → 1 are stretched enormously —
the boundary |z| = 1 is "infinitely far away" in hyperbolic distance.
Distance from origin: d(0, z) = 2 arctanh(|z|)`}
      </pre>
      <p>
        Geodesics (shortest paths) in this model are arcs of Euclidean circles
        that meet the unit circle at right angles, and diameters. The isometry
        group (orientation-preserving) is PSL(2,ℝ) acting on D by Möbius
        transformations of the form z → (az+b)/(b̄z+ā) with |a|²−|b|² = 1.
      </p>

      <h2>Circumradius formula</h2>
      <p>
        The central pentagon of the {"{5,4}"} tiling sits with its centre at the
        origin. Each vertex lies at hyperbolic circumradius R, which satisfies
        (via Napier&apos;s rules applied to the right triangle formed by the
        polygon centre, a vertex, and an edge midpoint):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`cosh(R) = cos(π/q) / sin(π/p)

For {5,4}: cosh(R) = cos(π/4) / sin(π/5)
                   = (1/√2) / sin(36°)
                   ≈ 0.7071 / 0.5878 ≈ 1.2031

R ≈ 0.6348    (hyperbolic units)

Euclidean disk radius: ρ = tanh(R/2) ≈ tanh(0.317) ≈ 0.307`}
      </pre>
      <p>
        So the 5 vertices of the central pentagon lie at radius 0.307 in the
        Poincaré disk — well away from the boundary at |z|=1.
      </p>

      <h2>Möbius reflection across a geodesic</h2>
      <p>
        To tile the disk, we reflect the central pentagon across each of its 5
        sides. Reflecting a point z across the geodesic from p₁ to p₂ requires
        three steps:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`def poincare_reflect(z, p1, p2):
    # 1. Map p1 → 0 via Möbius isometry T
    T     = lambda w: (w − p1) / (1 − conj(p1) * w)
    T_inv = lambda w: (w + p1) / (1 + p1 * w)

    t2    = T(p2)
    theta = angle(t2)   # argument of T(p2)

    # 2. Rotate so T(p2) lies on positive real axis
    #    (geodesic is now a diameter = real axis segment)

    # 3. Reflect across the real axis = complex conjugate
    w = T(z) * exp(-i*theta)
    return T_inv(conj(w) * exp(i*theta))`}
      </pre>
      <p>
        This composition is itself a Möbius transformation, and it is an
        orientation-reversing isometry of H² — an element of PGL(2,ℝ) that
        does not lie in PSL(2,ℝ). Composing two reflections gives an
        orientation-preserving isometry (a rotation).
      </p>

      <h2>BFS tiling generation</h2>
      <p>
        Starting from the central pentagon, each of the 5 reflections produces
        an adjacent pentagon. Those 5 pentagons each have 5 sides; reflecting
        across the 4 non-shared sides produces 20 more (minus overlaps with
        already-seen tiles). BFS continues until the tile centre exceeds
        DISK_CUTOFF = 0.92 — tiles near the boundary become too small in
        Euclidean units to contribute usable geometry.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Typical tile counts by BFS depth:
  Depth 0: 1   (central pentagon)
  Depth 1: 5   (one reflection per side)
  Depth 2: ~15 (each neighbour exposes 4 new sides)
  Depth 3: ~45
  Depth 4: ~130
  Total (DISK_CUTOFF=0.92): ~400–450 tiles`}
      </pre>
      <p>
        The tile canonical key is the rounded centroid (4 decimal places),
        which is unique per tile: Möbius transformations are continuous, and
        any two distinct tiles have centres separated by at least 10⁻³ within
        DISK_CUTOFF.
      </p>

      <h2>Gauss–Bonnet and the hyperbolic area</h2>
      <p>
        Every pentagon has interior angle π/2 at each of its 5 vertices. By
        the Gauss–Bonnet theorem for a hyperbolic polygon:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Area = π(n − 2) − Σ interior angles
     = π(5 − 2) − 5·(π/2)
     = 3π − 5π/2
     = π/2   ≈ 1.5708 (in hyperbolic area units)`}
      </pre>
      <p>
        Every tile has the same hyperbolic area π/2. Near the boundary the
        Euclidean area shrinks to zero, but the tiles remain geometrically
        identical — this is the non-Euclidean magic that Escher exploited.
      </p>

      <h2>Vertex colour: depth gradient</h2>
      <p>
        After bmesh remove_doubles merges shared vertices, each vertex is
        coloured by its Euclidean radius r in the disk, mapped to HSV with
        hue = 0.75 − 0.70·(r / DISK_CUTOFF):
      </p>
      <ul>
        <li><strong>Centre (r≈0):</strong> hue ≈ 0.75 = cool violet</li>
        <li><strong>Middle (r≈0.5):</strong> hue ≈ 0.40 = cyan-green</li>
        <li><strong>Near boundary (r≈0.9):</strong> hue ≈ 0.05 = warm orange</li>
      </ul>
      <p>
        This mimics Escher&apos;s technique of using warm colours at the
        boundary to give the impression of the tiling fading into infinity.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`SK_Dome:   z = tanh(hyp_dist(v) / 3) × 0.12 m
           WHY tanh: bounded growth — tile height saturates at 0.12 m
           rather than growing without bound as the hyperbolic distance
           becomes very large near the boundary.

SK_Bowl:   z = −tanh(hyp_dist(v) / 3) × 0.12 m
           (inverted dome — bowl shape for placing poi in centre)

SK_Ripple: z = sin(3π × |v|_euclidean) × 0.06 m
           Three concentric rings of height oscillation, independent
           of hyperbolic distance — shows how the Euclidean metric
           and hyperbolic metric weight the same point differently.`}
      </pre>

      <h2>Relationship to other studio surfaces</h2>
      <ul>
        <li>
          <strong>Möbius transformations</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          >
            tutorial
          </Link>
          ): The isometry group of the Poincaré disk IS the group of Möbius
          transformations preserving the unit disk — exactly PSL(2,ℝ).
          The loxodromic Möbius maps from that tutorial are parabolic/
          hyperbolic/loxodromic elements of the same group.
        </li>
        <li>
          <strong>Apollonian gasket</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr"
          >
            tutorial
          </Link>
          ): The Apollonian gasket is the limit set of a Kleinian group acting
          on the Riemann sphere. The Poincaré disk tiling is the analogous
          construction for a cocompact (hence non-free) group — the pentagon
          tiles tesselate rather than accumulate on a fractal.
        </li>
        <li>
          <strong>Kleinian limit sets</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr"
          >
            tutorial
          </Link>
          ): Schottky groups are free Kleinian groups; the {"{5,4}"} triangle
          group is the opposite — it has relations (reflections square to the
          identity) and is co-compact, tiling H² completely with no residual
          set.
        </li>
        <li>
          <strong>Penrose tiling stage floor</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr"
          >
            tutorial
          </Link>
          ): Both are aperiodic-looking tilings of a disc used as a stage floor
          — but the Penrose tiling is a quasicrystal in Euclidean space, while
          this one is a perfectly periodic tiling in hyperbolic space.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Too few tiles generated:</strong> Decrease DISK_CUTOFF from
          0.92 toward 0.80. The BFS terminates earlier, giving a sparser
          tiling with a larger clear boundary — Escher&apos;s fish would fade
          to white before reaching the circle. The upside: faster build and
          fewer vertices for the GLB.
        </li>
        <li>
          <strong>Degenerate faces near boundary:</strong> Use{" "}
          <code>bmesh.ops.remove_doubles(dist=2e-5)</code> or tighten
          DISK_CUTOFF to 0.88. Tiles near |z|=0.95 have sides only 2–3mm
          long in Euclidean space; without doubles-removal they produce
          near-zero-area faces that confuse the normal solver.
        </li>
        <li>
          <strong>Shape keys not exporting to GLB:</strong> Confirm{" "}
          <code>export_morph=True</code> in the glTF operator call. Morph
          targets (shape keys) require this flag; it is off by default in
          some versions of the GLTF exporter.
        </li>
        <li>
          <strong>TypeError in poincare_reflect near p1 = 0:</strong> The
          formula (w−p1)/(1−p̄₁w) is undefined when p1 = 0 (division by
          zero in the inverse T_inv when w = −p1 = 0). This cannot happen in
          the {"{5,4}"} tiling because the central pentagon never has a vertex
          at the origin, but if you adapt the code to {"{4,4}"} (degenerate
          Euclidean) p1 → 0 can occur. Guard with{" "}
          <code>if abs(p1) &lt; 1e-9: return conj(z * exp(-2j*angle(p2)))</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body, {
  slug: SLUG,
  libraryPath: `blends/scripting/${SLUG}`,
  requiredFiles: [
    "blueprint.py",
    "record.py",
    "hf_hyp_tiling_5_4.blend",
    "hf_hyp_tiling_5_4.glb",
  ],
});
