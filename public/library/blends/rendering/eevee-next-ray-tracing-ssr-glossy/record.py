"""
record.py — EEVEE Next SSR: Sequential Sphere-Drop Reveal
Output: public/library/videos/rendering/eevee-next-ray-tracing-ssr-glossy/viewport.mp4

Run after blueprint.py. Spheres drop one by one from height 3.5 m, each
landing triggers a squash-bounce that shows the SSR floor reflection
activating. Final two seconds hold all six in place for comparison.
"""

import bpy
import math

scene = bpy.context.scene

SPHERE_NAMES  = [
    "sphere_r000", "sphere_r008", "sphere_r018",
    "sphere_r032", "sphere_r055", "sphere_r100",
]
SPHERE_RADIUS = 0.30
FPS           = 24
DROP_HEIGHT   = 3.5        # metres above floor
STAGGER       = 14         # frames between successive drop starts
FALL_FRAMES   = 22         # duration of each drop (ease-out cubic)
SQUASH_FRAMES = 5          # bounce recovery duration
HOLD_FRAMES   = FPS * 2   # two-second hold at end showing all six

scene.render.engine  = 'BLENDER_EEVEE'
scene.render.fps     = FPS
scene.frame_start    = 1
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = (
    "//../../../../videos/rendering/"
    "eevee-next-ray-tracing-ssr-glossy/viewport.mp4"
)

# Determine end frame based on the last sphere's complete motion
last_start    = 1 + (len(SPHERE_NAMES) - 1) * STAGGER
last_land     = last_start + FALL_FRAMES
last_recover  = last_land + SQUASH_FRAMES
scene.frame_end = last_recover + HOLD_FRAMES


def clear_anim(ob: bpy.types.Object) -> None:
    if ob.animation_data:
        ob.animation_data_clear()


def set_key(ob: bpy.types.Object, frame: int,
            data_path: str, index: int, value: float) -> None:
    scene.frame_set(frame)
    if data_path == "location":
        ob.location[index] = value
    elif data_path == "scale":
        ob.scale[index] = value
    ob.keyframe_insert(data_path=data_path, index=index, frame=frame)


for i, name in enumerate(SPHERE_NAMES):
    ob = bpy.data.objects.get(name)
    if not ob:
        print(f"[holoflow] WARNING: {name} not found — run blueprint.py first")
        continue

    clear_anim(ob)

    drop_start = 1 + i * STAGGER
    drop_end   = drop_start + FALL_FRAMES
    squash_end = drop_end + SQUASH_FRAMES

    # Drop: sphere at DROP_HEIGHT → SPHERE_RADIUS (resting on floor)
    set_key(ob, drop_start, "location", 2, DROP_HEIGHT)
    set_key(ob, drop_end,   "location", 2, SPHERE_RADIUS)

    # Squash on landing: compress Z to 0.78, recover to 1.0
    # Scale (1, 1, 1) → (1, 1, 0.78) → (1, 1, 1)
    set_key(ob, drop_end,        "scale", 2, 1.00)
    set_key(ob, drop_end + 2,    "scale", 2, 0.78)  # peak squash
    set_key(ob, squash_end,      "scale", 2, 1.00)

    # Apply CUBIC EASE_OUT to the drop: fast at the top, slows into landing.
    # This mimics gravitational acceleration reversal (visual read: real weight).
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'CUBIC'
                if fc.data_path == "location" and fc.array_index == 2:
                    kp.easing = 'EASE_IN'   # EASE_IN on cubic = fast → slow = correct drop
                else:
                    kp.easing = 'EASE_IN_OUT'

print(f"[holoflow] Animation built → {scene.frame_end} frames")
bpy.ops.render.render(animation=True)
print("[holoflow] record.py complete → viewport.mp4")
