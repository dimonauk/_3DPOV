"""
record.py — viewport render for vertex-colour-attributes.

150 frames, 30 fps, 5 seconds.  The camera orbits 360° around the coloured
icosphere, revealing all four palette zones (amber top cap, teal / rose
equatorial band, indigo bottom cap) and the clean hard facet boundaries.

Run:  blender --background --python record.py
Out:  public/library/videos/shading/vertex-colour-attributes/viewport.mp4
"""

import bpy
import math
from pathlib import Path

VIDEO_DIR = (
    Path(__file__).parents[4]
    / "public" / "library" / "videos"
    / "shading" / "vertex-colour-attributes"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = VIDEO_DIR / "viewport.mp4"

FRAMES     = 150
FPS        = 30
CAM_DIST   = 3.0
CAM_HEIGHT = 1.2   # slight high-angle so the top amber cap reads early


def _setup_scene() -> "bpy.types.Scene":
    blend_src = Path(__file__).parent / "vertex_colour_demo.blend"
    if blend_src.exists():
        bpy.ops.wm.open_mainfile(filepath=str(blend_src))
    else:
        # Self-contained fallback: run blueprint inline when .blend is absent.
        exec(
            compile(
                (Path(__file__).parent / "blueprint.py").read_text(),
                "blueprint.py",
                "exec",
            )
        )

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.fps    = FPS
    scene.frame_start   = 1
    scene.frame_end     = FRAMES

    scene.render.image_settings.file_format    = "FFMPEG"
    scene.render.ffmpeg.format                 = "MPEG4"
    scene.render.ffmpeg.codec                  = "H264"
    scene.render.ffmpeg.constant_rate_factor   = "MEDIUM"
    scene.render.resolution_x                  = 1920
    scene.render.resolution_y                  = 1080
    scene.render.filepath                      = str(OUT_PATH)
    return scene


def _add_camera(scene: "bpy.types.Scene") -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Full 360° orbit, one keyframe per frame — no interpolation surprises.
    tilt = math.atan2(CAM_HEIGHT, CAM_DIST)   # angle down toward origin
    for f in range(1, FRAMES + 1):
        angle = (f - 1) / (FRAMES - 1) * math.tau
        cam_obj.location = (
            CAM_DIST * math.sin(angle),
            -CAM_DIST * math.cos(angle),
            CAM_HEIGHT,
        )
        # Euler order ZXY: first spin around Z (orbit), then tilt around X.
        cam_obj.rotation_euler = (tilt, 0.0, angle)
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)


def _add_lighting(scene: "bpy.types.Scene") -> None:
    # Near-black background: the Emission shader needs no scene light, but a
    # dark surround makes the palette hues pop without washing them out.
    world = bpy.data.worlds.new("RecordWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value    = (0.05, 0.05, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    scene.world = world


def render() -> None:
    scene = _setup_scene()
    _add_camera(scene)
    _add_lighting(scene)
    bpy.ops.render.render(animation=True)
    print(f"[record] → {OUT_PATH}")


render()
