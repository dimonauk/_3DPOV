"""
record.py — Viewport animation for Face-Push Panel Stamp
Blender 5.1 · CC0 · Holoflow Studio

Output: public/library/videos/geometry-nodes/
          gn-node-tool-face-push-panel-stamp/viewport.mp4

Run this from the Scripting workspace after blueprint.py has been
executed. It animates the Amount parameter from 0 → 0.10 over 60
frames, capturing the panels lifting off the base surface, then
reverses back. Render with Workbench (fast) at 1920 × 1080.

Conversion to MP4 (run in a terminal after rendering):
  ffmpeg -r 30 -i /tmp/fp_frame_%04d.png \
         -c:v libx264 -pix_fmt yuv420p -crf 18 viewport.mp4
"""

import bpy
import os

FRAME_COUNT = 60
PEAK_FRAME  = 30
AMOUNT_PEAK = 0.12
OUT_DIR     = "/tmp/fp_frame_"
OBJ_NAME    = "FacePush_Demo"
NG_MODIFIER = "GN_FacePush_Modifier"


def _setup_render():
    scn = bpy.context.scene
    scn.render.engine              = "BLENDER_WORKBENCH"
    scn.render.resolution_x       = 1920
    scn.render.resolution_y       = 1080
    scn.render.resolution_percentage = 100
    scn.render.image_settings.file_format = "PNG"
    scn.render.filepath           = OUT_DIR
    scn.frame_start               = 1
    scn.frame_end                 = FRAME_COUNT

    # Workbench: cavity on, solid colour to show depth
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.shading.type             = "SOLID"
                    space.shading.light            = "MATCAP"
                    space.shading.show_cavity       = True
                    space.shading.cavity_type       = "BOTH"
                    space.shading.cavity_ridge_factor = 1.0
                    break


def _keyframe_amount():
    """
    Animate 'Amount' on the GN modifier:
    frame  1 → 0.00  (flat grid, no push)
    frame 30 → 0.12  (panels fully raised)
    frame 60 → 0.00  (back to flat)
    """
    ob = bpy.data.objects.get(OBJ_NAME)
    ng = bpy.data.node_groups.get(NG_MODIFIER)
    if ob is None or ng is None:
        raise RuntimeError("Run blueprint.py first to create FacePush_Demo.")

    mod = None
    for m in ob.modifiers:
        if m.type == "NODES" and m.node_group == ng:
            mod = m
            break
    if mod is None:
        raise RuntimeError("GN modifier not found on FacePush_Demo.")

    # Find the Amount socket identifier
    amt_id = None
    for item in ng.interface.items_tree:
        if item.name == "Amount":
            amt_id = item.identifier
            break
    if amt_id is None:
        raise RuntimeError("'Amount' socket not found in GN_FacePush_Modifier.")

    scn = bpy.context.scene

    def _key(frame, value):
        scn.frame_set(frame)
        mod[amt_id] = value
        # Trigger depsgraph and keyframe the modifier input
        ob.update_tag()
        bpy.context.view_layer.update()
        mod.keyframe_insert(f'["{amt_id}"]', frame=frame)

    _key(1,            0.00)
    _key(PEAK_FRAME,   AMOUNT_PEAK)
    _key(FRAME_COUNT,  0.00)

    # Smooth interpolation
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def _render_animation():
    os.makedirs("/tmp", exist_ok=True)
    bpy.ops.render.render(animation=True, write_still=False)


def _main():
    _setup_render()
    _keyframe_amount()
    _render_animation()
    print(f"[record] Frames → {OUT_DIR}0001.png … {OUT_DIR}{FRAME_COUNT:04d}.png")
    print("[record] Convert: ffmpeg -r 30 -i /tmp/fp_frame_%04d.png "
          "-c:v libx264 -pix_fmt yuv420p -crf 18 viewport.mp4")


_main()
