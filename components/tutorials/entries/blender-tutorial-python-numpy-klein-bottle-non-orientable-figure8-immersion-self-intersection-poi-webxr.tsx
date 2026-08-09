import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-klein-bottle-non-orientable-figure8-immersion-self-intersection-poi-webxr";

const TITLE =
  "Python numpy — Klein Bottle: Non-Orientable Surface Immersed in ℝ³, Figure-8 Parameterisation, Self-Intersection Seam Detection & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A Klein bottle is a closed surface with no consistent inside or outside — non-orientable, like a Möbius strip without a boundary.  In ℝ⁴ it embeds cleanly; in ℝ³ every immersion must self-intersect.  This blueprint builds the figure-8 immersion by rotating the tube frame through π/2 per loop via a half-angle u/2 substitution, detects the self-intersection circle via spatial proximity on the vertex grid, marks it with an orange emission seam, and morphs between three distinct immersions — figure-8, saddled (3v/2 cross-section), and classical pinched-neck — via Blender shape keys.  The result exports as a WebXR-ready GLB poi head with Draco level-6 compression.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Apéry, François (1994). Models of the Real Projective Plane. Vieweg. ISBN 978-3-322-89569-1. Public Domain (mathematical content).",
      url: "https://link.springer.com/book/9783322895691",
      licence: "Public Domain",
      author: "François Apéry",
    },
    {
      label:
        "Weeks, Jeffrey (2002). The Shape of Space. CRC Press. CC0 conceptual description. geometrygames.org.",
      url: "https://www.geometrygames.org/",
      licence: "CC0",
      author: "Jeffrey Weeks",
    },
    {
      label: "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
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
        The Klein bottle sits at the intersection of differential topology and
        visual mathematics.  It is a closed surface — every path eventually
        returns to its start — but unlike a sphere or a torus, it carries no
        consistent notion of "inside" versus "outside".  Slide an ant along the
        surface and, after one trip around the long axis, it arrives back where
        it started but on the &ldquo;other side&rdquo; — a side that, for a
        Klein bottle, does not exist as a separate thing.
      </p>

      <h2>Topology: what makes it non-orientable</h2>
      <p>
        Orientability is the question of whether you can assign a consistent
        normal vector to every point on a surface.  For a sphere, yes: always
        point outward.  For a torus, yes: always point away from the tube
        interior.  For a Klein bottle, no: any consistent choice of normal
        somewhere forces a contradiction somewhere else.
      </p>
      <p>
        The Euler characteristic χ = V − E + F of the Klein bottle equals 0,
        the same as a torus — but the Klein bottle has no fundamental class in
        integer homology (H₂(ℤ) = 0), whereas the torus has H₂(ℤ) = ℤ.  Over
        𝔽₂ coefficients, H₂ = 𝔽₂ appears, reflecting the mod-2 cycle that
        winds the non-orientable direction.  This makes the Klein bottle an
        example where homology with different coefficient rings genuinely
        differs.
      </p>

      <h2>From Möbius strip to Klein bottle</h2>
      <p>
        The Möbius strip is a non-orientable surface <em>with</em> a boundary
        — one circular edge.  Glue two Möbius strips along their shared
        boundary and you obtain a Klein bottle.  This is not just a mnemonic:
        it means the Klein bottle can be decomposed into two Möbius-strip
        patches, each covering half the surface.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          className={lk}
        >
          Möbius Strip tutorial
        </Link>{" "}
        for the single-sided surface construction that is the building block
        here.
      </p>

      <h2>The figure-8 parameterisation</h2>
      <p>
        The parameterisation used in this blueprint is sometimes called the
        figure-8 (or folded-torus) immersion.  It differs from the classical
        bottle shape in that the self-intersection forms a clean great-circle
        rather than a sharp pinch:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`u, v ∈ [0, 2π]

half-angle frame components:
  cos_u2 = cos(u / 2)
  sin_u2 = sin(u / 2)

radial(u,v) = R + r · (cos(v) · cos_u2  −  sin(2v) · sin_u2)

x = radial · cos(u)  −  r · sin(2v) · sin(u)
y = radial · sin(u)  +  r · sin(2v) · cos(u)
z = r · (cos(v) · sin_u2  +  sin(2v) · cos_u2)`}
      </pre>
      <p>
        The <code>sin(2v)</code> (double-frequency) term is the entire secret.
        Without it, the frame just wraps a circular tube around the spine and
        you get a torus.  With it, the cross-section is a figure-8, and the
        half-twist introduced by{" "}
        <code>u/2</code> ensures that after one full loop the figure-8 has
        rotated by π — reversing the identification of the two lobes.  This
        exactly matches the Klein bottle identification{" "}
        <code>(u, v) ~ (u + 2π, −v)</code> that distinguishes it from the torus
        identification <code>(u, v) ~ (u + 2π, v)</code>.
      </p>

      <h2>Why the frame rotates by π, not 2π</h2>
      <p>
        A torus uses a frame that rotates by 2π (a full turn) over one loop,
        returning to itself.  A Klein bottle uses a frame that rotates by π (a
        half-turn): the frame at u = 2π is the negative of the frame at u = 0,
        which flips the cross-section.  The half-angle substitution{" "}
        <code>u/2</code> achieves exactly this: cos(2π/2) = cos(π) = −1, so
        the e₁ component reverses sign.  In homological terms this is the same
        twist that makes a Möbius strip single-sided.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          Torus Knot parallel-transport tube
        </Link>{" "}
        — there, the Bishop frame is explicitly parallel-transported to avoid
        unnecessary twist.  Here, the twist is the point: we want the frame to
        rotate by exactly π, so we encode it deliberately via the half-angle.
      </p>

      <h2>Self-intersection detection</h2>
      <p>
        The self-intersection locus in the figure-8 Klein bottle is a circle
        at roughly u ≈ π.  Analytically it is the set of (u, v) pairs where
        the surface formula gives the same (x, y, z) for distinct parameter
        values.  In the blueprint, this is detected computationally:
      </p>
      <ol>
        <li>
          Restrict to the "neck" region u ∈ [3π/8, 5π/8] — the rows most
          likely to self-intersect.
        </li>
        <li>
          Compare each neck row against all rows outside it (u &lt; 3π/8).
        </li>
        <li>
          Flag any vertex within <code>SEAM_THRESH</code> (default 0.05
          pre-scale units) of a topologically distant vertex as a seam vertex.
        </li>
        <li>
          Assign the emission material to any polygon whose majority of
          vertices are seam-flagged.
        </li>
      </ol>
      <p>
        The result is an orange glowing seam exactly where the tube passes
        through itself — visually marking the self-intersection that is
        topologically inevitable for this surface.
      </p>

      <h2>The three immersions as shape keys</h2>
      <p>
        Three distinct immersions of the Klein bottle in ℝ³ are provided as
        shape keys:
      </p>
      <ul>
        <li>
          <strong>Basis (figure-8):</strong> the canonical figure-8 cross-
          section, clean self-intersection circle near u = π.
        </li>
        <li>
          <strong>saddled:</strong> uses <code>sin(3v/2)</code> instead of{" "}
          <code>sin(2v)</code>.  The 3/2 frequency creates a three-pronged
          saddle cross-section with a more open self-intersection.  Still a
          valid Klein bottle immersion (same fundamental group) but with
          different local geometry.
        </li>
        <li>
          <strong>pinched:</strong> the classical bottle silhouette — tube
          radius shrinks to near-zero at the neck, then the neck passes back
          through the bottle wall.  Most recognisable to the public; most
          difficult to explain topologically because the pinch obscures the
          frame rotation.
        </li>
      </ul>
      <p>
        Morphing between these via shape keys lets you communicate the same
        underlying topology through three different geometric presentations —
        useful for teaching that "the Klein bottle" is a topological class of
        surfaces, not a single geometric object.
      </p>

      <h2>Connection to the Hopf fibration</h2>
      <p>
        Lawson proved in 1970 that the Klein bottle embeds cleanly in S³
        (the 3-sphere), which the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          Hopf Fibration tutorial
        </Link>{" "}
        builds geometrically.  Specifically, the Lawson Klein bottle is the
        quotient of a Clifford torus by the antipodal identification on one
        factor — a different object from the figure-8 immersion in ℝ³ but
        sharing the same fundamental group π₁ = ℤ ⋊ ℤ.  The stereographic
        projection of the Lawson Klein bottle into ℝ³ gives yet another
        immersion with different self-intersection structure.
      </p>

      <h2>Bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1 → <strong>Scripting</strong> workspace → New.
        </li>
        <li>
          Paste or open <code>blueprint.py</code>.  Check the parameter block
          at the top: <code>U_SEGS</code>, <code>V_SEGS</code>,{" "}
          <code>R_MAJOR</code>, <code>R_TUBE</code>.  Default values produce a
          poi head roughly 0.64 m in diameter.
        </li>
        <li>
          Press <strong>Run Script</strong> (▶).  The Python console prints
          vertex count, quad count, and seam vertex count.
        </li>
        <li>
          Switch to <strong>3D Viewport</strong>.  Press Numpad 5 for
          orthographic, then Numpad 1 for front view.  Rotate to spot the
          orange seam.
        </li>
        <li>
          In <em>Properties → Object Data → Shape Keys</em>, drag the
          "saddled" value from 0 → 1.  The figure-8 cross-section opens into
          a three-pronged saddle.
        </li>
        <li>
          Drag "saddled" back to 0, then drag "pinched" to 1.  The neck forms
          and passes through the body wall.
        </li>
        <li>
          Return both keys to 0.  Run <code>record.py</code> (open it in a
          second Text block, press ▶) to render the 360° orbit animation.
        </li>
        <li>
          The GLB exports automatically at end of <code>blueprint.py</code>.
          Check it via{" "}
          <em>File → Import → glTF 2.0</em> in a fresh Blender window.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No seam visible:</strong> increase{" "}
          <code>SEAM_THRESH</code> from 0.05 to 0.08 and re-run.  The seam
          width depends on mesh density; if <code>U_SEGS</code> is low, the
          proximity detection can miss narrow crossings.
        </li>
        <li>
          <strong>Mesh looks wrong at the seam:</strong> the mesh is NOT
          topologically closed at the u-seam — it is a self-intersecting
          surface, not a watertight solid.  This is intentional.  If you need
          a watertight version for 3D printing, use the Remesh modifier (voxel
          mode) after running the blueprint.
        </li>
        <li>
          <strong>GLB export fails:</strong> ensure the GLB path is relative
          (&lt;code&gt;//filename.glb&lt;/code&gt;) and the file has been saved
          at least once.  Or change to an absolute path.
        </li>
        <li>
          <strong>Shape key from_pydata mismatch:</strong> the mesh vertex
          count must match the shape key vertex count exactly.  If you change{" "}
          <code>U_SEGS</code> or <code>V_SEGS</code> mid-run, call{" "}
          <code>clear_scene()</code> first.
        </li>
      </ul>

      <h2>Why the poi head?</h2>
      <p>
        The Klein bottle is naturally compact — it has no boundary and no
        preferred "up" direction — which makes it an ideal poi head geometry.
        The self-intersection seam doubles as a visual focal point during
        spinning: the glowing orange circle appears to hover inside the surface
        as the head rotates, exploiting the visual paradox of a surface that
        has no inside.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-klein-bottle-non-orientable-figure8-immersion-self-intersection-poi-webxr",
});
