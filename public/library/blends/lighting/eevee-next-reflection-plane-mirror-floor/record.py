"""
record.py — Viewport animation for the Reflection Plane Probe tutorial.
Blender 5.1  ·  CC0 1.0 Universal  ·  holoflow.co.uk

Sequence (90 frames @ 30 fps = 3 seconds):
  Fr  1–30:  Floor at ROUGHNESS_MIN (0.04) — mirror-clear reflection visible.
             Camera holds still; red sphere orbits slowly overhead.
  Fr 30–50:  Floor roughness ramps to ROUGHNESS_MAX (0.50 > SSR_MAX_ROUGHNESS).
             Reflection dissolves: the Plane Probe cutoff is crossed.
  Fr 50–70:  Hold at matte — shows the floor without any specular contribution.
  Fr 70–90:  Roughness ramps back to ROUGHNESS_MIN — reflection returns.

This before/after reveal is the clearest single-shot demo of the Plane Probe
threshold: the reflection doesn't fade gracefully (like SSR) but cuts at the
roughness boundary, then re-engages as roughness drops back below the cutoff.
Run blueprint.py first to build the scene before executing this script.
"""

import bpy
import math

FRAME_START       = 1
FRAME_END         = 90
FPS               = 30
ROUGHNESS_MIN     = 0.04   # mirror state
ROUGHNESS_MAX     = 0.50   # matte — above SSR_MAX_ROUGHNESS (0.45) set in blueprint
ORBIT_RADIUS      = 1.2    # red sphere horizontal orbit radius (metres)
ORBIT_HEIGHT      = 0.36   # red sphere orbit height above floor
OUTPUT_PATH       = "//../../videos/lighting/eevee-next-reflection-plane-mirror-floor/viewport"

RAMP_IN_START  = 30        # frame: roughness starts rising
RAMP_IN_END    = 50        # frame: roughness reaches max
RAMP_OUT_START = 70        # frame: roughness starts falling
RAMP_OUT_END   = 90        # frame: roughness back at min


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * max(0.0, min(1.0, t))


def get_floor_roughness_node() -> bpy.types.Node | None:
    mat = bpy.data.materials.get("mirror_floor")
    if mat is None:
        print("[record] WARNING: mirror_floor material not found. Run blueprint.py first.")
        return None
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            return node
    return None


def get_red_sphere() -> bpy.types.Object | None:
    obj = bpy.data.objects.get("sphere_red")
    if obj is None:
        print("[record] WARNING: sphere_red not found. Run blueprint.py first.")
    return obj


def insert_roughness_keyframe(bsdf_node: bpy.types.Node, frame: int, value: float) -> None:
    bsdf_node.inputs["Roughness"].default_value = value
    bsdf_node.inputs["Roughness"].keyframe_insert("default_value", frame=frame)


def setup_roughness_animation(bsdf_node: bpy.types.Node) -> None:
    """Animate roughness: mirror → matte → mirror, crossing the probe cutoff twice."""
    # Hold mirror roughness frames 1–30
    insert_roughness_keyframe(bsdf_node, FRAME_START, ROUGHNESS_MIN)
    insert_roughness_keyframe(bsdf_node, RAMP_IN_START, ROUGHNESS_MIN)
    # Ramp up to matte frames 30–50
    insert_roughness_keyframe(bsdf_node, RAMP_IN_END, ROUGHNESS_MAX)
    # Hold matte frames 50–70
    insert_roughness_keyframe(bsdf_node, RAMP_OUT_START, ROUGHNESS_MAX)
    # Ramp back to mirror frames 70–90
    insert_roughness_keyframe(bsdf_node, RAMP_OUT_END, ROUGHNESS_MIN)

    # Use LINEAR interpolation — constant-rate ramp makes the cutoff moment clear
    action = bpy.data.materials["mirror_floor"].node_tree.animation_data.action
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"


def setup_sphere_orbit(sphere: bpy.types.Object) -> None:
    """Orbit sphere_red slowly — proves the reflection is live (not baked)."""
    for frame in range(FRAME_START, FRAME_END + 1):
        angle = (frame / FRAME_END) * math.pi * 0.75   # 135° arc over 90 frames
        x = math.cos(angle) * ORBIT_RADIUS
        y = math.sin(angle) * ORBIT_RADIUS
        sphere.location = (x, y, ORBIT_HEIGHT + sphere.dimensions.z * 0.5)
        sphere.keyframe_insert("location", frame=frame)

    action = sphere.animation_data.action
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "BEZIER"


def setup_render_output(scene: bpy.types.Scene) -> None:
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath                   = OUTPUT_PATH
    scene.render.fps                        = FPS
    scene.frame_start                       = FRAME_START
    scene.frame_end                         = FRAME_END


def main() -> None:
    scene = bpy.context.scene

    bsdf_node = get_floor_roughness_node()
    sphere    = get_red_sphere()

    if bsdf_node is None or sphere is None:
        print("[record] Aborting — dependencies missing. Run blueprint.py first.")
        return

    setup_roughness_animation(bsdf_node)
    setup_sphere_orbit(sphere)
    setup_render_output(scene)

    scene.frame_set(FRAME_START)
    print(
        "[record] Animation keyframes inserted.\n"
        "  Fr  1–30: mirror floor, reflection visible.\n"
        "  Fr 30–50: floor roughness ramps beyond SSR cutoff — reflection dissolves.\n"
        "  Fr 50–70: matte floor hold.\n"
        "  Fr 70–90: roughness returns — reflection re-engages.\n"
        "  Red sphere orbits throughout to show the reflection is live.\n"
        "  Render: Render › Render Animation (Ctrl+F12). Output → viewport.mp4."
    )


main()
