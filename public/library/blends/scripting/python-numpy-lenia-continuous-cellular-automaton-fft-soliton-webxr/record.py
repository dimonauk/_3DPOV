"""
record.py — Viewport animation recorder for Lenia tutorial
Blender 5.1 | CC0 | Holoflow Studio Library

Run AFTER blueprint.py has built the "hf_lenia" mesh with shape keys.
Sets up camera, key light, and Material Preview shading, then renders the
shape-key timeline as viewport.mp4 into:
  public/library/videos/scripting/
  python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr/
"""

import bpy
import os
import math

# ── Parameters ────────────────────────────────────────────────────────────────
OUTPUT_SUBDIR = (
    "public/library/videos/scripting/"
    "python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr"
)
OUTPUT_FILENAME = "viewport"
RENDER_W        = 1280
RENDER_H        = 720
FPS             = 30
CAMERA_HEIGHT   = 18.0
CAMERA_TILT_DEG = 55.0
LIGHT_ENERGY    = 900.0


# ── Output path ───────────────────────────────────────────────────────────────
def _output_path() -> str:
    """Walk up from the .blend file directory to the repo root (contains public/)."""
    base = (
        os.path.dirname(bpy.data.filepath)
        if bpy.data.filepath
        else os.path.expanduser("~")
    )
    candidate = base
    for _ in range(8):
        if os.path.isdir(os.path.join(candidate, "public")):
            return os.path.join(candidate, OUTPUT_SUBDIR)
        candidate = os.path.dirname(candidate)
    return os.path.join(base, "viewport_frames")


# ── Camera ────────────────────────────────────────────────────────────────────
def _setup_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    cam_data      = bpy.data.cameras.new("RecordCam")
    cam_data.type = "PERSP"
    cam_data.lens = 45.0
    cam_obj       = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    tilt_rad = math.radians(CAMERA_TILT_DEG)
    cam_obj.location = (
        -1.5,
        -CAMERA_HEIGHT * math.sin(tilt_rad),
         CAMERA_HEIGHT * math.cos(tilt_rad),
    )
    cam_obj.rotation_euler = (tilt_rad, 0.0, math.radians(-8.0))
    return cam_obj


# ── Key light ─────────────────────────────────────────────────────────────────
def _setup_light(scene: bpy.types.Scene) -> bpy.types.Object:
    existing = bpy.data.objects.get("RecordLight")
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)

    ldata          = bpy.data.lights.new("RecordLight", type="AREA")
    ldata.energy   = LIGHT_ENERGY
    ldata.size      = 10.0
    lobj            = bpy.data.objects.new("RecordLight", ldata)
    scene.collection.objects.link(lobj)
    lobj.location       = (5.0, -7.0, 14.0)
    lobj.rotation_euler = (math.radians(40.0), math.radians(10.0), 0.0)
    return lobj


# ── Viewport shading ──────────────────────────────────────────────────────────
def _set_viewport_shading() -> None:
    """
    Material Preview shading shows vertex colour attribute (Col) without
    a full Cycles pass — sufficient for the tutorial viewport.mp4.
    """
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != "VIEW_3D":
                continue
            for space in area.spaces:
                if space.type != "VIEW_3D":
                    continue
                space.shading.type           = "MATERIAL"
                space.shading.use_scene_lights = True
                space.shading.use_scene_world  = False
                space.overlay.show_floor       = False
                space.overlay.show_axis_x      = False
                space.overlay.show_axis_y      = False
                space.overlay.show_cursor      = False


# ── Render sequence ────────────────────────────────────────────────────────────
def render_sequence(scene: bpy.types.Scene) -> None:
    out_dir = _output_path()
    os.makedirs(out_dir, exist_ok=True)

    scene.render.resolution_x        = RENDER_W
    scene.render.resolution_y        = RENDER_H
    scene.render.resolution_percentage = 100
    scene.render.fps                  = FPS

    # Write PNG sequence first (opengl animation)
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(out_dir, OUTPUT_FILENAME)
    bpy.ops.render.opengl(animation=True, write_still=False)

    # Mux to mp4 via Blender's built-in ffmpeg
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = os.path.join(out_dir, "viewport.mp4")
    bpy.ops.render.opengl(animation=True, write_still=False)

    print(f"[record.py] viewport animation → {out_dir}/viewport.mp4")


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    scene = bpy.context.scene
    _set_viewport_shading()
    _setup_camera(scene)
    _setup_light(scene)
    render_sequence(scene)
