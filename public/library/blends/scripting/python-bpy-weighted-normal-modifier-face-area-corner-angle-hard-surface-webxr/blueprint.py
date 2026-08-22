"""
WeightedNormalModifier — Face-Area, Corner-Angle & Face-With-Angle Modes
Hard-Surface Console-Lid Prop · Blender 5.1 · CC0

Technique:
  WeightedNormalModifier rewrites the custom normal field on the evaluated
  mesh so each vertex normal is a weighted blend of adjacent face normals.
  Three modes control how each face is weighted:
    FACE_AREA        — large structural faces dominate; small bevel strips
                       are suppressed proportionally to their tiny area.
    CORNER_ANGLE     — faces at wide angles to the vertex dominate; tight
                       bevel faces sit at a narrow angle and are suppressed.
    FACE_WITH_ANGLE  — product of area × angle; strongest suppression.

  On a chamfered hard-surface prop the standard average normal produces a
  visible gradient across every bevel strip, making the surface look
  plasticky and slightly blurred. WeightedNormal eliminates that gradient
  so the large flat zones read as perfectly flat while edges remain crisp.

  Normals are evaluated at export time; the GLB NORMAL accessor contains
  the WeightedNormal result verbatim. No post-process step required.

Author: Holoflow Studio · CC0
"""

import bpy
import bmesh
import math

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PANEL_W     = 3.0     # metres
PANEL_D     = 2.0
PANEL_H     = 0.35
INSET_OFFS  = 0.22    # raised-panel border width
RAISE_H     = 0.07    # height of raised centre panel above slab top
BEVEL_W     = 0.045   # chamfer width on all edges
BEVEL_SEGS  = 2       # bevel loop count — keep ≤2 for WebXR poly budget
BASE_MAT    = (0.20, 0.26, 0.38, 1.0)   # steel-blue base colour
ROUGHNESS   = 0.40
METALLIC    = 0.65
EXPORT_GLB  = "//hf_weighted_console_lid.glb"
EXPORT_BLEND = "//hf_weighted_console_lid.blend"

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for me in list(bpy.data.meshes):
    if me.users == 0:
        bpy.data.meshes.remove(me)
for ma in list(bpy.data.materials):
    if ma.users == 0:
        bpy.data.materials.remove(ma)


