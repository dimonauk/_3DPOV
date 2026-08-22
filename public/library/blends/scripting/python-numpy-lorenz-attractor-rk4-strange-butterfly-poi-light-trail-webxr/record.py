"""
record.py — Lorenz Strange Attractor poi light trail: viewport animation recording
Blender 5.1 · Holoflow Studio

Output: public/library/videos/scripting/
        python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr/
        viewport.mp4

Duration: 10 s @ 30 fps = 300 frames
Technique: Camera orbits 360° at two different elevations (high → low),
           revealing the butterfly-wing topology.  A second pass plays the
           shape-key morph: Basis_ρ28 → Stable_ρ22 → Hot_ρ200 → Basis.
Renderer: Workbench, vertex-colour mode — real-time and facet-correct.

Run from Blender's Scripting workspace AFTER blueprint.py (objects
hf_lorenz_poi and hf_lorenz_poi_pole must be in the scene).
"""

import bpy, math

SLUG  = "python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
OUT   = f"//../../../../videos/scripting/{SLUG}/viewport"

FRAMES   = 300    # 10 s at 30 fps
FPS      = 30
R_ORBIT  = 0.22   # orbit radius (scene scaled to ~0.12 m poi)
ELEV_HI  = math.radians(60)   # start elevation
ELEV_LO  = math.radians(15)   # end elevation

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS
scn.render.filepath = OUT
scn.render.image_settings.file_format  = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.resolution_x   = 1920
scn.render.resolution_y   = 1080
scn.render.resolution_percentage = 100

# ── Locate objects ────────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_lorenz_poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first — hf_lorenz_poi not found.")

# ── Camera setup ──────────────────────────────────────────────────────────────
EMP = "_LorenzTarget"
if EMP in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[EMP])
emp          = bpy.data.objects.new(EMP, None)
scn.collection.objects.link(emp)
emp.location = (0, 0, 0)   # attractor centred at origin by blueprint

cam_data = bpy.data.cameras.new("Cam_Lorenz")
cam      = bpy.data.objects.new("Cam_Lorenz", cam_data)
scn.collection.objects.link(cam)
scn.camera = cam

# Remove stale constraints
for c in list(cam.constraints):
    cam.constraints.remove(c)
ct = cam.constraints.new("TRACK_TO")
ct.target     = emp
ct.track_axis = "TRACK_NEGATIVE_Z"
ct.up_axis    = "UP_Y"
cam.animation_data_clear()

# ── Orbit keyframes ───────────────────────────────────────────────────────────
# First 200 frames: orbit at descending elevation while rotating 360°
# Last 100 frames: shape-key crossfade static camera
for f in range(1, 201):
    t     = (f - 1) / 199
    angle = 2.0 * math.pi * t
    elev  = ELEV_HI - (ELEV_HI - ELEV_LO) * t
    cam.location = (
        R_ORBIT * math.sin(angle) * math.cos(elev),
       -R_ORBIT * math.cos(angle) * math.cos(elev),
        R_ORBIT * math.sin(elev),
    )
    cam.keyframe_insert("location", frame=f)

# Hold camera at oblique side view for shape-key demo
for f in range(201, FRAMES + 1):
    cam.location = (R_ORBIT * 0.7, -R_ORBIT * 0.7, R_ORBIT * 0.4)
    cam.keyframe_insert("location", frame=f)

# ── Shape-key animation (frames 201–300) ────────────────────────────────────
# Animate key_blocks by name: Basis_ρ28 → Stable_ρ22 → Hot_ρ200 → Basis
if obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    # Clear any existing animation
    if obj.data.shape_keys.animation_data:
        obj.data.shape_keys.animation_data_clear()

    def set_sk(name, val, frame):
        if name in kb:
            kb[name].value = val
            kb[name].keyframe_insert("value", frame=frame)

    # Frame 200: all at basis
    set_sk("Basis_ρ28",  1.0, 200); set_sk("Stable_ρ22",  0.0, 200); set_sk("Hot_ρ200", 0.0, 200)
    # Frame 225: fade to Stable_ρ22
    set_sk("Basis_ρ28",  0.0, 225); set_sk("Stable_ρ22",  1.0, 225); set_sk("Hot_ρ200", 0.0, 225)
    # Frame 250: back to basis
    set_sk("Basis_ρ28",  1.0, 250); set_sk("Stable_ρ22",  0.0, 250); set_sk("Hot_ρ200", 0.0, 250)
    # Frame 275: fade to Hot_ρ200
    set_sk("Basis_ρ28",  0.0, 275); set_sk("Stable_ρ22",  0.0, 275); set_sk("Hot_ρ200", 1.0, 275)
    # Frame 300: return to basis
    set_sk("Basis_ρ28",  1.0, 300); set_sk("Stable_ρ22",  0.0, 300); set_sk("Hot_ρ200", 0.0, 300)

# ── Render settings ───────────────────────────────────────────────────────────
scn.render.engine                     = "BLENDER_WORKBENCH"
scn.display.shading.light             = "STUDIO"
scn.display.shading.color_type        = "VERTEX"
scn.display.shading.show_shadows      = False   # shadows obscure the trail detail
scn.display.shading.background_type   = "THEME"

bpy.ops.render.render(animation=True)
print("record.py: render complete →", OUT)
