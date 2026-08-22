"""
Viewport animation recorder for:
  animation-layered-action-layers-strips-blending

Builds a minimal version of the layered idle scene and renders a 5-second
EEVEE viewport animation to:
  public/library/videos/animation/animation-layered-action-layers-strips-blending/viewport.mp4

Run from Blender's Scripting workspace after running blueprint.py,  OR
run standalone — it resets the scene itself.

The visual demonstrates additive layering: the cube sways at one frequency
while a smaller child cube pulses at a faster breathing rate independently.
"""

import bpy
import math
import os

OUTPUT_DIR   = "//../../videos/animation/animation-layered-action-layers-strips-blending/"
TOTAL_FRAMES = 120
SWAY_FREQ    = 60
BREATHE_FREQ = 12


def _reset() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for act in list(bpy.data.actions): bpy.data.actions.remove(act)


def _build_scene():
    """Two cubes: parent sways (REPLACE layer), child breathes (ADD layer)."""
    bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, 0, 0))
    body = bpy.context.object
    body.name = "body_cube"

    bpy.ops.mesh.primitive_cube_add(size=0.25, location=(0, 0, 0.5))
    chest = bpy.context.object
    chest.name = "chest_cube"
    chest.parent = body

    action = bpy.data.actions.new("layered_vis")
    slot_body  = action.slots.new("OBJECT", "body_cube")
    slot_chest = action.slots.new("OBJECT", "chest_cube")

    # ── Layer 0 REPLACE: body sway ────────────────────────────────────────────
    l0 = action.layers.new(name="base_sway")
    l0.blend_mode, l0.influence = "REPLACE", 1.0
    s0   = l0.strips.new(type="KEYFRAME")
    bag0 = s0.channelbag_for_slot(slot_body)
    if bag0 is None:
        bag0 = s0.channelbags.new(slot=slot_body)

    fc_sway = bag0.fcurves.new(data_path="rotation_euler", index=1)
    for f in range(0, TOTAL_FRAMES + 1, 3):
        val = math.sin(f / SWAY_FREQ * math.tau) * 0.25
        kp = fc_sway.keyframe_points.insert(frame=float(f), value=val)
        kp.interpolation = "BEZIER"
    fc_sway.update()

    # ── Layer 1 ADD: chest breathing ──────────────────────────────────────────
    l1 = action.layers.new(name="additive_breath")
    l1.blend_mode, l1.influence = "ADD", 0.9
    s1   = l1.strips.new(type="KEYFRAME")
    bag1 = s1.channelbag_for_slot(slot_chest)
    if bag1 is None:
        bag1 = s1.channelbags.new(slot=slot_chest)

    fc_breathe = bag1.fcurves.new(data_path="scale", index=2)
    for f in range(0, TOTAL_FRAMES + 1, 2):
        val = math.sin(f / BREATHE_FREQ * math.tau) * 0.12
        kp = fc_breathe.keyframe_points.insert(frame=float(f), value=val)
        kp.interpolation = "BEZIER"
    fc_breathe.update()

    # assign animation data
    body.animation_data_create()
    body.animation_data.action = action
    body.animation_data.action_slot = slot_body

    chest.animation_data_create()
    chest.animation_data.action = action
    chest.animation_data.action_slot = slot_chest

    return body, chest


def _setup_render(output_dir: str) -> None:
    scn = bpy.context.scene
    scn.frame_start, scn.frame_end = 0, TOTAL_FRAMES
    scn.render.fps = 24
    scn.render.engine = "BLENDER_EEVEE_NEXT"
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format   = "MPEG4"
    scn.render.ffmpeg.codec    = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.resolution_percentage = 50   # record at 960×540 for speed
    os.makedirs(bpy.path.abspath(output_dir), exist_ok=True)
    scn.render.filepath = output_dir + "viewport"


def _add_camera_light() -> None:
    bpy.ops.object.camera_add(location=(3, -5, 3))
    cam = bpy.context.object
    bpy.context.scene.camera = cam
    import mathutils
    cam.rotation_euler = mathutils.Euler((math.radians(55), 0, math.radians(35)), "XYZ")

    bpy.ops.object.light_add(type="SUN", location=(5, 5, 8))
    bpy.context.object.data.energy = 3.0


if __name__ == "__main__":
    _reset()
    body, chest = _build_scene()
    _add_camera_light()
    _setup_render(OUTPUT_DIR)
    bpy.ops.render.render(animation=True, write_still=False)
    print("✓ Viewport render complete → viewport.mp4")