# ---------------------------------------------------------------------------
# Build mesh helper
# ---------------------------------------------------------------------------
def build_console_lid(name: str) -> bpy.types.Object:
    """
    Construct the console-lid mesh with bmesh:
      - rectangular slab (6 faces)
      - top face inset to form a border ring (bmesh.ops.inset_individual)
      - inner face extruded upward to create the raised panel

    Using inset_individual is preferable to create_grid because it keeps
    the border quad ring in one operation without manual vertex arithmetic.
    """
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()

    hw, hd, hh = PANEL_W * 0.5, PANEL_D * 0.5, PANEL_H * 0.5

    # outer box — manual face winding keeps normals outward
    v = [
        bm.verts.new((-hw, -hd, -hh)),
        bm.verts.new(( hw, -hd, -hh)),
        bm.verts.new(( hw,  hd, -hh)),
        bm.verts.new((-hw,  hd, -hh)),
        bm.verts.new((-hw, -hd,  hh)),
        bm.verts.new(( hw, -hd,  hh)),
        bm.verts.new(( hw,  hd,  hh)),
        bm.verts.new((-hw,  hd,  hh)),
    ]
    bm.faces.new([v[0], v[3], v[2], v[1]])  # bottom (-Z)
    bm.faces.new([v[0], v[1], v[5], v[4]])  # front  (-Y)
    bm.faces.new([v[1], v[2], v[6], v[5]])  # right  (+X)
    bm.faces.new([v[2], v[3], v[7], v[6]])  # back   (+Y)
    bm.faces.new([v[3], v[0], v[4], v[7]])  # left   (-X)
    top_face = bm.faces.new([v[4], v[5], v[6], v[7]])  # top (+Z)

    # inset top face — creates a border ring + smaller inner quad
    res = bmesh.ops.inset_individual(
        bm,
        faces=[top_face],
        thickness=INSET_OFFS,
        depth=0.0,
        use_even_offset=True,
    )
    inner = res['faces'][0]

    # extrude inner quad upward to form raised panel
    ex = bmesh.ops.extrude_face_region(bm, geom=[inner], use_keep_orig=False)
    raised_verts = [e for e in ex['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=raised_verts, vec=(0.0, 0.0, RAISE_H))

    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------------------
# Material
# ---------------------------------------------------------------------------
mat = bpy.data.materials.new("hf_lid_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = BASE_MAT
    bsdf.inputs['Roughness'].default_value  = ROUGHNESS
    bsdf.inputs['Metallic'].default_value   = METALLIC


# ---------------------------------------------------------------------------
# Build three variants — one per WeightedNormal mode — offset in X
# ---------------------------------------------------------------------------
VARIANTS = [
    ("hf_wn_face_area",        'FACE_AREA',        0.0),
    ("hf_wn_corner_angle",     'CORNER_ANGLE',     4.5),
    ("hf_wn_face_with_angle",  'FACE_WITH_ANGLE', -4.5),
]

main_obj = None
for vname, wn_mode, x_off in VARIANTS:
    ob = build_console_lid(vname)
    ob.location.x = x_off
    ob.data.materials.append(mat)

    # shade_smooth is mandatory — flat shading discards custom normals silently
    with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
        bpy.ops.object.shade_smooth()

    # BevelModifier — chamfer every edge uniformly
    bev = ob.modifiers.new("Bevel", 'BEVEL')
    bev.width            = BEVEL_W
    bev.segments         = BEVEL_SEGS
    bev.limit_method     = 'NONE'
    bev.miter_outer      = 'MITER_ARC'
    bev.use_clamp_overlap = True
    bev.profile          = 0.5

    # WeightedNormalModifier — must sit AFTER Bevel to recalculate normals
    # on the bevel-modified geometry, not on the pre-chamfer base mesh.
    wn = ob.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
    wn.mode           = wn_mode
    # weight: 1–100. 100 = fully weighted; lower values blend toward a
    # plain area-averaged normal. Below ~60 the visual difference vs no
    # modifier is barely perceptible.
    wn.weight         = 100
    # face_influence: respect Mark Sharp / sharp_edge boolean attribute as a
    # hard shading boundary. Without this flag WeightedNormal bleeds normals
    # across intended crease edges.
    wn.face_influence = True
    # keep_sharp: preserve any sharp_edge flags already present on the mesh
    # after earlier modifier evaluation. Consistent with the studio's
    # sharp_edge pipeline (see edge-sharp-crease-seam tutorial).
    wn.use_keep_sharp = True

    # vertex-group masking: vertices with weight 1.0 receive the full
    # WeightedNormal result; weight 0.0 falls back to standard averaging.
    # Here the raised panel top verts get weight 1.0 (full WN) so their
    # normals strongly bias toward the dominant flat panel face.
    vg = ob.vertex_groups.new(name="panel_raised")
    z_thresh = PANEL_H * 0.5 + RAISE_H * 0.5
    raised_idxs = [v.index for v in ob.data.vertices if v.co.z > z_thresh]
    if raised_idxs:
        vg.add(raised_idxs, 1.0, 'REPLACE')
    wn.vertex_group = vg.name

    if x_off == 0.0:
        main_obj = ob


# ---------------------------------------------------------------------------
# Camera + lighting
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50.0
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (0.0, -6.5, 4.0)
cam.rotation_euler = (math.radians(52), 0.0, 0.0)
bpy.context.scene.camera = cam

sun_data = bpy.data.lights.new("Sun", 'SUN')
sun_data.energy = 3.0
sun = bpy.data.objects.new("Sun", sun_data)
bpy.context.collection.objects.link(sun)
sun.rotation_euler = (math.radians(55), 0.0, math.radians(25))


# ---------------------------------------------------------------------------
# Save .blend
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=EXPORT_BLEND)


# ---------------------------------------------------------------------------
# Export main object (FACE_AREA variant) as GLB
# ---------------------------------------------------------------------------
# The glTF exporter reads the evaluated mesh from the depsgraph.
# export_normals=True writes the WeightedNormal result into the NORMAL
# accessor. Three.js receives the normals verbatim with no recomputation.

for ob in bpy.data.objects:
    ob.select_set(ob is main_obj)
bpy.context.view_layer.objects.active = main_obj

bpy.ops.export_scene.gltf(
    filepath            = EXPORT_GLB,
    use_selection       = True,
    export_format       = 'GLB',
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = 'WEBP',
    export_apply        = True,
    export_normals      = True,
)

print("[holoflow] Exported →", EXPORT_GLB)
