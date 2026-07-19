import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The six <code>bmesh.ops.create_*</code> operators are Blender 5.1&apos;s
        headless primitive factory.  Each one accepts a target BMesh, an optional
        4×4 placement matrix, and a <code>calc_uvs</code> flag.  They return{" "}
        <code>&#123;&apos;verts&apos;: list[BMVert]&#125;</code> — direct element
        references for immediate downstream use.  Unlike{" "}
        <code>bpy.ops.mesh.primitive_*</code>, they require no active Object,
        no mode switch, and no operator context — which means multiple primitives
        can be constructed inside a single BMesh and converted to one mesh in a
        single <code>bm.to_mesh()</code> call, with zero object merges.
      </p>
      <p>
        The studio prop is a 3 m × 3 m crystal floor tile: a hexagonal-segment
        grid floor, a central pedestal cube with a UV-sphere accent on top, five
        hexagonal spires arranged on a pentagon ring with icosphere gem caps at
        their tips, and flat circle-disc rings at each spire base.  All six
        primitive types appear in one BMesh.  The approach mirrors what{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr"
          className={lk}
        >
          convex_hull
        </Link>{" "}
        does for implicit geometry — but create_* lets you compose exact
        parametric shapes instead.
      </p>

      <h2>Size semantics — the Blender 5.1 inconsistency</h2>
      <p>
        The most important thing to know about the create_* family is that{" "}
        <code>size</code> means different things in different operators.
        Getting this wrong produces geometry at unexpected scales:
      </p>
      <pre>{`# create_grid: size = HALF-SPAN — verts at ±size (full span = 2×size)
bmesh.ops.create_grid(bm, size=1.5, ...)   # → tile spans 3 m (-1.5 to +1.5)

# create_cube: size = FULL EDGE LENGTH — corners at ±size/2
bmesh.ops.create_cube(bm, size=0.58, ...)  # → cube is 0.58 m on each side

# create_cone: depth = FULL HEIGHT — cone spans ±depth/2 on Z
bmesh.ops.create_cone(bm, depth=1.6, ...)  # → cone from z=−0.8 to z=+0.8
# To sit the base on the tile: translate up by depth/2
mat = Matrix.Translation((px, py, 1.6 / 2.0))   # → base at z=0, tip at z=1.6

# create_icosphere, create_uvsphere, create_circle: radius = circumradius
bmesh.ops.create_icosphere(bm, radius=0.11, ...)  # → 0.11 m from centre to vertex`}</pre>
      <p>
        The inconsistency between <code>create_grid</code> (half-span) and{" "}
        <code>create_cube</code> (full edge) is a historical quirk that
        predates the unified operator API and has not been corrected in 5.1.
        The safest habit is to check with a single reference vertex after
        creation if you are uncertain about a specific operator.
      </p>

      <h2>UV layer ordering</h2>
      <pre>{`bm = bmesh.new()
# UV layer MUST exist before the first create_* call with calc_uvs=True.
# Operators write UV data to the active layer at creation time;
# adding the layer afterward leaves every loop without coordinates.
bm.loops.layers.uv.new("UVMap")

bmesh.ops.create_grid(bm, x_segments=6, y_segments=6, size=1.5, calc_uvs=True)
bmesh.ops.create_cube(bm, size=0.58, matrix=..., calc_uvs=True)
# ... all create_* calls follow`}</pre>

      <h2>create_grid — the base tile</h2>
      <pre>{`# size = half-span (verts at ±size).  No matrix parameter needed when
# the tile should sit at the world origin, which is the default.
bmesh.ops.create_grid(
    bm,
    x_segments=6, y_segments=6,   # → 6×6 = 36 quads
    size=1.5,                      # → spans from −1.5 to +1.5 m on X and Y
    calc_uvs=True,
)
# Return value: {'verts': [45 BMVerts]}  (7×7 vertex grid)
# No matrix: add one if you want the tile elevated or rotated`}</pre>

      <h2>create_cube — the pedestal</h2>
      <pre>{`# size = full edge length.  Matrix.Translation lifts it off the tile.
bmesh.ops.create_cube(
    bm,
    size=0.58,
    matrix=Matrix.Translation((0.0, 0.0, 0.58 / 2.0)),
    calc_uvs=True,
)
# Translating by size/2 places the cube bottom flush with z=0.
# The matrix composes AFTER local placement — it does not modify
# the size calculation itself.`}</pre>

      <h2>create_uvsphere — the pedestal accent</h2>
      <pre>{`# Low u/v segment counts keep the poles faceted.
# u_segments=8, v_segments=5 → stacked ring topology with visible poles.
bmesh.ops.create_uvsphere(
    bm,
    u_segments=8, v_segments=5,
    radius=0.14,
    matrix=Matrix.Translation((0.0, 0.0, PED_SIZE + 0.14)),
    calc_uvs=True,
)
# Translate by PED_SIZE + radius so the sphere sits on top of the cube.
# Contrast with create_icosphere: UV sphere has distinct pole vertices that
# give a regular band pattern; icosphere distributes faces more evenly.`}</pre>

      <h2>create_cone — the spires</h2>
      <pre>{`for px, py in pentagon_positions():
    bmesh.ops.create_cone(
        bm,
        segments=6,            # hexagonal cross-section
        radius1=0.18,          # base radius
        radius2=0.03,          # tip radius (non-zero → hexagonal frustum)
        depth=1.60,            # full height: cone spans ±0.8 m from matrix origin
        cap_ends=True,         # add top and bottom caps
        cap_tris=False,        # n-gon caps (single flat hexagon face)
        matrix=Matrix.Translation((px, py, 1.60 / 2.0)),
        calc_uvs=True,
    )
# radius2=0.03 (non-zero) avoids a degenerate apex vertex.
# A pure cone (radius2=0) produces one vertex shared by all lateral faces,
# which causes a normal singularity at the tip — visible as a dark star
# under most shading models.  A tiny flat tip instead creates SPIRE_SEGS
# small triangular faces that shade cleanly.`}</pre>
      <p>
        Choosing <code>segments=6</code> gives a hexagonal prism body — each
        lateral face is a flat quad, which reads as a distinct panel under flat
        shading.  This is the same topology that{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr"
          className={lk}
        >
          bmesh.ops.spin
        </Link>{" "}
        produces for a revolved profile, but without the profiling step.
      </p>

      <h2>create_icosphere — gem caps</h2>
      <pre>{`gem_z = SPIRE_DEPTH - GEM_RADIUS * 0.7   # nestle the gem into the spire tip

for px, py in pentagon_positions():
    bmesh.ops.create_icosphere(
        bm,
        subdivisions=1,    # 0=20 faces, 1=80 faces, 2=320 faces
        radius=0.11,
        matrix=Matrix.Translation((px, py, gem_z)),
        calc_uvs=True,
    )
# subdivisions=1 strikes the balance between faceted appearance and
# recognisable spherical silhouette.  subdivisions=0 (icosahedron) is
# too coarse for a gem; subdivisions=2 produces 320 faces which is
# overkill for a 0.11 m prop in a WebXR scene.`}</pre>
      <p>
        The gem placement at <code>SPIRE_DEPTH − radius × 0.7</code> partially
        embeds the sphere in the spire tip — this avoids a floating gap between
        cone and gem and creates a natural stop-facet appearance.  Because
        create_icosphere and create_cone both live in the same BMesh, no
        boolean is needed to merge them; at export the overlapping geometry is
        simply exported as-is and appears as one solid prop.  For a cleaner
        silhouette a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr"
          className={lk}
        >
          face-region extrusion
        </Link>{" "}
        from the cone tip cap could substitute the sphere.
      </p>

      <h2>create_circle — accent rings</h2>
      <pre>{`for px, py in pentagon_positions():
    bmesh.ops.create_circle(
        bm,
        segments=12,
        radius=RING_RADIUS,       # slightly wider than spire base
        cap_ends=True,            # True = filled n-gon disc
        cap_tris=False,           # single n-gon face (not triangulated)
        matrix=Matrix.Translation((px, py, 0.008)),  # 8 mm above tile
        calc_uvs=True,
    )
# cap_ends=False would give only the edge ring — useful for wire/ribbon decals.
# cap_ends=True turns it into a flat disc that reads as a visible accent pad.
# The 8 mm offset avoids z-fighting with the tile floor quads.`}</pre>
      <p>
        Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
          className={lk}
        >
          MirrorModifier
        </Link>{" "}
        tile assembly — where separate objects are mirrored then joined — all
        five rings live in the same BMesh from the start.  There is no{" "}
        <code>bpy.ops.object.join()</code> step, no normals-recalculation after
        joining, and no risk of mismatched material slot indices.
      </p>

      <h2>Combining all primitives</h2>
      <pre>{`# Every create_* call appends to the same bm.
# After the last call, bm.to_mesh() produces a single Mesh data block.
me = bpy.data.meshes.new("hf_crystal_tile")
ob = bpy.data.objects.new("hf_crystal_tile", me)
bpy.context.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()   # mandatory: releases native C memory
me.update()

# The single object exports as one GLB mesh — one draw call in WebXR.
# If you need individual objects (for separate animation or colliders),
# build a separate bm per primitive and link each to its own object.`}</pre>

      <h2>Export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath="//hf_crystal_tile.glb",
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    use_selection=True,
)`}</pre>

      <h2>Troubleshooting</h2>
      <table>
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Grid twice as wide as expected</td>
            <td>
              <code>create_grid size</code> is the half-span — treated as full
              span by mistake
            </td>
            <td>
              Use <code>size=TILE_SIZE / 2.0</code>
            </td>
          </tr>
          <tr>
            <td>Cube wrong size vs cone</td>
            <td>
              <code>create_cube size</code> is edge length; expected half-span
            </td>
            <td>Pass the intended edge length directly</td>
          </tr>
          <tr>
            <td>Cone floating above tile</td>
            <td>
              Cone spans ±<code>depth/2</code>; not translated up
            </td>
            <td>
              <code>Matrix.Translation((px, py, depth / 2.0))</code>
            </td>
          </tr>
          <tr>
            <td>UV layer empty after export</td>
            <td>UV layer added after create_* calls</td>
            <td>
              Create <code>bm.loops.layers.uv.new()</code> before all create_*
              calls
            </td>
          </tr>
          <tr>
            <td>Dark star artefact at cone tip</td>
            <td>
              <code>radius2=0</code> produces a degenerate apex normal
            </td>
            <td>Use a small non-zero radius2 (e.g. 0.03)</td>
          </tr>
          <tr>
            <td>Memory not released after build</td>
            <td>
              <code>bm.free()</code> omitted
            </td>
            <td>
              Always call <code>bm.free()</code> after <code>bm.to_mesh()</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          — CC-BY-SA-4.0.{" "}
          Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender source (projects.blender.org)
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.types reference
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0.{" "}
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>
          ,{" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 spec
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-create-primitives-modular-crystal-tile-webxr",
  title:
    "Python bmesh.ops Primitive Forge — create_grid, create_cone, create_icosphere, create_uvsphere, create_circle & create_cube: Modular Crystal Tile for WebXR (Blender 5.1)",
  description:
    "Build multiple primitives in a single BMesh from Python using all six bmesh.ops.create_* operators — covering size-semantics inconsistencies, matrix-based world placement, UV layer ordering, cap topology control, and combining everything into one GLB draw call for WebXR.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "primitives",
    "create-grid",
    "create-cone",
    "create-icosphere",
    "create-uvsphere",
    "create-circle",
    "create-cube",
    "crystal",
    "environment",
    "webxr",
    "glb",
    "export",
  ],
  body: Body,
  level: "intermediate",
});
