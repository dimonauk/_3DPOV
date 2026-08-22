"""
record.py — Apollonian Gasket poi head: viewport animation recording
Blender 5.1 · Holoflow Studio

Output: public/library/videos/scripting/
        python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr/
        viewport.mp4

Duration: 8 s @ 30 fps = 240 frames
Technique: camera orbits 360° from top-down (elev 70°) to oblique (elev 30°),
           revealing the terraced fractal depth relief as a sculpted disc.
Renderer: Workbench with vertex-colour display — fast and facet-correct.

Run from Blender's scripting tab AFTER executing blueprint.py (the object
hf_apollonian_gasket and camera Cam_Apollonian must exist in the scene).
"""

import bpy, math

SLUG    = ("python-numpy-apollonian-gasket-descartes-circle-theorem"
           "-inversive-geometry-poi-disc-webxr")
OUT     = f"//../../../../videos/scripting/{SLUG}/viewport"
FRAMES  = 240
FPS     = 30
R_ORBIT = 0.38   # orbit radius in m (scene is scaled to 0.12 m poi head)

scn                   = bpy.context.scene
scn.frame_start       = 1
scn.frame_end         = FRAMES
scn.render.fps        = FPS
scn.render.filepath   = OUT
scn.render.image_settings.file_format  = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.resolution_x                = 1920
scn.render.resolution_y                = 1080
scn.render.resolution_percentage       = 100

# ── Camera lookup ─────────────────────────────────────────────────────────────
cam = bpy.data.objects.get("Cam_Apollonian")
if cam is None:
    raise RuntimeError("Run blueprint.py first to create Cam_Apollonian.")

# ── Track-to empty so only position needs keyframes ───────────────────────────
EMP_NAME = "_ApollonianTarget"
if EMP_NAME in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[EMP_NAME])
emp          = bpy.data.objects.new(EMP_NAME, None)
scn.collection.objects.link(emp)
emp.location = (0, 0, 0.005)   # slightly above the base disc

# Remove any stale track-to constraints on the camera
for c in list(cam.constraints):
    cam.constraints.remove(c)

ct            = cam.constraints.new("TRACK_TO")
ct.target     = emp
ct.track_axis = "TRACK_NEGATIVE_Z"
ct.up_axis    = "UP_Y"
cam.animation_data_clear()

# ── Orbit keyframes ───────────────────────────────────────────────────────────
for f in range(1, FRAMES + 1):
    t     = (f - 1) / (FRAMES - 1)          # 0 → 1
    angle = 2.0 * math.pi * t               # full 360° orbit
    elev  = math.radians(70.0 - 40.0 * t)  # descend 70° → 30° elevation

    cam.location = (
        R_ORBIT * math.sin(angle) * math.cos(elev),
        -R_ORBIT * math.cos(angle) * math.cos(elev),
        R_ORBIT * math.sin(elev),
    )
    cam.keyframe_insert("location", frame=f)

# ── Render settings ───────────────────────────────────────────────────────────
scn.render.engine                  = "BLENDER_WORKBENCH"
scn.display.shading.light          = "STUDIO"
scn.display.shading.color_type     = "VERTEX"
scn.display.shading.show_shadows   = True
scn.display.shading.shadow_intensity = 0.5

bpy.ops.render.render(animation=True)
print("record.py: viewport render complete →", OUT)
