# python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop/blueprint.py
# Blender 5.1 — bmesh.ops: Extrude, Bevel & Bridge — Sci-Fi Hard-Surface Panel
#
# TECHNIQUE: bmesh.ops is the pre-packaged mesh operation library sitting one
# layer above the raw bmesh topology API.  Each function takes explicit geometry
# lists, runs at the C level, and returns new geometry references immediately —
# no active object, no Edit Mode, no selection state, no undo-stack overhead.
#
# FOUR KEY OPERATIONS demonstrated here:
#   extrude_face_region — copies selected faces + boundary; call translate on
#     the returned new verts to create depth.  Unlike bpy.ops.mesh.extrude_*,
#     the return value is usable immediately without switching modes.
#   inset_individual — replaces each face with a border ring + recessed inner
#     face; the 'depth' parameter moves the inner face along its normal.
#   bevel — chamfers selected edges; segments=2 inserts one highlight loop,
#     the classic hard-surface response to 'how do I get specular on a
#     curved edge in real time without SubD?'
#   bridge_loops — fills quads between two matching edge loops; the canonical
#     way to build conduit tubes, handles, and cable runs in script.
#
# WHY bmesh.ops OVER bpy.ops:
#   bpy.ops.mesh.extrude_region_move() needs an active Object in Edit Mode,
#   returns {'FINISHED'}, and hands you nothing.  bmesh.ops.extrude_face_region
#   returns {'geom': [BMVert, BMEdge, BMFace …]}: you hold every new element and
#   chain further ops on them with zero mode switches.  Headless (-b) renders work.
#
# WHY bmesh.ops OVER raw bmesh context API (bm.verts.new, bm.faces.new):
#   The context API BUILDS topology element by element — that is the gem tutorial
#   (blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr).
#   bmesh.ops EVOLVES topology that already exists.  Use context API to assemble;
#   use bmesh.ops to transform.
#
# OUTPUT: scifi_panel_prop.blend + scifi_panel_prop.glb
#   2 m × 1.2 m × 0.1 m vertical wall panel, one large recessed window,
#   chamfered outer edges, twin vertical conduit tubes.  Y-up, 1 unit = 1 m.

import bpy
import bmesh
from mathutils import Vector, Matrix
import math

# ── parameters ─────────────────────────────────────────────────────────────────
OBJECT_NAME  = "scifi_panel_prop"
PANEL_W      = 2.00   # X total width (metres)
PANEL_H      = 1.20   # Z total height (metres)
PANEL_D      = 0.10   # Y thickness
INSET_BORDER = 0.12   # width of raised frame around the recessed window
INSET_DEPTH  = 0.045  # how far the inner window face is recessed (metres)
BEVEL_OFFSET = 0.018  # chamfer half-width on outer silhouette edges
BEVEL_SEGS   = 2      # bevel profile segments (2 = one midpoint highlight loop)
CONDUIT_R    = 0.035  # conduit tube radius
CONDUIT_SEGS = 12     # vertices per circle — must be ≥ 3; divisible by 4 for
                      #   clean quad topology when the tube bends or is UV-unwrapped
EXPORT_PATH  = "//scifi_panel_prop.glb"


# ── scene reset ─────────────────────────────────────────────────────────────────
def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system      = 'METRIC'
    bpy.context.scene.unit_settings.length_unit = 'METERS'


# ── material factory ─────────────────────────────────────────────────────────────
def make_material(name, base_color, metallic=0.65, roughness=0.40):
    mat  = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value   = metallic
    bsdf.inputs["Roughness"].default_value  = roughness
    return mat


