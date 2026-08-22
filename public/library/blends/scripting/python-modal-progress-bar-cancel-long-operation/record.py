"""
record.py — Viewport animation for the Modal Progress Bar tutorial.
Blender 5.1 | Run from Text Editor or: blender --python record.py

Creates 20 cube objects in a 4×5 grid. Each cube animates from dark grey
to amber (processing) to bright green (done) across 50 frames, visualising
the chunked batch loop driven by a modal TIMER operator.

Output: public/library/videos/scripting/
        python-modal-progress-bar-cancel-long-operation/viewport.mp4
"""

import bpy, math, os

# ── constants ────────────────────────────────────────────────────────────
COLS         = 4
ROWS         = 5
TOTAL        = COLS * ROWS          # 20 cubes
FRAMES_EACH  = 2                    # frames per cube state transition
FPS          = 24
OUTPUT_SUBPATH = (
    "public/library/videos/scripting"
    "/python-modal-progress-bar-cancel-long-operation/viewport"
)
COL_DARK  = (0.05, 0.05, 0.07, 1.0)   # unprocessed — near-black
COL_ACTV  = (0.95, 0.72, 0.08, 1.0)   # being processed — amber
COL_DONE  = (0.12, 0.88, 0.44, 1.0)   # done — studio green
SPACING   = 1.4
# ─────────────────────────────────────────────────────────────────────────


def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def _build_grid():
    objs = []
    for i in range(TOTAL):
        col = i % COLS
        row = i // COLS
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(col * SPACING, row * SPACING, 0.0),
        )
        obj = bpy.context.active_object
        obj.name = f"Mesh_{i:02d}"
        obj.color = COL_DARK
        objs.append(obj)
    return objs


def _kf(obj, frame):
    """Insert a colour keyframe on obj at the given frame."""
    obj.keyframe_insert("color", frame=frame)


def _animate(objs):
    scene = bpy.context.scene
    total_frames = 2 + TOTAL * FRAMES_EACH + 8
    scene.frame_start = 1
    scene.frame_end   = total_frames

    # Frame 1: everything dark
    scene.frame_set(1)
    for obj in objs:
        obj.color = COL_DARK
        _kf(obj, 1)

    # Sequence: each object flashes amber then settles green
    for i, obj in enumerate(objs):
        t = 2 + i * FRAMES_EACH

        # One frame before: still dark (unless already lit)
        if t > 1:
            obj.color = COL_DARK
            _kf(obj, t - 1)

        # Activation flash
        obj.color = COL_ACTV
        _kf(obj, t)

        # Settle to done
        obj.color = COL_DONE
        _kf(obj, t + FRAMES_EACH)

    # Lock all objects to done colour at the end
    end = total_frames
    for obj in objs:
        obj.color = COL_DONE
        _kf(obj, end)


def _setup_camera():
    cx = (COLS - 1) * SPACING / 2.0
    cy = (ROWS - 1) * SPACING / 2.0

    bpy.ops.object.camera_add(location=(cx, cy - 5.5, 9.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(52), 0.0, 0.0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(cx, cy, 12.0))
    sun = bpy.context.active_object
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(45), 0.0, math.radians(30))


def _configure_render(out_path):
    scene  = bpy.context.scene
    render = scene.render

    render.engine             = 'BLENDER_EEVEE_NEXT'
    render.resolution_x       = 1280
    render.resolution_y       = 720
    render.fps                = FPS
    render.image_settings.file_format = 'FFMPEG'
    render.ffmpeg.format      = 'MPEG4'
    render.ffmpeg.codec       = 'H264'
    render.ffmpeg.constant_rate_factor = 'MEDIUM'
    render.filepath           = out_path

    # Object Color shading: each cube's obj.color drives emission in EEVEE.
    scene.display.shading.type       = 'MATERIAL'
    scene.display.shading.color_type = 'OBJECT'


def _set_viewport_object_color():
    """Switch active 3-D Viewport to Material Preview + Object Colour."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.shading.type       = 'MATERIAL'
            space.shading.color_type = 'OBJECT'
            break


def main():
    _purge()
    _set_viewport_object_color()

    objs = _build_grid()
    _animate(objs)
    _setup_camera()

    # Resolve output path relative to the blend file location.
    # When run via `blender --python record.py`, bpy.data.filepath is "".
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Go up from blends/scripting/<slug>/ to repo root (4 levels).
    root = os.path.normpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), *[".."] * 4)
    )
    out_dir = os.path.join(root, "public/library/videos/scripting"
                           "/python-modal-progress-bar-cancel-long-operation")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "viewport")

    _configure_render(out_path)
    bpy.ops.render.opengl(animation=True)
    print(f"[HL record.py] written → {out_path}.mp4")


main()
