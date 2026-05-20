"""
Shape Keys & Morph Targets for VRM Facial Expressions — Blender 5.1
public/library/blends/rigging/shape-keys-morph-targets/blueprint.py

Shape keys (also called blend shapes or morph targets) store per-vertex
absolute positions for every named expression.  Blender computes the delta
from Basis internally and writes it to the glTF morph target.  The topology
is locked once the Basis is set: you can move vertices but never add or remove
them.  VRM 1.0 maps named shape keys to expression slots (happy, angry, blink,
phonemes) that WebXR runtimes blend in real time.

Critical Blender 5.1 note: key_block.data[i].co is an ABSOLUTE position, not
a delta.  Set it to where you want the vertex to sit in that expression —
Blender subtracts the Basis position itself when writing the morph target.

Draco compression is deliberately DISABLED.  KHR_draco_mesh_compression and
KHR_mesh_morph_targets are incompatible in the glTF 2.0 spec; exporters that
try to combine them produce malformed files.

Run headless:
    blender --background --python blueprint.py

Outputs:
    face_vrm.blend
    face_vrm.glb     (morph targets embedded, no Draco)
"""

import bpy
import bmesh
from mathutils import Vector
from pathlib import Path

# ── Output paths ──────────────────────────────────────────────────────────────
OUT_DIR   = Path(__file__).parent
BLEND_OUT = OUT_DIR / "face_vrm.blend"
GLB_OUT   = OUT_DIR / "face_vrm.glb"

# ── Sphere topology ───────────────────────────────────────────────────────────
U_SEG   = 16    # longitude slices — even number keeps left/right symmetry
V_SEG   = 10    # latitude rings — 10 distributes face features cleanly
RADIUS  = 0.8

# Post-creation scale toward face proportions
SX = 0.75   # narrower than a sphere
SY = 0.55   # faces are not deep front-to-back
SZ = 1.05   # slightly taller vertically

# ── Expression vertex displacements (world units after scale) ─────────────────
BROW_RAISE   = 0.07   # happy: outer brow corners lift in +Z
BROW_LOWER   = 0.05   # angry: inner brow drops and slides toward midline in ±X
CHEEK_RAISE  = 0.04   # happy: cheek puff toward camera in +Y
LID_CLOSE    = 0.10   # blink: upper-lid verts drop in −Z
MOUTH_OPEN_Z = 0.11   # aa: lower jaw drops in −Z
MOUTH_WIDE_X = 0.05   # happy: lip corners stretch outward in ±X
MOUTH_WIDE_Z = 0.03   # happy: lip corners also rise slightly in +Z

# ── Material colours ──────────────────────────────────────────────────────────
COLOR_SKIN  = (0.92, 0.78, 0.66, 1.0)
COLOR_DARK  = (0.55, 0.38, 0.26, 1.0)
CEL_CUTOFF  = 0.35   # CONSTANT ramp step position


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Scene reset
# ─────────────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for blk in list(bpy.data.meshes) + list(bpy.data.materials):
    bpy.data.batch_remove([blk])


# ─────────────────────────────────────────────────────────────────────────────
# 2.  Build UV-sphere face proxy via bmesh
#     Poles at ±Z.  Face points toward +Y (front view).
#     After scale: front-face verts have y ≈ 0.3–0.55.
# ─────────────────────────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new("face_vrm")
obj  = bpy.data.objects.new("face_vrm", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=U_SEG, v_segments=V_SEG, radius=RADIUS)

for v in bm.verts:
    v.co.x *= SX
    v.co.y *= SY
    v.co.z *= SZ

bm.to_mesh(mesh)
bm.free()
mesh.update()


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Flat shading — per-face normal, not interpolated (studio convention)
# ─────────────────────────────────────────────────────────────────────────────
for poly in mesh.polygons:
    poly.use_smooth = False


# ─────────────────────────────────────────────────────────────────────────────
# 4.  Cel-shade material — Shader-to-RGB CONSTANT ramp
#     Same pattern as flat-shaded-faceted-normals and hard-surface tutorials.
# ─────────────────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name="face_cel")
mat.use_nodes = True
nt = mat.node_tree
for node in nt.nodes:
    nt.nodes.remove(node)

out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location   = (700, 0)
emit  = nt.nodes.new("ShaderNodeEmission");         emit.location  = (500, 0)
ramp  = nt.nodes.new("ShaderNodeValToRGB");         ramp.location  = (280, 0)
s2rgb = nt.nodes.new("ShaderNodeShaderToRGB");      s2rgb.location = (60,  0)
diff  = nt.nodes.new("ShaderNodeBsdfDiffuse");      diff.location  = (-160, 0)

diff.inputs["Color"].default_value = COLOR_SKIN
ramp.color_ramp.interpolation = "CONSTANT"
ramp.color_ramp.elements[0].position  = 0.0
ramp.color_ramp.elements[0].color     = COLOR_DARK
ramp.color_ramp.elements[1].position  = CEL_CUTOFF
ramp.color_ramp.elements[1].color     = COLOR_SKIN

nt.links.new(diff.outputs["BSDF"],   s2rgb.inputs["Shader"])
nt.links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"],  emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

obj.data.materials.append(mat)