# ── Phase 1: panel slab ─────────────────────────────────────────────────────────
def build_panel_slab(bm):
    """
    create_grid(x_segments=1, y_segments=1) → one quad in the XY plane.
    Scale + rotate to stand the panel upright (XZ plane, normal = +Y).
    extrude_face_region on the front face → new verts at Y=0 (same position).
    translate new verts by −PANEL_D → back face at Y=−PANEL_D; side walls
    auto-expand.  Returns the original front-face reference.

    Key point: extrude_face_region NEVER MOVES the originals — ret['geom']
    contains the freshly created copies.  Every 'extrude + move' pattern in
    bmesh.ops follows this same idiom: extrude → filter new verts → translate.
    """
    ret        = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
    quad_verts = ret['verts']

    # create_grid size=1.0 → spans X: [−1..+1] (= 2 m = PANEL_W) and Y: [−1..+1].
    # Scale Y axis to PANEL_H/2 so the face spans [−0.6..+0.6] (= 1.2 m = PANEL_H).
    bmesh.ops.scale(bm, verts=quad_verts, vec=Vector((1.0, PANEL_H / 2.0, 1.0)))

    # Rotate from XY (normal = +Z) into XZ plane (normal = +Y).
    # +90° around X: (x, y, z) → (x, −z, y); normal (0,0,1) → (0,1,0) ✓
    bmesh.ops.rotate(
        bm, verts=quad_verts, cent=Vector(),
        matrix=Matrix.Rotation(math.radians(90.0), 3, 'X'),
    )

    bm.faces.ensure_lookup_table()
    front_face = bm.faces[0]   # the one quad, now at Y=0, normal ≈ +Y

    # Extrude the front face region.  ret['geom'] holds ONLY the new geometry
    # (verts, edges, faces) — originals are unchanged and still at Y=0.
    ret_ext   = bmesh.ops.extrude_face_region(bm, geom=[front_face])
    new_verts = [e for e in ret_ext['geom'] if isinstance(e, bmesh.types.BMVert)]

    # Push new verts into the wall (−Y).  Side walls span Y=0 to Y=−PANEL_D.
    bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0.0, -PANEL_D, 0.0)))

    # Flood-fill consistent outward normals — side walls can wind incorrectly
    # when the source face is CCW from one direction and CW from another.
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return front_face


# ── Phase 2: recessed window panel ───────────────────────────────────────────────
def cut_window_recess(bm, front_face):
    """
    inset_individual on the front face:
      thickness=INSET_BORDER → four narrow border quads around the perimeter
      depth=−INSET_DEPTH    → the inner face is pushed along −normal (into panel)

    'depth' is signed along the face normal.  Front normal = +Y → depth < 0
    moves the inner face in the −Y direction (recessed into the slab).

    inset_individual operates on one face at a time; for a multi-face region
    inset (one border for the whole selection) use bmesh.ops.inset_region instead.
    """
    bmesh.ops.inset_individual(
        bm,
        faces=[front_face],
        thickness=INSET_BORDER,
        depth=-INSET_DEPTH,
        use_even_offset=True,
        use_relative_offset=False,
    )
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))


# ── Phase 3: chamfer the outer silhouette ────────────────────────────────────────
def bevel_outer_silhouette(bm):
    """
    Collect edges that separate the front face from the side faces, then apply
    bmesh.ops.bevel.

    Selection criterion: exactly 2 link faces, one with normal.y > 0.8 (front or
    back), one with |normal.y| < 0.4 (top, bottom, or side).  This targets only
    the four long 'corner' edges at the front-face perimeter — not interior edges.

    segments=2: the chamfer receives one intermediate loop → 2 strip faces.
    That midpoint loop holds specular highlights in real-time rendering and is
    the standard hard-surface 'highlight bevel' pattern.  segments=1 gives a
    flat cut; segments≥3 adds geometry without improving the visual payoff.

    profile=0.5: circular arc profile (default).  Use 0.0 for a straight cut or
    1.0 for a convex profile.
    """
    silhouette = [
        e for e in bm.edges
        if len(e.link_faces) == 2
        and any(f.normal.y > 0.8  for f in e.link_faces)
        and any(abs(f.normal.y) < 0.4 for f in e.link_faces)
    ]
    if not silhouette:
        return
    bmesh.ops.bevel(
        bm,
        geom=silhouette,
        offset=BEVEL_OFFSET,
        segments=BEVEL_SEGS,
        affect='EDGES',
        profile=0.5,
        loop_slide=True,   # slides verts along adjacent edges — keeps quads square
    )


