"""
Holoflow Studio — Blender 5.1
bmesh.ops.split_edges
Sharp-Edge Split, Angle-Threshold Hard Normals & UV Seam Co-location for WebXR

Technique:
  bmesh.ops.split_edges duplicates the vertices at each targeted edge endpoint
  so that the faces on either side no longer share those vertices.  The edge is
  replaced by two coincident edges, each owned by exactly one face.
  Those edges become non-manifold (link_faces count = 1), which the UV
  unwrapper treats as natural island boundaries — no manual seam marking
  required.

  Compare with the Smooth by Angle modifier: that modifier fakes split normals
  via custom_normal data whilst keeping geometry single-piece.  Use the modifier
  for viewport/render; use split_edges when you need truly disconnected topology
  for UV seam co-location, physics accuracy, or export to engines that re-derive
  normals from positions.

Artefact: hf_crystal_column.glb
  A six-sided hex prism shaft with a pyramidal crown.  All face-to-face
  transitions exceed 20° and are split, giving each face its own UV island.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
RADIUS          = 1.0    # circumradius of the hex cross-section (metres)
SHAFT_HEIGHT    = 1.4    # column body height
CROWN_HEIGHT    = 0.55   # pyramidal cap height above shaft
CROWN_INSET     = 0.18   # radial reduction at the crown shoulder
SPLIT_ANGLE_DEG = 20.0   # dihedral angles sharper than this are split
EXPORT_PATH     = "//hf_crystal_column.glb"


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in [bpy.data.meshes, bpy.data.materials,
                bpy.data.objects, bpy.data.cameras, bpy.data.lights]:
        for item in list(col):
            col.remove(item, do_unlink=True)


def build_column() -> bpy.types.Object:
    bm = bmesh.new()

    # ── Hexagonal shaft ───────────────────────────────────────────────────────
    # Flat-top orientation: first vertex at 30° gives flat top and bottom edges
    # which read as horizontal "steps" rather than diamond points.
    vb, vt = [], []
    for i in range(6):
        a  = math.radians(30 + 60 * i)
        xy = Vector((math.cos(a), math.sin(a), 0.0)) * RADIUS
        vb.append(bm.verts.new(xy))
        vt.append(bm.verts.new(xy + Vector((0.0, 0.0, SHAFT_HEIGHT))))

    bm.faces.new(vb[::-1])   # bottom cap: CW from above = outward −Z normal

    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new([vb[i], vb[j], vt[j], vt[i]])

    # ── Crown shoulder + apex ─────────────────────────────────────────────────
    # An inset shoulder ring sits at the same Z as the shaft top (vt ring)
    # but at a smaller radius.  The shoulder quads provide a transitional band
    # so the crown slope angle can be controlled independently of the shaft.
    vc = []
    r_crown = RADIUS - CROWN_INSET
    for i in range(6):
        a = math.radians(30 + 60 * i)
        vc.append(bm.verts.new(Vector((
            math.cos(a) * r_crown,
            math.sin(a) * r_crown,
            SHAFT_HEIGHT,
        ))))

    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new([vt[i], vt[j], vc[j], vc[i]])   # shoulder ring quads

    v_apex = bm.verts.new(Vector((0.0, 0.0, SHAFT_HEIGHT + CROWN_HEIGHT)))
    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new([vc[i], vc[j], v_apex])          # crown triangles

    bm.normal_update()   # required before calc_face_angle — normals must exist
    bm.edges.ensure_lookup_table()

    # ── Angle-threshold edge selection ────────────────────────────────────────
    # calc_face_angle(fallback) returns the dihedral angle in radians, or the
    # fallback for boundary / wire edges.  Passing None lets us skip those with
    # a single `is not None` guard rather than a separate boundary check.
    SPLIT_RAD  = math.radians(SPLIT_ANGLE_DEG)
    hard_edges = [
        e for e in bm.edges
        if (ang := e.calc_face_angle(None)) is not None and ang > SPLIT_RAD
    ]

    # ── THE CORE OPERATION ────────────────────────────────────────────────────
    # split_edges duplicates the endpoint verts of each targeted edge so the
    # two formerly-shared faces now each own their vert copies.  The call
    # returns an empty dict — there is no result geometry to introspect.
    bmesh.ops.split_edges(bm, edges=hard_edges)

    # ── UV seam co-location ───────────────────────────────────────────────────
    # After split_edges on a closed manifold, every split edge becomes
    # non-manifold (link_faces == 1 on each half).  Marking those edges as UV
    # seams means the unwrapper separates islands automatically — the seam
    # placement is free, not an approximation.
    bm.edges.ensure_lookup_table()
    for e in bm.edges:
        if len(e.link_faces) == 1:
            e.seam = True

    # Set smooth flags before baking — these write the sharp_edge attribute
    # that the glTF exporter reads when deciding per-loop normal encoding.
    for f in bm.faces:
        f.smooth = False
    for e in bm.edges:
        e.smooth = False   # writes sharp_edge attribute, required for GLB

    # ── Mesh + UV unwrap ──────────────────────────────────────────────────────
    me = bpy.data.meshes.new("hf_crystal_column")
    ob = bpy.data.objects.new("hf_crystal_column", me)
    bpy.context.scene.collection.objects.link(ob)
    bm.to_mesh(me)
    bm.free()

    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    with bpy.context.temp_override(
        active_object=ob,
        selected_objects=[ob],
        selected_editable_objects=[ob],
    ):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        # ANGLE_BASED unwrap respects seams; each split island unwraps cleanly
        bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')

    # ── Materials ─────────────────────────────────────────────────────────────
    ms = bpy.data.materials.new("hf_shaft")
    mc = bpy.data.materials.new("hf_crown")
    ms.diffuse_color = (0.06, 0.28, 0.35, 1.0)  # deep teal
    mc.diffuse_color = (0.80, 0.74, 0.42, 1.0)  # pale gold
    me.materials.append(ms)   # slot 0
    me.materials.append(mc)   # slot 1

    # Assign by Z: faces with any vertex above the shaft-top threshold are crown
    for poly in me.polygons:
        vz = me.vertices[poly.vertices[0]].co.z
        poly.material_index = 1 if vz > SHAFT_HEIGHT * 0.95 else 0

    return ob


def export_glb(ob: bpy.types.Object) -> None:
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_normals=True,
        export_yup=True,
        export_texcoords=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"[HF] exported → {bpy.path.abspath(EXPORT_PATH)}")


if __name__ == "__main__":
    purge_scene()
    ob = build_column()
    export_glb(ob)