# ─────────────────────────────────────────────────────────────────────────────
# 5.  Zone helper — selects vertex indices by world-space bounding box
#     Called once per expression zone; position-based so it survives topology
#     changes across Blender versions (unlike hard-coded index lists).
# ─────────────────────────────────────────────────────────────────────────────
def zone(verts, *, x=(None, None), y=(None, None), z=(None, None)):
    """Return indices of verts whose co falls within the specified ranges."""
    xlo, xhi = (x[0] if x[0] is not None else -9), (x[1] if x[1] is not None else 9)
    ylo, yhi = (y[0] if y[0] is not None else -9), (y[1] if y[1] is not None else 9)
    zlo, zhi = (z[0] if z[0] is not None else -9), (z[1] if z[1] is not None else 9)
    return [
        v.index for v in verts
        if xlo <= v.co.x <= xhi
        and ylo <= v.co.y <= yhi
        and zlo <= v.co.z <= zhi
    ]


# ─────────────────────────────────────────────────────────────────────────────
# 6.  Shape keys
#     Basis must be added first and its data must NOT be modified.
#     All subsequent keys start from_mix=False so each is an independent
#     expression from the rest pose, not a cumulative stack.
# ─────────────────────────────────────────────────────────────────────────────
basis = obj.shape_key_add(name="Basis")
basis.interpolation = "KEY_LINEAR"

verts = mesh.vertices

# ── helper: clone Basis positions into a new key then apply offsets ───────────
def add_key(name, offsets: dict):
    """offsets: {vert_index: Vector(dx, dy, dz)}"""
    kb = obj.shape_key_add(name=name, from_mix=False)
    kb.interpolation = "KEY_LINEAR"
    for idx, delta in offsets.items():
        kb.data[idx].co += delta
    return kb


# ── Blink_L — left-eye upper-lid closes in −Z ────────────────────────────────
# Left eye: x in [-0.55, -0.10], front half (y > 0.05), upper face (z > 0.10)
lid_L = zone(verts, x=(-0.55, -0.10), y=(0.05, 9), z=(0.10, 0.55))
add_key("Fcl_EYE_Close_L", {i: Vector((0, 0, -LID_CLOSE)) for i in lid_L})

# ── Blink_R — mirror on right side ───────────────────────────────────────────
lid_R = zone(verts, x=(0.10, 0.55), y=(0.05, 9), z=(0.10, 0.55))
add_key("Fcl_EYE_Close_R", {i: Vector((0, 0, -LID_CLOSE)) for i in lid_R})

# ── Happy — brow lift + cheek puff + lip corners up ──────────────────────────
brow   = zone(verts, z=(0.50, 0.80), y=(0.00, 9))
cheeks = zone(verts, x=(-0.65, 0.65), y=(0.15, 9), z=(-0.05, 0.30))
lips   = zone(verts, x=(-0.50, 0.50), y=(0.10, 9), z=(-0.40, -0.15))

happy_offsets: dict = {}
for i in brow:
    happy_offsets[i] = Vector((0, 0, BROW_RAISE))
for i in cheeks:
    happy_offsets[i] = happy_offsets.get(i, Vector()) + Vector((0, CHEEK_RAISE, 0))
for i in lips:
    x_sign = 1 if verts[i].co.x > 0 else -1
    happy_offsets[i] = happy_offsets.get(i, Vector()) + Vector(
        (x_sign * MOUTH_WIDE_X, 0, MOUTH_WIDE_Z)
    )
add_key("Fcl_ALL_Joy", happy_offsets)

# ── Angry — inner brow drop + lip compress ────────────────────────────────────
inner_brow = zone(verts, x=(-0.20, 0.20), y=(0.00, 9), z=(0.45, 0.80))
lip_mid    = zone(verts, x=(-0.25, 0.25), y=(0.10, 9), z=(-0.45, -0.20))

angry_offsets: dict = {}
for i in inner_brow:
    angry_offsets[i] = Vector((0, 0, -BROW_LOWER))
for i in lip_mid:
    angry_offsets[i] = angry_offsets.get(i, Vector()) + Vector((0, 0, BROW_LOWER * 0.4))
add_key("Fcl_ALL_Angry", angry_offsets)

# ── Aa phoneme — jaw opens in −Z ─────────────────────────────────────────────
jaw = zone(verts, z=(-0.75, -0.20), y=(0.05, 9), x=(-0.55, 0.55))
add_key("Fcl_MTH_A", {i: Vector((0, 0, -MOUTH_OPEN_Z)) for i in jaw})


# ─────────────────────────────────────────────────────────────────────────────
# 7.  Lighting rig — area light from upper-left for Viewport Shading
# ─────────────────────────────────────────────────────────────────────────────
light_data = bpy.data.lights.new("key_light", type="AREA")
light_data.energy = 400
light_obj  = bpy.data.objects.new("key_light", light_data)
light_obj.location = (-1.5, -2.0, 2.5)
bpy.context.collection.objects.link(light_obj)


# ─────────────────────────────────────────────────────────────────────────────
# 8.  Export GLB — NO Draco (incompatible with morph targets in glTF 2.0 spec)
# ─────────────────────────────────────────────────────────────────────────────
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    use_selection=True,
    export_apply=False,      # must be False when shape keys are present
    export_normals=True,
    export_morph=True,       # write shape keys as morph targets
    export_morph_normal=True,  # include normal deltas for smooth lighting
    export_morph_tangent=False,
    export_yup=True,
    export_texcoords=True,
    export_materials="EXPORT",
    # Draco deliberately absent — see module docstring
)

# ─────────────────────────────────────────────────────────────────────────────
# 9.  Save .blend
# ─────────────────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[blueprint] done → {GLB_OUT.name}  {BLEND_OUT.name}")
