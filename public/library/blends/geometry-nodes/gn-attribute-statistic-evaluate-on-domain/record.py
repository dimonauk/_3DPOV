# record.py — viewport animation for area_heat_map
# Blender 5.1 | CC0
#
# Animates Noise_Strength (the group socket that controls Z-displacement
# amplitude) from 0 → 0.30 → 0 over 90 frames at 30 fps (3 seconds).
# As the terrain deforms, face areas change and AttributeStatistic
# self-calibrates its Min/Max every frame — the heat map repaints live,
# showing cool flat areas emerging and warm steep flanks shrinking back.
#
# Run after blueprint.py has produced area_heat_map.blend:
#   blender area_heat_map.blend --background --python record.py

import bpy

OUT_DIR = ("public/library/videos/geometry-nodes/"
           "gn-attribute-statistic-evaluate-on-domain")

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = 30
scene.frame_start         = 1
scene.frame_end           = 90
scene.render.filepath     = f"{OUT_DIR}/viewport.mp4"
scene.render.image_settings.file_format     = "FFMPEG"
scene.render.ffmpeg.format                   = "MPEG4"
scene.render.ffmpeg.codec                    = "H264"
scene.render.ffmpeg.constant_rate_factor     = "MEDIUM"
scene.render.ffmpeg.audio_codec              = "NONE"

obj = bpy.data.objects["area_terrain"]
mod = obj.modifiers["AreaHeatMap"]

# Noise_Strength is the second group socket → modifier key "Input_2"
# (Blender 4.x+ socket-access convention: first GI socket = "Input_1",
# second = "Input_2", etc.)
SOCKET_KEY = "Input_2"

keyframes = {1: 0.0, 45: 0.30, 90: 0.0}
for frame, value in keyframes.items():
    mod[SOCKET_KEY] = value
    mod.id_data.keyframe_insert(
        f'modifiers["{mod.name}"]["{SOCKET_KEY}"]', frame=frame)

# OpenGL render is the fastest path for viewport animation — no raytracing.
# Ensure Material Preview or Rendered shading is active in the 3D Viewport
# before running, or set shading explicitly:
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                break

bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[record] Viewport animation → {OUT_DIR}/viewport.mp4")
