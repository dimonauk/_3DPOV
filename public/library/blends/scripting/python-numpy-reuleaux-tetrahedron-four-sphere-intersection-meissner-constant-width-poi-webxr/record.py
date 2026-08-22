"""
record.py — viewport animation for the Reuleaux Tetrahedron poi head.
Run AFTER blueprint.py has saved hf_reuleaux_tet_poi.blend.

Opens the .blend, sets up a 120-frame Workbench render (Vertex-Colour shading),
animates shape keys Basis → Puffed → Sphere → Basis, orbits the camera, and
renders to:
  public/library/videos/scripting/
    python-numpy-reuleaux-tetrahedron-four-sphere-intersection-meissner-constant-width-poi-webxr/
      viewport.mp4
"""

import bpy
from pathlib import Path
import math

# ── PATHS ───────────────────────────────────────────────────────────────────
HERE      = Path(__file__).parent
BLEND     = HERE / "hf_reuleaux_tet_poi.blend"
OUT_DIR   = Path(__file__).parents[4] / (
    "videos/scripting/"
    "python-numpy-reuleaux-tetrahedron-four-sphere-intersection-"
    "meissner-constant-width-poi-webxr"
)
OUT_FILE  = OUT_DIR / "viewport"

# ── CONSTANTS ────────────────────────────────────────────────────────────────
FPS        = 24
TOTAL_FRAMES = 120          # 5 s
ORBIT_TURNS  = 1.0          # full orbit over the clip

# Shape key phase boundaries (in frames)
PHASE = {
    "basis_hold":  (0,   20),
    "to_puffed":   (20,  50),
    "puffed_hold": (50,  60),
    "to_sphere":   (60,  90),
    "sphere_hold": (90, 100),
    "to_basis":    (100, 120),
}


def _lerp(a, b, t):
    return a + (b - a) * max(0.0, min(1.0, t))


def _ease(t):
    """Smoothstep."""
    return t * t * (3 - 2 * t)


def setup_render():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = TOTAL_FRAMES
    sc.render.fps  = FPS

    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light  = 'MATCAP'
    sc.display.shading.color_type = 'VERTEX'

    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format        = 'MPEG4'
    sc.render.ffmpeg.codec         = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sc.render.filepath = str(OUT_FILE)


def animate_shape_keys(ob):
    """Keyframe Basis / Puffed / Sphere value channels."""
    sk = ob.data.shape_keys
    if not sk:
        print("[record] No shape keys found — skipping shape key animation.")
        return

    def key(name, fr, val):
        kb = sk.key_blocks.get(name)
        if not kb:
            return
        kb.value = val
        kb.keyframe_insert("value", frame=fr)

    # Basis: 1 at start, fades to 0 at frame 20, stays 0, returns at frame 100
    for fr, val in [(1, 1), (20, 1), (50, 0), (100, 0), (120, 1)]:
        key("Basis", fr, val)

    # Puffed: 0 → 1 between 20–50, holds to 60, → 0 by 70
    for fr, val in [(20, 0), (50, 1), (60, 1), (70, 0), (120, 0)]:
        key("Puffed", fr, val)

    # Sphere: 0 → 1 between 60–90, holds to 100, → 0 by 120
    for fr, val in [(60, 0), (90, 1), (100, 1), (120, 0)]:
        key("Sphere", fr, val)

    # Apply smooth interpolation
    if sk.animation_data and sk.animation_data.action:
        for fcurve in sk.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'


def animate_camera(cam_ob):
    """Orbit camera around object over full clip."""
    sc   = bpy.context.scene
    dist = 0.25   # metres — gives nice framing for 0.10 m poi head

    for fr in range(1, TOTAL_FRAMES + 1):
        t     = (fr - 1) / (TOTAL_FRAMES - 1)
        angle = t * ORBIT_TURNS * 2 * math.pi
        elev  = math.radians(25) * math.sin(t * math.pi)   # gentle dip

        cam_ob.location.x = dist * math.cos(angle) * math.cos(elev)
        cam_ob.location.y = dist * math.sin(angle) * math.cos(elev)
        cam_ob.location.z = dist * math.sin(elev)
        cam_ob.keyframe_insert("location", frame=fr)

        # Keep camera pointing at origin
        sc.frame_set(fr)
        rot = cam_ob.rotation_euler
        rot.x = math.pi / 2 - elev
        rot.y = 0.0
        rot.z = angle + math.pi / 2
        cam_ob.rotation_euler = rot
        cam_ob.keyframe_insert("rotation_euler", frame=fr)


def run():
    if not BLEND.exists():
        print(f"[record] Blend file not found: {BLEND}. Run blueprint.py first.")
        return

    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    ob = bpy.data.objects.get("hf_reuleaux_tet_poi")
    if not ob:
        print("[record] Object hf_reuleaux_tet_poi not found.")
        return

    setup_render()
    animate_shape_keys(ob)

    # Camera
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85   # telephoto — minimises perspective distortion
    cam_ob = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob
    animate_camera(cam_ob)

    # Sun light
    sun_data = bpy.data.lights.new("Sun", 'SUN')
    sun_data.energy = 3.0
    sun_ob = bpy.data.objects.new("Sun", sun_data)
    bpy.context.collection.objects.link(sun_ob)
    sun_ob.location = (0.4, -0.3, 0.5)

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[record] Rendered → {OUT_FILE}.mp4")


run()
