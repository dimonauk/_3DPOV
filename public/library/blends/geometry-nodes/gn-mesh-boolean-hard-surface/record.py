"""
record.py — Viewport animation for GN Mesh Boolean panel
=========================================================
Blender 5.1 | Holoflow Studio | CC0

Outputs: public/library/videos/geometry-nodes/gn-mesh-boolean-hard-surface/viewport.mp4

Timeline (60 frames @ 24 fps ≈ 2.5 s):
  F1–20   Hole Density ramps 0 → 4.0  (holes appear progressively)
  F21–40  Camera orbits 180° around the panel
  F41–60  Hole Radius pulses 0.07 → 0.12 → 0.07 (holes grow and shrink)

Run after blueprint.py has created the .blend:
    blender --background panel_boolean.blend --python record.py

The script reads the blend file created by blueprint.py.  If the .blend
does not exist, run blueprint.py first.
"""

import bpy
from pathlib import Path
import math

BLEND_PATH = Path(__file__).parent / "output" / "panel_boolean.blend"
VIDEO_DIR  = (
    Path(__file__).parents[4]          # → public/
    / "library" / "videos"
    / "geometry-nodes"
    / "gn-mesh-boolean-hard-surface"
)
VIDEO_OUT = VIDEO_DIR / "viewport.mp4"

FPS          = 24
TOTAL_FRAMES = 60
MODIFIER_ID  = "HoloflowGNBoolean"


def main():
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load blend ─────────────────────────────────────────────────────────────
    if not BLEND_PATH.exists():
        raise FileNotFoundError(
            f"Run blueprint.py first — {BLEND_PATH} not found."
        )
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    obj = bpy.data.objects.get("panel_boolean")
    if obj is None:
        raise RuntimeError("panel_boolean object not found in blend.")

    mod = obj.modifiers.get(MODIFIER_ID)
    if mod is None:
        raise RuntimeError(f"Modifier {MODIFIER_ID!r} not found.")

    # ── Keyframe: Hole Density 0 → 4.0 (F1–F20) ──────────────────────────────
    mod["Input_2"] = 0.0
    mod.keyframe_insert(data_path='["Input_2"]', frame=1)
    mod["Input_2"] = 4.0
    mod.keyframe_insert(data_path='["Input_2"]', frame=20)

    # ── Keyframe: Hole Density stays 4.0 for remainder ────────────────────────
    mod.keyframe_insert(data_path='["Input_2"]', frame=60)

    # ── Camera orbit F21–F40: 0° → 180° around Z axis ─────────────────────────
    cam = bpy.data.objects.get("Camera")
    if cam is not None:
        import mathutils
        # Orbit radius from camera location
        radius = 3.2
        elevation = 1.8
        for frame, angle_deg in ((21, 0), (40, 180)):
            angle_rad = math.radians(angle_deg)
            cam.location = mathutils.Vector((
                math.sin(angle_rad) * radius,
                -math.cos(angle_rad) * radius,
                elevation,
            ))
            # Point camera at origin
            direction = mathutils.Vector((0, 0, 0)) - cam.location
            rot_quat = direction.to_track_quat("-Z", "Y")
            cam.rotation_euler = rot_quat.to_euler()
            cam.keyframe_insert(data_path="location", frame=frame)
            cam.keyframe_insert(data_path="rotation_euler", frame=frame)

    # ── Keyframe: Hole Radius pulse F41–F60 ───────────────────────────────────
    for frame, radius in ((41, 0.07), (50, 0.12), (60, 0.07)):
        mod["Input_3"] = radius
        mod.keyframe_insert(data_path='["Input_3"]', frame=frame)

    # ── Render settings ────────────────────────────────────────────────────────
    scene.render.engine         = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = str(VIDEO_OUT)

    # ── Render animation ───────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[record] viewport.mp4 → {VIDEO_OUT}")


if __name__ == "__main__":
    main()
