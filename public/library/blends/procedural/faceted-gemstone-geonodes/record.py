"""
record.py — Viewport animation for faceted-gemstone-geonodes
Holoflow Studio · topic: procedural · slug: faceted-gemstone-geonodes

Animates the gem rotating on Y while the camera orbits slightly on Z,
producing a 5-second clip that shows all facet groups catching the
studio light from different angles.

Output: public/library/videos/procedural/faceted-gemstone-geonodes/viewport.mp4

Run after blueprint.py has saved gemstone.blend:
    blender gemstone.blend --python record.py

Requires ffmpeg on PATH (Blender calls it for H.264 encoding).
"""

import bpy
import math
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.normpath(
    os.path.join(SCRIPT_DIR, "../../../videos/procedural/faceted-gemstone-geonodes")
)
FRAME_START   = 1
FRAME_END     = 150     # 5 seconds at 30 fps
FPS           = 30
GEM_NAME      = "gem_faceted"
RESOLUTION_X  = 1920
RESOLUTION_Y  = 1080

# ── SCENE ────────────────────────────────────────────────────────────────────

def setup_scene() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # Output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scene.render.filepath      = os.path.join(OUTPUT_DIR, "viewport")
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format             = 'MPEG4'
    scene.render.ffmpeg.codec              = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec        = 'NONE'
    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y
    scene.render.resolution_percentage = 100

    # Use EEVEE Next (Blender 5.x default)
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.use_bloom     = True
    scene.eevee.bloom_radius  = 3.0
    scene.eevee.bloom_intensity = 0.08   # subtle sparkle from specular

    # Background: dark studio grey so facets pop
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.06, 0.06, 0.08, 1.0)
        bg.inputs["Strength"].default_value = 0.8
    scene.world = world


def place_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85          # mild telephoto flattens the gem nicely
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # Orbit path: camera circles the gem at 30° elevation
    radius = 4.5
    elev   = math.radians(25)
    cam.location = (
        radius * math.cos(elev) * math.cos(0),
        radius * math.cos(elev) * math.sin(0),
        radius * math.sin(elev),
    )

    # Point at origin
    look = bpy.data.objects.new("CamTarget", None)
    look.location = (0, 0, 0)
    bpy.context.collection.objects.link(look)

    track = cam.constraints.new('TRACK_TO')
    track.target   = look
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis  = 'UP_Y'

    return cam


def add_lights() -> None:
    # Key light: sharp, high to produce strong specular glints on facets
    key_data = bpy.data.lights.new("Key", type='AREA')
    key_data.energy = 600
    key_data.size   = 0.5
    key = bpy.data.objects.new("Key", key_data)
    key.location = (3, -2, 5)
    bpy.context.collection.objects.link(key)

    # Rim light: opposite side, cool tint for contrast
    rim_data = bpy.data.lights.new("Rim", type='AREA')
    rim_data.energy = 200
    rim_data.color  = (0.7, 0.8, 1.0)
    rim_data.size   = 1.0
    rim = bpy.data.objects.new("Rim", rim_data)
    rim.location = (-4, 3, 2)
    bpy.context.collection.objects.link(rim)


def animate_gem(gem: bpy.types.Object) -> None:
    """
    Full 360° Y rotation over the clip length. Combined with the camera
    angle, every facet group passes through the key light at least twice,
    making the flat-shading 'pop' transition visible.
    """
    gem.rotation_euler = (0, 0, 0)
    gem.keyframe_insert(data_path="rotation_euler", frame=FRAME_START)

    gem.rotation_euler = (0, math.radians(360), 0)
    gem.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)

    # Linear interpolation — constant rotation speed, no ease-in/out
    for fcurve in gem.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'


# ── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    gem = bpy.data.objects.get(GEM_NAME)
    if gem is None:
        raise RuntimeError(
            f"[record] Object '{GEM_NAME}' not found. "
            "Run blueprint.py first to build the mesh."
        )

    setup_scene()
    place_camera()
    add_lights()
    animate_gem(gem)

    print(f"[record] Rendering {FRAME_END} frames → {OUTPUT_DIR}/viewport.mp4")
    bpy.ops.render.render(animation=True)
    print("[record] done.")
