"""
CurveModifier + ArrayModifier (FIT_CURVE): Path-Following Ribbon
================================================================
Blender 5.1 | CC0 | Holoflow Studio

Technique
---------
CurveModifier bends a mesh so that its local deform axis follows the
tangent of a Bezier/NURBS curve. ArrayModifier with fit_type='FIT_CURVE'
tiles a profile cross-section until the total length equals the curve arc
length. Together they produce a non-destructive path-following shape.

Modifier stack on the ribbon object (evaluation order = bottom → top in UI):
  Weld   → merge tile-junction vertices (0.1 mm threshold)
  Array  → FIT_CURVE count, relative offset along +X
  Curve  → deform_axis='POS_X', object = path curve

Why not Geometry Nodes (Curve to Mesh)?
  CurveToMesh GN API changed between 3.x, 4.x, and 5.x. This modifier
  stack has been stable since 2.80. UVs on the profile tile carry through
  to every instance with no GN Spline Parameter baking required.

Failure modes (all are footguns — read before touching)
---------------------------------------------------------
  Origin mismatch:   profile ob.location must equal (0,0,0) before modifiers.
                     CurveModifier offsets verts relative to the curve object's
                     origin; a non-zero profile origin shifts the whole ribbon.
  Unapplied scale:   FIT_CURVE count = curve_length / (tile_len * ob.scale.x).
                     An unconfirmed scale factor doubles tile count silently.
                     Apply scale on BOTH objects before adding modifiers.
  Wrong deform axis: DEFORM_AXIS must match the tile's long axis. If the
                     profile box is 0.022 m along X, use 'POS_X'. Rotating
                     the profile instead of switching deform_axis breaks FIT.
  Multi-spline curve: CurveModifier uses only the first spline. A curve with
                     two disconnected splines silently ignores the second.
  Cyclic closed path: set spline.use_cyclic_u=True and arr.fit_type='FIT_CURVE'
                     still works — tile count rounds to nearest integer, leaving
                     a small gap or overlap at the seam.
"""

import bpy
import bmesh
from mathutils import Vector

# ── Tunable constants ─────────────────────────────────────────────────────────
TILE_LEN    = 0.022    # metres — profile tile length along +X (deform axis)
RIBBON_W    = 0.038    # metres — ribbon cross-section width (Y extent)
RIBBON_T    = 0.003    # metres — ribbon thickness (Z extent)
WELD_DIST   = 0.0002   # metres — tile-junction merge threshold (> floating error)
DEFORM_AXIS = 'POS_X'
RIBBON_NAME = "hf_ribbon_accessory"
EXPORT_PATH = "//hf_ribbon_accessory.glb"


# ── Helpers ───────────────────────────────────────────────────────────────────

def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def link(ob):
    bpy.context.collection.objects.link(ob)
    return ob


def set_active_only(ob):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)


# ── Step 1 — Bezier curve path ────────────────────────────────────────────────

def build_ribbon_path() -> bpy.types.Object:
    """
    Four-point open Bezier making a loose flowing arc.
    twist_mode='MINIMUM' is essential: it minimises roll along the path,
    preventing the ribbon from spiralling. 'TANGENT' would roll at inflections.
    use_path=True enables path-length evaluation used by ArrayModifier FIT_CURVE.
    """
    cu = bpy.data.curves.new("ribbon_path", 'CURVE')
    cu.dimensions    = '3D'
    cu.twist_mode    = 'MINIMUM'   # preserves ribbon orientation
    cu.use_path      = True        # required for FIT_CURVE arc-length calculation
    cu.path_duration = 100

    sp = cu.splines.new('BEZIER')
    sp.use_cyclic_u = False
    sp.bezier_points.add(3)        # add 3 → 4 total (one pre-exists)

    # Control points in the XZ plane → ribbon flows horizontally
    # Each tuple: (co, left_handle, right_handle)
    pts = [
        (( 0.000,  0.0,  0.000), (-0.050,  0.0,  0.030), ( 0.050,  0.0, -0.030)),
        (( 0.120,  0.0,  0.075), ( 0.060,  0.0,  0.110), ( 0.180,  0.0,  0.040)),
        (( 0.240,  0.0, -0.055), ( 0.180,  0.0, -0.020), ( 0.300,  0.0, -0.090)),
        (( 0.360,  0.0,  0.020), ( 0.300,  0.0,  0.060), ( 0.420,  0.0, -0.020)),
    ]
    for i, (co, hl, hr) in enumerate(pts):
        bp                    = sp.bezier_points[i]
        bp.co                 = Vector(co)
        bp.handle_left        = Vector(hl)
        bp.handle_right       = Vector(hr)
        bp.handle_left_type   = 'FREE'
        bp.handle_right_type  = 'FREE'

    ob = bpy.data.objects.new("ribbon_path", cu)
    return link(ob)


# ── Step 2 — Profile tile ─────────────────────────────────────────────────────

