# record.py — Viewport render: RNM Detail Normal Overlay
# Blender 5.1 | CC0 | Holoflow Studio Library
#
# Run AFTER blueprint.py.  Animates:
#   Frames  1–30: camera orbits 90° horizontally — shows surface curvature
#   Frames 31–60: Detail Strength ramps from 0 → DETAIL_STRENGTH — shows
#                 RNM detail appearing live (rivet edges materialise)
#
# Output: public/library/videos/shading/shader-detail-normal-rnm-overlay-hard-surface/viewport.mp4

import bpy, math, os

DETAIL_STRENGTH = 0.35
OUT_PATH = "//../../videos/shading/shader-detail-normal-rnm-overlay-hard-surface/viewport"
FPS = 24
ORBIT_FRAMES = 30
BLEND_FRAMES = 30


def find_detail_bump() -> bpy.types.ShaderNode | None:
    mat = bpy.data.materials.get("RNM_Panel")
    if not mat or not mat.use_nodes:
        return None
    for node in mat.node_tree.nodes:
        if node.type == "BUMP" and abs(node.inputs["Strength"].default_value - DETAIL_STRENGTH) < 0.01:
            return node
    # Fallback: return second bump node found
    bumps = [n for n in mat.node_tree.nodes if n.type == "BUMP"]
    return bumps[1] if len(bumps) >= 2 else None


def setup_render():
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_EEVEE_NEXT"
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.fps = FPS
    scn.frame_start = 1
    scn.frame_end = ORBIT_FRAMES + BLEND_FRAMES
    scn.render.filepath = OUT_PATH
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format = "MPEG4"
    scn.render.ffmpeg.codec = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"

    out_abs = bpy.path.abspath(OUT_PATH)
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)


def keyframe_orbit():
    """90° arc orbit around Z to show normal-lit surface shape."""
    cam = bpy.context.scene.camera
    if not cam:
        return
    cam.animation_data_clear()

    cam.location = (0.0, -1.6, 0.9)
    cam.rotation_euler = (math.radians(60), 0, 0)
    cam.keyframe_insert("location", frame=1)
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.location = (1.4, -0.9, 0.9)
    cam.rotation_euler = (math.radians(60), 0, math.radians(-40))
    cam.keyframe_insert("location", frame=ORBIT_FRAMES)
    cam.keyframe_insert("rotation_euler", frame=ORBIT_FRAMES)


def keyframe_detail_blend(bump_node: bpy.types.ShaderNode):
    """Ramp detail Bump Strength from 0 → DETAIL_STRENGTH."""
    inp = bump_node.inputs["Strength"]
    inp.default_value = 0.0
    inp.keyframe_insert("default_value", frame=ORBIT_FRAMES + 1)
    inp.default_value = DETAIL_STRENGTH
    inp.keyframe_insert("default_value", frame=ORBIT_FRAMES + BLEND_FRAMES)


if __name__ == "__main__":
    setup_render()
    keyframe_orbit()
    detail_bump = find_detail_bump()
    if detail_bump:
        keyframe_blend_detail = keyframe_detail_blend(detail_bump)
    else:
        print("[holoflow] WARNING: could not locate detail Bump node — skipping detail blend animation")
    bpy.ops.render.render(animation=True)
    print("[holoflow] record complete → viewport.mp4")
