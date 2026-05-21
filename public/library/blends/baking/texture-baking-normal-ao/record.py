"""
record.py — viewport render for texture-baking-normal-ao.

90 frames · 30 fps · 3 seconds.  A three-point light rig orbits with the
camera through 180° around the baked sphere, so the catch-light traverses
the hemisphere and shows the normal map's micro-detail responding to the
changing angle.  EEVEE Next is used for speed; it reads the packed tangent-
space normal map correctly via the Normal Map node.

Run after blueprint.py:
    blender --background --python record.py

Out:  public/library/videos/baking/texture-baking-normal-ao/viewport.mp4
"""

import bpy
import math
from pathlib import Path

VIDEO_DIR = (
    Path(__file__).parents[4]
    / "public" / "library" / "videos"
    / "baking" / "texture-baking-normal-ao"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = VIDEO_DIR / "viewport.mp4"

FRAMES     = 90
FPS        = 30
CAM_DIST   = 3.4
CAM_HEIGHT = 0.9


def _setup_scene() -> "bpy.types.Scene":
    blend_src = Path(__file__).parent / "baked_normal_ao.blend"
    if blend_src.exists():
        bpy.ops.wm.open_mainfile(filepath=str(blend_src))
    else:
        # Fallback: run blueprint inline when .blend is absent.
        exec(
            compile(
                (Path(__file__).parent / "blueprint.py").read_text(),
                "blueprint.py",
                "exec",
            )
        )

    scene = bpy.context.scene
    # EEVEE Next for the preview orbit — Cycles at 8 samples × 90 frames is
    # ~12 minutes on CPU; EEVEE renders the same orbit in under 60 seconds.
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.fps    = FPS
    scene.frame_start   = 1
    scene.frame_end     = FRAMES

    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.resolution_x               = 1920
    scene.render.resolution_y               = 1080
    scene.render.filepath                   = str(OUT_PATH)
    return scene


def _add_camera(scene: "bpy.types.Scene") -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Half-orbit (0 → π): the catch-light sweeps across the sphere revealing
    # the normal map's micro-surface response.  A full orbit would repeat
    # the same lighting from behind and add nothing informative.
    tilt = math.atan2(CAM_HEIGHT, CAM_DIST)
    for f in range(1, FRAMES + 1):
        t     = (f - 1) / (FRAMES - 1)
        angle = t * math.pi
        cam_obj.location = (
            CAM_DIST * math.sin(angle),
            -CAM_DIST * math.cos(angle),
            CAM_HEIGHT,
        )
        cam_obj.rotation_euler = (tilt, 0.0, angle)
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)


def _add_lighting(scene: "bpy.types.Scene") -> None:
    world = bpy.data.worlds.new("RecordWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.3
    scene.world = world

    def _sun(name: str, energy: float, color: tuple, rx: float, rz: float) -> None:
        sd = bpy.data.lights.new(name, "SUN")
        so = bpy.data.objects.new(name, sd)
        sd.energy = energy
        sd.color  = color
        so.rotation_euler = (math.radians(rx), 0.0, math.radians(rz))
        scene.collection.objects.link(so)

    # Key: warm, upper-left — the primary catch-light on the baked surface.
    _sun("Key",  5.0, (1.0, 0.95, 0.85),  45,  30)
    # Fill: cool, dim — prevents the shadow side going pitch-black.
    _sun("Fill", 1.2, (0.7,  0.8,  1.0),  70, 210)
    # Rim: white, back — separates the sphere from the dark background.
    _sun("Rim",  2.8, (1.0,  1.0,  1.0),  20, 160)


def render() -> None:
    scene = _setup_scene()
    _add_camera(scene)
    _add_lighting(scene)
    bpy.ops.render.render(animation=True)
    print(f"[record] → {OUT_PATH}")


render()
