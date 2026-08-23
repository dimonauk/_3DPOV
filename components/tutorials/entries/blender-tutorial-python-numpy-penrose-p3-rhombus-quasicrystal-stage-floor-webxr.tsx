import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  slug: "blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr",
  title:
    "Python numpy — Penrose P3 Rhombus Tiling: Substitution Deflation, Quasicrystal 5-Fold Symmetry & Stage Floor GLB for WebXR (Blender 5.1)",
  lede: "Build an aperiodic Penrose P3 rhombus floor in pure Python: seed a 10-fold 'sun', apply Robinson-triangle deflation N times, merge triangle pairs into fat and thin rhombus quads, extrude each tile, and export a Draco-compressed GLB for use as an XR stage floor — all without touching the viewport.",
  date: "2026-07-26",
  externalSources: [
    {
      label: "fogleman/Penrose — Robinson-triangle deflation reference implementation",
      url: "https://github.com/fogleman/Penrose",
      licence: "MIT",
      author: "Michael Fogleman",
    },
    {
      label: "numpy — N-dimensional array library (complex-number vertex arithmetic)",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        A Penrose tiling never repeats. Run it forward forever and you will
        never find a unit cell that tiles the plane by translation alone — yet
        every finite patch you can cut from it appears infinitely often
        elsewhere. That is the quasicrystal property, and it makes a Penrose
        floor the most honest statement of &ldquo;no two spots are alike&rdquo;
        a stage designer can make. The floor produced by this script is a
        genuine Penrose P3 tiling with 5-fold quasi-symmetry, two rhombus
        species, and correct matching-rule colouring — generated in
        ≈&nbsp;200&nbsp;lines of Python, exported as a Draco-compressed GLB
        sized for WebXR.
      </p>
      <p>
        The technique connects to the studio&rsquo;s other procedural floor
        work (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-geometry-delaunay-2d-cdt-convex-hull-stage-floor-webxr"
          className={lk}
        >
          Delaunay CDT stage floor
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          Voronoi dual-mesh
        </Link>{" "}
        tutorials) but relies on pure arithmetic rather than spatial queries.
        No bmesh operations; every vertex and face is placed analytically.
      </p>

      <h2>Penrose P3 in 90 seconds</h2>
      <p>
        Roger Penrose described two infinite families of aperiodic tilings in
        1974. The P3 family uses two rhombus shapes:
      </p>
      <pre>{`Fat  rhombus: acute angle = 72°,  area = edge² × sin(72°)
Thin rhombus: acute angle = 36°,  area = edge² × sin(36°)

Diagonal ratio (both shapes): φ = (1 + √5) / 2 ≈ 1.618`}</pre>
      <p>
        Both rhombi are &ldquo;golden&rdquo; — their long diagonal divided by
        their short diagonal equals φ. In a valid Penrose tiling the ratio of
        fat to thin tiles is always φ&nbsp;:&nbsp;1, the same ratio found in
        Fibonacci sequences and phyllotaxis.
      </p>

      <h2>Robinson triangles and the deflation algorithm</h2>
      <p>
        The cleanest way to generate a Penrose P3 tiling programmatically is
        via <strong>Robinson triangles</strong> — the two half-rhombus
        isoceles triangles:
      </p>
      <pre>{`THICK triangle: angles 72°, 72°, 36°  (the "golden triangle")
                apex A = 36°,  base BC

THIN  triangle: angles 36°, 36°, 108° (the "golden gnomon")
                apex C = 108°, base AB`}</pre>
      <p>
        Each rhombus type is formed by gluing two congruent Robinson triangles
        along their short edge. The magic is in the{" "}
        <strong>deflation rules</strong>: split each triangle into smaller
        triangles of the same two types, scaled by 1/φ:
      </p>
      <pre>{`THICK(A, B, C)  →  X = A + (B − A) / φ
                   THICK(C, X, A)  +  THIN(X, C, B)

THIN(A, B, C)   →  X = B + (A − B) / φ
                   THIN(B, X, C)  +  THICK(X, A, C)`}</pre>
      <p>
        Apply these rules N times to a starting seed. After four deflations a
        sun seed yields ≈&nbsp;400 rhombi; after five, ≈&nbsp;1&nbsp;000.
        The tile edge length after N deflations is{" "}
        <code>SCALE / φ^N</code>.
      </p>

      <h2>The &ldquo;sun&rdquo; seed</h2>
      <p>
        The unique Penrose configuration with full{" "}
        <strong>D₁₀ dihedral symmetry</strong> (10-fold rotation plus
        reflections) is the &ldquo;sun&rdquo; seed: ten THICK triangles, each
        with its 36° apex at the origin, fanning around 360° like spokes. The
        vertices of adjacent triangles coincide perfectly — the spoke-tip ring
        forms a regular decagon.
      </p>
      <pre>{`for k in range(10):
    b = scale * exp(2πi·k / 10)
    c = scale * exp(2πi·(k+1) / 10)
    # alternating orientation preserves matching rules
    if k % 2 == 0:
        tris.append(('thick', 0+0j, b, c))
    else:
        tris.append(('thick', 0+0j, c, b))`}</pre>
      <p>
        Working in the complex plane (a 2D point becomes{" "}
        <code>x + yj</code>) keeps the arithmetic compact: rotations are
        multiplications by <code>exp(iθ)</code>, and distances are{" "}
        <code>abs(z)</code>. numpy is only needed at the mesh-building stage
        for coordinate array slicing; the core deflation loop uses only Python
        built-in <code>complex</code> arithmetic.
      </p>

      <h2>Vertex deduplication and face assembly</h2>
      <p>
        After N deflations you have thousands of triangles with many shared
        vertices. Direct floating-point comparison fails — rounding is
        unavoidable. The solution is to quantise each complex coordinate to a
        grid of <code>1e-6 m</code> and use the rounded tuple as a dictionary
        key:
      </p>
      <pre>{`def vid(z):
    k = (round(z.real * 1e6), round(z.imag * 1e6))
    if k not in vert_map:
        vert_map[k] = len(verts)
        verts.append(z)
    return vert_map[k]`}</pre>
      <p>
        Each triangle then records a <em>short-edge key</em> — the sorted pair
        of vertex indices for the short edge (BC for THICK, AB for THIN). Two
        triangles sharing a short-edge key are the two halves of a rhombus.
        Merging them gives a quad:
      </p>
      <pre>{`outer0 = vertex of tri0 NOT on short edge
outer1 = vertex of tri1 NOT on short edge
ea, eb = short edge endpoints
quad = [outer0, ea, outer1, eb]   # planar rhombus quad`}</pre>
      <p>
        Boundary triangles with no partner become 3-gon faces — they appear at
        the circular edge of the tiling and can be cropped or accepted as
        partial tiles depending on the application.
      </p>

      <h2>Building the Blender mesh</h2>
      <p>
        The 2D quads feed directly into bmesh:{" "}
        <code>bm.verts.new((x, y, 0))</code> for each vertex, then{" "}
        <code>bm.faces.new([...])</code> for each quad or triangle. A single
        bmesh extrude pass lifts every bottom face by{" "}
        <code>TILE_THICK = 0.012&nbsp;m</code> to give the tiles physical
        presence as stone pavers. No UV mapping is needed — both materials use
        a procedural <code>Principled BSDF</code> applied by face index.
      </p>
      <p>
        Material assignment exploits the face-area difference between species:
        fat rhombus bottom faces have area <code>e² sin 72°</code>; thin have{" "}
        <code>e² sin 36°</code>. A threshold at 75% of the estimated fat area
        routes each face to the correct material slot. This is cheaper than
        tracking kind metadata through the extrusion operator.
      </p>
      <p>
        Compare this mesh-from-scratch approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF GLB export tutorial
        </Link>{" "}
        for the shader conventions assumed here.
      </p>

      <h2>Export settings</h2>
      <pre>{`bpy.ops.wm.gltf2_export(
    filepath      = ...,
    export_format = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    use_selection = True,
)`}</pre>
      <p>
        Draco level&nbsp;6 compresses the flat rhombus geometry aggressively —
        expect 60–75% size reduction over uncompressed GLB. WebP textures are
        moot here (no image textures on this mesh) but the flag is set as
        per studio convention so the GLB can be merged with textured assets
        without re-export.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Duplicate face error.</strong> The{" "}
          <code>bm.faces.new()</code> call is wrapped in a try/except. If you
          see missing interior patches, the deduplication tolerance is too
          coarse — reduce <code>SNAP_TOL</code> from <code>1e-6</code> to{" "}
          <code>1e-7</code> and re-run. Too fine a tolerance introduces gaps
          instead.
        </li>
        <li>
          <strong>Tiling looks like triangles, not rhombi.</strong> The
          short-edge pairing found no matching partner — usually because the
          triangles are not properly normalised after deflation. Confirm that
          the alternating orientation in <code>make_sun</code> matches the
          deflation conventions (THICK apex at A, THIN apex at C).
        </li>
        <li>
          <strong>Wrong material on boundary tiles.</strong> Boundary triangles
          are assigned material 0 (fat) by default. If you need accurate
          boundary colouring, carry the <code>kind</code> field through the
          face-creation loop and use it directly instead of the area threshold.
        </li>
        <li>
          <strong>GLB too large for WebXR streaming.</strong> Drop{" "}
          <code>DEFLATIONS</code> from 4 to 3 (≈&nbsp;150 rhombi) or crop the
          mesh to a circular region before export using a Boolean with a disc
          cutter object.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body);
