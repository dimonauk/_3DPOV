"""
GN Separate Geometry — Procedural Dissection and Exploded-View Animation
Blender 5.1 | CC0 | Holoflow Studio

Technique:
    GeometryNodeSeparateGeometry accepts a boolean FIELD and returns TWO live
    geometry outputs: the matched elements (socket 0 "Selection") and their
    complement (socket 1 "Inverted").  This is the critical distinction from
    GeometryNodeDeleteGeometry, which permanently removes matched elements and
    cannot be reversed dynamically.  With Separate Geometry both halves remain
    live throughout the modifier stack, so a single Group Input float socket
    (Explode_Gap) can animate the dissection non-destructively at any time.

    GeometryNodeBoundingBox provides the adaptive separation distance: its
    Max.Z output equals the upper-hemisphere roof height, so multiplying by
    Explode_Gap gives a world-space lift that precisely clears the two halves
    at Gap = 1.0 regardless of sphere radius or scale.

    Domain = 'FACE' is chosen over 'EDGE' or 'POINT' because the equatorial
    ring of faces is the natural seam boundary.  POINT domain would include
    equatorial vertices in BOTH halves (a vertex touching two faces of
    opposing polarity belongs to whichever half first claims it — undefined
    order), leaving dangling interior geometry.

Usage:
    Open Blender ▸ Scripting workspace ▸ Open this file ▸ Run Script.
    Saves to: <blend_dir>/dissection_exploded.blend
    GLB at:   <blend_dir>/dissection_exploded.glb   (mid-dissection, frame 30)
"""

import bpy
import math
from pathlib import Path

# ── Parameters ────────────────────────────────────────────────────────────────
SEGMENTS      = 24       # UV sphere longitude divisions
RINGS         = 16       # UV sphere latitude divisions
SPHERE_R      = 1.0
SPLIT_Z       = 0.0      # world-Z of the dissection plane
EXPLODE_FRAMES = 60      # total animation length (frames)
EXPORT_FRAME  = 30       # frame to freeze for GLB snapshot
DRACO_LEVEL   = 6

SHELL_COLOR   = (0.85, 0.42, 0.08, 1.0)   # amber — outer rock surface
CORE_COLOR    = (0.04, 0.38, 0.52, 1.0)   # teal  — inner mineral face

OUT_DIR    = Path(bpy.path.abspath("//"))
BLEND_FILE = OUT_DIR / "dissection_exploded.blend"
GLB_FILE   = OUT_DIR / "dissection_exploded.glb"

# ── Reset ─────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.fps    = 30
scene.frame_start   = 1
scene.frame_end     = EXPLODE_FRAMES

# ── Materials ─────────────────────────────────────────────────────────────────
def _mat(name: str, color: tuple) -> bpy.types.Material:
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    links = m.node_tree.links
    nodes.clear()
    b = nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value  = 0.70
    b.inputs["Metallic"].default_value   = 0.08
    o = nodes.new("ShaderNodeOutputMaterial")
    links.new(b.outputs["BSDF"], o.inputs["Surface"])
    return m

shell_mat = _mat("shell_amber", SHELL_COLOR)
core_mat  = _mat("core_teal",   CORE_COLOR)

# ── Mesh ──────────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SEGMENTS, ring_count=RINGS,
    radius=SPHERE_R, location=(0, 0, 0),
)
obj = bpy.context.active_object
obj.name = "dissection_sphere"
bpy.ops.object.shade_flat()

obj.data.materials.append(shell_mat)
obj.data.materials.append(core_mat)

# ── Geometry Nodes modifier ──────────────────────────────────────────────────
mod = obj.modifiers.new("Dissect", "NODES")
ng  = bpy.data.node_groups.new("GN_Dissect", "GeometryNodeTree")
mod.node_group = ng

nd = ng.nodes
lk = ng.links

