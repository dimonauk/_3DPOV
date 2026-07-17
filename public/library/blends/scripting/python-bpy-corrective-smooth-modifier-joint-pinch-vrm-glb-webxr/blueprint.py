"""
CorrectiveSmoothModifier — Joint Pinch Mitigation for VRM Arms
Blender 5.1  |  bpy.types.CorrectiveSmoothModifier
Blueprint: Holoflow Studio  |  CC0 — No Rights Reserved

Technique: A two-bone arm tube demonstrates how CorrectiveSmoothModifier
eliminates vertex pinching at the elbow fold. The modifier sits AFTER the
Armature modifier in the stack and reads the already-deformed geometry each
frame, then smooths verts back toward their ORCO (object-data rest) positions.
The gradient vertex-group mask restricts the effect to the elbow zone so
the stable shoulder and wrist hulls remain completely unaffected.

ORCO vs BIND: ORCO (default) uses the mesh's original vertex coordinates as
the rest reference and requires no explicit bind step. BIND captures a custom
arbitrary pose as the rest; use it only when your rest mesh is NOT your T-pose.
For standard VRM rigs T-pose == rest-pose, so ORCO is always the right choice.

Run headless:
    blender --background --python blueprint.py
Or paste into Blender's Text Editor and press Run Script.
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG           = "hf_corrective_smooth_arm"
ARM_RADIUS     = 0.07         # tube cross-section radius (m)
ARM_HEIGHT     = 1.6          # full arm length (m)
SEGS_CIRC      = 16           # circumferential resolution (polygon count)
SEGS_LONG      = 12           # longitudinal segments; more = smoother CS result
ELBOW_Z        = 0.0          # elbow pivot in local Z
ELBOW_HALF     = 0.30         # half-height of CS vertex-group mask (m)
CS_FACTOR      = 0.90         # corrective smooth influence [0=none, 1=full]
CS_ITERATIONS  = 14           # smoothing passes; 10-16 covers most joints
BEND_ANGLE_DEG = -100         # forearm bend angle (degrees, negative = forward)
EXPORT_GLB     = "//hf_corrective_smooth_arm.glb"
BLEND_SAVE     = "//hf_corrective_smooth_arm.blend"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 48
scene.render.fps = 24

# ── Tube mesh (open cylinder via from_pydata) ─────────────────────────────────
# Using from_pydata rather than bmesh.ops.create_cylinder gives us explicit
# control over ring count (SEGS_LONG) without needing to subdivide after.
def build_tube(radius, height, circ, segs):
    verts, faces = [], []
    rings = segs + 1
    for r in range(rings):
        z = -height * 0.5 + height * r / segs
        for s in range(circ):
            a = math.tau * s / circ
            verts.append((math.cos(a) * radius, math.sin(a) * radius, z))
    for r in range(segs):
        for s in range(circ):
            sn = (s + 1) % circ
            v0 = r * circ + s
            v1 = r * circ + sn
            v2 = (r + 1) * circ + sn
            v3 = (r + 1) * circ + s
            faces.append((v0, v1, v2, v3))
    return verts, faces

me = bpy.data.meshes.new(SLUG)
verts, faces = build_tube(ARM_RADIUS, ARM_HEIGHT, SEGS_CIRC, SEGS_LONG)
me.from_pydata(verts, [], faces)
me.update()

for p in me.polygons:
    p.use_smooth = False   # faceted cel-shade silhouette

obj = bpy.data.objects.new(SLUG, me)
scene.collection.objects.link(obj)

# ── Vertex groups ─────────────────────────────────────────────────────────────
# upper_arm / lower_arm: deform groups for the Armature modifier.
# elbow_zone: gradient mask for CorrectiveSmoothModifier only — NOT a deform group.
vg_up = obj.vertex_groups.new(name="upper_arm")
vg_lo = obj.vertex_groups.new(name="lower_arm")
vg_el = obj.vertex_groups.new(name="elbow_zone")

for v in me.vertices:
    z = v.co.z
    lo = ELBOW_Z - ELBOW_HALF
    hi = ELBOW_Z + ELBOW_HALF

    # Linear blend in the elbow zone; outside → full ownership to one bone.
    if z >= hi:
        wu, wl = 1.0, 0.0
    elif z <= lo:
        wu, wl = 0.0, 1.0
    else:
        # t goes from 0 (lower boundary) to 1 (upper boundary)
        t = (z - lo) / (2 * ELBOW_HALF)
        wu, wl = t, 1.0 - t

    vg_up.add([v.index], wu, 'REPLACE')
    vg_lo.add([v.index], wl, 'REPLACE')

    # CS mask: 1.0 at elbow centre, 0.0 at boundary — smooth falloff prevents
    # a hard seam between corrected and uncorrected regions.
    if lo < z < hi:
        w_el = 1.0 - abs(z - ELBOW_Z) / ELBOW_HALF
        vg_el.add([v.index], w_el, 'REPLACE')

# ── Armature (2-bone chain) ────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new("ArmRig")
arm_data.display_type = 'STICK'
rig = bpy.data.objects.new("ArmRig", arm_data)
scene.collection.objects.link(rig)

bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

b_upper = eb.new("upper_arm")
b_upper.head = Vector((0, 0, -ARM_HEIGHT * 0.5))
b_upper.tail = Vector((0, 0,  ELBOW_Z))

b_lower = eb.new("lower_arm")
b_lower.head      = Vector((0, 0, ELBOW_Z))
b_lower.tail      = Vector((0, 0,  ARM_HEIGHT * 0.5))
b_lower.parent    = b_upper
b_lower.use_connect = True

bpy.ops.object.mode_set(mode='OBJECT')

# ── Modifiers ─────────────────────────────────────────────────────────────────
# 1. Armature — skinning: deforms mesh via vertex-group weights
arm_mod = obj.modifiers.new("Armature", 'ARMATURE')
arm_mod.object            = rig
arm_mod.use_vertex_groups = True

# 2. CorrectiveSmoothModifier — must be AFTER Armature in the stack.
# If placed before, it reads un-deformed rest geometry and has zero effect.
cs = obj.modifiers.new("CorrectiveSmooth", 'CORRECTIVE_SMOOTH')

# ORCO: mesh.vertices[i].co in object space (the T-pose) is the rest reference.
# Each frame the modifier computes how far each vert moved from rest, then
# pulls it back toward a Laplacian-smoothed version of the deformed mesh.
cs.rest_source = 'ORCO'

# LENGTH_WEIGHTED: neighbour smoothing weight = 1 / edge_length.
# Longer edges pull harder, preserving volume on varying-density topology.
# Use SIMPLE only for very uniform grids (less overhead, same quality there).
cs.smooth_type = 'LENGTH_WEIGHTED'

cs.factor     = CS_FACTOR
cs.iterations = CS_ITERATIONS

# Restrict to elbow_zone VG. Outside the mask the modifier reads 0-weight and
# contributes nothing — this is cheaper than a masking Vertex Weight modifier.
cs.vertex_group        = vg_el.name
cs.invert_vertex_group = False

# use_only_smooth=False: smooth ALL verts inside the mask, not just those
# whose displacement exceeds a threshold. True mode leaves stationary-ish verts
# untouched but creates discontinuous seams at the VG boundary.
cs.use_only_smooth  = False

# use_pin_boundary=False: allow all verts (including open boundary rings) to
# shift. True freezes open-mesh boundary loops — correct for cloth edges that
# must not drift, wrong here because we want the tube open ends free.
cs.use_pin_boundary = False

# scale: world-space multiplier for the ORCO reference. At default 1.0 the
# modifier assumes object.scale == (1,1,1). If you later apply a non-uniform
# scale to the arm, update this to match or the smoothing target drifts.
cs.scale = 1.0

# ── Parent mesh to rig (without adding another armature modifier) ─────────────
obj.parent = rig

# ── Pose: elbow bend animation ────────────────────────────────────────────────
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')
pb = rig.pose.bones["lower_arm"]
pb.rotation_mode = 'XYZ'

for fr, deg in [(1, 0), (24, BEND_ANGLE_DEG), (48, 0)]:
    scene.frame_set(fr)
    pb.rotation_euler = (math.radians(deg), 0, 0)
    pb.keyframe_insert("rotation_euler", frame=fr)

for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

bpy.ops.object.mode_set(mode='OBJECT')
scene.frame_set(1)

# ── Toon material ─────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(f"{SLUG}_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new('ShaderNodeOutputMaterial')
toon = nt.nodes.new('ShaderNodeBsdfToon')
toon.component                      = 'DIFFUSE'
toon.inputs['Color'].default_value  = (0.82, 0.30, 0.14, 1.0)
toon.inputs['Size'].default_value   = 0.55
toon.inputs['Smooth'].default_value = 0.06
nt.links.new(toon.outputs['BSDF'], out.inputs['Surface'])
obj.data.materials.append(mat)

# ── Lighting (simple 3-point rig) ─────────────────────────────────────────────
def add_sun(name, energy, angle_xy, angle_z):
    ld = bpy.data.lights.new(name, 'SUN')
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.rotation_euler = (math.radians(angle_xy), 0, math.radians(angle_z))
    return lo

add_sun("Key",  4.0, 50,   30)
add_sun("Fill", 1.5, 60, -120)
add_sun("Rim",  2.0, 20,  170)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 70
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location      = (0, -3.5, 0.4)
cam.rotation_euler = (math.radians(90), 0, 0)

# ── GLB export (rest pose — frame 1, full stack baked) ────────────────────────
bpy.ops.export_scene.gltf(
    filepath         = bpy.path.abspath(EXPORT_GLB),
    export_format    = 'GLB',
    export_apply     = True,    # bakes full modifier stack into exported geometry
    export_normals   = True,    # write face normals; Three.js reads verbatim
    export_materials = 'EXPORT',
    export_yup       = True,    # +Y up for WebXR / Three.js convention
    use_selection    = False,
)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_SAVE))
print(f"[holoflow] Blueprint complete → {EXPORT_GLB}")
