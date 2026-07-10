"""
record.py — Viewport animation for:
  python-bpy-sequence-editor-vse-script-tutorial-assembly

Output: public/library/videos/video-editing/
         python-bpy-sequence-editor-vse-script-tutorial-assembly/viewport.mp4

What it animates (10 s @ 30 fps = 300 frames):
  Stylised 3D representation of VSE strip assembly.  Five colour-coded panels
  (representing the strip types produced by blueprint.py) fly in one by one
  and stack into a horizontal timeline.  The camera arcs from above to a 3/4
  perspective view to show depth.

This clip becomes the 'viewport.mp4' used as source material in the tutorial
assembly itself — a deliberate recursive reference that demonstrates the pipeline
feeding itself.
"""

import bpy
import math
import os

SLUG      = 'python-bpy-sequence-editor-vse-script-tutorial-assembly'
TOPIC     = 'video-editing'
VIDEO_DIR = bpy.path.abspath(
    f'//public/library/videos/{TOPIC}/{SLUG}'
)
OUTPUT  = os.path.join(VIDEO_DIR, 'viewport.mp4')
FPS     = 30
FRAMES  = 300   # 10 seconds

# Strip-type colours — consistent with blueprint.py palette
COLOURS = {
    'COLOR_title':   (0.07, 0.07, 0.09),
    'MOVIE_vp':      (0.20, 0.45, 0.85),
    'MOVIE_sc':      (0.85, 0.50, 0.20),
    'TEXT_overlay':  (1.00, 0.32, 0.55),
    'FX_dissolve':   (0.28, 0.78, 0.40),
}
STRIP_LABELS = [
    ('COLOR_title',  'COLOR: Title Card'),
    ('MOVIE_vp',     'MOVIE: Viewport Clip'),
    ('MOVIE_sc',     'MOVIE: Screen Clip'),
    ('TEXT_overlay', 'TEXT: Overlays'),
    ('FX_dissolve',  'FX: Gamma Cross'),
]

PANEL_W = 2.2
PANEL_H = 0.45


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)


def make_panel(name: str, rgb: tuple, pos_x: float, pos_y: float) -> 'bpy.types.Object':
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(pos_x, 0.0, pos_y))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (PANEL_W, 1.0, PANEL_H)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()

    mat = bpy.data.materials.new(f'mat_{name}')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value      = (*rgb, 1.0)
    bsdf.inputs['Roughness'].default_value       = 0.85
    bsdf.inputs['Emission Color'].default_value  = (*rgb, 1.0)
    bsdf.inputs['Emission Strength'].default_value = 0.20
    obj.data.materials.append(mat)
    return obj


def make_label(text: str, pos_x: float, pos_y: float) -> 'bpy.types.Object':
    bpy.ops.object.text_add(location=(pos_x - PANEL_W * 0.48, 0.01, pos_y))
    obj = bpy.context.active_object
    obj.data.body     = text
    obj.data.size     = 0.10
    obj.data.align_x  = 'LEFT'
    obj.rotation_euler = (math.radians(90), 0, 0)

    mat = bpy.data.materials.new(f'mat_label_{text[:8]}')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value     = (0.95, 0.95, 0.95, 1.0)
    bsdf.inputs['Emission Color'].default_value = (0.95, 0.95, 0.95, 1.0)
    bsdf.inputs['Emission Strength'].default_value = 0.5
    obj.data.materials.append(mat)
    return obj


def animate_fly_in(obj: 'bpy.types.Object', start_frame: int,
                   final_z: float, off_screen_z: float = -6.0):
    """
    Animate the object flying in from off-screen (below) to its final Z position.
    Uses EASE_IN interpolation for a physical deceleration feel.
    """
    obj.location.z = off_screen_z
    obj.keyframe_insert('location', index=2, frame=start_frame)
    obj.location.z = final_z
    obj.keyframe_insert('location', index=2, frame=start_frame + 20)

    action = obj.animation_data.action
    for fc in action.fcurves:
        if fc.data_path == 'location' and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BACK'
                kp.easing        = 'EASE_OUT'


