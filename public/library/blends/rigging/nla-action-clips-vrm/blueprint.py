"""
NLA Action Clips for VRM — Blender 5.1
public/library/blends/rigging/nla-action-clips-vrm/blueprint.py

Each shape-key expression gets its own bpy.data.Action, pushed to an NLA
strip named after the expression.  The glTF exporter writes every strip as a
separate glTF Animation object.  Three.js AnimationMixer.clipAction( clip )
addresses them by name at runtime — the same model that VRM 1.0 runtimes use
for simultaneous expression blending (blink + smile + phoneme in parallel).

WHY NLA tracks, not a single merged action:
A merged action bundles all keyframes under one glTF Animation named "face_vrm".
The runtime can only play it as a unit; there is no way to drive "aa" weight
from speech while independently driving "blinkLeft" from face tracking.
Separate NLA strips produce separate, independently-addressable clips.

Critical API distinction:
  Shape key F-curves live on obj.data.shape_keys (bpy.types.Key), NOT on obj.
  obj.animation_data drives location / rotation / scale only.
  Setting the wrong animation_data silently produces a GLB with no morph
  animation — the shape keys export as static morph targets but never move.

Draco disabled — KHR_draco_mesh_compression is spec-incompatible with
KHR_mesh_morph_targets in glTF 2.0 (§9.5.3).

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from mathutils import Vector
from pathlib import Path

# ── Output paths ───────────────────────────────────────────────────────────────
OUT_DIR   = Path(__file__).parent
BLEND_OUT = OUT_DIR / "face_nla_vrm.blend"
GLB_OUT   = OUT_DIR / "face_nla_vrm.glb"

# ── Sphere topology ────────────────────────────────────────────────────────────
U_SEG, V_SEG, RADIUS = 16, 10, 0.8
SX, SY, SZ = 0.75, 0.55, 1.05   # face-proportion scale

# ── Expression magnitudes (world units after scale) ────────────────────────────
BROW_RAISE   = 0.07
BROW_LOWER   = 0.05
CHEEK_RAISE  = 0.04
LID_CLOSE    = 0.10
MOUTH_OPEN_Z = 0.11
MOUTH_WIDE_X = 0.05
MOUTH_WIDE_Z = 0.03

# ── Animation timing ───────────────────────────────────────────────────────────
# Each clip runs 0 → peak → 0 across CLIP_FRAMES.  20 frames at 24fps ≈ 0.83s.
# The gentle arc looks natural without needing a custom ease function in JS.
CLIP_FRAMES = 20

# ── Material ───────────────────────────────────────────────────────────────────
COLOR_SKIN = (0.92, 0.78, 0.66, 1.0)
COLOR_DARK = (0.55, 0.38, 0.26, 1.0)
CEL_CUTOFF = 0.35


# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for blk in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.actions):
    bpy.data.batch_remove([blk])


# ── Face proxy (same topology as shape-keys tutorial for portability) ──────────
mesh = bpy.data.meshes.new("face_nla_vrm")
obj  = bpy.data.objects.new("face_nla_vrm", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=U_SEG, v_segments=V_SEG, radius=RADIUS)
for v in bm.verts:
    v.co.x *= SX; v.co.y *= SY; v.co.z *= SZ
bm.to_mesh(mesh);  bm.free();  mesh.update()

for poly in mesh.polygons:
    poly.use_smooth = False   # studio flat-shade / faceted convention


# ── Cel material: Diffuse → ShaderToRGB → CONSTANT ramp → Emission ─────────────
mat = bpy.data.materials.new("face_cel")
mat.use_nodes = True
nt  = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location   = (700, 0)
emit  = nt.nodes.new("ShaderNodeEmission");         emit.location  = (500, 0)
ramp  = nt.nodes.new("ShaderNodeValToRGB");         ramp.location  = (280, 0)
s2rgb = nt.nodes.new("ShaderNodeShaderToRGB");      s2rgb.location = (60,  0)
diff  = nt.nodes.new("ShaderNodeBsdfDiffuse");      diff.location  = (-160, 0)

diff.inputs["Color"].default_value           = COLOR_SKIN
ramp.color_ramp.interpolation                = "CONSTANT"
ramp.color_ramp.elements[0].position        = 0.0;        ramp.color_ramp.elements[0].color = COLOR_DARK
ramp.color_ramp.elements[1].position        = CEL_CUTOFF; ramp.color_ramp.elements[1].color = COLOR_SKIN

nt.links.new(diff.outputs["BSDF"],     s2rgb.inputs["Shader"])
nt.links.new(s2rgb.outputs["Color"],   ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"],    emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
obj.data.materials.append(mat)


# ── Zone helper: position-based vertex selection ───────────────────────────────
def zone(verts, *, x=(None, None), y=(None, None), z=(None, None)):
    xlo = x[0] if x[0] is not None else -9;  xhi = x[1] if x[1] is not None else 9
    ylo = y[0] if y[0] is not None else -9;  yhi = y[1] if y[1] is not None else 9
    zlo = z[0] if z[0] is not None else -9;  zhi = z[1] if z[1] is not None else 9
    return [v.index for v in verts
            if xlo <= v.co.x <= xhi and ylo <= v.co.y <= yhi and zlo <= v.co.z <= zhi]


# ── Shape keys ─────────────────────────────────────────────────────────────────
basis = obj.shape_key_add(name="Basis");  basis.interpolation = "KEY_LINEAR"
verts = mesh.vertices

def add_key(name, offsets: dict):
    kb = obj.shape_key_add(name=name, from_mix=False)
    kb.interpolation = "KEY_LINEAR"
    for idx, delta in offsets.items():
        kb.data[idx].co += delta
    return kb

lid_L      = zone(verts, x=(-0.55, -0.10), y=(0.05, 9), z=(0.10, 0.55))
lid_R      = zone(verts, x=(0.10,  0.55),  y=(0.05, 9), z=(0.10, 0.55))
brow_z     = zone(verts, z=(0.50, 0.80),   y=(0.00, 9))
cheeks     = zone(verts, x=(-0.65, 0.65),  y=(0.15, 9), z=(-0.05, 0.30))
lips       = zone(verts, x=(-0.50, 0.50),  y=(0.10, 9), z=(-0.40, -0.15))
inner_brow = zone(verts, x=(-0.20, 0.20),  y=(0.00, 9), z=(0.45, 0.80))
lip_mid    = zone(verts, x=(-0.25, 0.25),  y=(0.10, 9), z=(-0.45, -0.20))
jaw        = zone(verts, x=(-0.55, 0.55),  y=(0.05, 9), z=(-0.75, -0.20))

add_key("Fcl_EYE_Close_L", {i: Vector((0, 0, -LID_CLOSE)) for i in lid_L})
add_key("Fcl_EYE_Close_R", {i: Vector((0, 0, -LID_CLOSE)) for i in lid_R})

happy_off: dict = {}
for i in brow_z: happy_off[i] = Vector((0, 0, BROW_RAISE))
for i in cheeks: happy_off[i] = happy_off.get(i, Vector()) + Vector((0, CHEEK_RAISE, 0))
for i in lips:
    xs = 1 if verts[i].co.x > 0 else -1
    happy_off[i] = happy_off.get(i, Vector()) + Vector((xs * MOUTH_WIDE_X, 0, MOUTH_WIDE_Z))
add_key("Fcl_ALL_Joy", happy_off)

angry_off: dict = {}
for i in inner_brow: angry_off[i] = Vector((0, 0, -BROW_LOWER))
for i in lip_mid:    angry_off[i] = angry_off.get(i, Vector()) + Vector((0, 0, BROW_LOWER * 0.4))
add_key("Fcl_ALL_Angry", angry_off)
add_key("Fcl_MTH_A", {i: Vector((0, 0, -MOUTH_OPEN_Z)) for i in jaw})


# ── NLA animation setup ────────────────────────────────────────────────────────
# Shape key animation lives on obj.data.shape_keys, a bpy.types.Key object.
# The Key has its own animation_data, independent of obj.animation_data.
shape_keys = obj.data.shape_keys
shape_keys.animation_data_create()

EXPRESSIONS = [
    ("Fcl_EYE_Close_L", "blink_L"),
    ("Fcl_EYE_Close_R", "blink_R"),
    ("Fcl_ALL_Joy",     "happy"),
    ("Fcl_ALL_Angry",   "angry"),
    ("Fcl_MTH_A",       "aa"),
]

def make_action(key_name: str, clip_name: str) -> bpy.types.Action:
    """Build a 0 → 1 → 0 ramp for key_name across CLIP_FRAMES."""
    action = bpy.data.actions.new(name=clip_name)
    # data_path is relative to the Key object that owns this action
    fc = action.fcurves.new(data_path=f'key_blocks["{key_name}"].value')
    fc.keyframe_points.add(3)
    pts = fc.keyframe_points
    pts[0].co = (0,                  0.0);  pts[0].interpolation = "BEZIER"
    pts[1].co = (CLIP_FRAMES / 2.0,  1.0);  pts[1].interpolation = "BEZIER"
    pts[2].co = (float(CLIP_FRAMES), 0.0);  pts[2].interpolation = "BEZIER"
    fc.update()   # rebuilds internal keyframe index; omitting this leaves curve invalid
    return action

# All strips start at frame 1 — parallel layout for Three.js AnimationMixer.
# record.py repositions them sequentially for a readable demo render.
for key_name, clip_name in EXPRESSIONS:
    action = make_action(key_name, clip_name)
    track  = shape_keys.animation_data.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(clip_name, 1, action)
    strip.blend_type    = "REPLACE"
    strip.use_auto_blend = False   # disable fade — export clarity

# Clearing the active action prevents the exporter double-playing it alongside
# the NLA strips.  An active action overrides the NLA unless this is None.
shape_keys.animation_data.action = None


# ── Lighting rig ───────────────────────────────────────────────────────────────
ld = bpy.data.lights.new("key_light", type="AREA");  ld.energy = 400
lo = bpy.data.objects.new("key_light", ld);          lo.location = (-1.5, -2.0, 2.5)
bpy.context.collection.objects.link(lo)


# ── GLB export ─────────────────────────────────────────────────────────────────
# export_nla_strips=True → each NLA strip → separate glTF Animation.
# gltf.animations[i].name in Three.js matches the NLA strip name set above.
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath           = str(GLB_OUT),
    export_format      = "GLB",
    use_selection      = True,
    export_apply       = False,          # shape keys forbid modifier apply
    export_normals     = True,
    export_morph       = True,
    export_morph_normal = True,
    export_morph_tangent = False,
    export_animations  = True,
    export_nla_strips  = True,           # each strip → own glTF Animation
    export_yup         = True,
    export_texcoords   = True,
    export_materials   = "EXPORT",
)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[blueprint] done → {GLB_OUT.name}  {BLEND_OUT.name}")
