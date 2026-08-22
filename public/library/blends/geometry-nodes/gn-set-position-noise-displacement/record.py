# record.py — viewport animation renderer
# Blender 5.1 | CC0
#
# Renders a 90-frame viewport animation of the blob planet breathing:
# W_Anim advances from 0 to 3.75 (=90 frames × 1/24 W/frame), so the
# noise field cycles through roughly 3.75 units of 4D-W space — enough
# motion to show both macro and micro noise evolving without looping.
#
# Run after blueprint.py: open blob_planet.blend, then run this script.
# Output: public/library/videos/geometry-nodes/
#         gn-set-position-noise-displacement/viewport.mp4

import bpy

BLEND_PATH = ("public/library/blends/geometry-nodes/"
              "gn-set-position-noise-displacement/blob_planet.blend")
OUT_VIDEO  = ("public/library/videos/geometry-nodes/"
              "gn-set-position-noise-displacement/viewport.mp4")

OBJ_NAME   = "blob_planet"
GNM_NAME   = "BlobPlanet"
TOTAL_FRAMES = 90
FPS          = 24


def _find_socket_id(ng: bpy.types.GeometryNodeTree, name: str) -> str:
    for item in ng.interface.items_tree:
        if item.name == name and item.in_out == 'INPUT':
            return item.identifier
    raise RuntimeError(f"Socket '{name}' not found in {ng.name}")


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene            = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # Viewport render settings
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.filepath = OUT_VIDEO

    # Remove the driver so we can keyframe W_Anim directly
    obj = bpy.data.objects[OBJ_NAME]
    mod = obj.modifiers[GNM_NAME]
    ng  = mod.node_group
    w_id = _find_socket_id(ng, 'W_Anim')

    # Clear any existing driver on the socket
    mod.driver_remove(f'["{w_id}"]')

    W_PER_FRAME = 1.0 / FPS
    for frame in range(1, TOTAL_FRAMES + 1):
        scene.frame_set(frame)
        mod[w_id] = (frame - 1) * W_PER_FRAME
        mod.keyframe_insert(data_path=f'["{w_id}"]', frame=frame)

    # Render animation
    bpy.ops.render.render(animation=True)
    print(f"Viewport animation written to: {OUT_VIDEO}")


if __name__ == "__main__":
    main()
