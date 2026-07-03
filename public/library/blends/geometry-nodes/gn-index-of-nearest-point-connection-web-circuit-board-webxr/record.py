"""
record.py — Viewport animation render for the KNN Circuit Board tutorial.

Outputs:  public/library/videos/geometry-nodes/
          gn-index-of-nearest-point-connection-web-circuit-board-webxr/viewport.mp4

Run from Blender's Text Editor AFTER running blueprint.py (scene must have
the HF_CircuitSubstrate object with the KNNCircuit modifier in place).

The animation shows the POINT_DENSITY parameter ramping from 10 → 160 over
60 frames so the connection web grows from sparse to dense — communicating
how Index of Nearest adapts to varying point counts in real time.
"""

import bpy
import os

# ── Render settings ────────────────────────────────────────────────────────────
OUTPUT_DIR  = "//../../videos/geometry-nodes/" \
              "gn-index-of-nearest-point-connection-web-circuit-board-webxr/"
OUTPUT_FILE = "viewport"
FRAME_START = 1
FRAME_END   = 60
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
RENDER_ENGINE = 'BLENDER_EEVEE_NEXT'

# ── Density keyframe schedule (frame → density) ───────────────────────────────
DENSITY_KEYS = {
     1:   10.0,
    20:   40.0,
    40:  100.0,
    60:  160.0,
}


def setup_scene():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.engine = RENDER_ENGINE
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format        = 'MPEG4'
    scene.render.ffmpeg.codec         = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = bpy.path.abspath(OUTPUT_DIR + OUTPUT_FILE)


def setup_camera():
    # Overhead orthographic camera gives clear top-down read of the web pattern.
    bpy.ops.object.camera_add(location=(0, 0, 3.5))
    cam_obj = bpy.context.active_object
    cam_obj.name = "HF_RecordCam"
    cam = cam_obj.data
    cam.type      = 'ORTHO'
    cam.ortho_scale = 2.4    # slightly wider than the 2m panel
    cam_obj.rotation_euler = (0, 0, 0)
    bpy.context.scene.camera = cam_obj


def setup_light():
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 5))
    sun = bpy.context.active_object
    sun.name = "HF_RecordSun"
    sun.data.energy = 2.0


def keyframe_density():
    """Animate the Density socket on the DistributePointsOnFaces node."""
    plane = bpy.data.objects.get("HF_CircuitSubstrate")
    if not plane:
        print("ERROR: HF_CircuitSubstrate not found — run blueprint.py first.")
        return

    mod = plane.modifiers.get("KNNCircuit")
    if not mod or not mod.node_group:
        print("ERROR: KNNCircuit modifier not found.")
        return

    dist_node = mod.node_group.nodes.get("Distribute Points on Faces")
    if not dist_node:
        # Find by type if name differs
        for nd in mod.node_group.nodes:
            if nd.type == 'DISTRIBUTE_POINTS_ON_FACES':
                dist_node = nd
                break

    if not dist_node:
        print("ERROR: DistributePointsOnFaces node not found in GN tree.")
        return

    density_input = dist_node.inputs.get('Density')
    if not density_input:
        print("ERROR: Density input not found on distribute node.")
        return

    for frame, val in DENSITY_KEYS.items():
        density_input.default_value = val
        density_input.keyframe_insert(data_path='default_value', frame=frame)

    # Ease in/out interpolation for the curve
    action = mod.node_group.animation_data.action if mod.node_group.animation_data else None
    if action:
        for fcurve in action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'EASE_IN_OUT'


def main():
    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
    setup_scene()
    setup_camera()
    setup_light()
    keyframe_density()
    bpy.ops.render.render(animation=True)
    print("✓ viewport.mp4 rendered.")


if __name__ == "__main__":
    main()
