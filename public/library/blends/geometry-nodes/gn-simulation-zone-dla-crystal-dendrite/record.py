"""
record.py — DLA Crystal Dendrite: viewport-animation render
Blender 5.1 · CC0 · Holoflow Studio

Run after blueprint.py. Renders a 5-second (150-frame) EEVEE-Viewport animation
of the crystal growing from a single seed point to a full 3-D dendrite, then
exports the image sequence as viewport.mp4 to:
  public/library/videos/geometry-nodes/gn-simulation-zone-dla-crystal-dendrite/

The camera orbits slowly (0.6 °/frame) so the 3-D branching structure is legible
throughout. Crystal is rendered with an HDRI rim-light to pop the metallic finish.
"""

import bpy
import os
import math

# ── Render parameters ─────────────────────────────────────────────────────────
FRAME_START   = 1
FRAME_END     = 150
ORBIT_SPEED   = 0.6          # degrees per frame, camera orbits the Y axis
CAM_DIST      = 9.0          # camera distance from origin
CAM_ELEV      = 1.2          # camera Z elevation (metres)
RESOLUTION_X  = 1920
RESOLUTION_Y  = 1080
OUTPUT_DIR    = "//../../videos/geometry-nodes/gn-simulation-zone-dla-crystal-dendrite/"
MP4_FILENAME  = "viewport"


def _setup_camera() -> bpy.types.Object:
    # Remove any existing render camera
    for ob in list(bpy.data.objects):
        if ob.name.startswith("DLA_Cam"):
            bpy.data.objects.remove(ob, do_unlink=True)
    cam_data = bpy.data.cameras.new("DLA_Cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("DLA_Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    # Start position
    cam.location = (0, -CAM_DIST, CAM_ELEV)
    cam.rotation_euler = (math.radians(80), 0, 0)
    # Keyframe orbit: one keyframe every 10 frames is enough for smooth interpolation
    cam.animation_data_create()
    cam.animation_data.action = bpy.data.actions.new("DLA_CamOrbit")
    for frame in range(FRAME_START, FRAME_END + 1, 10):
        angle = math.radians(frame * ORBIT_SPEED)
        cam.location = (
            math.sin(angle) * CAM_DIST,
            -math.cos(angle) * CAM_DIST,
            CAM_ELEV,
        )
        cam.rotation_euler = (math.radians(80), 0, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
    return cam


def _setup_world() -> None:
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("DLA_World")
        bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes.get("Background") or nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.04, 1)  # near-black void
    bg.inputs["Strength"].default_value = 0.4


def _setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine        = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x  = RESOLUTION_X
    scene.render.resolution_y  = RESOLUTION_Y
    scene.render.fps           = 30
    scene.frame_start          = FRAME_START
    scene.frame_end            = FRAME_END

    # Output as image sequence; ffmpeg in post or Blender VSE to mux to mp4
    out_path = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(out_path, exist_ok=True)
    scene.render.filepath      = os.path.join(out_path, MP4_FILENAME + "_")
    scene.render.image_settings.file_format = 'PNG'

    # EEVEE settings for metallic crystal
    eevee = scene.eevee
    eevee.use_bloom            = True
    eevee.bloom_threshold      = 0.8
    eevee.bloom_intensity      = 0.4
    eevee.use_gtao             = True


def _add_key_light() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("DLA_Light"):
            bpy.data.objects.remove(ob, do_unlink=True)
    ld = bpy.data.lights.new("DLA_Light_Key", 'AREA')
    ld.energy = 2000
    ld.size   = 3.0
    lo = bpy.data.objects.new("DLA_Light_Key", ld)
    bpy.context.collection.objects.link(lo)
    lo.location      = (4, -4, 6)
    lo.rotation_euler = (math.radians(45), 0, math.radians(45))

    # Fill light from below — accentuates the downward branch geometry
    lf = bpy.data.lights.new("DLA_Light_Fill", 'POINT')
    lf.energy = 300
    lf.color  = (0.3, 0.5, 1.0)
    lfo = bpy.data.objects.new("DLA_Light_Fill", lf)
    bpy.context.collection.objects.link(lfo)
    lfo.location = (0, 0, -2)


def main() -> None:
    _setup_world()
    _setup_render()
    _add_key_light()
    _setup_camera()
    # Bake the simulation: play through once so the zone writes its cache
    bpy.context.scene.frame_set(FRAME_START)
    for f in range(FRAME_START, FRAME_END + 1):
        bpy.context.scene.frame_set(f)
    # Render the full sequence
    bpy.ops.render.render(animation=True)
    print("[DLA] record.py complete — frames in", bpy.path.abspath(OUTPUT_DIR))


if __name__ == "__main__":
    main()