def build_profile_tile() -> bpy.types.Object:
    """
    Flat rectangular box aligned along +X.
    Dimensions: TILE_LEN × RIBBON_W × RIBBON_T.
    Long-edge faces (top/bottom) marked sharp for faceted shading.
    Two material slots: [0] fabric faces, [1] cap/end faces.
    Origin at (0, 0, 0) is mandatory — see failure mode note at top.
    """
    bm = bmesh.new()

    hl, hw, ht = TILE_LEN / 2, RIBBON_W / 2, RIBBON_T / 2

    verts = [
        bm.verts.new((-hl, -hw, -ht)),  # 0
        bm.verts.new((-hl,  hw, -ht)),  # 1
        bm.verts.new((-hl,  hw,  ht)),  # 2
        bm.verts.new((-hl, -hw,  ht)),  # 3
        bm.verts.new(( hl, -hw, -ht)),  # 4
        bm.verts.new(( hl,  hw, -ht)),  # 5
        bm.verts.new(( hl,  hw,  ht)),  # 6
        bm.verts.new(( hl, -hw,  ht)),  # 7
    ]

    # face_indices → (vert list, material_index)
    face_data = [
        ([0, 1, 2, 3],  1),   # −X cap  → trim slot
        ([7, 6, 5, 4],  1),   # +X cap  → trim slot
        ([4, 5, 1, 0],  0),   # −Z bottom face → fabric
        ([3, 2, 6, 7],  0),   # +Z top face    → fabric
        ([0, 3, 7, 4],  0),   # −Y side        → fabric
        ([5, 6, 2, 1],  0),   # +Y side        → fabric
    ]
    for idxs, mat_idx in face_data:
        f = bm.faces.new([verts[i] for i in idxs])
        f.material_index = mat_idx

    # Sharp edges on top/bottom long-edge boundaries → hard facet crease
    for e in bm.edges:
        zs = {round(v.co.z, 5) for v in e.verts}
        if ht in zs or -ht in zs:
            e.smooth = False

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        for loop in face.loops:
            c = loop.vert.co
            if abs(n.x) > 0.9:
                loop[uv_layer].uv = (c.y / RIBBON_W + 0.5, c.z / RIBBON_T + 0.5)
            elif abs(n.z) > 0.9:
                loop[uv_layer].uv = (c.x / TILE_LEN  + 0.5, c.y / RIBBON_W + 0.5)
            else:
                loop[uv_layer].uv = (c.x / TILE_LEN  + 0.5, c.z / RIBBON_T + 0.5)

    me = bpy.data.meshes.new(RIBBON_NAME)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(RIBBON_NAME, me)
    ob.location = (0.0, 0.0, 0.0)
    return link(ob)


# ── Step 3 — Materials ────────────────────────────────────────────────────────

def build_materials(ob: bpy.types.Object):
    def mat(name, base, rough, metal):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*base, 1.0)
        bsdf.inputs["Roughness"].default_value  = rough
        bsdf.inputs["Metallic"].default_value   = metal
        return m

    ob.data.materials.append(mat("mat_ribbon_fabric", (0.82, 0.40, 0.58), 0.75, 0.0))
    ob.data.materials.append(mat("mat_ribbon_edge",   (0.96, 0.81, 0.86), 0.40, 0.45))


# ── Step 4 — Modifier stack ───────────────────────────────────────────────────

def build_modifier_stack(ribbon_ob: bpy.types.Object, path_ob: bpy.types.Object):
    # Weld: merges spatially coincident verts from adjacent tiles.
    # mode='ALL' is correct here — tile junctions are topologically disconnected,
    # so 'CONNECTED' (only welds verts sharing an edge) would not help.
    weld = ribbon_ob.modifiers.new("Weld", 'WELD')
    weld.merge_threshold = WELD_DIST
    weld.mode            = 'ALL'

    # Array: tile count driven by curve arc length.
    arr = ribbon_ob.modifiers.new("Array", 'ARRAY')
    arr.fit_type                       = 'FIT_CURVE'
    arr.curve                          = path_ob
    arr.relative_offset_displace[0]    = 1.0   # +X by 1× tile length
    arr.relative_offset_displace[1]    = 0.0
    arr.relative_offset_displace[2]    = 0.0
    arr.use_merge_vertices             = False  # Weld handles this above

    # Curve: bend the fully tiled geometry to follow the path.
    crv = ribbon_ob.modifiers.new("Curve", 'CURVE')
    crv.object      = path_ob
    crv.deform_axis = DEFORM_AXIS


# ── Step 5 — Apply scale ──────────────────────────────────────────────────────

def apply_scale(ob: bpy.types.Object):
    """
    Apply scale before modifiers evaluate.
    FIT_CURVE count = curve_length / (TILE_LEN * ob.scale.x).
    An unapplied scale of 2× doubles the tile count and breaks the seam weld.
    """
    set_active_only(ob)
    bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)


# ── Step 6 — GLB export ───────────────────────────────────────────────────────

def export_glb():
    bpy.ops.export_scene.gltf(
        filepath            = bpy.path.abspath(EXPORT_PATH),
        export_format       = 'GLB',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
        export_apply        = True,   # collapses Weld + Array + Curve into final mesh
        export_materials    = 'EXPORT',
        export_yup          = True,   # Holoflow Studio: +Y up convention
        use_selection       = False,
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge_scene()

    path_ob   = build_ribbon_path()
    ribbon_ob = build_profile_tile()
    build_materials(ribbon_ob)

    # Apply scale BEFORE modifiers reference the curve object
    apply_scale(ribbon_ob)
    apply_scale(path_ob)

    build_modifier_stack(ribbon_ob, path_ob)

    bpy.ops.wm.save_as_mainfile(
        filepath=bpy.path.abspath("//hf_ribbon_accessory.blend"))
    export_glb()
    print("[holoflow] ribbon export complete →", EXPORT_PATH)


main()