def main():
    os.makedirs(VIDEO_DIR, exist_ok=True)
    clear_scene()

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES

    # Render settings — EEVEE Next for speed
    scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
    scene.render.fps                         = FPS
    scene.render.resolution_x               = 1920
    scene.render.resolution_y               = 1080
    scene.render.resolution_percentage      = 100
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath                   = OUTPUT

    # World — dark near-black background matching site palette
    world = bpy.data.worlds.new('vse_record_world')
    scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get('Background')
    if bg_node:
        bg_node.inputs['Color'].default_value    = (0.04, 0.04, 0.06, 1.0)
        bg_node.inputs['Strength'].default_value = 0.4

    # Build strip panels stacked vertically — each 0.6 units above the last
    panels = []
    labels = []
    for idx, (key, label_text) in enumerate(STRIP_LABELS):
        rgb     = COLOURS[key]
        final_z = idx * 0.6
        panel   = make_panel(f'strip_{idx}_{key}', rgb, 0.0, final_z)
        lbl     = make_label(label_text, 0.0, final_z)
        panels.append((panel, final_z))
        labels.append((lbl, final_z))

        # Fly in staggered: first at frame 10, then +25 each
        fly_start = 10 + idx * 25
        animate_fly_in(panel, fly_start, final_z)
        animate_fly_in(lbl, fly_start + 8, final_z)

    # Add a thin divider line between panels for timeline feel
    bpy.ops.mesh.primitive_plane_add(
        size=1.0, location=(0.0, 0.0, len(STRIP_LABELS) * 0.6 + 0.3)
    )
    divider = bpy.context.active_object
    divider.name  = 'timeline_bar'
    divider.scale = (PANEL_W, 1.0, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    bar_mat = bpy.data.materials.new('mat_timeline_bar')
    bar_mat.use_nodes = True
    bar_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (
        1.0, 0.32, 0.55, 1.0)
    bar_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (
        1.0, 0.32, 0.55, 1.0)
    bar_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.8
    divider.data.materials.append(bar_mat)

    # Camera arc — starts overhead, pulls back and tilts to 3/4 view
    bpy.ops.object.camera_add(location=(0.0, -5.0, 6.0))
    cam = bpy.context.active_object
    cam.name = 'vse_record_cam'
    scene.camera = cam
    cam.data.lens = 35.0

    cam.location       = (0.0, -6.0, 6.0)
    cam.rotation_euler = (math.radians(60), 0.0, 0.0)
    cam.keyframe_insert('location', frame=1)
    cam.keyframe_insert('rotation_euler', frame=1)

    cam.location       = (2.5, -5.0, 4.5)
    cam.rotation_euler = (math.radians(50), 0.0, math.radians(18))
    cam.keyframe_insert('location', frame=180)
    cam.keyframe_insert('rotation_euler', frame=180)

    cam.location       = (4.0, -3.5, 3.8)
    cam.rotation_euler = (math.radians(45), 0.0, math.radians(30))
    cam.keyframe_insert('location', frame=FRAMES)
    cam.keyframe_insert('rotation_euler', frame=FRAMES)

    # Area light — warm fill from upper-left
    bpy.ops.object.light_add(type='AREA', location=(-3.0, -2.0, 6.0))
    light = bpy.context.active_object
    light.data.energy = 80.0
    light.data.size   = 3.0
    light.rotation_euler = (math.radians(40), 0.0, math.radians(-30))

    # EEVEE — enable bloom for emissive panel glow
    scene.eevee.use_bloom  = True
    scene.eevee.bloom_intensity = 0.04
    scene.eevee.bloom_radius    = 4.0

    print(f'[holoflow] record.py ready — {FRAMES} frames → {OUTPUT}')
    print('  Run: bpy.ops.render.render(animation=True)')


main()
