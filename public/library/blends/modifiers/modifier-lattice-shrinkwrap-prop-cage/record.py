"""
record.py — Viewport animation for modifier-lattice-shrinkwrap-prop-cage
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py.  Animates two things simultaneously:

  Phase 1 (frames 1–80):   Camera orbits 120° — establishes the fitted prop.
  Phase 2 (frames 80–160): Lattice Z scale pulses +35%, showing the dome rise
                            as the cage expands; the contact ring re-snaps live.
  Phase 3 (frames 160–240): Lattice returns to rest; camera completes the arc.

The lattice pulse demonstrates the core selling point: lattice edits are
immediately reflected in the fitted prop without re-running any bake step.

Output:
  public/library/videos/modifiers/modifier-lattice-shrinkwrap-prop-cage/viewport.mp4
"""

import bpy
import math
import os

OUT_SUBDIR = "videos/modifiers/modifier-lattice-shrinkwrap-prop-cage"
OUT_FILE   = "viewport"
FRAME_END  = 240
ORBIT_R    = 1.3
ORBIT_Z    = 0.36   # focus height — shoulder prop centre
CAM_Z      = 0.55   # camera elevation


def _ensure_dir() -> str:
    blend_abs = bpy.path.abspath("//")
    # blend lives at public/library/blends/modifiers/<slug>/
    # videos live at public/library/videos/<topic>/<slug>/
    lib_root = os.path.normpath(os.path.join(blend_abs, "..", "..", "..", ".."))
    out = os.path.join(lib_root, OUT_SUBDIR)
    os.makedirs(out, exist_ok=True)
    return out + os.sep


def _setup_render(out_dir: str) -> None:
    sc = bpy.context.scene
    sc.render.engine          = "BLENDER_EEVEE_NEXT"
    sc.render.filepath        = out_dir + OUT_FILE
    sc.render.image_settings.file_format        = "FFMPEG"
    sc.render.ffmpeg.format                     = "MPEG4"
    sc.render.ffmpeg.codec                      = "H264"
    sc.render.ffmpeg.constant_rate_factor       = "MEDIUM"
    sc.render.resolution_x                      = 1920
    sc.render.resolution_y                      = 1080
    sc.render.resolution_percentage             = 100
    sc.render.fps    = 24
    sc.frame_start   = 1
    sc.frame_end     = FRAME_END


def _orbit_camera() -> None:
    sc = bpy.context.scene
    if "RecordCam" not in bpy.data.objects:
        cd  = bpy.data.cameras.new("RecordCam")
        cam = bpy.data.objects.new("RecordCam", cd)
        sc.collection.objects.link(cam)
    else:
        cam = bpy.data.objects["RecordCam"]
    sc.camera = cam
    cam.animation_data_clear()
    cam.rotation_mode = 'XYZ'

    # Orbit centred on prop location (0.42, 0.0, ORBIT_Z)
    cx, cy = 0.42, 0.0

    for fr in range(1, FRAME_END + 1):
        t     = (fr - 1) / FRAME_END
        angle = 2 * math.pi * t
        cam.location.x = cx + ORBIT_R * math.sin(angle)
        cam.location.y = cy - ORBIT_R * math.cos(angle)
        cam.location.z = CAM_Z

        dx = cx - cam.location.x
        dy = cy - cam.location.y
        dz = ORBIT_Z - cam.location.z
        pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
        yaw   = math.atan2(dx, dy)
        cam.rotation_euler = (math.pi / 2 - pitch, 0.0, yaw)

        cam.keyframe_insert("location",       frame=fr)
        cam.keyframe_insert("rotation_euler", frame=fr)


def _animate_lattice() -> None:
    """
    Scale lattice on Z to show the live cage-to-prop feedback loop.
    The Shrinkwrap fires each frame; the contact ring stays on the body surface
    even as the dome rises — visible proof that the modifier stack is live.
    """
    lat = bpy.data.objects.get("lattice_pauldron")
    if lat is None:
        print("[record] lattice_pauldron not found — skipping lattice animation.")
        return

    lat.animation_data_clear()
    rest_z = lat.scale.z

    def _kf(frame: int, sz: float) -> None:
        bpy.context.scene.frame_set(frame)
        lat.scale.z = sz
        lat.keyframe_insert("scale", frame=frame)

    _kf(1,   rest_z)
    _kf(80,  rest_z)
    _kf(120, rest_z * 1.35)   # cage expands — dome rises
    _kf(160, rest_z * 1.35)   # hold expanded (viewer reads the contact snap)
    _kf(200, rest_z)           # return to rest
    _kf(240, rest_z)


def main() -> None:
    out_dir = _ensure_dir()
    _setup_render(out_dir)
    _orbit_camera()
    _animate_lattice()
    bpy.ops.render.render(animation=True, use_viewport=True)
    print(f"[record] viewport.mp4 → {out_dir}")


if __name__ == "__main__":
    main()
