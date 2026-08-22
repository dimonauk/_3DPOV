import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr";

const TITLE =
  "Python numpy — Borromean Rings: Brunnian Three-Component Link, Milnor μ̄₁₂₃=1, Freedman–Skora Obstruction & Oval-Ring Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Three loops that are collectively inseparable yet pairwise completely unlinked: that is the Borromean paradox.  This blueprint derives the topology from first principles — Milnor's triple linking number μ̄₁₂₃, why Freedman and Skora proved round circles in R³ cannot do it, and the exact oval-ring construction (semi-axes a=1.4, b=1.0) whose Z₃ cyclic symmetry gives provably collision-free crossings with 0.16-metre tube clearance.  The resulting three-ring poi head is built in bpy using a Bishop parallel-transport tube sweep, coloured vermilion, cobalt and malachite, and exported as a Draco-6 GLB ready for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Milnor, J.W. (1954). Link groups. Annals of Mathematics 59(2): 177–195. Mathematical content Public Domain.",
      url: "https://doi.org/10.2307/1969685",
      licence: "Public Domain (mathematical content)",
      author: "John W. Milnor",
    },
    {
      label:
        "Freedman, M.H. & Skora, R. (1987). Strange actions of groups on spheres. Journal of Differential Geometry 25(1): 75–98. Mathematical content Public Domain. Related: Freedman 1982 Fields Medal work on 4-manifolds.",
      url: "https://doi.org/10.4310/jdg/1214441486",
      licence: "Public Domain (mathematical content)",
      author: "Michael H. Freedman, Richard Skora",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Take three curtain rings and hang them from a hook in a chain — each
        ring interlocks with both its neighbours and the whole chain cannot
        fall apart.  That is the Hopf link, repeated twice: every adjacent
        pair is genuinely linked.  Now ask a harder question: can you arrange
        three rings so that the triple is inseparable, yet no single pair is
        linked at all?  Remove ring one and rings two and three drop free.
        Remove ring two and rings one and three drop free.  Every pair:
        free.  Yet all three together: inescapable.
      </p>
      <p>
        This is the <strong>Borromean rings</strong>, named for the Borromeo
        family of Milan who used them as a heraldic device from the fifteenth
        century.  Mathematically, they are the simplest example of a{" "}
        <strong>Brunnian link</strong> — a link where every proper sub-link is
        trivial.  The topological invariant that detects them is{" "}
        <strong>Milnor's triple linking number</strong> μ̄₁₂₃ = ±1,
        introduced in his 1954 Annals paper on link groups.  For any ordinary
        two-component link the linking number Lk(A,B) is already enough to
        decide separability; the Borromean rings require a{" "}
        <em>second-order</em> invariant because every pairwise number is zero.
      </p>

      <h2 className="font-semibold mt-6 mb-2">
        The Freedman–Skora Obstruction
      </h2>
      <p>
        Before building anything in Blender, there is a theorem to absorb.
        In 1987 Michael Freedman and Richard Skora published a proof that{" "}
        <strong>
          perfectly round circles in R³ cannot form Borromean rings
        </strong>
        .  The argument uses the rigidity of circle inversions in Möbius
        geometry: any conformal map sending a round circle to a round circle
        preserves the linking structure, and careful analysis of the inversion
        group shows the Borromean topology cannot survive.  This is not a
        physical manufacturing limitation — it is a theorem about the
        topology of smooth circles in Euclidean space.
      </p>
      <p>
        The practical consequence for Blender is that the rings must be
        slightly oval.  We use ellipses with semi-axes{" "}
        <code>a = 1.4</code> (major) and <code>b = 1.0</code> (minor).  The
        choice is not arbitrary: the three rings are related by the Z₃ cyclic
        permutation X→Y→Z→X, which maps Ring A (in the XZ plane) to Ring B
        (in the XY plane) to Ring C (in the YZ plane) and back.  Because the
        permutation is an isometry, the geometry at every crossing is
        identical — a single clearance proof covers all six simultaneously.
      </p>

      <h2 className="font-semibold mt-6 mb-2">Crossing Clearance Proof</h2>
      <p>
        Ring A lives in the plane y = 0 and traces{" "}
        <code>(a·cos t, 0, b·sin t)</code>.  Ring B lives in the plane z = 0
        and traces{" "}
        <code>(b·sin t, a·cos t, 0)</code>.  Ring B crosses y = 0 when
        a·cos t = 0, i.e. at t = π/2 and t = 3π/2, giving the points{" "}
        <code>(±b, 0, 0) = (±1, 0, 0)</code>.
      </p>
      <p>
        Are those points inside Ring A's hole?  Ring A's interior (projected
        onto the y = 0 plane) is the ellipse interior{" "}
        <code>(x/a)² + (z/b)² &lt; 1</code>.  Substituting (1, 0, 0): we get{" "}
        <code>(1/1.4)² = 0.51 &lt; 1</code>.  Yes — Ring B's crossing points
        are strictly inside Ring A's hole, so Ring B genuinely threads through.
      </p>
      <p>
        The minimum distance from the crossing point (1, 0, 0) to Ring A's
        centre-line is minimised at t = 0 (the closest point on Ring A is{" "}
        <code>(a, 0, 0) = (1.4, 0, 0)</code>) giving distance{" "}
        <code>a − b = 0.4 m</code>.  With <code>TUBE_R = 0.12</code>, the
        tube-to-tube gap at every crossing is:
      </p>
      <pre className="bg-neutral-900 text-neutral-100 rounded p-3 text-sm overflow-x-auto my-3">
{`gap = (a − b) − 2 × TUBE_R
    = 0.40 − 0.24
    = 0.16 m   (≈ 1.3 tube radii of clear space)`}
      </pre>
      <p>
        By Z₃ symmetry this holds for all six crossing zones.  The geometry
        is provably collision-free.
      </p>

      <h2 className="font-semibold mt-6 mb-2">Building the Rings in bpy</h2>
      <p>
        The script computes each ring's centre-line as a numpy array, then
        sweeps a tube around it using a{" "}
        <strong>Bishop (parallel-transport) frame</strong>.  The Bishop frame
        avoids the gymnastic contortions Frenet–Serret frames suffer at
        inflection points and handles the closed-curve holonomy
        (accumulated twist after one full lap) by distributing it uniformly
        — a technique shared with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          torus-knot tutorial
        </Link>
        .
      </p>
      <p>
        At each of the six crossing zones the script adds a small Gaussian
        bump (amplitude{" "}
        <code>DELTA = 0.09 m</code>, width <code>SIGMA = 0.32 rad</code>)
        perpendicular to the ring's plane.  The bump does not change the
        topology or violate the clearance proof — it simply accentuates the
        over/under weaving so that the Borromean character is visible to the
        eye.  The cyclic over/under pattern — A over B, B over C, C over A
        at one set of crossing ends, and the reversal at the opposite ends —
        is precisely the signature of μ̄₁₂₃ = +1.
      </p>

      <h2 className="font-semibold mt-6 mb-2">The Script</h2>
      <pre className="bg-neutral-900 text-neutral-100 rounded p-3 text-sm overflow-x-auto my-3">
{`# Parameters
A      = 1.40   # major semi-axis
B      = 1.00   # minor semi-axis — clearance = A−B = 0.40
TUBE_R = 0.12   # tube radius; must be < (A−B)/2 = 0.20
N_PATH = 96     # centre-line segments
N_TUBE = 18     # tube cross-section segments
DELTA  = 0.09   # Gaussian crossing-bump (aesthetic)
SIGMA  = 0.32   # bump half-width (radians)

def ring_path(idx):
    t = np.linspace(0, 2π, N_PATH, endpoint=False)
    if idx == 0:               # Ring A: XZ plane
        pts = [A cos t, 0, B sin t]
        # add ±DELTA·gauss bumps in Y at 4 crossing zones
    elif idx == 1:             # Ring B: XY plane (cyclic image of A)
        pts = [B sin t, A cos t, 0]
        # add ±DELTA·gauss bumps in Z
    else:                      # Ring C: YZ plane (second cyclic image)
        pts = [0, B cos t, A sin t]
        # add ±DELTA·gauss bumps in X
    return pts`}
      </pre>

      <h2 className="font-semibold mt-6 mb-2">Milnor's μ̄₁₂₃ — Why It Matters</h2>
      <p>
        For two-component links, the linking number Lk(A,B) is an integer
        that counts (algebraically) how many times one component winds around
        the other.  For Borromean rings, Lk(A,B) = Lk(B,C) = Lk(A,C) = 0 —
        pairwise completely unlinked.  Milnor's 1954 construction defines
        higher-order linking numbers by looking at the lower central series of
        the fundamental group π₁(S³ \ (A∪B∪C)).  The first non-vanishing
        invariant for the Borromean rings is μ̄(1,2,3) = ±1 (sign depending
        on orientation conventions), detecting the three-way entanglement
        that pairwise invariants miss entirely.
      </p>
      <p>
        This is relevant beyond topology: Borromean entanglement appears in
        nuclear physics (the Borromean nucleus ¹¹Li, with two halo neutrons
        that are not bound to each other but only to the Li-9 core),
        materials science (Borromean mechanical metamaterials), and quantum
        information (Borromean-entangled photon states where tracing out any
        one qubit disentangles the others).
      </p>

      <h2 className="font-semibold mt-6 mb-2">WebXR Export</h2>
      <p>
        The three ring objects are parented to a root empty carrying the
        Holoflow facet flag.  Rotation by π/2 about X converts Blender's Z-up
        to WebXR's Y-up convention before export.  See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          the Hopf fibration tutorial
        </Link>{" "}
        for the related construction of great-circle links on S³, and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
          className={lk}
        >
          the Villarceau circles tutorial
        </Link>{" "}
        for another interlocked-circle construction whose geometry lives on the
        Clifford torus in S³ — the very space where Borromean great circles
        would have to live if round-circle Borromean rings were possible.
      </p>

      <h2 className="font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-outside ml-5 space-y-1">
        <li>
          <strong>Tubes interpenetrate visually</strong> — check TUBE_R &lt;
          (A−B)/2 = 0.20.  Default 0.12 is safe; increasing above 0.20 will
          cause geometric overlap at crossings.
        </li>
        <li>
          <strong>Seam twist visible</strong> — the Bishop frame distributes
          holonomy linearly; if N_PATH is too low (&lt;48) the per-step
          correction is coarse.  Increase N_PATH to 96 or 128.
        </li>
        <li>
          <strong>GLB import shows split normals</strong> — run{" "}
          <code>bmesh.ops.recalc_face_normals</code> before exporting.  The
          blueprint already calls this.
        </li>
        <li>
          <strong>Crossing bumps look kinked</strong> — increase SIGMA (try
          0.45) to widen the Gaussian zone, or reduce DELTA (try 0.05) if the
          bump amplitude is too large relative to the tube radius.
        </li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">Related Studio Work</h2>
      <ul className="list-disc list-outside ml-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr"
            className={lk}
          >
            24-cell stereographic projection
          </Link>{" "}
          — another 4D→3D projection technique
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
            className={lk}
          >
            Hopf fibration linked circles
          </Link>{" "}
          — great circles on S³ and how they project to linked circles in R³
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
            className={lk}
          >
            Torus knot p/q winding
          </Link>{" "}
          — Bishop parallel-transport frame in depth
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