# Interface sockets
ng.interface.new_socket("Geometry",   in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry",   in_out="OUTPUT", socket_type="NodeSocketGeometry")
gap_sock = ng.interface.new_socket(
    "Explode_Gap", in_out="INPUT", socket_type="NodeSocketFloat"
)
gap_sock.default_value = 0.0
gap_sock.min_value     = 0.0
gap_sock.max_value     = 1.5
gap_id = gap_sock.identifier   # e.g. "Socket_2" — needed for keyframe_insert

# ── Group in/out ─────────────────────────────────────────────────────────────
gin  = nd.new("NodeGroupInput");  gin.location  = (-700, 0)
gout = nd.new("NodeGroupOutput"); gout.location = (1200, 0)

# ── Field: Position.Z > SPLIT_Z → boolean selection ──────────────────────────
n_pos = nd.new("GeometryNodeInputPosition"); n_pos.location = (-560, -220)
n_xyz = nd.new("ShaderNodeSeparateXYZ");     n_xyz.location = (-360, -220)
lk.new(n_pos.outputs["Position"], n_xyz.inputs["Vector"])

n_cmp = nd.new("FunctionNodeCompare")
n_cmp.data_type = "FLOAT"
n_cmp.operation = "GREATER_THAN"
n_cmp.location  = (-160, -220)
n_cmp.inputs["B"].default_value = SPLIT_Z + 1e-4  # avoid equator ambiguity
lk.new(n_xyz.outputs["Z"], n_cmp.inputs["A"])

# ── SeparateGeometry ──────────────────────────────────────────────────────────
# outputs[0] = "Selection" (upper hemisphere, bool=True)
# outputs[1] = "Inverted"  (lower hemisphere, bool=False)
# domain='FACE': face assigned to whichever side its centre sits on — clean cut
n_sep = nd.new("GeometryNodeSeparateGeometry")
n_sep.domain   = "FACE"
n_sep.location = (60, 0)
lk.new(gin.outputs["Geometry"],   n_sep.inputs["Geometry"])
lk.new(n_cmp.outputs["Result"],   n_sep.inputs["Selection"])

# ── Material assignment ───────────────────────────────────────────────────────
n_mu = nd.new("GeometryNodeSetMaterial")
n_mu.location = (260,  130)
n_mu.inputs["Material"].default_value = shell_mat
lk.new(n_sep.outputs["Selection"], n_mu.inputs["Geometry"])

n_ml = nd.new("GeometryNodeSetMaterial")
n_ml.location = (260, -130)
n_ml.inputs["Material"].default_value = core_mat
lk.new(n_sep.outputs["Inverted"], n_ml.inputs["Geometry"])

# ── BoundingBox → adaptive gap height ────────────────────────────────────────
# BoundingBox.Max.Z = top of upper shell; × Explode_Gap = world-Z lift.
# This scales correctly with any sphere radius — no hard-coded offset needed.
n_bb  = nd.new("GeometryNodeBoundingBox"); n_bb.location = (260, 340)
lk.new(n_sep.outputs["Selection"], n_bb.inputs["Geometry"])

n_bxyz = nd.new("ShaderNodeSeparateXYZ"); n_bxyz.location = (460, 340)
lk.new(n_bb.outputs["Max"], n_bxyz.inputs["Vector"])

n_mul = nd.new("ShaderNodeMath")
n_mul.operation = "MULTIPLY"
n_mul.location  = (640, 340)
lk.new(n_bxyz.outputs["Z"],           n_mul.inputs[0])
lk.new(gin.outputs["Explode_Gap"],    n_mul.inputs[1])

n_cv = nd.new("ShaderNodeCombineXYZ"); n_cv.location = (820, 340)
n_cv.inputs["X"].default_value = 0.0
n_cv.inputs["Y"].default_value = 0.0
lk.new(n_mul.outputs["Value"], n_cv.inputs["Z"])

# ── TransformGeometry: lift upper shell ───────────────────────────────────────
n_tf = nd.new("GeometryNodeTransformGeometry"); n_tf.location = (980, 130)
lk.new(n_mu.outputs["Geometry"],  n_tf.inputs["Geometry"])
lk.new(n_cv.outputs["Vector"],    n_tf.inputs["Translation"])

# ── JoinGeometry ─────────────────────────────────────────────────────────────
n_join = nd.new("GeometryNodeJoinGeometry"); n_join.location = (1160, 0)
lk.new(n_tf.outputs["Geometry"],         n_join.inputs["Geometry"])
lk.new(n_ml.outputs["Geometry"],         n_join.inputs["Geometry"])
lk.new(n_join.outputs["Geometry"],       gout.inputs["Geometry"])

# ── Animate Explode_Gap ───────────────────────────────────────────────────────
mod[gap_id] = 0.0
mod.keyframe_insert(data_path=f'["{gap_id}"]', frame=1)
mod[gap_id] = 1.0
mod.keyframe_insert(data_path=f'["{gap_id}"]', frame=EXPLODE_FRAMES)

for fc in obj.animation_data.action.fcurves:
    if gap_id in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing        = "EASE_IN_OUT"

# ── Camera ────────────────────────────────────────────────────────────────────
cam = bpy.data.cameras.new("Camera")
cam_obj = bpy.data.objects.new("Camera", cam)
scene.collection.objects.link(cam_obj)
cam_obj.location       = (2.8, -2.8, 1.4)
cam_obj.rotation_euler = (math.radians(68), 0, math.radians(45))
scene.camera = cam_obj

# ── Lights ────────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("Sun", "SUN"); sun.energy = 3.5
sun_obj = bpy.data.objects.new("Sun", sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(30))

fill = bpy.data.lights.new("Fill", "AREA"); fill.energy = 55.0
fill.color = (0.35, 0.65, 1.0)
fill_obj = bpy.data.objects.new("Fill", fill)
scene.collection.objects.link(fill_obj)
fill_obj.location = (-2.0, 2.0, 0.4)

# ── Save ──────────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_FILE))

# ── Export GLB ────────────────────────────────────────────────────────────────
scene.frame_set(EXPORT_FRAME)
bpy.ops.export_scene.gltf(
    filepath=str(GLB_FILE),
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_animations=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format="WEBP",
)
print(f"✓ blend  → {BLEND_FILE}")
print(f"✓ GLB    → {GLB_FILE}")
