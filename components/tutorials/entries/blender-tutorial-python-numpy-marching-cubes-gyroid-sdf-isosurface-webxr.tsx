import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  slug: "blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr",
  title:
    "Python numpy — Surface Nets: Gyroid SDF Isosurface, Trilinear Edge Interpolation & Watertight GLB for WebXR + 3D Print (Blender 5.1)",
  lede: "Extract the gyroid triply-periodic minimal surface from a signed-distance field using the Surface Nets algorithm: evaluate the SDF on a 48³ numpy grid, place one vertex per surface cell at the centroid of its active edge-crossings, stitch adjacent cells into quads along sign-change edges, then triangulate and export a Draco-compressed GLB — all without a 256-case Marching Cubes lookup table.",
  date: "2026-07-26",
  externalSources: [
    {
      label:
        "Gibson, S.F.F. (1998) — 'Constrained Elastic Surface Nets', MERL Technical Report TR98-19",
      url: "https://www.merl.com/publications/TR98-19.pdf",
      licence: "Academic free-use",
      author: "Sarah F. Gibson / Mitsubishi Electric Research Laboratories",
    },
    {
      label:
        "scikit-image — skimage.measure.marching_cubes — BSD-3-Clause reference implementation",
      url: "https://github.com/scikit-image/scikit-image",
      licence: "BSD-3-Clause",
      author: "scikit-image contributors",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Why the gyroid, and why Surface Nets?</h2>
      <p>
        The gyroid is defined by the implicit equation{" "}
        <code>sin x cos y + sin y cos z + sin z cos x = 0</code>. It is a
        triply-periodic minimal surface (TPMS): it divides all of 3-space into
        two congruent, non-intersecting channels and has zero mean curvature at
        every point. For the studio it is doubly useful — as a WebXR prop its
        lattice silhouette reads well in VR, and as an MSLA 3D-print infill
        pattern it maximises strength-to-material ratio without support
        structures.
      </p>
      <p>
        Classical Marching Cubes (Lorensen &amp; Cline 1987) produces the same
        surface but requires a 256-case lookup table (4 KB of hand-crafted
        integer data) to handle every possible sign pattern across an 8-corner
        cell. Surface Nets (Gibson 1998) sidesteps that table entirely: it
        places exactly one vertex per surface cell and connects neighbouring
        cells by quads. The mesh quality on smooth SDFs like the gyroid is
        comparable to MC while the code is dramatically shorter and easier to
        audit.
      </p>

      <h2>Step 1 — Vectorised SDF evaluation</h2>
      <p>
        The field is evaluated in a single numpy expression across all{" "}
        <code>N³</code> grid points simultaneously:
      </p>
      <pre>{`N        = 48
HALF_BOX = 1.5 * math.pi   # metres — 1.5 gyroid periods
coords   = np.linspace(-HALF_BOX, HALF_BOX, N, dtype=np.float32)
X, Y, Z  = np.meshgrid(coords, coords, coords, indexing='ij')
F        = np.sin(X)*np.cos(Y) + np.sin(Y)*np.cos(Z) + np.sin(Z)*np.cos(X)
INSIDE   = F >= 0.0`}</pre>
      <p>
        With <code>indexing='ij'</code>, <code>F[i,j,k]</code> maps cleanly to
        world position <code>(coords[i], coords[j], coords[k])</code> — crucial
        for the per-cell loops later. The whole array occupies about 11 MB at
        float32; Blender's bundled Python handles this without configuration.
      </p>

      <h2>Step 2 — Surface cell detection</h2>
      <p>
        A cell at <code>(i,j,k)</code> is a surface cell if it has any
        sign-change neighbour. We detect this by comparing shifted slices of the
        boolean array <code>INSIDE</code> along each axis:
      </p>
      <pre>{`mark = np.zeros((N,N,N), dtype=bool)
for ax in range(3):
    lo = [slice(None)]*3; lo[ax] = slice(None, N-1)
    hi = [slice(None)]*3; hi[ax] = slice(1,    None)
    diff          = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff
    mark[tuple(hi)] |= diff`}</pre>
      <p>
        This is fully vectorised — no Python loop over grid cells. For N=48 it
        runs in under 10 ms. The resulting <code>mark</code> array has roughly
        50–80k True entries for the gyroid at ISO=0.
      </p>

      <h2>Step 3 — Vertex placement via edge interpolation</h2>
      <p>
        Each surface vertex is the centroid of its cell's active edge-crossing
        points. For each of the three forward-facing edges (along +x, +y, +z),
        linear interpolation finds where the SDF crosses ISO:
      </p>
      <pre>{`t  = (ISO - va) / (vb - va + 1e-12)
pt = pa + t * (pb - pa)`}</pre>
      <p>
        The <code>1e-12</code> guard prevents division by zero on the rare
        cell where both corners have equal field values. The vertex is then the
        mean of all active crossing points. On a smooth surface like the gyroid,
        this consistently places vertices well within the cell interior, giving
        a smooth visual result without any post-smoothing pass.
      </p>
      <p>
        This is the primary per-cell Python loop — <em>O</em>(M) iterations
        where M ≈ 50k for N=48. At roughly 3–5 µs per iteration in CPython,
        expect 150–250 ms. If throughput matters, the loop can be replaced by a
        vectorised numpy gather using advanced indexing, but for a one-shot
        blueprint that runtime is entirely acceptable.
      </p>

      <h2>Step 4 — Quad stitching</h2>
      <p>
        Surface Nets connectivity rule: for each sign-change edge (a grid edge
        where INSIDE flips), the four cells surrounding that edge form a quad.
        The four corners are at offsets{" "}
        <code>(0,0), (-1,0), (-1,-1), (0,-1)</code> in the two axes
        perpendicular to the edge's own axis.
      </p>
      <pre>{`for ax in range(3):
    a1, a2 = [x for x in range(3) if x != ax]
    edges  = np.argwhere(INSIDE[tuple(lo)] != INSIDE[tuple(hi)])
    for e in edges:
        corners = []
        for d1, d2 in ((0,0),(-1,0),(-1,-1),(0,-1)):
            c = e.copy(); c[a1] += d1; c[a2] += d2
            vi = cell_map[c[0], c[1], c[2]]
            if vi < 0: ok=False; break
            corners.append(vi)
        if ok:
            quads.append(corners if INSIDE[e[0],e[1],e[2]] else corners[::-1])`}</pre>
      <p>
        The reversal on <code>not INSIDE</code> aligns quad winding order so
        face normals point outward consistently. A quad is skipped if any of its
        four surrounding cells is not a surface cell (this handles boundary
        cells at the grid edge cleanly).
      </p>
      <p>
        Compare this quad-per-edge approach with the face-topology query
        patterns used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient"
          className={lk}
        >
          GN Corners of Face tutorial
        </Link>{" "}
        — both enumerate faces by their surrounding primitives, just at
        different abstraction levels.
      </p>

      <h2>Step 5 — bmesh assembly</h2>
      <p>
        Building the mesh follows the same bmesh pattern used across the studio
        library:
      </p>
      <pre>{`bm       = bmesh.new()
bm_verts = [bm.verts.new((float(v[0]),float(v[1]),float(v[2]))) for v in verts_w]
bm.verts.ensure_lookup_table()
for q in quads:
    try: bm.faces.new([bm_verts[i] for i in q])
    except ValueError: pass   # degenerate quad — skip`}</pre>
      <p>
        Two post-assembly operations clean the mesh:{" "}
        <code>bmesh.ops.remove_doubles</code> with a tolerance of{" "}
        <code>cell_size × 0.05</code> welds any vertices that landed within 5%
        of a cell width of each other (can occur at grid boundaries), and{" "}
        <code>bmesh.ops.triangulate</code> converts quads to triangles as
        required by the glTF 2.0 spec.
      </p>
      <p>
        For the bmesh-from-scratch pattern in more detail, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere bmesh tutorial
        </Link>
        . For the surface-RD workflow that evaluates a different scalar field on
        the same N³ grid structure, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr"
          className={lk}
        >
          surface reaction-diffusion tutorial
        </Link>
        .
      </p>

      <h2>Material and shading</h2>
      <p>
        The gyroid mesh gets a translucent Principled BSDF:{" "}
        <code>Transmission Weight = 0.45</code>, IOR 1.48 (borosilicate glass),
        teal base colour. Flat shading is applied via{" "}
        <code>bpy.ops.object.shade_flat()</code> — the faceted cell-face
        aesthetic suits the lattice geometry and aligns with the studio
        convention for WebXR props. Smooth shading would require a custom
        normals pass or a Smooth by Angle modifier, which adds weight for no
        visual gain at N=48 resolution.
      </p>
      <p>
        For the 3D-print version, swap the material for a Principled BSDF with
        Transmission Weight = 0 and a light-diffusing base colour, then see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
          className={lk}
        >
          MSLA light sculpture tutorial
        </Link>{" "}
        for the shell-offset and drainage-hole workflow.
      </p>

      <h2>Export</h2>
      <pre>{`bpy.ops.wm.gltf2_export(
    filepath                             = bpy.path.abspath("//hf_gyroid.glb"),
    export_format                        = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    use_selection                        = True,
)`}</pre>
      <p>
        Draco level 6 reduces the gyroid GLB by roughly 60–70% versus raw
        binary. The mesh has high-frequency detail (many small triangles from
        the 48³ grid) so Draco's delta-encoding yields larger gains here than on
        coarser geometry. Expect a final GLB of around 1.5–2.5 MB depending on
        N.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Empty mesh / no surface cells found.</strong> Check that{" "}
          <code>F</code> actually crosses <code>ISO = 0.0</code> in the domain.
          Print <code>float(F.min()), float(F.max())</code> — for a 1.5π
          half-extent the range should be roughly <code>[-1.73, +1.73]</code>.
          If the range is all-positive or all-negative, the domain is too small
          or <code>HALF_BOX</code> needs adjusting.
        </li>
        <li>
          <strong>Holes in the mesh.</strong> Surface cells at the grid
          boundary have fewer than four surrounding cells for some edges; those
          quads are skipped and leave open boundary loops. Either clip the domain
          slightly inside the grid (<code>HALF_BOX = 1.4π</code>) or add a
          SolidBound modifier to fill them in the viewport.
        </li>
        <li>
          <strong>Slow execution.</strong> The vertex-placement loop is{" "}
          <em>O</em>(M) in CPython — expected. If N=64 is too slow, drop to
          N=40 for development and raise it for final export. The quad-stitching
          loop scales with the number of sign-change edges (~3M × surface
          fraction), not with N³.
        </li>
        <li>
          <strong>GLB looks faceted / jagged in WebXR viewer.</strong> Apply a
          Subdivision Surface modifier (level 1) before the Triangulate step, or
          use <code>bpy.ops.object.shade_smooth_by_angle(angle=0.5)</code>{" "}
          instead of shade_flat. The ISO=0 gyroid has smooth normals, so smooth
          shading reads well at N≥48.
        </li>
        <li>
          <strong>ISO offset to thicken walls.</strong> Setting ISO to +0.2
          or −0.2 shifts the isosurface to a parallel level-set, thickening or
          thinning one channel. Useful for MSLA prints where minimum wall
          thickness must exceed 0.5 mm.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body);
