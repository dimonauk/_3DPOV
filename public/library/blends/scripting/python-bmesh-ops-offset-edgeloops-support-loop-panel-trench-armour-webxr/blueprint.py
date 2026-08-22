"""
Holoflow Studio — Blender 5.1
bmesh.ops.offset_edgeloops
Support-Loop Insertion, Panel-Line Trench & Pinch-Free Bevel Prep:
Sci-Fi Armour Plate for WebXR

Technique:
  bmesh.ops.offset_edgeloops takes a nominated edge set (ideally a connected
  loop or open path) and inserts two new parallel edge loops flanking the input
  on either side, by sliding new vertices along the adjacent quad faces.  It is
  the headless equivalent of Edit Mode's Offset Edge Loop Slide (Ctrl+R then
  right-click to place without offsetting — but with explicit slide factor).

  Three distinct workflows demonstrated:
    1. SUPPORT LOOPS — closed boss-perimeter loop → two tight flanking loops
       preventing SubD pinching at the raised panel boundary.
    2. PANEL-LINE TRENCH — open horizontal groove path → two flanking loops →
       faces between them extruded down to form a recessed groove groove line.
    3. BEVEL PREP — the support loops are ALSO perfect bevel guides: a
       BevelModifier (weight mode) applied post-export to the same vert positions
       produces a crisp machined chamfer without pinching.

  Studio prop: a Sci-Fi Armour Plate — 2.4 × 1.6 m hard-surface shell with a
  raised central boss, two horizontal panel-line trenches, and a solidified back
  for depth.  Exported as a Draco-compressed GLB for WebXR drop-in.

Outside sources:
  Blender Foundation — bmesh.ops API Reference — CC-BY-SA-4.0
  https://docs.blender.org/api/5.1/bmesh.ops.html
  Related: https://projects.blender.org/blender/blender

  KhronosGroup — glTF-Blender-IO — Apache-2.0
  https://github.com/KhronosGroup/glTF-Blender-IO
  Related: https://github.com/KhronosGroup/glTF
"""

import bpy
import bmesh
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
PLATE_W         = 2.4     # armour plate width  in metres (X)
PLATE_H         = 1.6     # armour plate height in metres (Y)
SEG_X           = 4       # grid columns  → x step = PLATE_W / SEG_X = 0.6 m
SEG_Y           = 8       # grid rows     → y step = PLATE_H / SEG_Y = 0.2 m

# With SEG_X=4: x vertex cols at ±1.2, ±0.6, 0.0 (5 vals); face centers ±0.9, ±0.3
# With SEG_Y=8: y vertex rows at ±0.8, ±0.6, ±0.4, ±0.2, 0.0 (9 vals);
#               face centers ±0.7, ±0.5, ±0.3, ±0.1

BOSS_X_LIMIT    = 0.35    # boss face centres with |x| < BOSS_X_LIMIT → face cols ±0.3
BOSS_Y_LIMIT    = 0.15    # boss face centres with |y| < BOSS_Y_LIMIT → face rows ±0.1
BOSS_Z          = 0.10    # boss extrusion height in metres

GROOVE_Y_VALS   = [0.4, -0.4]  # y-coordinate of groove edge rows (safe between boss ±0.2 and boundary ±0.6)
GROOVE_DEPTH    = 0.015         # groove extrusion depth (down)

PLATE_THICKNESS = 0.035   # solidify thickness in metres (adds backing shell)
COORD_EPS       = 0.02    # tolerance for coordinate comparisons

EXPORT_PATH     = "//hf_armour_plate.glb"
# ──────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def make_material(name: str, rgb: tuple,
                  metallic: float = 0.0, roughness: float = 0.5) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = roughness
    return mat


