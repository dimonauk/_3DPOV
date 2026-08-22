"""
record.py — Viewport animation render for GN Set Handle Positions S-Curve Taper
Blender 5.1  ·  Holoflow Studio

Animates Handle_Spread from 0.0 → 0.55 over 60 frames, showing the straight
line gradually bending into the S-curve. Camera orbits 30° simultaneously.
Output: public/library/videos/geometry-nodes/gn-set-handle-positions-bezier-s-curve-taper/viewport.mp4

Run with:
  blender --background --python record.py
"""

import bpy, math, os, sys

# ── Output path ────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../../.."))
OUT_DIR    = os.path.join(REPO_ROOT,
    "public/library/videos/geometry-nodes/gn-set-handle-positions-bezier-s-curve-taper")
os.makedirs(OUT_DIR, exist_ok=True)
OUT_MP4    = os.path.join(OUT_DIR, "viewport.mp4")

# ── Animation constants ────────────────────────────────────────────────────────
FRAME_START    = 1
FRAME_END      = 60
CURVE_LENGTH   = 1.0
HANDLE_SPREAD_TARGET = 0.55
PROFILE_RADIUS = 0.032
RESAMPLE_COUNT = 120

# ── Scene ──────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name        = "SCurveTaperRecord"
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END

# ── GN tree (same topology as blueprint.py) ───────────────────────────────────
ng = bpy.data.node_groups.new("GN_SCurveTaper_Rec", "GeometryNodeTree")
ng.interface.new_socket("Geometry",       in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Handle_Spread",  in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Profile_Radius", in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Geometry",       in_out="OUTPUT", socket_type="NodeSocketGeometry")

for sock in ng.interface.items_tree:
    if sock.name == "Handle_Spread":
        sock.default_value = 0.0
    elif sock.name == "Profile_Radius":
        sock.default_value = PROFILE_RADIUS

nodes = ng.nodes
links = ng.links

def N(bl_id, x, y, label=""):
    n = nodes.new(bl_id)
    n.location = (x, y)
    if label:
        n.label = label
    return n

gIn  = N("NodeGroupInput",  -2200, 0)
gOut = N("NodeGroupOutput",  2200, 0)

line = N("GeometryNodeCurvePrimitiveLine", -1900, 0)
line.mode = 'POINTS'
line.inputs["Start"].default_value = (0.0, -CURVE_LENGTH / 2, 0.0)
line.inputs["End"].default_value   = (0.0,  CURVE_LENGTH / 2, 0.0)

sht = N("GeometryNodeCurveSetHandles", -1600, 0)
sht.mode = {'LEFT', 'RIGHT'}
sht.handle_type = 'FREE'
links.new(line.outputs["Curve"], sht.inputs["Curve"])

idx  = N("GeometryNodeInputIndex", -1750, -250)
sel0 = N("ShaderNodeMath", -1550, -250)
sel0.operation = 'COMPARE'; sel0.inputs[1].default_value = 0.0; sel0.inputs[2].default_value = 0.5
links.new(idx.outputs["Index"], sel0.inputs[0])

sel1 = N("ShaderNodeMath", -1550, -420)
sel1.operation = 'COMPARE'; sel1.inputs[1].default_value = 1.0; sel1.inputs[2].default_value = 0.5
links.new(idx.outputs["Index"], sel1.inputs[0])

neg = N("ShaderNodeMath", -1550, -90)
neg.operation = 'MULTIPLY'; neg.inputs[1].default_value = -1.0
links.new(gIn.outputs["Handle_Spread"], neg.inputs[0])

p0r = N("ShaderNodeCombineXYZ", -1350, -80)
p0r.inputs["Y"].default_value = -CURVE_LENGTH / 4; p0r.inputs["Z"].default_value = 0.0
links.new(gIn.outputs["Handle_Spread"], p0r.inputs["X"])

p1l = N("ShaderNodeCombineXYZ", -1350, -300)
p1l.inputs["Y"].default_value =  CURVE_LENGTH / 4; p1l.inputs["Z"].default_value = 0.0
links.new(neg.outputs["Value"], p1l.inputs["X"])

shp0 = N("GeometryNodeSetCurveHandlePositions", -1100, 0)
shp0.mode = 'RIGHT'
links.new(sht.outputs["Curve"],  shp0.inputs["Curve"])
links.new(sel0.outputs["Value"], shp0.inputs["Selection"])
links.new(p0r.outputs["Vector"], shp0.inputs["Position"])

shp1 = N("GeometryNodeSetCurveHandlePositions", -800, 0)
shp1.mode = 'LEFT'
links.new(shp0.outputs["Curve"], shp1.inputs["Curve"])
links.new(sel1.outputs["Value"], shp1.inputs["Selection"])
links.new(p1l.outputs["Vector"], shp1.inputs["Position"])

sparam  = N("GeometryNodeSplineParameter", -600, -200)
tpi     = N("ShaderNodeMath", -400, -200)
tpi.operation = 'MULTIPLY'; tpi.inputs[1].default_value = math.pi
links.new(sparam.outputs["Factor"], tpi.inputs[0])

sin_t = N("ShaderNodeMath", -200, -200)
sin_t.operation = 'SINE'
links.new(tpi.outputs["Value"], sin_t.inputs[0])

rad_mult = N("ShaderNodeMath", 0, -200)
rad_mult.operation = 'MULTIPLY'
links.new(sin_t.outputs["Value"],        rad_mult.inputs[0])
links.new(gIn.outputs["Profile_Radius"], rad_mult.inputs[1])

set_rad = N("GeometryNodeSetCurveRadius", -600, 0)
links.new(shp1.outputs["Curve"],    set_rad.inputs["Curve"])
links.new(rad_mult.outputs["Value"], set_rad.inputs["Radius"])

res = N("GeometryNodeResampleCurve", -350, 0)
res.mode = 'COUNT'; res.inputs["Count"].default_value = RESAMPLE_COUNT
links.new(set_rad.outputs["Curve"], res.inputs["Curve"])

prof = N("GeometryNodeCurvePrimitiveLine", -100, -200)
prof.mode = 'POINTS'
prof.inputs["Start"].default_value = (-PROFILE_RADIUS, 0.0, 0.0)
prof.inputs["End"].default_value   = ( PROFILE_RADIUS, 0.0, 0.0)

ctm = N("GeometryNodeCurveToMesh", -100, 0)
ctm.inputs["Fill Caps"].default_value = False
links.new(res.outputs["Curve"],  ctm.inputs["Curve"])
links.new(prof.outputs["Curve"], ctm.inputs["Profile Curve"])

sms = N("GeometryNodeSetShadeSmooth", 150, 0)
sms.domain = 'FACE'; sms.inputs["Shade Smooth"].default_value = True
links.new(ctm.outputs["Mesh"],     sms.inputs["Geometry"])
links.new(sms.outputs["Geometry"], gOut.inputs["Geometry"])

# ── Carrier object ────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=0.01)
carrier = bpy.context.active_object
carrier.name = "s_curve_ribbon"
mod = carrier.modifiers.new("GN_SCurveTaper_Rec", 'NODES')
mod.node_group = ng

# ── Animate Handle_Spread: 0 → HANDLE_SPREAD_TARGET over FRAME_END frames ─────
mod["Socket_2"] = 0.0
mod.keyframe_insert(data_path='["Socket_2"]', frame=FRAME_START)
mod["Socket_2"] = HANDLE_SPREAD_TARGET
mod.keyframe_insert(data_path='["Socket_2"]', frame=FRAME_END)
# Ease in-out via BEZIER interpolation (default)

# ── Material ──────────────────────────────────────────────────────────────────
mat  = bpy.data.materials.new("ribbon_emissive_rec")
mat.use_nodes = True
nt   = mat.node_tree; nt.nodes.clear()
out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (600, 0)
mix  = nt.nodes.new("ShaderNodeMixShader");      mix.location = (400, 0); mix.inputs["Fac"].default_value = 0.55
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (0, 100)
bsdf.inputs["Base Color"].default_value = (0.95, 0.35, 0.05, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.30
emit = nt.nodes.new("ShaderNodeEmission");       emit.location = (0, -100)
emit.inputs["Color"].default_value    = (1.0, 0.45, 0.1, 1.0)
emit.inputs["Strength"].default_value = 6.0
nt.links.new(bsdf.outputs["BSDF"],     mix.inputs[1])
nt.links.new(emit.outputs["Emission"], mix.inputs[2])
nt.links.new(mix.outputs["Shader"],    out.inputs["Surface"])
carrier.data.materials.append(mat)

# ── Camera (orbits from front to 3/4 view) ────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -1.8, 0.5))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(78), 0, 0)
scene.camera = cam

# Orbit from Y-front to 3/4 over the animation
cam.rotation_euler = (math.radians(78), 0, 0)
cam.keyframe_insert(data_path="rotation_euler", frame=FRAME_START)
cam.rotation_euler = (math.radians(65), 0, math.radians(45))
cam.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)
cam.location = (0.0, -1.8, 0.5)
cam.keyframe_insert(data_path="location", frame=FRAME_START)
cam.location = (1.2, -1.4, 0.5)
cam.keyframe_insert(data_path="location", frame=FRAME_END)

# ── Area light ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(2.0, -1.0, 2.0))
light = bpy.context.active_object
light.data.energy = 60.0; light.data.size = 1.5
light.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                 = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath            = OUT_MP4

print(f"[record] Rendering {FRAME_END} frames → {OUT_MP4}")
bpy.ops.render.render(animation=True, write_still=False)
print("[record] Done.")
