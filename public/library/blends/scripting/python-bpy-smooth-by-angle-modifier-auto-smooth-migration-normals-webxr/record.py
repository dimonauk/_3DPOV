"""
Viewport animation recorder — SMOOTH_BY_ANGLE migration demo
Outputs: public/library/videos/scripting/python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr/viewport.mp4
Run via: blender --background --python record.py
"""

import bpy
import math
import os
import sys

# ── Output config ────────────────────────────────────────────────────────────
THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(
    THIS_DIR,
    "../../..",
    "videos",
    "scripting",
    "python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr",
)
OUTPUT_DIR = os.path.normpath(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "viewport.mp4")

FRAME_START  = 1
FRAME_END    = 72   # 72 frames @ 24fps = 3 s animation
RESOLUTION_X = 1280
RESOLUTION_Y = 720
FPS          = 24

# ── Geometry constants (mirror blueprint.py) ─────────────────────────────────
BARREL_RADIUS    = 0.5
BARREL_HEIGHT    = 0.8
BARREL_SEGMENTS  = 16
LID_RADIUS       = 0.45
LID_HEIGHT       = 0.25
LID_SIDES        = 6
SMOOTH_ANGLE_DEG = 30.0


# ── Scene helpers ────────────────────────────────────────────────────────────

def setup_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    bpy.ops.outliner.orphans_purge(do_recursive=True)

    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    render = scene.render
    render.resolution_x   = RESOLUTION_X
    render.resolution_y   = RESOLUTION_Y
    render.fps            = FPS
    render.image_settings.file_format = 'FFMPEG'
    render.ffmpeg.format          = 'MPEG4'
    render.ffmpeg.codec           = 'H264'
    render.ffmpeg.constant_rate_factor = 'HIGH'
    render.filepath = OUTPUT_MP4

    scene.display.shading.type   = 'SOLID'
    scene.display.shading.light  = 'MATCAP'


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(3.5, -3.0, 2.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(65), 0, math.radians(46))
    bpy.context.scene.camera = cam
    return cam


def add_lights() -> None:
    bpy.ops.object.light_add(type='SUN', location=(4, 2, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(35), 0, math.radians(-45))

    bpy.ops.object.light_add(type='AREA', location=(-3, -2, 4))
    fill = bpy.context.active_object
    fill.data.energy = 600.0
    fill.data.size   = 3.0


def build_prop() -> bpy.types.Object:
    """Rebuild prop identical to blueprint.py — no imports to keep record.py standalone."""
    import bmesh
    from mathutils import Vector

    mesh = bpy.data.meshes.new("hf_smooth_demo")
    obj  = bpy.data.objects.new("hf_smooth_demo", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    bot_v, top_v = [], []
    for i in range(BARREL_SEGMENTS):
        a = 2 * math.pi * i / BARREL_SEGMENTS
        x, y = BARREL_RADIUS * math.cos(a), BARREL_RADIUS * math.sin(a)
        bot_v.append(bm.verts.new(Vector((x, y, 0.0))))
        top_v.append(bm.verts.new(Vector((x, y, BARREL_HEIGHT))))

    n = BARREL_SEGMENTS
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([bot_v[i], bot_v[j], top_v[j], top_v[i]])
    bm.faces.new(bot_v[::-1])
    bm.faces.new(top_v)

    lid_z0, lid_z1 = BARREL_HEIGHT, BARREL_HEIGHT + LID_HEIGHT
    hb, ht = [], []
    for i in range(LID_SIDES):
        a = 2 * math.pi * i / LID_SIDES + math.pi / LID_SIDES
        x, y = LID_RADIUS * math.cos(a), LID_RADIUS * math.sin(a)
        hb.append(bm.verts.new(Vector((x, y, lid_z0))))
        ht.append(bm.verts.new(Vector((x, y, lid_z1))))

    ns = LID_SIDES
    for i in range(ns):
        j = (i + 1) % ns
        bm.faces.new([hb[i], hb[j], ht[j], ht[i]])
    bm.faces.new(hb[::-1])
    bm.faces.new(ht)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return obj


# ── Animation ────────────────────────────────────────────────────────────────

def animate(obj: bpy.types.Object) -> None:
    """
    Timeline:
      F 1–24   Flat-shaded (no smooth modifier) — slowly rotating.
      F 25–48  SMOOTH_BY_ANGLE added at frame 25 — barrel reads smooth,
               hex lid facets remain hard.
      F 49–72  Turntable full rotation with modifier active — beauty pass.
    """
    scene = bpy.context.scene

    # Phase A: rotation without modifier
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path='rotation_euler', frame=1)
    obj.rotation_euler = (0, 0, math.radians(90))
    obj.keyframe_insert(data_path='rotation_euler', frame=24)

    # At F25: add modifier
    scene.frame_set(25)
    mod = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')
    mod.angle            = math.radians(SMOOTH_ANGLE_DEG)
    mod.keep_sharp_edges = True

    # Phase B: continue rotating
    obj.rotation_euler = (0, 0, math.radians(90))
    obj.keyframe_insert(data_path='rotation_euler', frame=25)
    obj.rotation_euler = (0, 0, math.radians(270))
    obj.keyframe_insert(data_path='rotation_euler', frame=48)

    # Phase C: full turntable
    obj.rotation_euler = (0, 0, math.radians(270))
    obj.keyframe_insert(data_path='rotation_euler', frame=49)
    obj.rotation_euler = (0, 0, math.radians(360 + 270))
    obj.keyframe_insert(data_path='rotation_euler', frame=72)

    # Use linear interpolation for steady rotation
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    setup_scene()
    add_camera()
    add_lights()
    obj = build_prop()
    animate(obj)

    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
    print(f"Viewport recording saved → {OUTPUT_MP4}")


if __name__ == "__main__":
    main()
