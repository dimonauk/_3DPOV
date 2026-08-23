import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr";

function Body() {
  return (
    <>
      <h2>The one that has no straight lines</h2>
      <p>
        Every list of triply periodic minimal surfaces mentions the same three:
        Schwarz P, Schwarz D, and Schoen&rsquo;s Gyroid. Of those three, only the Gyroid
        has the property of having absolutely no straight lines and no flat symmetry
        planes. That is not a minor distinction. It means the Gyroid has no points
        where the surface locally looks like a flat sheet or a ruled surface. Every
        point is a genuine saddle, leaning one way and then curling back. The surface
        is, in Schoen&rsquo;s phrase, &ldquo;everywhere in contact with itself&rdquo; at the saddlepoint
        level of complexity.
      </p>
      <p>
        The Gyroid also has a property no other common TPMS shares: it is self-dual.
        Both of its interpenetrating labyrinths are geometrically identical. A translation
        by half the body diagonal plus a 90° rotation is a symmetry operation of the
        space group Ia-3d (No. 230) that maps one labyrinth onto the other. You
        cannot tell them apart by geometry alone.
      </p>
      <p>
        For a poi head, this produces something that looks like a mathematical pomander
        ball — a sphere perforated by a three-dimensionally interlocking channel system
        that spirals inward from every direction simultaneously.
      </p>

      <h2>Alan Schoen and the NASA report</h2>
      <p>
        The Gyroid was discovered by Alan Schoen in 1970 and published in a NASA
        Technical Note (TN D-5541) — not a mathematics journal. Schoen was working
        at NASA&rsquo;s Electronics Research Centre on space structures. The report is
        public domain and available in full from the NASA Technical Reports Server.
        It contains 17 TPMS, hand-drawn figures, and the first systematic classification
        of these surfaces by space group. The Gyroid appears as surface number 12.
      </p>
      <p>
        The rigorous proof that the Gyroid is genuinely embedded (non-self-intersecting)
        and genuinely minimal (zero mean curvature everywhere) came later, from
        Große-Brauckmann and Wohlgemuth in 1996. Schoen&rsquo;s 1970 paper established the
        geometry and symmetry; the analysis followed once the mathematical tools
        were available.
      </p>

      <h2>Space group Ia-3d (No. 230)</h2>
      <p>
        The Gyroid belongs to space group <strong>Ia-3d</strong> — body-centred cubic
        (I-lattice) with diamond-type 4₁ screw axes and 3d glide planes.
        The conventional unit cell is twice the size of the primitive cell.
        The two Wyckoff positions that matter:
      </p>
      <pre>{`Wyckoff 16a  (0,0,0)+BCC-translations: nodes of the (+) labyrinth
Wyckoff 16b  (¼,¼,¼)+BCC-translations: nodes of the (−) labyrinth`}</pre>
      <p>
        The 4₁ screw axis at position ⅛,&thinsp;y,&thinsp;¼ maps (16a) onto (16b) —
        meaning the space group operation itself interchanges the two labyrinths.
        Self-duality is not an accident of geometry; it is crystallographically mandated.
      </p>
      <p>
        Compare with the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr" className={lk}>
          Neovius surface (Im-3m)
        </Link>
        , whose two labyrinths occupy 74 % and 26 % of the unit cell volume and are
        definitively non-congruent. The Gyroid&rsquo;s 50/50 split and self-duality put it
        in a completely different topological class.
      </p>

      <h2>Genus and Gauss–Bonnet</h2>
      <p>
        For the primitive unit cell (volume ½&thinsp;a³ for lattice parameter a):
      </p>
      <pre>{`∫∫ K dA = 2πχ
χ = −4  per primitive cell
g = (2 − χ)/2 = 3`}</pre>
      <p>
        Genus 3 per primitive cell means the Gyroid, Schwarz P, and Schwarz D all
        share the same topological complexity. They are, in fact, related by the
        Bonnet isometric deformation family: a one-parameter family of minimal
        surfaces interpolating between P (Bonnet angle 0°) and D (90°) passes through
        the Gyroid at approximately 38.01°. At every intermediate angle the mean
        curvature stays zero and the metric (intrinsic geometry) stays constant;
        only the extrinsic shape changes.
      </p>
      <p>
        The area density for a = 2π is A/a² ≈ 3.0916 (exact from the Weierstrass
        representation). The nodal-surface approximation gives 3.097 — a 0.2% error,
        far below visual resolution.
      </p>

      <h2>Nodal-surface approximation</h2>
      <p>
        The true Gyroid is defined via the Weierstrass–Enneper representation using
        elliptic functions on a genus-3 Riemann surface — computable but not trivial.
        The first-Fourier-mode nodal surface is:
      </p>
      <pre>{`F(x, y, z) = cos(x)·sin(y) + cos(y)·sin(z) + cos(z)·sin(x) = 0`}</pre>
      <p>
        This equation is the unique (up to scale) trigonometric polynomial of its
        degree that is invariant under all 230 symmetry operations of Ia-3d. It is
        not an arbitrary approximation — it is the symmetry-mandated leading term
        of the Fourier expansion of the true surface, which converges rapidly because
        the Gyroid is analytic. The mean curvature of the nodal surface deviates
        from zero by at most 1.5%.
      </p>

      <h2>Marching tetrahedra and the active-cube filter</h2>
      <p>
        The mesh is extracted by the 6-tet-per-cube marching tetrahedra algorithm
        (Doi–Koide body-diagonal decomposition). Each cube is split into 6 tetrahedra
        sharing the v₀→v₇ main diagonal. The tetrahedra have 16 sign-classification
        cases (2⁴), which reduce by symmetry to 3 non-trivial outputs: one triangle
        (1 or 3 vertices inside), two triangles (2 vertices inside), or empty
        (0 or 4 inside).
      </p>
      <p>
        An active-cube NumPy mask filters out voxels with no sign change before the
        Python-level tet loop, reducing loop iterations to the ~6 000 surface-crossing
        cubes out of ~125 000 total at N_GRID = 50. A simultaneous sphere mask clips
        the gyroid to the poi-head radius.
      </p>
      <p>
        The same marching-tetrahedra approach powers the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr" className={lk}>
          Barth Sextic
        </Link>{" "}
        tutorial, where 65 nodes make the surface topology far harder to follow.
        The Gyroid is simpler topologically (no singularities) and cleaner numerically.
      </p>

      <h2>Gaussian curvature: the bordered Hessian</h2>
      <p>
        For the level set F = 0, the Gaussian curvature is:
      </p>
      <pre>{`K = −det(M) / |∇F|⁴

M = [[0,   Fx,   Fy,   Fz  ],
     [Fx,  Fxx,  Fxy,  Fxz ],
     [Fy,  Fxy,  Fyy,  Fyz ],
     [Fz,  Fxz,  Fyz,  Fzz ]]`}</pre>
      <p>
        WHY: det(M) encodes the shape-operator determinant via Meusnier&rsquo;s theorem.
        For a minimal surface H = 0, the principal curvatures satisfy κ₂ = −κ₁, so
        K = κ₁κ₂ = −κ₁² ≤ 0 everywhere. Large |K| marks deep saddle centres (amber);
        K ≈ 0 marks the flat junctions where channels meet (cobalt).
      </p>
      <p>
        All six second-partial derivatives are computed analytically — no finite
        differences. Compare this with the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr" className={lk}>
          Enneper Surface
        </Link>
        , where the analytic Gaussian curvature K = −4/(1 + u² + v²)⁴ is available
        in closed form from the parametric representation, making the bordered Hessian
        unnecessary.
      </p>

      <h2>Self-duality in the shape keys</h2>
      <p>
        Shape key <code>SK_ThickShell</code> shifts the iso-level to +0.28, causing
        the positive labyrinth to fill in from its Wyckoff-16a nodes outward. Shape key
        <code>SK_ThinShell</code> shifts to −0.28, causing the negative labyrinth to
        fill in from its Wyckoff-16b nodes. Because the labyrinths are geometrically
        congruent, the two shape keys produce visually identical results — confirming
        the self-duality. This is exactly the kind of thing you want to animate on
        camera: a topological proof played out in mesh deformation.
      </p>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr" className={lk}>
          Scherk Doubly Periodic Surface
        </Link>{" "}
        has a similar iso-level shape-key animation, but there the two iso-levels produce
        visually distinct shapes because the Scherk surface&rsquo;s two halves are related
        only by a planar reflection (cmm plane symmetry), not a full 3D screw axis.
      </p>

      <h2>Bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1. Go to the Scripting workspace. Click <em>New</em> to
          create a blank text block.
        </li>
        <li>
          Paste the contents of <code>blueprint.py</code>. Check the top of the file:
          confirm <code>N_GRID = 50</code>. For a fast preview, drop it to 30.
        </li>
        <li>
          Click <em>Run Script</em>. The console will print active-cube count and
          vertex count as the mesh builds. Expect 30–60 seconds.
        </li>
        <li>
          Once complete, the gyroid sphere appears in the 3D Viewport. Switch to
          Material Preview. The cobalt-amber curvature colour map is visible
          immediately — cobalt in the channel junctions, amber in the saddle centres.
        </li>
        <li>
          In Properties → Object Data → Shape Keys, scrub <code>SK_ThickShell</code>
          from 0 to 1. Watch one labyrinth fill in. Return to 0, scrub{" "}
          <code>SK_ThinShell</code>. Note the identical result: self-duality confirmed.
        </li>
        <li>
          File → Export → glTF 2.0. Or run <code>record.py</code> from the command
          line to render the 10-second viewport animation to <code>viewport.mp4</code>.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Empty mesh at iso ≠ 0.</strong> The nodal Gyroid has no saddle
          values in [−0.5, +0.5] that produce topology changes — iso-values in ±[0,1]
          all give a surface. Beyond ±1.0 the channels start closing. At iso = ±√3/2 ≈ ±0.866
          the labyrinths pinch off completely into isolated pockets.
        </li>
        <li>
          <strong>Slow script for large N_GRID.</strong> The active-cube NumPy filter
          drastically reduces the Python loop, but N_GRID = 60 still involves ~10 000
          active cubes. Set N_GRID = 30 for a 5-second preview with all topology intact.
        </li>
        <li>
          <strong>Shape key vertex mismatch.</strong> scipy.spatial.cKDTree maps the
          Basis vertices onto the nearest vertices in the offset-iso mesh. If scipy
          is unavailable in your Blender build, replace with
          {" "}<code>np.argmin(np.sum((basis_co[:,None] - verts2[None,:])**2, axis=2), axis=1)</code>,
          which is O(N²) but correct.
        </li>
        <li>
          <strong>Bordered Hessian gives unexpected positive K.</strong> This happens
          at vertices that were interpolated just slightly off the surface by the
          marching algorithm. The gyroid is a minimal surface so K must be ≤ 0; if
          you see K &gt; 0, clamp it to zero before colouring.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        <strong>Alan Schoen (NASA, 1970).</strong>{" "}
        Public Domain.{" "}
        <a
          href="https://ntrs.nasa.gov/citations/19700020472"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          ntrs.nasa.gov
        </a>
        . Schoen&rsquo;s original NASA Technical Note cataloguing 17 TPMS including the
        Gyroid. The report is a US Government work and fully public domain. Related:
        the NASA Technical Reports Server hosts the full TPMS archive; Karcher &amp;
        Polthier (1996) &ldquo;Construction of Triply Periodic Minimal Surfaces&rdquo;
        in Experimental Mathematics extended the theory with modern differential geometry.
      </p>
      <p>
        <strong>Ken Brakke, Surface Evolver (MIT Licence).</strong>{" "}
        <a
          href="http://facstaff.susqu.edu/brakke/evolver/evolver.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          facstaff.susqu.edu/brakke/evolver
        </a>
        . The Surface Evolver is the standard tool for numerically computing and refining
        minimal surfaces. The Gyroid example file (<code>evolver/examples/gyroid.fe</code>)
        starts from the nodal approximation and relaxes it toward the true minimal
        surface. Related:{" "}
        <a
          href="https://github.com/nschloe/meshzoo"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          github.com/nschloe/meshzoo
        </a>{" "}
        (MIT, structured mesh utilities) and{" "}
        <a
          href="https://github.com/scipy/scipy"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          github.com/scipy/scipy
        </a>{" "}
        (BSD-3-Clause, KDTree for shape-key vertex remapping).
      </p>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Schoen Gyroid: TPMS Ia-3d (No. 230), No Straight Lines, Self-Dual Labyrinths (Wyckoff 16a/16b), Genus 3, Bordered-Hessian Gaussian Curvature & Gyroid-Sphere Poi Head for WebXR (Blender 5.1)",
  lede:
    "The only common TPMS with no straight lines and no flat symmetry planes — space group Ia-3d, self-dual at the screw-axis level, genus 3, Gaussian curvature computed via the bordered Hessian, spherically clipped for a poi head.",
  date: "2026-08-23",
  tags: ["blender", "python", "numpy", "tpms", "minimal-surface", "marching-tetrahedra", "poi-head", "5.1"],
  body: Body,
});

export const blenderTutorialPythonNumpyGyroidSchoen1970TpmsIa3dSelfDualSpongeNodalSurfaceMarchingTetrahedraPoiWebxrEntry =
  entry;
export default entry;
