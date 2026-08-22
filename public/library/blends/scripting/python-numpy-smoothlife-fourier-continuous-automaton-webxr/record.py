"""
record.py — Viewport animation recorder for SmoothLife tutorial
Blender 5.1 | CC0 | Holoflow Studio Library

Run this AFTER blueprint.py has built the "SmoothLife" mesh object.
It sets camera, lighting, viewport shading, then renders the timeline as
viewport.mp4 into public/library/videos/scripting/
python-numpy-smoothlife-fourier-continuous-automaton-webxr/

The render uses Blender's OpenGL viewport renderer (bpy.ops.render.opengl)
with the SEQUENCE flag so all timeline frames are written to disk.
"""

import bpy
import os
import math

# ── Parameters ────────────────────────────────────────────────────────────────
OUTPUT_SUBDIR  = (
    "public/library/videos/scripting/"
    "python-numpy-smoothlife-fourier-continuous-automaton-webxr"
)
OUTPUT_FILENAME = "viewport"    # Blender appends #### + .png, ffmpeg muxes to .mp4
RENDER_W        = 1280
RENDER_H        = 720
FPS             = 30
CAMERA_HEIGHT   = 14.0
CAMERA_TILT_DEG = 52.0          # perspective overhead angle
LIGHT_ENERGY    = 800.0

# ── Locate output directory (relative to .blend file) ─────────────────────────
def _output_path():
    blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.path.expanduser("~")
    # Walk up to repo root (contains public/)
    candidate = blend_dir
    for _ in range(8):
        if os.path.isdir(os.path.join(candidate, "public")):
            return os.path.join(candidate, OUTPUT_SUBDIR)
        candidate = os.path.dirname(candidate)
    # Fallback: place next to the .blend file
    return os.path.join(blend_dir, "viewport_frames")

# ── Camera ────────────────────────────────────────────────────────────────────
def _setup_camera(scene):
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.type = "PERSP"
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Position: elevated, slightly off-centre for dynamic composition
    tilt_rad      = math.radians(CAMERA_TILT_DEG)
    cam_obj.location = (
        -2.5,
        -CAMERA_HEIGHT * math.sin(tilt_rad),
         CAMERA_HEIGHT * math.cos(tilt_rad),
    )
    cam_obj.rotation_euler = (tilt_rad, 0.0, math.radians(-5.0))
    return cam_obj

# ── Key light ─────────────────────────────────────────────────────────────────
def _setup_light(scene):
    existing = bpy.data.objects.get("RecordLight")
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)

    ldata = bpy.data.lights.new("RecordLight", type="AREA")
    ldata.energy = LIGHT_ENERGY
    ldata.size   = 8.0
    lobj  = bpy.data.objects.new("RecordLight", ldata)
    scene.collection.objects.link(lobj)
    lobj.location     = (4.0, -6.0, 12.0)
    lobj.rotation_euler = (math.radians(35.0), math.radians(15.0), 0.0)
    return lobj

# ── Viewport shading ──────────────────────────────────────────────────────────
def _set_viewport_shading():
    """
    Set all 3D viewports to LookDev (Material Preview) shading so the vertex
    colour attribute (Col) is visible without setting up a full Cycles material.
    """
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                for space in area.spaces:
                    if space.type == "VIEW_3D":
                        space.shading.type = "MATERIAL"
                        space.shading.use_scene_lights = True
                        space.shading.use_scene_world  = False
                        space.overlay.show_floor       = False
                        space.overlay.show_axis_x      = False
                        space.overlay.show_axis_y      = False
                        space.overlay.show_cursor      = False

# ── Render sequence ────────────────────────────────────────────────────────────
def render_sequence(scene):
    out_dir = _output_path()
    os.makedirs(out_dir, exist_ok=True)

    scene.render.resolution_x    = RENDER_W
    scene.render.resolution_y    = RENDER_H
    scene.render.resolution_percentage = 100
    scene.render.fps              = FPS
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath         = os.path.join(out_dir, OUTPUT_FILENAME)

    # OpenGL viewport render writes each frame as a PNG with #### numbering.
    # Blender's built-in ffmpeg step then muxes them to .mp4.
    bpy.ops.render.opengl(animation=True, write_still=False)

    # Mux to mp4 using Blender's built-in ffmpeg if available
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = os.path.join(out_dir, "viewport.mp4")
    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"[record.py] Viewport animation saved → {out_dir}/viewport.mp4")

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    scene = bpy.context.scene
    _set_viewport_shading()
    _setup_camera(scene)
    _setup_light(scene)
    render_sequence(scene)
