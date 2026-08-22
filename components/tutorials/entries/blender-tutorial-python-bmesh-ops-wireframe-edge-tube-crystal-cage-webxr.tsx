import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.wireframe</code> converts every edge in a selected face
        set into a rectangular-section tube — the same C kernel that drives
        Blender&apos;s Wireframe tool in Edit Mode, exposed here as a headless,
        context-free Python call. The operation inserts new vertices at each
        face corner, builds four quad faces around every original edge, and
        optionally deletes the original fill faces to leave a hollow lattice.
        Two studio props emerge: a crystal cage from a subdivided icosahedron,
        and a sci-fi HUD grid panel with a semi-transparent fill layer behind
        emissive wire lines.
      </p>
      <p>
        The distinguishing contrast to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-wireframe-modifier-toon-ink-geometry-webxr"
          className={lk}
        >
          Wireframe Modifier
        </Link>{" "}
        is context dependency: the modifier needs an active Object and can only
        be applied at render or export time. <code>bmesh.ops.wireframe</code>{" "}
        works on any BMesh in memory — no Object, no Mode switch, no operator
        context. The GN approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-to-curve-wireframe-scaffold"
          className={lk}
        >
          Mesh to Curve → Wireframe Scaffold
        </Link>{" "}
        is non-destructive and driveable by fields, but produces curve objects
        rather than a single committed mesh; <code>bmesh.ops.wireframe</code>{" "}
        produces a real committed mesh in one call, ideal for batch GLB
        pipelines.
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.wireframe(
    bm,
    faces               = list_of_BMFace,  # required: face set to solidify
    thickness           = 0.04,            # tube half-width, world units
    offset              = 0.0,             # inset from face plane before tube
    use_even_offset     = True,            # equalise thickness at junctions
    use_replace         = True,            # True → hollow; False → overlay
    use_boundary        = False,           # include open-mesh rim edges
    use_crease          = False,           # write SubD crease to wire edges
    crease_weight       = 0.0,            # value when use_crease=True
    use_relative_offset = False,           # thickness relative to edge length
    material_offset     = 0,              # int: wire quads shift mat slot by N
)
wire_faces = result['faces']  # list[BMFace] — the new tube quad faces only`}</pre>

      <h2>use_replace — hollow cage vs wire overlay</h2>
      <pre>{`# Hollow cage: fill faces removed, only tubes remain
bmesh.ops.wireframe(bm, faces=all_faces, use_replace=True, thickness=0.045)
# mesh now contains ONLY tube quads; original icosphere tris are gone

# Wire overlay: fill faces kept under the tubes
bmesh.ops.wireframe(bm, faces=all_faces, use_replace=False,
                    thickness=0.022, material_offset=1)
# mesh has original fill at slot 0 + wire quads at slot 1`}</pre>
      <p>
        <code>use_replace=True</code> is correct for a cage prop or holographic
        skeleton where no interior surface should block depth sorting in WebXR.
        <code>use_replace=False</code> is used on the HUD grid: the flat fill
        quads remain visible as a tinted backdrop, and <code>material_offset=1</code>{" "}
        sends wire quads to slot 1 (emissive) while fill stays at slot 0
        (semi-transparent glass). Contrast this with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr"
          className={lk}
        >
          extrude_discrete_faces
        </Link>
        , which moves geometry along face normals — wireframe moves geometry
        perpendicular to each edge&apos;s span.
      </p>

      <h2>use_even_offset — junction compensation</h2>
      <p>
        Where two tubes meet at a non-90° angle, naive thickness insertion
        produces thinner-looking joints on narrow-angle sides and thicker on
        wide-angle sides. <code>use_even_offset=True</code> redistributes the
        offset so the tube wall measures consistently regardless of junction
        angle — visible in WebXR as uniform emissive brightness across all
        joints of the cage. Always enable it for isotropic lattices; disable
        it only when deliberately modelling asymmetric chamfers.
      </p>

      <h2>use_boundary — open-mesh rim edges</h2>
      <pre>{`# Flat grid: perimeter edges border only ONE face (boundary edges)
# use_boundary=False (default) → outer rim left as ragged open edge
# use_boundary=True            → outer rim also gets tube quads (correct)

bmesh.ops.create_grid(bm, x_segments=6, y_segments=6, size=1.2)
bmesh.ops.wireframe(bm, faces=list(bm.faces),
                    thickness=0.022, use_boundary=True, use_replace=False,
                    material_offset=1)`}</pre>
      <p>
        A closed sphere has no boundary edges so this flag is inert there.
        Any open mesh — flat grid, cup rim, open panel — needs{" "}
        <code>use_boundary=True</code> or the perimeter frame is absent.
      </p>

      <h2>Topology invariant</h2>
      <p>
        Each original edge produces exactly four quad faces. On the{" "}
        <code>subdivisions=1</code> icosphere (120 edges):{" "}
        <code>120 × 4 = 480</code> tube quads after{" "}
        <code>use_replace=True</code>. On the 6×6 grid (84 edges including
        boundary) with <code>use_replace=False</code>: 36 fill quads +{" "}
        <code>84 × 4 = 336</code> tube quads. The{" "}
        <code>result[&apos;faces&apos;]</code> key returns only the new tube
        quads — original fill faces are never in the result, even when retained.
      </p>

      <h2>Sharp edges + flat shading for GLB export</h2>
      <pre>{`for f in result['faces']:
    f.smooth = False          # flat-shaded facet per tube quad
bm.normal_update()
for e in bm.edges:
    e.smooth = False          # writes 'sharp_edge' Boolean attribute (Blender 5.1)
                              # → split per-corner normals in GLB NORMAL accessor`}</pre>
      <p>
        In Blender 5.1 <code>e.smooth = False</code> writes the{" "}
        <code>sharp_edge</code> boolean attribute on the EDGE domain. The glTF
        exporter reads this attribute and emits split per-corner normals in the
        NORMAL accessor — essential for the cage to render with visible edge
        facets rather than smooth interpolation in WebXR runtimes that ignore
        custom normal data.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            blender/blender
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.types
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0 · Khronos Group). Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF spec
          </a>
          ,{" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF 2.0 specification
          </a>
          .
        </li>
      </ul>

      <h2>Blueprint</h2>
      <pre>{`# public/library/blends/scripting/
#   python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr/blueprint.py

import bpy, bmesh, math
from mathutils import Vector

CAGE_THICKNESS = 0.045
GRID_TUBE      = 0.022

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, calc_uvs=False)

result = bmesh.ops.wireframe(
    bm,
    faces               = list(bm.faces),
    thickness           = CAGE_THICKNESS,
    offset              = 0.005,
    use_even_offset     = True,
    use_replace         = True,
    use_boundary        = False,
    use_crease          = False,
    use_relative_offset = False,
    material_offset     = 0,
)
for f in result['faces']: f.smooth = False
bm.normal_update()
for e in bm.edges: e.smooth = False

me = bpy.data.meshes.new("hf_wireframe_cage")
ob = bpy.data.objects.new("hf_wireframe_cage", me)
bpy.context.collection.objects.link(ob)
bm.to_mesh(me); bm.free()

bpy.ops.export_scene.gltf(
    filepath="//hf_wireframe_cage.glb", export_format='GLB',
    export_apply=True, export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr",
  title:
    "Python bmesh.ops.wireframe — Edge-Tube Lattice, Crystal Cage & Holographic Grid for WebXR (Blender 5.1)",
  description:
    "Convert every edge of a mesh into a rectangular-section tube with the headless bmesh.ops.wireframe kernel — covering use_replace hollow vs overlay mode, use_even_offset junction compensation, boundary edge handling, and a two-material emissive HUD grid for WebXR.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "wireframe",
    "hard-surface",
    "crystal",
    "webxr",
    "glb",
    "export",
    "lattice",
  ],
  body: Body,
  level: "intermediate",
});