def horiz_edges_at_y(bm: bmesh.types.BMesh, y_val: float) -> list:
    """
    Return all horizontal edges (both verts at y_val, edge runs along X) in bm.
    Horizontal here means edge.verts have same y but different x — excludes
    diagonal and vertical edges that happen to pass through y_val.
    """
    return [
        e for e in bm.edges
        if abs(e.verts[0].co.y - y_val) < COORD_EPS
        and abs(e.verts[1].co.y - y_val) < COORD_EPS
        and abs(e.verts[0].co.x - e.verts[1].co.x) > COORD_EPS  # must have x-span
        and e.verts[0].co.z < COORD_EPS                          # plate-level only
        and e.verts[1].co.z < COORD_EPS
    ]


def build_armour_plate() -> bpy.types.Object:
    """
    Construct the armour plate BMesh:
      1. Subdivided grid → scale to plate dimensions
      2. Boss: identify centre faces → extrude_face_region upward
      3. Support loops: boss perimeter → offset_edgeloops (closed, cap=False)
      4. Groove lines: two horizontal rows → offset_edgeloops (open, cap=True)
      5. Groove trenches: faces between groove loops → extrude down
      6. Solidify: add backing shell
      7. Shade flat, build object
    """
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")

    # ── 1. Grid ────────────────────────────────────────────────────────────────
    # create_grid uses size=1.0 → verts span ±1 in X and Y before scaling.
    bmesh.ops.create_grid(
        bm,
        x_segments=SEG_X, y_segments=SEG_Y,
        size=1.0, calc_uvs=True,
    )
    # Scale to plate dimensions
    for v in bm.verts:
        v.co.x *= PLATE_W / 2.0   # ×1.2 → x cols: ±1.2, ±0.6, 0.0
        v.co.y *= PLATE_H / 2.0   # ×0.8 → y rows: ±0.8, ±0.6, ±0.4, ±0.2, 0.0

    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # ── 2. Boss faces ──────────────────────────────────────────────────────────
    # Face centres at (±0.3, ±0.1) — the 4 central faces of the 4×8 grid.
    boss_faces = [
        f for f in bm.faces
        if abs(f.calc_center_median().x) < BOSS_X_LIMIT
        and abs(f.calc_center_median().y) < BOSS_Y_LIMIT
    ]

    # ── 3. Boss perimeter edges ────────────────────────────────────────────────
    # An edge is on the perimeter iff exactly ONE of its adjacent faces is a
    # boss face (the other is a plate face).  Collected BEFORE extrusion so
    # that the edge objects remain valid to pass into offset_edgeloops.
    boss_set = set(boss_faces)
    boss_perim = [
        e for e in bm.edges
        if sum(1 for f in e.link_faces if f in boss_set) == 1
    ]
    # → 8 edges: 2 top, 2 bottom, 2 left, 2 right of the 2×2 boss patch

    # ── 4. Extrude boss ────────────────────────────────────────────────────────
    # extrude_face_region duplicates the boss faces and returns the new geometry
    # in ret['geom'].  We move only the new vertices upward; the originals stay
    # as the enclosed bottom faces of the boss hull.
    ret = bmesh.ops.extrude_face_region(bm, geom=boss_faces)
    top_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top_verts, vec=Vector((0.0, 0.0, BOSS_Z)))

    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # ── 5. SUPPORT LOOPS via offset_edgeloops ─────────────────────────────────
    # boss_perim forms a closed rectangular path around the boss base (z≈0).
    # offset_edgeloops inserts two new parallel loops flanking each input edge:
    #   · outer loop → slides into the plate face (prevents pinch on plate side)
    #   · inner loop → slides into the boss wall face (prevents pinch on boss side)
    # use_cap_endpoint=False: the path is a closed loop — no dangling endpoints.
    supp_ret = bmesh.ops.offset_edgeloops(
        bm,
        edges=boss_perim,
        use_cap_endpoint=False,
    )
    # supp_ret['edges'] holds the newly created parallel edge loops.
    # These are identical to adding support loops manually via Ctrl+R slide.

    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # ── 6. PANEL-LINE GROOVE via offset_edgeloops ─────────────────────────────
    # Each groove row is an open horizontal path spanning the full plate width.
    # offset_edgeloops turns each row into a triplet: left-offset · original ·
    # right-offset.  The faces sandwiched between the two offset loops become
    # the groove floor after an inward extrusion.
    # use_cap_endpoint=True: the path endpoints are open (boundary edges of the
    # plate) — the cap extends the offset loops to meet the plate rim correctly.
    for gy in GROOVE_Y_VALS:
        groove_src = horiz_edges_at_y(bm, gy)
        if not groove_src:
            continue

        bmesh.ops.offset_edgeloops(
            bm,
            edges=groove_src,
            use_cap_endpoint=True,
        )

        bm.verts.ensure_lookup_table()
        bm.edges.ensure_lookup_table()
        bm.faces.ensure_lookup_table()

        # Faces between the new offset loops are centred near gy at plate level.
        # EPS of 0.08 catches faces in the narrow stripe regardless of slide
        # distance (the offset splits the original face width ~50/50).
        groove_faces = [
            f for f in bm.faces
            if abs(f.calc_center_median().y - gy) < 0.08
            and f.calc_center_median().z < COORD_EPS
            and f.calc_center_median().z > -COORD_EPS
        ]
        if not groove_faces:
            continue

        # ── 7. TRENCH: extrude groove floor downward ───────────────────────────
        gret = bmesh.ops.extrude_face_region(bm, geom=groove_faces)
        g_verts = [g for g in gret['geom'] if isinstance(g, bmesh.types.BMVert)]
        # Negative Z: grooves recess INTO the plate surface.
        bmesh.ops.translate(bm, verts=g_verts, vec=Vector((0.0, 0.0, -GROOVE_DEPTH)))

        bm.verts.ensure_lookup_table()
        bm.edges.ensure_lookup_table()
        bm.faces.ensure_lookup_table()

    # ── 8. Solidify backing shell ──────────────────────────────────────────────
    # bmesh.ops.solidify extrudes each face along its (inverted) normal by
    # |thickness|.  A negative value pushes faces in their −normal direction
    # (downward for upward-facing plate faces) creating a hollow back plate.
    all_faces = list(bm.faces)
    bmesh.ops.solidify(bm, geom=all_faces, thickness=-PLATE_THICKNESS)

    bm.normal_update()

    # ── 9. Shade flat ──────────────────────────────────────────────────────────
    for f in bm.faces:
        f.smooth = False
    for e in bm.edges:
        e.smooth = False

    # ── 10. Build object ───────────────────────────────────────────────────────
    me = bpy.data.meshes.new("hf_armour_plate")
    ob = bpy.data.objects.new("hf_armour_plate", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me)
    bm.free()
    me.update()

    return ob


