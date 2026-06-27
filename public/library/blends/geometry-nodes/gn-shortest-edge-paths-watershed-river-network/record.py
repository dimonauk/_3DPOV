"""
record.py — Watershed River Network: viewport-animation render
Blender 5.1 · CC0 · Holoflow Studio

Run after blueprint.py (with watershed_river.blend open).
Renders a 5-second (150-frame) EEVEE-Viewport animation:
  - Camera orbits the terrain at 45° elevation, completing one full revolution
  - Blue emissive river tubes pulse gently (emission strength keyframed 1.0 → 2.5 → 1.0)
  - Outputs PNG sequence to public/library/videos/geometry-nodes/…

Mux to MP4 after render:
  ffmpeg -r 30 -i viewport_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
"""

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 150
CAM_DIST     = 9.5
CAM_ELEV     = 4.2      # height of camera above terrain midpoint
ORBIT_DEG    = 360.0     # total camera rotation over the animation
RESOLUTION_X = 1920
RESOLUTION_Y = 1080
OUTPUT_DIR   = "//../../videos/geometry-nodes/gn-shortest-edge-paths-watershed-river-network/"


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine         = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x   = RESOLUTION_X
    sc.render.resolution_y   = RESOLUTION_Y
    sc.render.fps            = 30
    sc.frame_start           = FRAME_START
    sc.frame_end             = FRAME_END
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath       = OUTPUT_DIR + "viewport_"
    # EEVEE bloom makes the river emissive glow read well
    if hasattr(sc.eevee, "use_bloom"):
        sc.eevee.use_bloom = True
        sc.eevee.bloom_intensity = 0.08
        sc.eevee.bloom_radius    = 5.0


def _setup_camera() -> bpy.types.Object:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("WS_Cam"):
            bpy.data.objects.remove(ob, do_unlink=True)
    cam_data = bpy.data.cameras.new("WS_Cam")
    cam_data.lens = 45
    cam = bpy.data.objects.new("WS_Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # Orbit keyframes every 5 frames is smooth enough
    cam.animation_data_create()
    cam.animation_data.action = bpy.data.actions.new("WS_CamOrbit")
    for fr in range(FRAME_START, FRAME_END + 1, 5):
        t     = (fr - FRAME_START) / (FRAME_END - FRAME_START)
        angle = math.radians(ORBIT_DEG * t)
        cam.location = (
            math.sin(angle) * CAM_DIST,
            -math.cos(angle) * CAM_DIST,
            CAM_ELEV,
        )
        # Point camera at origin (terrain centre) by aiming -Z toward it
        cam.rotation_euler = (
            math.radians(65),  # tilt 65° down from horizontal
            0.0,
            angle,
        )
        cam.keyframe_insert("location",       frame=fr)
        cam.keyframe_insert("rotation_euler", frame=fr)
    return cam


def _animate_river_glow() -> None:
    """Pulse the river material's emission strength for visual interest."""
    mat = bpy.data.materials.get("Mat_River")
    if mat is None:
        return
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    strength_input = bsdf.inputs["Emission Strength"]
    # 1.0 → peak 2.5 at midpoint → back to 1.0
    for fr, val in ((1, 1.0), (75, 2.5), (150, 1.0)):
        strength_input.default_value = val
        strength_input.keyframe_insert("default_value", frame=fr)


def _setup_world() -> None:
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("WS_World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value   = (0.05, 0.06, 0.12, 1.0)
        bg.inputs["Strength"].default_value = 0.6


def main() -> None:
    _setup_render()
    _setup_camera()
    _animate_river_glow()
    _setup_world()
    bpy.ops.render.render(animation=True, write_still=True)
    print("WatershedRiver record.py: render complete.")


main()