# ── Phase 4: conduit tube via bridge_loops ───────────────────────────────────────
def add_conduit(bm, x_pos, z_top=0.52, z_bot=-0.52):
    """
    create_circle × 2 + bridge_loops = a closed cylinder tube.

    create_circle with cap_ends=False produces a pure edge ring (no faces).
    bridge_loops stitches two matching rings together with quad faces.
    The two rings MUST be in the same BMesh and have the same segment count.

    Edge gathering: all edges whose BOTH endpoints belong to the ring vert set.
    set membership lookup is O(1); iterating bm.edges is O(E) total — fast
    enough for meshes of this scale.  Do NOT call edges.ensure_lookup_table()
    before this loop; it's not needed for iteration, only for integer indexing.

    fill + triangulate caps the open circle ends and converts the n-gon cap
    to triangles — glTF requires triangles or quads; n-gons with n > 4 are not
    valid in all loaders.
    """
    y_pos = CONDUIT_R   # tube centre sits flush on the front panel surface

    # Top circle ring — horizontal (XY plane), centre at (x_pos, y_pos, z_top)
    mat_top  = Matrix.Translation(Vector((x_pos, y_pos, z_top)))
    ret_top  = bmesh.ops.create_circle(
        bm, cap_ends=False, cap_tris=False,
        segments=CONDUIT_SEGS, radius=CONDUIT_R, matrix=mat_top,
    )
    top_vset = set(ret_top['verts'])

    # Bottom circle ring — same radius/orientation at z_bot
    mat_bot  = Matrix.Translation(Vector((x_pos, y_pos, z_bot)))
    ret_bot  = bmesh.ops.create_circle(
        bm, cap_ends=False, cap_tris=False,
        segments=CONDUIT_SEGS, radius=CONDUIT_R, matrix=mat_bot,
    )
    bot_vset = set(ret_bot['verts'])

    # Gather edges of each ring by vert set membership
    bm.edges.ensure_lookup_table()
    top_edges = [e for e in bm.edges if e.verts[0] in top_vset and e.verts[1] in top_vset]
    bot_edges = [e for e in bm.edges if e.verts[0] in bot_vset and e.verts[1] in bot_vset]

    # Bridge the two rings into a quad cylinder
    bmesh.ops.bridge_loops(bm, edges=top_edges + bot_edges)

    # Cap the open ends; triangulate the n-gon caps for glTF safety
    caps = (
        bmesh.ops.fill(bm, edges=top_edges, use_beauty=True)['faces']
        + bmesh.ops.fill(bm, edges=bot_edges, use_beauty=True)['faces']
    )
    if caps:
        bmesh.ops.triangulate(bm, faces=caps)


# ── Phase 5: assemble, material, export ─────────────────────────────────────────
def build_and_export():
    clean_scene()

    bm = bmesh.new()
    try:
        front_face = build_panel_slab(bm)
        cut_window_recess(bm, front_face)
        bevel_outer_silhouette(bm)
        add_conduit(bm, x_pos=-0.90)   # left conduit
        add_conduit(bm, x_pos=+0.90)   # right conduit

        me = bpy.data.meshes.new(OBJECT_NAME)
        bm.to_mesh(me)
        # calc_normals_split computes custom split-normal data so the bevel
        # highlight loops shade as a smooth band rather than hard-faceted strips.
        me.calc_normals_split()
    finally:
        bm.free()   # must always call free() — bmesh holds a C allocation that
                    # Python's GC does NOT release; leak persists until next file-open

    ob = bpy.data.objects.new(OBJECT_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob["holoflow:facet"] = True   # marks object for holoflow exporter pipeline

    # Two-material setup: dark alloy casing + brass conduit pipe
    me.materials.append(make_material("panel_alloy",  (0.10, 0.14, 0.18, 1.0), 0.80, 0.30))
    me.materials.append(make_material("conduit_pipe", (0.52, 0.40, 0.22, 1.0), 0.45, 0.55))

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//scifi_panel_prop.blend"))

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[blueprint] Exported → {bpy.path.abspath(EXPORT_PATH)}")


if __name__ == "__main__":
    build_and_export()
