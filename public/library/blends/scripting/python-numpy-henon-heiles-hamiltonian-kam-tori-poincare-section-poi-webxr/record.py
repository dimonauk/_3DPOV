"""
record.py — Hénon-Heiles Hamiltonian KAM Tori: viewport animation recording
Blender 5.1 · Holoflow Studio

Output: public/library/videos/scripting/
        python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr/
        viewport.mp4

Duration: 12 s @ 30 fps = 360 frames
Structure:
  Frames   1–240: camera orbits 360° at descending elevation, revealing the
                  3D tube topology in (x, px, y) phase space.
  Frames 241–360: static oblique view; shape-key crossfade demos
                  KAM_E0.083 → Mixed_E0.125 → Chaotic_E0.165 → back to KAM.

Renderer: Workbench with vertex-colour attribute mode — real-time, facet-safe.

Run from Blender 5.1 Scripting workspace AFTER blueprint.py.
Objects hf_henon_heiles and hf_henon_heiles_pole must exist in the scene.
"""

import bpy, math

SLUG = "python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
OUT  = f"//../../../../videos/scripting/{SLUG}/viewport"

FRAMES   = 360
FPS      = 30
R_ORBIT  = 0.20
ELEV_HI  = math.radians(60)
ELEV_LO  = math.radians(12)

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS
scn.render.filepath = OUT
scn.render.image_settings.file_format  = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.resolution_x    = 1920
scn.render.resolution_y    = 1080
scn.render.resolution_percentage = 100

# ── Locate main object ────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_henon_heiles")
if obj is None:
    raise RuntimeError("Run blueprint.py first — hf_henon_heiles not found.")

# ── Camera ─────────────────────────────────────────────────────────────────────
EMP_NAME = "_HHTarget"
if EMP_NAME in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[EMP_NAME])
emp = bpy.data.objects.new(EMP_NAME, None)
scn.collection.objects.link(emp)
emp.location = (0, 0, 0)

cam_data = bpy.data.cameras.new("Cam_HenonHeiles")
cam      = bpy.data.objects.new("Cam_HenonHeiles", cam_data)
scn.collection.objects.link(cam)
scn.camera = cam

for c in list(cam.constraints):
    cam.constraints.remove(c)
ct = cam.constraints.new("TRACK_TO")
ct.target = emp; ct.track_axis = "TRACK_NEGATIVE_Z"; ct.up_axis = "UP_Y"
cam.animation_data_clear()

# ── Orbit keyframes (frames 1-240) ────────────────────────────────────────────
for f in range(1, 241):
    t     = (f - 1) / 239
    angle = 2.0 * math.pi * t
    elev  = ELEV_HI - (ELEV_HI - ELEV_LO) * t
    cam.location = (
        R_ORBIT * math.sin(angle) * math.cos(elev),
       -R_ORBIT * math.cos(angle) * math.cos(elev),
        R_ORBIT * math.sin(elev),
    )
    cam.keyframe_insert("location", frame=f)

# Static oblique view for shape-key demo
for f in range(241, FRAMES + 1):
    cam.location = (R_ORBIT*0.7, -R_ORBIT*0.7, R_ORBIT*0.45)
    cam.keyframe_insert("location", frame=f)

# ── Shape-key crossfade (frames 241-360) ─────────────────────────────────────
if obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    if obj.data.shape_keys.animation_data:
        obj.data.shape_keys.animation_data_clear()

    def sk_key(name, val, frame):
        if name in kb:
            kb[name].value = val
            kb[name].keyframe_insert("value", frame=frame)

    # Start at KAM basis
    sk_key("KAM_E0.083",    1.0, 241)
    sk_key("Mixed_E0.125",  0.0, 241)
    sk_key("Chaotic_E0.165", 0.0, 241)
    # Cross-fade to Mixed
    sk_key("KAM_E0.083",    0.0, 271)
    sk_key("Mixed_E0.125",  1.0, 271)
    sk_key("Chaotic_E0.165", 0.0, 271)
    # Cross-fade to Chaotic
    sk_key("KAM_E0.083",    0.0, 301)
    sk_key("Mixed_E0.125",  0.0, 301)
    sk_key("Chaotic_E0.165", 1.0, 301)
    # Return to KAM
    sk_key("KAM_E0.083",    1.0, 360)
    sk_key("Mixed_E0.125",  0.0, 360)
    sk_key("Chaotic_E0.165", 0.0, 360)

# ── Renderer ──────────────────────────────────────────────────────────────────
scn.render.engine                   = "BLENDER_WORKBENCH"
scn.display.shading.light           = "STUDIO"
scn.display.shading.color_type      = "VERTEX"
scn.display.shading.show_shadows    = False
scn.display.shading.background_type = "THEME"

bpy.ops.render.render(animation=True)
print("record.py: render complete →", OUT)
