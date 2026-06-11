"""
record.py — viewport animation recorder for gn-mesh-to-curve-wireframe-scaffold
Outputs: public/library/videos/geometry-nodes/gn-mesh-to-curve-wireframe-scaffold/viewport.mp4

Run AFTER blueprint.py:
  blender wireframe_scaffold.blend --background --python record.py

Animation: the camera orbits 180° over 2.5 s while Thick Radius animates
from 0.002 (hair-thin) to 0.040 (structural), giving viewers a simultaneous
sense of the scaffold's spatial shape AND the dihedral-driven thickness hierarchy.
Thin Radius stays fixed at 0.012 so the contrast between equatorial
(near-flat) seams and the sharp polar edges is always visible.
"""

import bpy
import math

OUTPUT_PATH  = "//../../videos/geometry-nodes/gn-mesh-to-curve-wireframe-scaffold/viewport"
ANIM_FRAMES  = 60
FPS          = 24
RES_X        = 1280
RES_Y        = 720
CAM_RADIUS   = 3.2
CAM_HEIGHT   = 1.6
ORBIT_START  = math.radians(20)
ORBIT_END    = math.radians(200)
THICK_START  = 0.002
THICK_END    = 0.040


def setup_camera_orbit() -> bpy.types.Object:
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "CamPivot"

    bpy.ops.object.camera_add(location=(CAM_RADIUS, 0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.data.lens = 50
    bpy.context.scene.camera = cam
    cam.parent = pivot
    cam.parent_type = 'OBJECT'

    ct = cam.constraints.new('TRACK_TO')
    ct.target     = pivot
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'
    return pivot


def keyframe_orbit(pivot: bpy.types.Object) -> None:
    scene = bpy.context.scene

    scene.frame_set(1)
    pivot.rotation_euler = (0, 0, ORBIT_START)
    pivot.keyframe_insert('rotation_euler', frame=1)

    scene.frame_set(ANIM_FRAMES)
    pivot.rotation_euler = (0, 0, ORBIT_END)
    pivot.keyframe_insert('rotation_euler', frame=ANIM_FRAMES)

    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def keyframe_thick_radius() -> None:
    obj = bpy.data.objects.get("WireframeScaffold")
    if obj is None:
        print("WARNING: WireframeScaffold not found — skipping Thick Radius keyframe")
        return
    mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
    if mod is None:
        return
    sock_id = None
    for item in mod.node_group.interface.items_tree:
        if item.name == "Thick Radius":
            sock_id = item.identifier
            break
    if sock_id is None:
        return

    scene = bpy.context.scene
    scene.frame_set(1)
    mod[sock_id] = THICK_START
    mod.keyframe_insert(data_path=f'["{sock_id}"]', frame=1)

    scene.frame_set(ANIM_FRAMES)
    mod[sock_id] = THICK_END
    mod.keyframe_insert(data_path=f'["{sock_id}"]', frame=ANIM_FRAMES)

    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def setup_lighting() -> None:
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.data.angle  = 0.05
    bpy.ops.object.light_add(type='AREA', location=(-3, 3, 3))
    fill = bpy.context.active_object
    fill.data.energy = 100
    fill.data.size   = 5.0


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine                        = 'BLENDER_EEVEE_NEXT'
    scene.render.filepath                      = OUTPUT_PATH
    scene.render.image_settings.file_format    = 'FFMPEG'
    scene.render.ffmpeg.format                 = 'MPEG4'
    scene.render.ffmpeg.codec                  = 'H264'
    scene.render.ffmpeg.constant_rate_factor   = 'HIGH'
    scene.render.resolution_x                  = RES_X
    scene.render.resolution_y                  = RES_Y
    scene.render.fps                           = FPS
    scene.frame_start                          = 1
    scene.frame_end                            = ANIM_FRAMES
    scene.render.film_transparent              = True


def main() -> None:
    pivot = setup_camera_orbit()
    keyframe_orbit(pivot)
    keyframe_thick_radius()
    setup_lighting()
    setup_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"✓ viewport.mp4 → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