def setup_scene(ob: bpy.types.Object,
                mat_plate: bpy.types.Material,
                mat_groove: bpy.types.Material) -> None:
    ob.data.materials.append(mat_plate)
    ob.data.materials.append(mat_groove)

    # Camera at 45° elevation, 4 m back
    cam_data = bpy.data.cameras.new("cam")
    cam_ob   = bpy.data.objects.new("cam", cam_data)
    cam_ob.location = (0.0, -3.8, 2.2)
    cam_ob.rotation_euler = (1.05, 0.0, 0.0)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    sun = bpy.data.lights.new("sun", 'SUN')
    sun_ob = bpy.data.objects.new("sun", sun)
    sun_ob.location = (3.0, -2.0, 4.0)
    sun_ob.rotation_euler = (0.7, 0.0, 0.8)
    sun.energy = 4.0
    bpy.context.collection.objects.link(sun_ob)


def main() -> None:
    purge_scene()

    mat_plate  = make_material("plate",  (0.35, 0.38, 0.42), metallic=0.7, roughness=0.3)
    mat_groove = make_material("groove", (0.08, 0.08, 0.10), metallic=0.9, roughness=0.2)

    ob = build_armour_plate()
    setup_scene(ob, mat_plate, mat_groove)

    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        use_selection=True,
    )
    print(f"Exported → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
